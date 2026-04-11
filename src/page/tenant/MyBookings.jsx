import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useColorModeValue,
  Spinner,
  Text,
  Flex,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Image,
  Divider,
} from "@chakra-ui/react";
import { FiCalendar, FiHome, FiInfo, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiArrowRight, FiDollarSign } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import echo from "../../utils/echo";
import { QRCodeCanvas } from "qrcode.react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";

const BAKONG_LOGO_RED = "https://bakong.nbc.gov.kh/images/logo.png";

const BookingStep = ({ label, isCompleted, isActive, isLast }) => (
  <Flex align="center" flex={isLast ? "none" : 1}>
    <VStack spacing={1} align="center" position="relative">
      <Flex
        h={8}
        w={8}
        borderRadius="full"
        bg={isCompleted ? "green.500" : isActive ? "blue.500" : "gray.200"}
        color="white"
        align="center"
        justify="center"
        zIndex={1}
      >
        <Icon as={isCompleted ? FiCheckCircle : isActive ? FiClock : FiCircle} />
      </Flex>
      <Text fontSize="10px" fontWeight="bold" color={isActive || isCompleted ? "gray.700" : "gray.400"} textTransform="uppercase" textAlign="center" position="absolute" top="100%" mt={1} whiteSpace="nowrap">
        {label}
      </Text>
    </VStack>
    {!isLast && (
      <Box flex={1} h="2px" bg={isCompleted ? "green.500" : "gray.200"} mx={2} />
    )}
  </Flex>
);

