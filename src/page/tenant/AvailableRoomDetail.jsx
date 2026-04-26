import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Badge,
  Button,
  Icon,
  Spinner,
  useColorModeValue,
  Grid,
  VStack,
  HStack,
  Divider,
  SimpleGrid,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription,
  Select,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiMaximize,
  FiLayers,
  FiCheckCircle,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import roomPlaceholder from "../../assets/room-placeholder.png";
import api from "../../api/axios";
import { QRCodeCanvas } from "qrcode.react";
import echo from "../../lib/echo";

const BAKONG_LOGO_RED = "https://raw.githubusercontent.com/sokeng/khqr-gateway/main/assets/khqr.png";

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/public/rooms` : "http://localhost:8000/api/v1/public/rooms";
const PUBLIC_SETTINGS_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/public/settings` : "http://localhost:8000/api/v1/public/settings";

export default function AvailableRoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);

  // Booking Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [desiredDate, setDesiredDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);

  // Payment step
  const [bookingStep, setBookingStep] = useState("details"); // "details" | "payment"
  const [createdBooking, setCreatedBooking] = useState(null);
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
    fetchRoomDetail();
    fetchPublicSettings();
  }, [id]);

  const fetchRoomDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
      } else {
        toast.error("Failed to load room details");
        navigate("/dashboard/available-rooms");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPublicSettings = async () => {
    try {
      const res = await fetch(PUBLIC_SETTINGS_URL);
      if (res.ok) {
        const data = await res.json();
        if (data.booking_down_payment_percent) {
          setDownPaymentPercent(Number(data.booking_down_payment_percent));
        }
      }
    } catch (e) {
      // Silently fail — default 20% will be used
    }
  };

  const handleBook = () => {
    onOpen();
    setBookingStep("payment");
    generateQrForBooking();
  };

  const generateQrForBooking = async () => {
    setLoadingQr(true);
    setPaymentConfirmed(false);
    setQrString(null);
    setQrMd5(null);
    try {
      const res = await api.post(`/tenant/payment/bakong/generate-qr`, {
        type: "booking_prepay",
        room_id: room.id,
        desired_move_in_date: desiredDate,
        notes: bookingNotes
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
    toast.success("🎉 Booking confirmed! Room is reserved for you. You have 1 month to move in.");
    setTimeout(() => {
      handleCloseModal();
      navigate('/dashboard/my-bookings');
    }, 3000);
  };

  const handleCloseModal = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    onClose();
    setBookingStep("details");
    setDesiredDate("");
    setBookingNotes("");
  };

  const handleWaitlist = async () => {
    setIsWaitlistLoading(true);
    try {
      await api.post("/tenant/waitlists", {
        room_id: room.id,
      });
      toast.success("Successfully joined the waitlist!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join waitlist");
    } finally {
      setIsWaitlistLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const currency = (localStorage.getItem("currency") || sessionStorage.getItem("currency")) || "$";
    const exchangeRate = Number((localStorage.getItem("exchangeRate") || sessionStorage.getItem("exchangeRate")) || 4000);
    const num = Number(amount || 0);

    if (currency === "៛" || currency === "KHR" || currency === "Riel") {
      return `៛${Math.round(num * exchangeRate).toLocaleString()}`;
    }
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg={bg}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  if (!room) return null;

  const images = room.images || [];
  const isAvailable = room.is_actually_available;
  const downPaymentAmount = room.base_rent_price * (downPaymentPercent / 100);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split("T")[0]; })();

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val < today) {
      toast.error("Move-in date cannot be in the past.");
      setDesiredDate("");
      return;
    }
    if (val > maxDate) {
      toast.error("Move-in date must be within 2 months from today.");
      setDesiredDate("");
      return;
    }
    setDesiredDate(val);
  };

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="calc(100vh - 80px)">
      <Toaster position="top-right" />

      {/* Breadcrumb / Back button */}
      <Flex align="center" mb={6} justify="space-between">
        <HStack spacing={4}>
          <IconButton
            icon={<FiArrowLeft />}
            onClick={() => navigate("/dashboard/available-rooms")}
            variant="ghost"
            aria-label="Back"
          />
          <Breadcrumb fontSize="sm" color={mutedText} display={{ base: "none", md: "block" }}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/dashboard/available-rooms")}>
                {t("sidebar.available_rooms")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink color={textColor} fontWeight="bold">
                {room.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "1fr", lg: "7fr 5fr" }} gap={8}>
        {/* Left Column: Image Gallery & Description */}
        <VStack spacing={8} align="stretch">
          {/* Main Photo Gallery */}
          <Box bg={cardBg} borderRadius="3xl" p={4} shadow="sm" border="1px" borderColor={borderColor}>
            <Box position="relative" h={{ base: "300px", md: "500px" }} borderRadius="2xl" overflow="hidden" mb={4}>
              <Image
                src={images[activeImageIndex] ? `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}/storage/${images[activeImageIndex].path}` : roomPlaceholder}
                alt={room.name}
                w="full"
                h="full"
                objectFit="cover"
              />
              
              {/* Image Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <IconButton
                    icon={<FiChevronLeft />}
                    position="absolute"
                    left={4}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                    colorScheme="blackAlpha"
                    isRound
                    aria-label="Previous image"
                  />
                  <IconButton
                    icon={<FiChevronRight />}
                    position="absolute"
                    right={4}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={() => setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                    colorScheme="blackAlpha"
                    isRound
                    aria-label="Next image"
                  />
                </>
              )}
            </Box>

            {/* Thumbnails */}
            {images.length > 1 && (
              <HStack spacing={4} overflowX="auto" pb={2} px={1}>
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    cursor="pointer"
                    onClick={() => setActiveImageIndex(idx)}
                    borderRadius="lg"
                    overflow="hidden"
                    border="2px solid"
                    borderColor={activeImageIndex === idx ? "blue.500" : "transparent"}
                    minW="80px"
                    h="60px"
                    transition="all 0.2s"
                    _hover={{ opacity: 0.8 }}
                  >
                    <Image
                      src={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}/storage/${img.path}`}
                      alt={`Thumbnail ${idx}`}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </HStack>
            )}
          </Box>

          {/* Description */}
          <Box bg={cardBg} borderRadius="3xl" p={8} shadow="sm" border="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} color={textColor} display="flex" align="center" gap={2}>
              <Icon as={FiInfo} color="blue.500" />
              {t("common.description")}
            </Heading>
            <Text color={mutedText} lineHeight="tall" whiteSpace="pre-wrap">
              {room.description || "No detailed description available for this room."}
            </Text>
          </Box>
        </VStack>

        {/* Right Column: Room Info & Action */}
        <VStack spacing={8} align="stretch" position={{ lg: "sticky" }} top="8">
          <Box bg={cardBg} borderRadius="3xl" p={8} shadow="lg" border="1px" borderColor={borderColor} position="relative" overflow="hidden">
            {/* Decoration */}
            <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="blue.50" borderRadius="full" zIndex={0} _dark={{ bg: "whiteAlpha.50" }} />
            
            <VStack align="flex-start" spacing={6} position="relative" zIndex={1}>
              <VStack align="flex-start" spacing={1}>
                {isAvailable ? (
                  <Badge colorScheme="green" variant="solid" borderRadius="full" px={3} py={0.5} fontSize="xs">
                    {t("room.available")}
                  </Badge>
                ) : (
                  <Badge colorScheme="red" variant="solid" borderRadius="full" px={3} py={0.5} fontSize="xs">
                    Occupied
                  </Badge>
                )}
                <Heading size="xl" color={textColor} letterSpacing="tight">
                  {room.name}
                </Heading>
              </VStack>

              <Box w="full">
                <Text fontSize="xs" fontWeight="black" color="blue.500" textTransform="uppercase" letterSpacing="widest" mb={1}>
                  {t("room.price")}
                </Text>
                <Heading size="xl" color="blue.600">
                  {formatCurrency(room.base_rent_price)}
                  <Text as="span" fontSize="lg" fontWeight="bold" color={mutedText} ml={2}>
                    / month
                  </Text>
                </Heading>
              </Box>

              {/* Down Payment Info */}
              {isAvailable && (
                <Box w="full" bg={useColorModeValue("orange.50", "rgba(237,137,54,0.1)")} p={4} borderRadius="2xl" border="1px" borderColor={useColorModeValue("orange.200", "orange.800")}>
                  <HStack spacing={3}>
                    <Icon as={FiDollarSign} color="orange.500" boxSize={5} />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="xs" color="orange.600" fontWeight="bold" _dark={{ color: "orange.300" }}>Down Payment Required ({downPaymentPercent}%)</Text>
                      <Text fontWeight="black" fontSize="lg" color="orange.700" _dark={{ color: "orange.200" }}>
                        {formatCurrency(downPaymentAmount)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              <SimpleGrid columns={2} spacing={4} w="full">
                <Box bg={bg} p={4} borderRadius="2xl" border="1px" borderColor={borderColor}>
                  <HStack spacing={3}>
                    <Icon as={FiMaximize} color="blue.500" boxSize={5} />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="2xs" color="gray.400" fontWeight="bold">{t("room.size")}</Text>
                      <Text fontWeight="bold" fontSize="sm">{room.size || "N/A"}</Text>
                    </VStack>
                  </HStack>
                </Box>
                <Box bg={bg} p={4} borderRadius="2xl" border="1px" borderColor={borderColor}>
                  <HStack spacing={3}>
                    <Icon as={FiLayers} color="blue.500" boxSize={5} />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="2xs" color="gray.400" fontWeight="bold">{t("room.floor")}</Text>
                      <Text fontWeight="bold" fontSize="sm">Floor 1</Text>
                    </VStack>
                  </HStack>
                </Box>
              </SimpleGrid>

              <Divider borderColor={borderColor} />

              <VStack align="flex-start" spacing={4} w="full">
                <Text fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="widest">
                  {t("room.amenities")}
                </Text>
                {room.furniture && room.furniture.length > 0 ? (
                  <SimpleGrid columns={2} spacing={3} w="full">
                    {room.furniture.map((item, idx) => (
                      <HStack key={idx} spacing={2}>
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text fontSize="sm" fontWeight="medium" color={mutedText}>{item.name}</Text>
                      </HStack>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text fontSize="sm" color={mutedText} fontStyle="italic">
                    No special furniture or amenities listed.
                  </Text>
                )}
              </VStack>

              {/* Action Buttons */}
              <VStack w="full" spacing={4}>
                {isAvailable ? (
                  <VStack w="full" align="stretch" spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="black" color="blue.500" textTransform="uppercase" letterSpacing="widest" mb={1}>
                        Desired Move-in Date
                      </FormLabel>
                      <Input
                        type="date"
                        value={desiredDate}
                        onChange={(e) => setDesiredDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        max={(() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split("T")[0]; })()}
                        bg={bg}
                        h="50px"
                        borderRadius="xl"
                        borderColor={borderColor}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                    </FormControl>

                    <Button
                      w="full"
                      size="lg"
                      colorScheme="blue"
                      leftIcon={<FiCalendar />}
                      h="60px"
                      borderRadius="2xl"
                      shadow="md"
                      onClick={handleBook}
                      fontSize="md"
                      fontWeight="black"
                      isDisabled={!desiredDate}
                    >
                      Book & Pay Now
                    </Button>
                  </VStack>
                ) : (
                  <Button w="full" size="lg" colorScheme="gray" h="60px" borderRadius="2xl" shadow="md" fontSize="md" fontWeight="black" isDisabled>
                    Not Available
                  </Button>
                )}

                <Button
                  w="full"
                  size="md"
                  variant="ghost"
                  leftIcon={<FiMessageSquare />}
                  onClick={() => navigate("/dashboard/chat")}
                  color={mutedText}
                >
                  {t("room.inquire")}
                </Button>
              </VStack>
            </VStack>
          </Box>
        </VStack>
      </Grid>

      {/* Booking Modal — Multi-step: Details → Payment */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={cardBg} shadow="2xl">
          <ModalHeader color={textColor}>
            {bookingStep === "details"
              ? `Book Room: ${room.name}`
              : "Complete Down Payment"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {bookingStep === "details" ? (
              <VStack spacing={5}>
                {/* Down Payment Banner */}
                <Alert status="info" borderRadius="xl" variant="left-accent">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    A <strong>{downPaymentPercent}%</strong> down payment of{" "}
                    <strong>{formatCurrency(downPaymentAmount)}</strong> is required to confirm your booking.
                  </AlertDescription>
                </Alert>

                <FormControl isRequired>
                  <FormLabel color={textColor}>Desired Move-in Date</FormLabel>
                  <Input
                    type="date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    max={(() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split("T")[0]; })()}
                    bg={bg}
                    borderColor={borderColor}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={textColor}>Notes (Optional)</FormLabel>
                  <Textarea
                    placeholder="Any special requests or questions?"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    bg={bg}
                    borderColor={borderColor}
                  />
                </FormControl>
              </VStack>
            ) : (
              /* Payment Step */
              <VStack spacing={5}>
                <Box w="full" bg={useColorModeValue("green.50", "rgba(72,187,120,0.1)")} p={5} borderRadius="xl" border="1px solid" borderColor={useColorModeValue("green.200", "green.800")}>
                  <VStack spacing={1}>
                    <Text fontSize="sm" color={mutedText} fontWeight="bold">Amount Due</Text>
                    <Heading size="lg" color="green.600" _dark={{ color: "green.300" }}>
                      {formatCurrency(downPaymentAmount)}
                    </Heading>
                    <Text fontSize="xs" color={mutedText}>
                      {downPaymentPercent}% of {formatCurrency(room.base_rent_price)} monthly rent
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
                      <Box p={6} textAlign="center">
                         {loadingQr ? (
                           <VStack spacing={4} py={8}>
                             <Spinner size="xl" color="blue.500" thickness="4px" />
                             <Text fontSize="sm" fontWeight="bold" color={textColor}>Generating Secure QR Code...</Text>
                           </VStack>
                         ) : qrString ? (
                           <VStack spacing={5}>
                             <Box w="280px" bg="white" borderRadius="xl" overflow="hidden" shadow="xl" border="1px solid" borderColor="gray.200" mx="auto">
                               <Box bg="#005EAA" p={3}>
                                 <Flex align="center" justify="center">
                                   <Text color="white" fontSize="xl" fontWeight="black" fontStyle="italic" letterSpacing="widest">KHQR</Text>
                                 </Flex>
                               </Box>
                               <Box p={4} bg="white">
                                 <Flex justify="center" align="center" py={2}>
                                   <QRCodeCanvas 
                                     value={qrString} size={200} level="H" includeMargin={false}
                                      imageSettings={{ src: BAKONG_LOGO_RED, x: undefined, y: undefined, height: 40, width: 40, excavate: true }}
                                   />
                                 </Flex>
                               </Box>
                               <Text fontSize="xs" fontWeight="bold" color="gray.500" textAlign="center" pb={2}>
                                 Exchange Rate: 1$ = 4000 Riel
                               </Text>
                             </Box>
                             <Flex justify="space-between" align="center" w="full" px={4}>
                                <Text fontSize="xs" color={mutedText} fontWeight="bold">Scanning...</Text>
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

          <ModalFooter>
            {bookingStep === "details" ? (
              <>
                <Button variant="ghost" mr={3} onClick={handleCloseModal} color={textColor}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleBook}
                  isLoading={isBookingLoading}
                  isDisabled={!desiredDate}
                >
                  Continue to Payment
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" w="full" onClick={handleCloseModal} color={textColor} isDisabled={paymentConfirmed}>
                  Cancel Booking
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
