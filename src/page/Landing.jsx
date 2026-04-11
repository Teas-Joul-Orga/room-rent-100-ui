import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  Badge,
  Stack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  VStack,
  HStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  AlertDescription,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiMaximize, FiPhone, FiLogIn, FiMail, FiArrowRight, FiArrowUp, FiCalendar, FiCheckCircle, FiDollarSign, FiClock, FiInfo, FiGrid } from "react-icons/fi";
import { LuCircleUser, LuLogOut, LuSettings } from "react-icons/lu";
import { IoKeyOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import Logo from "../assets/Arun_MuyKea.png";
import api from "../api/axios";
import { QRCodeCanvas } from "qrcode.react";
import echo from "../lib/echo";
import ChangePasswordModal from "../components/ChangePasswordModal";

const BAKONG_LOGO_RED = "https://bakong.nbc.gov.kh/images/logo.png";

const MotionBox = motion(Box);

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({
    app_name: "Arun Muy Kea",
    company_name: "Arun Muy Kea",
    address: "Phnom Penh, Cambodia",
    phone: "+855 87 94 60 60",
    email: "support@roomrent100.com",
    currency: "$",
    exchange_rate: 4000
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [isBookingMode, setIsBookingMode] = useState(false);
  const [desiredDate, setDesiredDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);

  // Payment step
  const [bookingStep, setBookingStep] = useState("details"); // "details" | "payment"
  const [createdBooking, setCreatedBooking] = useState(null);
  const pollingRef = useRef(null);
  const [qrString, setQrString] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const isLoggedIn = useMemo(() => 
    localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true", 
  []);

  // User Bookings Drawer
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const [userBookings, setUserBookings] = useState([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);

  // User details
  const userDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : { name: "User" };
    } catch { return { name: "User" }; }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  // Currency Logic
  const currencySettings = useMemo(() => {
    const rateItem = (localStorage.getItem("exchangeRate") || sessionStorage.getItem("exchangeRate"));
    return {
      c: (localStorage.getItem("currency") || sessionStorage.getItem("currency")) || settings.currency || "$",
      r: rateItem ? Number(rateItem) : (settings.exchange_rate || 4000)
    };
  }, [settings.currency, settings.exchange_rate]);

  const fmt = React.useCallback((n) => {
    const num = Number(n || 0);
    if (currencySettings.c === "៛" || currencySettings.c === "KHR" || currencySettings.c === "Riel") {
      return "៛" + (num * currencySettings.r).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currencySettings]);

  const bg = "gray.50";
  const cardBg = "white";
  const textColor = "gray.700";

  useEffect(() => {
    fetchRooms();
    fetchSettings();
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");
    if (isLoggedIn && role === "tenant") {
      fetchUserBookings();
    }
  }, [isLoggedIn]);

  const fetchUserBookings = async () => {
    setIsBookingsLoading(true);
    try {
      const response = await api.get("/tenant/bookings");
      setUserBookings(response.data || []);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    } finally {
      setIsBookingsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get("/public/rooms");
      const data = response.data;
      // Handle Laravel pagination (data.data) or simple array (data)
      const roomList = data.data || data;
      setRooms(Array.isArray(roomList) ? roomList : []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get("/public/settings");
      const data = response.data;
      if (data && Object.keys(data).length > 0) {
        setSettings({
          app_name: data.app_name || "RoomRent 100",
          company_name: data.company_name || "RoomRent 100",
          address: data.contact_address || "Phnom Penh, Cambodia",
          phone: data.contact_phone || "+855 12 345 678",
          email: data.contact_email || "support@roomrent100.com",
          currency: data.finance_currency || "$",
          exchange_rate: data.finance_exchange_rate || 4000
        });
        if (data.booking_down_payment_percent) {
          setDownPaymentPercent(Number(data.booking_down_payment_percent));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

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
      const res = await api.post(`/tenant/payment/bakong/generate-qr`, {
        type: "booking_prepay",
        room_id: selectedRoom.id,
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
    toast.success("🎉 Down payment successful! Booking confirmed.");
    setTimeout(() => {
      handleCloseBookingModal();
      navigate('/dashboard/bookings');
    }, 3000);
  };

  const handleCloseBookingModal = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedRoom(null);
    setIsBookingMode(false);
    setBookingStep("details");
    setDesiredDate("");
    setBookingNotes("");
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Toggle display logic
  const displayedRooms = showAll ? filteredRooms : filteredRooms.slice(0, 6);

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
    <Box bg={bg} color="gray.800" minH="100vh">
      <Toaster position="top-right" />
      {/* Navbar */}
      <Box bg={cardBg} px={4} shadow="sm" position="sticky" top="0" zIndex="1000">
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={2} cursor="pointer" onClick={() => navigate("/")}>
              <Box p={1} borderRadius="md" display="flex" alignItems="center">
                <Image src={Logo} alt="Logo" boxSize="150px" objectFit="contain" />
              </Box>
            </HStack>
            <HStack spacing={4}>
              {isLoggedIn ? (
                <Menu placement="bottom-end">
                  <MenuButton
                    as={Flex}
                    alignItems="center"
                    gap={2}
                    px={3}
                    py={1.5}
                    borderRadius="xl"
                    cursor="pointer"
                    bg="transparent"
                    color="gray.600"
                    fontWeight="semibold"
                    fontSize="sm"
                    transition="all 0.2s"
                    _hover={{ bg: "gray.100", color: "gray.800" }}
                  >
                    <HStack spacing={2}>
                      <Text display={{ base: "none", sm: "block" }}>{userDetails.name}</Text>
                      <Avatar size="sm" name={userDetails.name} bg="blue.600" color="white" fontWeight="black" />
                    </HStack>
                  </MenuButton>
                  <MenuList 
                    borderRadius="xl" 
                    boxShadow="lg" 
                    borderColor="gray.200" 
                    p={1}
                  >
                    <MenuItem
                      icon={<FiGrid size={18} />}
                      fontSize="sm"
                      fontWeight="semibold"
                      borderRadius="md"
                      _hover={{ bg: "gray.100", color: "blue.500" }}
                      onClick={() => navigate("/dashboard")}
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem
                      icon={<LuCircleUser size={18} />}
                      fontSize="sm"
                      fontWeight="semibold"
                      borderRadius="md"
                      _hover={{ bg: "gray.100", color: "blue.500" }}
                      onClick={() => navigate("/dashboard/profile")}
                    >
                      Profile
                    </MenuItem>
                    <MenuItem
                      icon={<LuSettings size={18} />}
                      fontSize="sm"
                      fontWeight="semibold"
                      borderRadius="md"
                      _hover={{ bg: "gray.100", color: "blue.500" }}
                      onClick={() => navigate("/dashboard/settings")}
                    >
                      Settings
                    </MenuItem>
                    <MenuItem
                      icon={<IoKeyOutline size={18} />}
                      fontSize="sm"
                      fontWeight="semibold"
                      borderRadius="md"
                      _hover={{ bg: "gray.100", color: "blue.500" }}
                      onClick={onPasswordOpen}
                    >
                      Change Password
                    </MenuItem>
                    <MenuDivider borderColor="gray.200" />
                    <MenuItem
                      icon={<LuLogOut size={18} />}
                      fontSize="sm"
                      fontWeight="semibold"
                      color="red.600"
                      borderRadius="md"
                      _hover={{ bg: "red.50" }}
                      onClick={handleLogout}
                    >
                      Log Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <>
                  <Button 
                    leftIcon={<FiLogIn />} 
                    variant="ghost" 
                    color="gray.800"
                    _hover={{ bg: "gray.100" }}
                    _active={{ bg: "gray.200" }}
                    onClick={() => navigate("/login")} 
                    rounded="full" 
                    fontWeight="bold" 
                    fontSize="sm"
                  >
                    {t("common.login")}
                  </Button>
                  <Button colorScheme="blue" onClick={() => navigate("/login")} rounded="full" fontWeight="bold" fontSize="sm" px={6}>
                    Get Started
                  </Button>
                </>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bg="blue.600" py={20} color="white">
        <Container maxW="container.xl">
          <Stack direction={{ base: "column", md: "row" }} spacing={10} align="center">
            <VStack align="flex-start" spacing={6} flex="1">
              <Heading as="h1" size="2xl" lineHeight="shorter">
                Find Your Perfect Room <br />
                With Zero Hassle
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Modern, affordable, and fully managed rooms available now at <b>{settings.company_name}</b>. 
                Browse our collection and find your next home today.
              </Text>
              <Box w="full" maxW="md">
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input 
                    bg="white" 
                    color="gray.800" 
                    placeholder="Search by room name or details..." 
                    _placeholder={{ color: "gray.400" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Box>
            </VStack>
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <Image 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                borderRadius="2xl" 
                shadow="2xl"
                alt="Room Hero"
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Available Rooms Section */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8} align="flex-start" mb={12}>
          <Heading size="lg" borderBottom="4px solid" borderColor="blue.500" pb={2}>
            Available Rooms
          </Heading>
          <Text color={textColor}>
            Browse our current vacancies and find a space that fits your lifestyle.
          </Text>
        </VStack>

        {loading ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10} w="full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Box key={i} bg={cardBg} borderRadius="xl" overflow="hidden" shadow="md">
                <Skeleton h="240px" w="full" />
                <VStack p={6} align="flex-start" spacing={4}>
                  <Flex justify="space-between" w="full">
                    <Skeleton h="20px" w="120px" />
                    <Skeleton h="28px" w="80px" />
                  </Flex>
                  <HStack spacing={4} w="full">
                    <Skeleton h="16px" w="60px" />
                    <Skeleton h="16px" w="60px" />
                  </HStack>
                  <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" w="full" />
                  <Divider />
                  <HStack w="full">
                    <Skeleton h="32px" w="full" rounded="full" />
                    <Skeleton h="32px" w="full" rounded="full" />
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        ) : displayedRooms.length > 0 ? (
          <>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10}>
              {displayedRooms.map((room, index) => (
                <MotionBox 
                  key={room.uid} 
                  bg={cardBg} 
                  borderRadius="xl" 
                  overflow="hidden" 
                  shadow="md" 
                  _hover={{ transform: "translateY(-8px)", shadow: "xl" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Box position="relative" h="240px">
                    <Image
                      src={room.images && room.images.length > 0 
                        ? `http://localhost:8000/storage/${room.images[0].path}` 
                        : "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                      alt={room.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                    <Badge 
                      position="absolute" 
                      top={4} 
                      right={4} 
                      colorScheme="green" 
                      px={3} 
                      py={1} 
                      borderRadius="full"
                      fontSize="sm"
                    >
                      Available
                    </Badge>
                  </Box>
                  
                  <VStack p={6} align="flex-start" spacing={4}>
                    <Flex justify="space-between" w="full" align="center">
                      <Heading size="md" color="blue.600">{room.name}</Heading>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">{fmt(room.base_rent_price)}</Text>
                    </Flex>
                    
                    <HStack spacing={4} color="gray.500" fontSize="sm">
                      <Flex align="center">
                        <Icon as={FiMapPin} mr={1} />
                        <Text>Floor {room.floor || 0}</Text>
                      </Flex>
                      <Flex align="center">
                        <Icon as={FiMaximize} mr={1} />
                        <Text>{room.size || "N/A"}</Text>
                      </Flex>
                    </HStack>

                    <Text color={textColor} noOfLines={2} fontSize="sm">
                      {room.description || "No description provided for this room. Contact us for more details."}
                    </Text>

                    <Divider />

                    <HStack w="full">
                      <Button flex="1" colorScheme="blue" variant="outline" onClick={() => { setSelectedRoom(room); setIsBookingMode(false); }} rounded="full" fontWeight="bold" textTransform="uppercase" fontSize="xs">
                        View Details
                      </Button>
                      <Button 
                        onClick={() => {
                          if (isLoggedIn) {
                            setSelectedRoom(room);
                            setIsBookingMode(true);
                          } else {
                            navigate("/login");
                          }
                        }}
                        flex="1" 
                        colorScheme="blue" 
                        leftIcon={isLoggedIn ? undefined : <FiLogIn />}
                        rounded="full"
                        fontWeight="bold"
                        textTransform="uppercase"
                        fontSize="xs"
                      >
                        {isLoggedIn ? "Book Now" : "Login to Book"}
                      </Button>
                    </HStack>
                  </VStack>
                </MotionBox>
              ))}
            </SimpleGrid>
            
            {/* Toggle All Rooms Button */}
            {filteredRooms.length > 6 && (
              <Flex justify="center" mt={12}>
                  <Button 
                    size="lg" 
                    colorScheme="blue" 
                    variant="outline" 
                    onClick={() => setShowAll(!showAll)}
                    rightIcon={showAll ? <FiArrowUp /> : <FiArrowRight />}
                    rounded="full"
                    fontWeight="bold"
                    textTransform="uppercase"
                    fontSize="sm"
                  >
                    {showAll ? "Show Less" : `View All Rooms (${filteredRooms.length})`}
                  </Button>
              </Flex>
            )}
          </>
        ) : (
          <Box py={20} textAlign="center" w="full">
            <Text fontSize="lg" color="gray.500">No rooms currently available that match your search.</Text>
            <Button mt={4} variant="link" colorScheme="blue" onClick={() => setSearch("")}>
              Clear Search
            </Button>
          </Box>
        )}
      </Container>

      {/* Map Section */}
      <Box bg="white" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="flex-start" mb={8}>
            <Heading size="lg" borderBottom="4px solid" borderColor="blue.500" pb={2}>
              Our Location
            </Heading>
            <Text color={textColor}>
              Visit us or get in touch. We are conveniently located at <b>{settings.address}</b>.
            </Text>
          </VStack>
          <Box 
            w="full" 
            h={{ base: "300px", md: "450px" }} 
            borderRadius="xl" 
            overflow="hidden" 
            shadow="lg" 
            border="1px solid" 
            borderColor="gray.200"
          >
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || "Phnom Penh, Cambodia")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              title="Location Map"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.800" color="gray.400" py={12}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            <VStack align="flex-start" spacing={4}>
              <Heading size="md" color="white">{settings.app_name}</Heading>
              <Text fontSize="sm">
                The most reliable room rental management system. Powered by <b>{settings.company_name}</b>.
              </Text>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">Quick Links</Heading>
              <Button variant="link" size="sm" onClick={() => navigate("/")}>Home</Button>
              <Button variant="link" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button variant="link" size="sm" onClick={() => setShowAll(true)}>Available Rooms</Button>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">Contact Details</Heading>
              <HStack>
                <Icon as={FiMapPin} />
                <Text fontSize="sm">{settings.address}</Text>
              </HStack>
              <HStack>
                <Icon as={FiPhone} />
                <Text fontSize="sm">{settings.phone}</Text>
              </HStack>
              <HStack>
                <Icon as={FiMail} />
                <Text fontSize="sm">{settings.email}</Text>
              </HStack>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">About</Heading>
              <Text fontSize="sm">Find your perfect home with our easy-to-use rental platform. We prioritize comfort and affordability.</Text>
            </VStack>
          </SimpleGrid>
          <Divider my={8} borderColor="gray.700" />
          <Text textAlign="center" fontSize="xs">
            © {new Date().getFullYear()} {settings.company_name}. All rights reserved.
          </Text>
        </Container>
      </Box>

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
                <Box w="40px" h="3px" borderRadius="full" bg={bookingStep === "details" ? "white" : "whiteAlpha.500"} transition="all 0.3s" />
                <Box w="40px" h="3px" borderRadius="full" bg={bookingStep === "payment" ? "white" : "whiteAlpha.300"} transition="all 0.3s" />
              </HStack>
            )}
            <Text color="whiteAlpha.800" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
              {bookingStep === "payment" ? "Step 2 of 2" : isBookingMode ? "Step 1 of 2" : "Room Details"}
            </Text>
            <Heading size="md" color="white" mt={1} pr={8}>
              {bookingStep === "payment"
                ? "Complete Down Payment"
                : isBookingMode
                  ? `Book: ${selectedRoom?.name}`
                  : selectedRoom?.name}
            </Heading>
          </Box>

          <ModalBody p={{ base: 4, md: 6 }} bg="gray.50">
            {/* View Details Mode */}
            {selectedRoom && !isBookingMode && bookingStep === "details" && (
              <VStack spacing={5} align="stretch">
                <Box h={{ base: "220px", md: "300px" }} borderRadius="xl" overflow="hidden" shadow="md">
                  <Image
                    src={selectedRoom.images && selectedRoom.images.length > 0 
                      ? `http://localhost:8000/storage/${selectedRoom.images[0].path}` 
                      : "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                    alt={selectedRoom.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
                
                <Box bg="white" p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
                  <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                    <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="blue.600">
                      {fmt(selectedRoom.base_rent_price)} <Text as="span" fontSize="sm" color="gray.400" fontWeight="medium">/ month</Text>
                    </Text>
                    <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="xs">Available</Badge>
                  </Flex>

                  <SimpleGrid columns={2} spacing={3} mb={4}>
                    <HStack bg="gray.50" p={3} borderRadius="lg" spacing={2}>
                      <Icon as={FiMapPin} color="blue.400" boxSize={4} />
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Floor {selectedRoom.floor || 0}</Text>
                    </HStack>
                    <HStack bg="gray.50" p={3} borderRadius="lg" spacing={2}>
                      <Icon as={FiMaximize} color="blue.400" boxSize={4} />
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">{selectedRoom.size || "Standard"}</Text>
                    </HStack>
                  </SimpleGrid>

                  {/* Down Payment Info */}
                  <HStack bg="orange.50" p={3} borderRadius="lg" border="1px solid" borderColor="orange.200">
                    <Box bg="orange.100" p={2} borderRadius="md">
                      <Icon as={FiDollarSign} color="orange.500" boxSize={4} />
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="xs" color="orange.600" fontWeight="bold">Down Payment ({downPaymentPercent}%)</Text>
                      <Text fontSize="sm" color="orange.700" fontWeight="bold">{fmt(selectedRoom.base_rent_price * (downPaymentPercent / 100))}</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box bg="white" p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
                  <HStack mb={3} spacing={2}>
                    <Icon as={FiInfo} color="blue.400" />
                    <Heading size="sm" color="gray.700">Description</Heading>
                  </HStack>
                  <Text color="gray.600" fontSize="sm" lineHeight="tall">
                    {selectedRoom.description || "No description provided. Please contact us for more details about this room."}
                  </Text>
                </Box>
              </VStack>
            )}

            {/* Booking Details Step */}
            {selectedRoom && isBookingMode && bookingStep === "details" && (
              <VStack spacing={5} align="stretch">
                {/* Compact Room Summary */}
                <HStack bg="white" p={3} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100" spacing={4}>
                  <Box w="70px" h="70px" borderRadius="lg" overflow="hidden" flexShrink={0}>
                    <Image
                      src={selectedRoom.images && selectedRoom.images.length > 0 
                        ? `http://localhost:8000/storage/${selectedRoom.images[0].path}` 
                        : "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                      alt={selectedRoom.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                  <VStack align="flex-start" spacing={0} flex="1">
                    <Text fontWeight="bold" fontSize="sm" color="gray.800">{selectedRoom.name}</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">{fmt(selectedRoom.base_rent_price)}<Text as="span" fontSize="xs" color="gray.400" fontWeight="normal"> /mo</Text></Text>
                  </VStack>
                  <Badge colorScheme="green" borderRadius="full" px={2} fontSize="2xs">Available</Badge>
                </HStack>

                {/* Down Payment Banner */}
                <Box bg="blue.50" p={4} borderRadius="xl" border="1px solid" borderColor="blue.200">
                  <HStack spacing={3}>
                    <Box bg="blue.100" p={2} borderRadius="lg">
                      <Icon as={FiDollarSign} color="blue.500" boxSize={5} />
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="xs" color="blue.600" fontWeight="bold">Required Down Payment ({downPaymentPercent}%)</Text>
                      <Text fontSize="lg" fontWeight="bold" color="blue.700">{fmt(selectedRoom.base_rent_price * (downPaymentPercent / 100))}</Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Form Fields */}
                <Box bg="white" p={{ base: 4, md: 5 }} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
                  <VStack spacing={5} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                        <HStack spacing={2}>
                          <Icon as={FiCalendar} color="blue.400" boxSize={4} />
                          <Text>Desired Move-in Date</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="date"
                        value={desiredDate}
                        onChange={handleDateChange}
                        min={today}
                        max={maxDate}
                        bg="gray.50"
                        borderColor="gray.200"
                        h="48px"
                        borderRadius="xl"
                        fontSize="sm"
                        _hover={{ borderColor: "blue.300" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                      <Text fontSize="xs" color="gray.400" mt={1}>Select a date within the next 2 months</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                        <HStack spacing={2}>
                          <Icon as={FiMail} color="blue.400" boxSize={4} />
                          <Text>Notes (Optional)</Text>
                        </HStack>
                      </FormLabel>
                      <Textarea
                        placeholder="Any special requests, questions, or preferences?"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        bg="gray.50"
                        borderColor="gray.200"
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
                <Box w="full" bg="white" p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor="green.200">
                  <VStack spacing={1}>
                    <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Amount Due</Text>
                    <Heading size="xl" color="green.600">
                      {fmt(selectedRoom?.base_rent_price * (downPaymentPercent / 100))}
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      {downPaymentPercent}% of {fmt(selectedRoom?.base_rent_price)} monthly rent
                    </Text>
                  </VStack>
                </Box>

                <Box w="full" bg="white" borderRadius="2xl" overflow="hidden" border="2px solid" borderColor={paymentConfirmed ? "green.400" : qrString ? "blue.300" : "gray.200"} transition="all 0.5s ease" shadow={qrString && !paymentConfirmed ? "0 0 30px -5px rgba(66,153,225,0.4)" : "none"}>
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
          <Box bg="white" borderTop="1px solid" borderColor="gray.100" px={6} py={4} shadow="0 -4px 20px rgba(0,0,0,0.05)">
            {bookingStep === "payment" ? (
              <Button 
                variant="outline" 
                w="full" 
                onClick={handleCloseBookingModal} 
                rounded="xl" 
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
                  rounded="xl" 
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
                  leftIcon={isLoggedIn ? undefined : <FiLogIn />} 
                  rounded="xl"
                  fontWeight="bold"
                  fontSize="sm"
                  h="48px"
                  flex={{ base: "auto", sm: 1 }}
                  shadow="md"
                  onClick={() => {
                    if (isLoggedIn) {
                      setIsBookingMode(true);
                    } else {
                      navigate("/login");
                    }
                  }}
                >
                  {isLoggedIn ? "Book Now" : "Login to Book"}
                </Button>
              </Stack>
            ) : (
              <Stack direction={{ base: "column-reverse", sm: "row" }} w="full" spacing={3}>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsBookingMode(false)} 
                  rounded="xl" 
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
                  rounded="xl"
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

      {/* Booking Requests Floating Button & Drawer */}
      {isLoggedIn && (
        <>
          <Tooltip label="My Booking Requests" placement="left">
            <Button
              position="fixed"
              bottom="30px"
              right="30px"
              colorScheme="blue"
              borderRadius="full"
              w="60px"
              h="60px"
              shadow="2xl"
              onClick={onDrawerOpen}
              zIndex="1001"
              _hover={{ transform: "scale(1.1)" }}
              transition="all 0.2s"
            >
              <Icon as={FiCalendar} boxSize={6} />
              {userBookings.length > 0 && (
                <Badge
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  colorScheme="red"
                  borderRadius="full"
                  variant="solid"
                  fontSize="xs"
                  minW="20px"
                >
                  {userBookings.length}
                </Badge>
              )}
            </Button>
          </Tooltip>

          <Drawer isOpen={isDrawerOpen} placement="right" onClose={onDrawerClose} size="sm">
            <DrawerOverlay backdropFilter="blur(2px)" />
            <DrawerContent borderLeftRadius="2xl">
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px" color="blue.600">
                My Booking Requests
              </DrawerHeader>

              <DrawerBody bg="gray.50" p={4}>
                {isBookingsLoading ? (
                  <Flex justify="center" align="center" h="200px">
                    <Spinner color="blue.500" />
                  </Flex>
                ) : userBookings.length === 0 ? (
                  <VStack spacing={4} py={10} textAlign="center">
                    <Icon as={FiCalendar} boxSize={12} color="gray.300" />
                    <Text color="gray.500">You haven't requested any rooms yet.</Text>
                  </VStack>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {userBookings.map((b) => (
                      <Box
                        key={b.id}
                        bg="white"
                        p={4}
                        borderRadius="xl"
                        shadow="sm"
                        border="1px solid"
                        borderColor="gray.100"
                      >
                        <VStack align="stretch" spacing={2}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="bold" fontSize="md" color="blue.700">
                              {b.room?.name || "Room"}
                            </Text>
                            <Badge
                              colorScheme={
                                b.status === "approved"
                                  ? "green"
                                  : b.status === "pending"
                                  ? "yellow"
                                  : "red"
                              }
                              borderRadius="full"
                              px={2}
                            >
                              {b.status}
                            </Badge>
                          </Flex>

                          <HStack fontSize="xs" color="gray.500" spacing={4}>
                            <HStack>
                              <Icon as={FiCalendar} />
                              <Text>{b.desired_move_in_date || "Anytime"}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiDollarSign} />
                              <Text fontWeight="bold">{fmt(b.down_payment_amount)}</Text>
                            </HStack>
                          </HStack>

                          <Flex justify="space-between" align="center" mt={1}>
                            <HStack spacing={1}>
                              <Icon 
                                as={b.down_payment_status === 'paid' ? FiCheckCircle : FiClock} 
                                color={b.down_payment_status === 'paid' ? "green.500" : "orange.400"} 
                                boxSize={3}
                              />
                              <Text fontSize="10px" fontWeight="bold" color="gray.400">
                                {b.down_payment_status === 'paid' ? "PAID" : "UNPAID"}
                              </Text>
                            </HStack>
                            <Text fontSize="10px" color="gray.400">
                              {new Date(b.created_at).toLocaleDateString()}
                            </Text>
                          </Flex>
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </DrawerBody>

              <DrawerFooter borderTopWidth="1px">
                <Button variant="outline" mr={3} onClick={onDrawerClose} w="full" rounded="full">
                  Close
                </Button>
                <Button colorScheme="blue" onClick={() => navigate("/dashboard/bookings")} w="full" rounded="full">
                  Manage All
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isPasswordOpen} onClose={onPasswordClose} />
      </Box>
      );
      };

      export default Landing;