const FiCircle = () => <Box w={2} h={2} borderRadius="full" border="2px solid currentColor" />;

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Payment Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [qrString, setQrString] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const pollingRef = React.useRef(null);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      await fetchBookings();
    };
    init();

    echo.connector.pusher.connection.bind('connected', () => setIsLive(true));
    echo.connector.pusher.connection.bind('disconnected', () => setIsLive(false));
    setIsLive(echo.connector.pusher.connection.state === 'connected');

    return () => {
      if (user?.tenant?.id) {
        echo.leaveChannel(`tenant.bookings.${user.tenant.id}`);
      }
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Listen for specific payment MD5 if open
  useEffect(() => {
    if (!qrMd5) return;
    const channel = echo.channel(`bakong.payment.${qrMd5}`)
      .listen('.App\\Events\\BakongPaymentConfirmed', (e) => {
          if (pollingRef.current) clearInterval(pollingRef.current);
          handlePaymentSuccess();
      });
    return () => echo.leaveChannel(`bakong.payment.${qrMd5}`);
  }, [qrMd5]);

  const handlePayNow = async (booking) => {
    setSelectedBooking(booking);
    setPaymentConfirmed(false);
    setQrString(null);
    setQrMd5(null);
    onOpen();
    setLoadingQr(true);

    try {
      const res = await api.post(`/tenant/payment/bakong/generate-qr`, {
        type: "booking",
        id: booking.id,
      });
      const data = res.data;
      if (data.status === "success") {
        setQrString(data.data.qrString);
        setQrMd5(data.data.md5);
        startPolling(data.data.md5);
      }
    } catch (e) {
      toast.error("Failed to generate payment QR");
    } finally {
      setLoadingQr(false);
    }
  };

  const startPolling = (md5) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.post(`/tenant/payment/bakong/check-transaction`, { md5 });
        if (res.data.status === "success" && res.data.paid === true) {
          clearInterval(pollingRef.current);
          handlePaymentSuccess();
        }
      } catch (_) {}
    }, 5000);
  };

  const handlePaymentSuccess = () => {
    setPaymentConfirmed(true);
    toast.success("Payment verified successfully!");
    fetchBookings();
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleCloseModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    onClose();
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data.user);
    } catch (error) {
      console.error("Failed to load user profile", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get("/tenant/bookings");
      setBookings(res.data);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    // Optimistic UI update
    const previousBookings = [...bookings];
    setBookings(bookings.filter(b => b.id !== id));

    try {
      await api.post(`/tenant/bookings/${id}/cancel`);
      toast.success("Booking cancelled successfully");
    } catch (error) {
      setBookings(previousBookings);
      toast.error("Failed to cancel booking");
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      pending: "yellow",
      approved: "green",
      rejected: "red",
      cancelled: "gray",
    };
    return (
      <Badge colorScheme={colorMap[status] || "gray"} px={3} py={1} borderRadius="full" textTransform="uppercase" fontSize="xs">
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) return (
    <Flex h="60vh" align="center" justify="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text color={mutedText} fontWeight="medium">Loading your bookings...</Text>
      </VStack>
    </Flex>
  );

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <VStack align="flex-start" spacing={0}>
            <Heading size="lg" color={textColor} letterSpacing="tight">
              My Bookings
            </Heading>
            <Text color={mutedText} fontSize="sm">Track your room reservation status.</Text>
          </VStack>
          
          <HStack bg={cardBg} px={4} py={2} borderRadius="full" shadow="sm" border="1px" borderColor={borderColor}>
            <Box w={2} h={2} borderRadius="full" bg={isLive ? "green.500" : "red.500"} />
            <Text fontSize="xs" fontWeight="bold" color={mutedText}>{isLive ? "Live Updates" : "Offline"}</Text>
          </HStack>
        </Flex>

        {bookings.length === 0 ? (
          <Box bg={cardBg} p={20} borderRadius="2xl" shadow="sm" textAlign="center" border="1px" borderColor={borderColor}>
            <Icon as={FiHome} boxSize={12} color="gray.300" mb={4} />
            <Heading size="md" mb={2}>No Bookings Yet</Heading>
            <Text color={mutedText} mb={6}>You haven't made any room reservations.</Text>
            <Button colorScheme="blue" borderRadius="full" leftIcon={<FiArrowRight />} onClick={() => window.location.href='/public/rooms'}>
              Find a Room
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {bookings.map((b) => (
              <Box key={b.id} bg={cardBg} borderRadius="2xl" shadow="md" overflow="hidden" border="1px" borderColor={borderColor}>
                <Flex direction={{ base: "column", sm: "row" }}>
                  <Box w={{ base: "full", sm: "200px" }} h={{ base: "150px", sm: "auto" }} bg="gray.100" position="relative">
                    {b.room?.images?.[0] ? (
                      <Image src={b.room.images[0].url} alt={b.room.name} objectFit="cover" h="full" w="full" />
                    ) : (
                      <Flex h="full" w="full" align="center" justify="center" direction="column">
                        <Icon as={FiHome} boxSize={8} color="gray.400" />
                        <Text fontSize="xs" color="gray.400" mt={2}>Room Preview</Text>
                      </Flex>
                    )}
                    <Box position="absolute" top={2} left={2}>
                      {getStatusBadge(b.status)}
                    </Box>
                  </Box>

                  <Box p={6} flex={1}>
                    <VStack align="stretch" spacing={4}>
                      <Flex justify="space-between" align="flex-start">
                        <VStack align="flex-start" spacing={0}>
                          <Text fontWeight="bold" fontSize="xl">{b.room?.name || "Room Details"}</Text>
                          <HStack spacing={1} color={mutedText} fontSize="sm">
                            <Icon as={FiCalendar} />
                            <Text>Move-in: {b.desired_move_in_date || "Anytime"}</Text>
                          </HStack>
                        </VStack>
                        <VStack align="flex-end" spacing={0}>
                          <Text fontWeight="black" fontSize="xl" color="blue.600">{formatCurrency(b.down_payment_amount)}</Text>
                          <Text fontSize="xs" color={mutedText} fontWeight="bold">DOWN PAYMENT</Text>
                        </VStack>
                      </Flex>

                      <Box py={4} px={2}>
                        <Flex justify="space-between" position="relative">
                          <BookingStep label="Submitted" isCompleted={true} isLast={false} />
                          <BookingStep 
                            label="Payment" 
                            isCompleted={b.down_payment_status === 'paid'} 
                            isActive={b.down_payment_status === 'unpaid' && b.status === 'pending'} 
                            isLast={false} 
                          />
                          <BookingStep 
                            label="Approval" 
                            isCompleted={b.status === 'approved'} 
                            isActive={b.status === 'pending' && b.down_payment_status === 'paid'} 
                            isLast={true} 
                          />
                        </Flex>
                      </Box>

                      <Divider />

                      <Flex justify="space-between" align="center">
                        <HStack>
                          <Icon as={b.down_payment_status === 'paid' ? FiCheckCircle : FiAlertCircle} color={b.down_payment_status === 'paid' ? "green.500" : "orange.500"} />
                          <Text fontSize="sm" fontWeight="medium">
                            {b.down_payment_status === 'paid' ? "Payment Verified" : "Awaiting Payment"}
                          </Text>
                        </HStack>
                        
                        <HStack spacing={2}>
                          {b.down_payment_status === 'unpaid' && b.status === 'pending' && (
                            <Button size="sm" colorScheme="blue" variant="solid" leftIcon={<FiDollarSign />} onClick={() => handlePayNow(b)}>
                              Pay Now
                            </Button>
                          )}
                          {b.status === "pending" && (
                            <Button size="sm" colorScheme="red" variant="ghost" leftIcon={<FiXCircle />} onClick={() => cancelBooking(b.id)}>
                              Cancel
                            </Button>
                          )}
                        </HStack>
                      </Flex>
                    </VStack>
                  </Box>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Payment Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} isCentered size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={cardBg} shadow="2xl">
          <ModalHeader color={textColor}>Complete Down Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={5}>
              <Box w="full" bg={useColorModeValue("green.50", "rgba(72,187,120,0.1)")} p={5} borderRadius="xl" border="1px solid" borderColor={useColorModeValue("green.200", "green.800")}>
                <VStack spacing={1}>
                  <Text fontSize="sm" color={mutedText} fontWeight="bold">Amount Due</Text>
                  <Heading size="lg" color="green.600" _dark={{ color: "green.300" }}>
                    {selectedBooking ? formatCurrency(selectedBooking.down_payment_amount) : "$0.00"}
                  </Heading>
                </VStack>
              </Box>

              <Box w="full" bg={cardBg} borderRadius="2xl" overflow="hidden" border="2px solid" borderColor={paymentConfirmed ? "green.400" : qrString ? "blue.300" : borderColor} transition="all 0.5s ease" shadow={qrString && !paymentConfirmed ? "0 0 30px -5px rgba(66,153,225,0.4)" : "none"}>
                {paymentConfirmed ? (
                  <Box bgGradient="linear(to-br, green.400, green.600)" p={8} textAlign="center">
                    <Icon as={FiCheckCircle} boxSize={12} color="white" mb={4} />
                    <Heading size="md" color="white" mb={2}>Payment Verified!</Heading>
                    <Text color="whiteAlpha.900" fontSize="sm">Your booking status will update shortly.</Text>
                  </Box>
                ) : (
                  <>
                    <Box bg={qrString ? "blue.500" : "gray.100"} px={5} py={2}>
                      <Text fontSize="sm" fontWeight="bold" color={qrString ? "white" : "gray.600"} textAlign="center">Bakong KHQR</Text>
                    </Box>
                    <Box p={6} textAlign="center">
                       {loadingQr ? (
                         <VStack spacing={4} py={8}>
                           <Spinner size="xl" color="blue.500" thickness="4px" />
                           <Text fontSize="sm" fontWeight="bold" color={textColor}>Generating Secure QR...</Text>
                         </VStack>
                       ) : qrString ? (
                         <VStack spacing={5}>
                           <Box w="240px" bg="white" borderRadius="xl" p={4} shadow="xl" border="1px solid" borderColor="gray.200" mx="auto">
                             <Box bg="#005EAA" p={2} mb={3} borderRadius="md">
                               <Text color="white" fontSize="md" fontWeight="black" fontStyle="italic" letterSpacing="widest">KHQR</Text>
                             </Box>
                             <QRCodeCanvas 
                               value={qrString} size={200} level="H" includeMargin={false}
                                imageSettings={{ src: BAKONG_LOGO_RED, x: undefined, y: undefined, height: 40, width: 40, excavate: true }}
                             />
                           </Box>
                           <HStack justify="center" spacing={3}>
                              <Spinner size="xs" color="blue.400" />
                              <Text fontSize="xs" color={mutedText} fontWeight="bold">Awaiting Transaction Confirmation</Text>
                           </HStack>
                         </VStack>
                       ) : (
                         <Text color="red.500">Error loading QR code.</Text>
                       )}
                    </Box>
                  </>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
             <Button variant="ghost" w="full" onClick={handleCloseModal} color={textColor} isDisabled={paymentConfirmed}>
                Close
             </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
