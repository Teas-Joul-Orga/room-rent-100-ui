import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Image,
  Badge,
  Button,
  Icon,
  Spinner,
  useColorModeValue,
  Center,
  VStack,
  HStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  AlertDescription,
  Stack,
} from "@chakra-ui/react";
import { FiHome, FiMaximize, FiArrowRight, FiInfo, FiLayers, FiMapPin, FiDollarSign, FiCalendar, FiMail, FiCheckCircle } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import roomPlaceholder from "../../assets/room-placeholder.png";
import api from "../../api/axios";
import { QRCodeCanvas } from "qrcode.react";
import echo from "../../lib/echo";
import ChakraDatePicker from "../../components/ChakraDatePicker";

const BAKONG_LOGO_RED = "https://raw.githubusercontent.com/sokeng/khqr-gateway/main/assets/khqr.png";

export default function AvailableRooms() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add settings state for downPayment and bakong
  const [settings, setSettings] = useState({
    bakong_merchant_name: "SIEVTHAI PHEAK"
  });
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);

  // Booking states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [bookingStep, setBookingStep] = useState("details"); // "details" | "terms" | "payment"
  const [desiredDate, setDesiredDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  const pollingRef = useRef(null);
  const [qrString, setQrString] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetchAvailableRooms();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/public/settings");
      const data = response.data;
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, bakong_merchant_name: data.bakong_merchant_name || "SIEVTHAI PHEAK" }));
        if (data.booking_down_payment_percent) {
          setDownPaymentPercent(Number(data.booking_down_payment_percent));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchAvailableRooms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/public/rooms");
      const data = res.data;
      setRooms(data.data || data || []);
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Currency Logic
  const currencySettings = useMemo(() => {
    const rateItem = (localStorage.getItem("exchangeRate") || sessionStorage.getItem("exchangeRate"));
    return {
      c: (localStorage.getItem("currency") || sessionStorage.getItem("currency")) || "$",
      r: rateItem ? Number(rateItem) : 4000
    };
  }, []);

  const fmt = React.useCallback((n) => {
    const num = Number(n || 0);
    if (currencySettings.c === "៛" || currencySettings.c === "KHR" || currencySettings.c === "Riel") {
      return "៛" + (num * currencySettings.r).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currencySettings]);

  // Booking Logic
  const handleBook = () => {
    setBookingStep("payment");
    generateQrForBooking();
  };

  const generateQrForBooking = async () => {
    setLoadingQr(true);
    setPaymentConfirmed(false);
    setQrString(null);
    setQrMd5(null);
    try {
      const combinedNotes = `Contact Name: ${contactName}\nPhone: ${contactPhone}\nEmail: ${contactEmail}\n\nNotes: ${bookingNotes}`.trim();

      const res = await api.post(`/tenant/payment/bakong/generate-qr`, {
        type: "booking_prepay",
        room_id: selectedRoom.id,
        desired_move_in_date: desiredDate,
        notes: combinedNotes
      });
      const data = res.data;
      if (data.status === "success") {
        setQrString(data.data.qrString);
        if (data.data.md5) {
          setQrMd5(data.data.md5);
          startPolling(data.data.md5);
        }
      } else {
        toast.error(data.message || "Failed to generate QR Code");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Network error");
    } finally {
      setLoadingQr(false);
    }
  };

  const startPolling = (md5) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.post(`/tenant/payment/bakong/check-transaction`, {
          md5, type: "booking_prepay"
        });
        const data = res.data;
        if (data.status === "success" && data.paid === true) {
          clearInterval(pollingRef.current);
          handlePaymentSuccess();
        }
      } catch (_) {}
    }, 5000);
  };

  useEffect(() => {
    if (!qrMd5) return;
    const channel = echo().channel(`bakong.payment.${qrMd5}`)
      .listen('.App\\Events\\BakongPaymentConfirmed', (e) => {
          if (pollingRef.current) clearInterval(pollingRef.current);
          handlePaymentSuccess();
      });
    return () => echo().leaveChannel(`bakong.payment.${qrMd5}`);
  }, [qrMd5]);

  const handlePaymentSuccess = () => {
    setPaymentConfirmed(true);
    toast.success("🎉 Down payment successful! Booking confirmed.");
    setTimeout(() => {
      handleCloseBookingModal();
      navigate('/dashboard/my-bookings');
    }, 3000);
  };

  const handleCloseBookingModal = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedRoom(null);
    setIsBookingMode(false);
    setBookingStep("details");
    setDesiredDate("");
    setBookingNotes("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
  };

  const today = new Date().toISOString().split("T")[0];
  const maxDate = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0]; })();

  const handleDateChange = (val) => {
    if (!val) { setDesiredDate(""); return; }
    if (val < today) {
      toast.error("Move-in date cannot be in the past.");
      setDesiredDate("");
      return;
    }
    if (val > maxDate) {
      toast.error("Move-in date must be within 14 days from today.");
      setDesiredDate("");
      return;
    }
    setDesiredDate(val);
  };

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="calc(100vh - 80px)">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <VStack align="flex-start" spacing={2} mb={8}>
        <Heading size="xl" color="blue.600" letterSpacing="tight">
          {t("room.available_title")}
        </Heading>
        <Text color={mutedText} fontSize="lg">
          {t("room.available_subtitle")}
        </Text>
      </VStack>

      {isLoading ? (
        <Center h="400px">
          <Spinner size="xl" color="blue.500" thickness="4px" />
        </Center>
      ) : rooms.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
          {rooms.map((room) => (
            <Box
              key={room.id}
              bg={cardBg}
              borderRadius="2xl"
              overflow="hidden"
              border="1px solid"
              borderColor={borderColor}
              transition="all 0.3s"
              _hover={{ shadow: "2xl", transform: "translateY(-8px)" }}
              display="flex"
              flexDirection="column"
              role="group"
            >
              {/* Image Container */}
              <Box position="relative" overflow="hidden" h="220px">
                <Image
                  src={room.images && room.images.length > 0 ? `http://localhost:8000/storage/${room.images[0].path}` : roomPlaceholder}
                  alt={room.name}
                  w="full"
                  h="full"
                  objectFit="cover"
                  transition="transform 0.5s"
                  _groupHover={{ transform: "scale(1.1)" }}
                  onError={(e) => {
                    e.target.onerror = null; // prevent infinite loop
                    e.target.src = roomPlaceholder;
                  }}
                />
                <Box
                  position="absolute"
                  top={4}
                  right={4}
                  bg="whiteAlpha.900"
                  px={3}
                  py={1}
                  borderRadius="full"
                  shadow="sm"
                  backdropFilter="blur(4px)"
                >
                  <Text fontSize="sm" fontWeight="black" color="blue.600">
                    {fmt(room.base_rent_price)}
                  </Text>
                </Box>
                {room.size && (
                  <Badge
                    position="absolute"
                    bottom={4}
                    left={4}
                    colorScheme="blue"
                    variant="solid"
                    borderRadius="md"
                    px={2}
                    py={1}
                    fontSize="xs"
                  >
                    {room.size}
                  </Badge>
                )}
              </Box>

              {/* Content */}
              <Box p={5} flex="1">
                <VStack align="flex-start" spacing={3}>
                  <Flex justify="space-between" align="center" w="full">
                    <HStack spacing={2}>
                      <Icon as={FiHome} color="blue.500" />
                      <Heading size="md" color={textColor} letterSpacing="tight">
                        {room.name}
                      </Heading>
                    </HStack>
                    <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2}>
                      {t("room.available")}
                    </Badge>
                  </Flex>
                  
                  <Text fontSize="sm" color={mutedText} noOfLines={2} minH="40px">
                    {room.description || "No description provided for this room."}
                  </Text>

                  <Divider borderColor={borderColor} />

                  <SimpleGrid columns={2} w="full" spacing={2}>
                    <HStack color={mutedText} fontSize="xs">
                      <Icon as={FiLayers} />
                      <Text fontWeight="bold">Standard Type</Text>
                    </HStack>
                    <HStack color={mutedText} fontSize="xs">
                      <Icon as={FiMaximize} />
                      <Text fontWeight="bold">{room.size || "Unknown Size"}</Text>
                    </HStack>
                  </SimpleGrid>

                  <HStack w="full" mt={2} spacing={2}>
                    <Button
                      flex="1"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => { setSelectedRoom(room); setIsBookingMode(false); setBookingStep("details"); }}
                      borderRadius="xl"
                      fontWeight="black"
                      fontSize="xs"
                    >
                      View Details
                    </Button>
                    <Button
                      flex="1"
                      colorScheme="blue"
                      onClick={() => { setSelectedRoom(room); setIsBookingMode(true); setBookingStep("terms"); }}
                      borderRadius="xl"
                      fontWeight="black"
                      fontSize="xs"
                    >
                      Book Now
                    </Button>
                  </HStack>

                </VStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Center h="400px" bg={cardBg} borderRadius="3xl" border="2px dashed" borderColor={borderColor}>
          <VStack spacing={4}>
            <Icon as={FiInfo} boxSize={12} color="gray.400" />
            <Text fontSize="xl" fontWeight="bold" color={mutedText}>
              No rooms currently available.
            </Text>
          </VStack>
        </Center>
      )}

      {/* Room Details & Booking Modal */}
      <Modal 
        isOpen={!!selectedRoom} 
        onClose={handleCloseBookingModal} 
        size={{ base: "full", md: "xl" }}
        scrollBehavior="inside"
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
        <ModalContent 
          borderRadius={{ base: "0", md: "2xl" }} 
          overflow="hidden" 
          my={{ base: 0, md: "4vh" }}
          maxH={{ base: "100vh", md: "92vh" }}
          bg={cardBg}
        >
          {/* Custom Header */}
          <Box 
            bg={bookingStep === "payment" ? "green.500" : "blue.500"} 
            px={6} 
            py={4} 
            position="relative"
            transition="background 0.3s"
          >
            <ModalCloseButton color="white" top={3} right={3} _hover={{ bg: "whiteAlpha.200" }} />
            {/* Step Indicator for Booking Mode */}
            {isBookingMode && (
              <HStack spacing={2} mb={3}>
                <Box w="30px" h="3px" borderRadius="full" bg={bookingStep === "terms" ? "white" : "whiteAlpha.500"} transition="all 0.3s" />
                <Box w="30px" h="3px" borderRadius="full" bg={bookingStep === "details" ? "white" : "whiteAlpha.300"} transition="all 0.3s" />
                <Box w="30px" h="3px" borderRadius="full" bg={bookingStep === "payment" ? "white" : "whiteAlpha.300"} transition="all 0.3s" />
              </HStack>
            )}
            <Text color="whiteAlpha.800" fontSize="xs" fontWeight="bold" letterSpacing="wider">
              {bookingStep === "payment" ? "Step 3 of 3" : bookingStep === "details" ? "Step 2 of 3" : isBookingMode ? "Step 1 of 3" : "Room Details"}
            </Text>
            <Heading size="md" color="white" mt={1} pr={8}>
              {bookingStep === "payment"
                ? "Complete Down Payment"
                : bookingStep === "details"
                  ? `Book: ${selectedRoom?.name}`
                  : bookingStep === "terms"
                    ? t("booking_agreement.step_terms")
                    : selectedRoom?.name}
            </Heading>
          </Box>

          <ModalBody p={{ base: 4, md: 6 }} bg={useColorModeValue("gray.50", "transparent")}>
            {/* View Details Mode */}
            {selectedRoom && !isBookingMode && bookingStep === "details" && (
              <VStack spacing={5} align="stretch">
                <Box h={{ base: "220px", md: "300px" }} borderRadius="xl" overflow="hidden" shadow="md">
                  <Image
                    src={selectedRoom.images && selectedRoom.images.length > 0 
                      ? `http://localhost:8000/storage/${selectedRoom.images[0].path}` 
                      : roomPlaceholder}
                    alt={selectedRoom.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
                
                <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                    <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="blue.600">
                      {fmt(selectedRoom.base_rent_price)} <Text as="span" fontSize="sm" color="gray.400" fontWeight="medium">/ month</Text>
                    </Text>
                    <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="xs">Available</Badge>
                  </Flex>

                  <SimpleGrid columns={2} spacing={3} mb={4}>
                    <HStack bg={bg} p={3} borderRadius="lg" spacing={2}>
                      <Icon as={FiMapPin} color="blue.400" boxSize={4} />
                      <Text fontSize="sm" color={textColor} fontWeight="medium">Floor {selectedRoom.floor || 0}</Text>
                    </HStack>
                    <HStack bg={bg} p={3} borderRadius="lg" spacing={2}>
                      <Icon as={FiMaximize} color="blue.400" boxSize={4} />
                      <Text fontSize="sm" color={textColor} fontWeight="medium">{selectedRoom.size || "Standard"}</Text>
                    </HStack>
                  </SimpleGrid>

                  {/* Down Payment Info */}
                  <HStack bg={useColorModeValue("orange.50", "orange.900")} p={3} borderRadius="lg" border="1px solid" borderColor={useColorModeValue("orange.200", "orange.800")}>
                    <Box bg={useColorModeValue("orange.100", "orange.800")} p={2} borderRadius="md">
                      <Icon as={FiDollarSign} color="orange.500" boxSize={4} />
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="xs" color={useColorModeValue("orange.600", "orange.300")} fontWeight="bold">Down Payment ({downPaymentPercent}%)</Text>
                      <Text fontSize="sm" color={useColorModeValue("orange.700", "orange.200")} fontWeight="bold">{fmt(selectedRoom.base_rent_price * (downPaymentPercent / 100))}</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <HStack mb={3} spacing={2}>
                    <Icon as={FiInfo} color="blue.400" />
                    <Heading size="sm" color={textColor}>Description</Heading>
                  </HStack>
                  <Text color={mutedText} fontSize="sm" lineHeight="tall">
                    {selectedRoom.description || "No description provided. Please contact us for more details about this room."}
                  </Text>
                </Box>
              </VStack>
            )}

            {/* Terms and Conditions Step */}
            {selectedRoom && isBookingMode && bookingStep === "terms" && (
              <VStack spacing={5} align="stretch">
                <Box bg={cardBg} p={6} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <VStack align="stretch" spacing={4}>
                    <Heading size="sm" color="blue.600">{t("booking_agreement.title")}</Heading>
                    <Divider borderColor={borderColor} />
                    <Box fontSize="sm" color={mutedText} lineHeight="tall">
                      <Text fontWeight="bold" mb={2} color={textColor}>{t("booking_agreement.policy_title")}</Text>
                      <Text mb={4}>
                        {t("booking_agreement.policy_desc", { percent: downPaymentPercent })}
                      </Text>
                      
                      <Text fontWeight="bold" mb={2} color={textColor}>{t("booking_agreement.reservation_title")}</Text>
                      <Text mb={4}>
                        {t("booking_agreement.reservation_desc")}
                      </Text>

                      <Text fontWeight="bold" mb={2} color={textColor}>{t("booking_agreement.id_title")}</Text>
                      <Text mb={4}>
                        {t("booking_agreement.id_desc")}
                      </Text>

                      <Text fontWeight="bold" mb={2} color={textColor}>{t("booking_agreement.rules_title")}</Text>
                      <Text>
                        {t("booking_agreement.rules_desc")}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
                <Alert status="info" borderRadius="xl" variant="subtle">
                  <AlertIcon />
                  <AlertDescription fontSize="xs">
                    {t("booking_agreement.alert_msg")}
                  </AlertDescription>
                </Alert>
              </VStack>
            )}

            {/* Booking Details Step */}
            {selectedRoom && isBookingMode && bookingStep === "details" && (
              <VStack spacing={5} align="stretch">
                {/* Compact Room Summary */}
                <HStack bg={cardBg} p={3} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} spacing={4}>
                  <Box w="70px" h="70px" borderRadius="lg" overflow="hidden" flexShrink={0}>
                    <Image
                      src={selectedRoom.images && selectedRoom.images.length > 0 
                        ? `http://localhost:8000/storage/${selectedRoom.images[0].path}` 
                        : roomPlaceholder}
                      alt={selectedRoom.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                  <VStack align="flex-start" spacing={0} flex="1">
                    <Text fontWeight="bold" fontSize="sm" color={textColor}>{selectedRoom.name}</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">{fmt(selectedRoom.base_rent_price)}<Text as="span" fontSize="xs" color="gray.400" fontWeight="normal"> /mo</Text></Text>
                  </VStack>
                  <Badge colorScheme="green" borderRadius="full" px={2} fontSize="2xs">Available</Badge>
                </HStack>

                {/* Down Payment Banner */}
                <Box bg={useColorModeValue("blue.50", "blue.900")} p={4} borderRadius="xl" border="1px solid" borderColor={useColorModeValue("blue.200", "blue.800")}>
                  <HStack spacing={3}>
                    <Box bg={useColorModeValue("blue.100", "blue.800")} p={2} borderRadius="lg">
                      <Icon as={FiDollarSign} color="blue.500" boxSize={5} />
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="xs" color={useColorModeValue("blue.600", "blue.300")} fontWeight="bold">Required Down Payment ({downPaymentPercent}%)</Text>
                      <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("blue.700", "blue.200")}>{fmt(selectedRoom.base_rent_price * (downPaymentPercent / 100))}</Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Form Fields */}
                <Box bg={cardBg} p={{ base: 4, md: 5 }} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <VStack spacing={5} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                        <HStack spacing={2}>
                          <Icon as={FiCalendar} color="blue.400" boxSize={4} />
                          <Text>Desired Move-in Date</Text>
                        </HStack>
                      </FormLabel>
                      <ChakraDatePicker selectedDate={desiredDate}
                        onChange={handleDateChange}
                        min={today}
                        max={maxDate}
                        bg={bg}
                        borderColor={borderColor}
                        h="48px"
                        borderRadius="xl"
                        fontSize="sm"
                        _hover={{ borderColor: "blue.300" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                      <Text fontSize="xs" color="gray.400" mt={1}>Select a date within the next 14 days</Text>
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                          Contact Name
                        </FormLabel>
                        <Input
                          placeholder="Your full name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          bg={bg}
                          borderColor={borderColor}
                          borderRadius="md"
                          fontSize="sm"
                          _hover={{ borderColor: "blue.300" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                          Phone Number
                        </FormLabel>
                        <Input
                          placeholder="Your phone number"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          bg={bg}
                          borderColor={borderColor}
                          borderRadius="md"
                          fontSize="sm"
                          _hover={{ borderColor: "blue.300" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                        Email Address
                      </FormLabel>
                      <Input
                        type="email"
                        placeholder="Your email address"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        bg={bg}
                        borderColor={borderColor}
                        borderRadius="md"
                        fontSize="sm"
                        _hover={{ borderColor: "blue.300" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                        <HStack spacing={2}>
                          <Icon as={FiMail} color="blue.400" boxSize={4} />
                          <Text>Notes (Optional)</Text>
                        </HStack>
                      </FormLabel>
                      <Textarea
                        placeholder="Any special requests, questions, or preferences?"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        bg={bg}
                        borderColor={borderColor}
                        borderRadius="xl"
                        fontSize="sm"
                        rows={3}
                        resize="vertical"
                        _hover={{ borderColor: "blue.300" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            )}

            {/* Payment Step */}
            {bookingStep === "payment" && (
              <VStack spacing={5}>
                <Box w="full" bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor="green.200">
                  <VStack spacing={1}>
                    <Text fontSize="xs" color="gray.400" fontWeight="bold" letterSpacing="wider">Amount Due</Text>
                    <Heading size="xl" color="green.600">
                      {fmt(selectedRoom?.base_rent_price * (downPaymentPercent / 100))}
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      {downPaymentPercent}% of {fmt(selectedRoom?.base_rent_price)} monthly rent
                    </Text>
                  </VStack>
                </Box>

                <Box w="full" bg={cardBg} borderRadius="2xl" overflow="hidden" border="2px solid" borderColor={paymentConfirmed ? "green.400" : qrString ? "blue.300" : borderColor} transition="all 0.5s ease" shadow={qrString && !paymentConfirmed ? "0 0 30px -5px rgba(66,153,225,0.4)" : "none"}>
                  {paymentConfirmed ? (
                    <Box bgGradient="linear(to-br, green.400, green.600)" p={8} textAlign="center">
                      <Icon as={FiCheckCircle} boxSize={12} color="white" mb={4} />
                      <Heading size="md" color="white" mb={2}>Payment Received!</Heading>
                      <Text color="whiteAlpha.900" fontSize="sm">Your down payment was successfully verified.</Text>
                    </Box>
                  ) : (
                    <>
                      <Box bg={qrString ? "blue.500" : "gray.100"} px={5} py={2} transition="background 0.4s">
                        <Text fontSize="sm" fontWeight="bold" color={qrString ? "white" : "gray.600"} textAlign="center">Bakong KHQR</Text>
                      </Box>
                      <Box p={{ base: 4, md: 6 }} textAlign="center">
                         {loadingQr ? (
                           <VStack spacing={4} py={8}>
                             <Spinner size="xl" color="blue.500" thickness="4px" />
                             <Text fontSize="sm" fontWeight="bold" color={textColor}>Generating Secure QR Code...</Text>
                           </VStack>
                         ) : qrString ? (
                           <VStack spacing={5}>
                             <Box w={{ base: "240px", md: "280px" }} bg="white" borderRadius="xl" overflow="hidden" shadow="xl" border="1px solid" borderColor="gray.200" mx="auto">
                               <Box bg="#005EAA" p={3}>
                                 <Flex align="center" justify="center">
                                    <Text color="white" fontSize="md" fontWeight="black" letterSpacing="wider" textAlign="center">
                                      {settings.bakong_merchant_name}
                                    </Text>
                                 </Flex>
                               </Box>
                               <Box p={4} bg="white">
                                 <Flex justify="center" align="center" py={2}>
                                   <QRCodeCanvas 
                                     value={qrString} size={200} level="H" includeMargin={false}
                                      imageSettings={{ src: BAKONG_LOGO_RED, height: 40, width: 40, excavate: true }}
                                   />
                                 </Flex>
                               </Box>
                               <Text fontSize="xs" fontWeight="bold" color="gray.500" textAlign="center" pb={2}>
                                 Exchange Rate: 1$ = 4000 Riel
                               </Text>
                             </Box>
                             <Flex justify="space-between" align="center" w="full" px={4}>
                                <Text fontSize="xs" color="gray.500" fontWeight="bold">Scanning...</Text>
                                <Spinner size="sm" color="orange.400" speed="1.2s" />
                             </Flex>
                           </VStack>
                         ) : (
                           <Text color="red.500">Failed to load QR code. Please cancel and try again.</Text>
                         )}
                      </Box>
                    </>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>

          {/* Mobile-friendly Footer */}
          <Box bg={cardBg} borderTop="1px solid" borderColor={borderColor} px={6} py={4} shadow="0 -4px 20px rgba(0,0,0,0.05)">
            {bookingStep === "payment" ? (
              <Button 
                variant="outline" 
                w="full" 
                onClick={handleCloseBookingModal} 
                borderRadius="xl" 
                fontWeight="bold" 
                fontSize="sm" 
                h="48px"
                colorScheme="red"
                isDisabled={paymentConfirmed}
              >
                Cancel Booking
              </Button>
            ) : !isBookingMode ? (
              <Stack direction={{ base: "column-reverse", sm: "row" }} w="full" spacing={3}>
                <Button 
                  onClick={handleCloseBookingModal} 
                  borderRadius="xl" 
                  fontWeight="bold" 
                  fontSize="sm"
                  variant="ghost"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                >
                  Close
                </Button>
                <Button 
                  colorScheme="blue" 
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="sm"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                  shadow="md"
                  onClick={() => {
                    setIsBookingMode(true);
                    setBookingStep("terms");
                  }}
                >
                  Book Now
                </Button>
              </Stack>
            ) : bookingStep === "terms" ? (
              <Stack direction={{ base: "column-reverse", sm: "row" }} w="full" spacing={3}>
                <Button 
                  variant="ghost" 
                  onClick={() => { setIsBookingMode(false); setBookingStep("details"); }} 
                  borderRadius="xl" 
                  fontWeight="bold" 
                  fontSize="sm"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                >
                  {t("booking_agreement.back_to_details")}
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => setBookingStep("details")}
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="sm"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                  shadow="md"
                  rightIcon={<FiArrowRight />}
                >
                  {t("booking_agreement.accept_continue")}
                </Button>
              </Stack>
            ) : (
              <Stack direction={{ base: "column-reverse", sm: "row" }} w="full" spacing={3}>
                <Button 
                  variant="ghost" 
                  onClick={() => setBookingStep("terms")} 
                  borderRadius="xl" 
                  fontWeight="bold" 
                  fontSize="sm"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                >
                  ← Back
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleBook}
                  isLoading={isBookingLoading}
                  isDisabled={!desiredDate}
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="sm"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                  shadow="md"
                  leftIcon={<FiCalendar />}
                >
                  Continue to Payment
                </Button>
              </Stack>
            )}
          </Box>
        </ModalContent>
      </Modal>
    </Box>
  );
}