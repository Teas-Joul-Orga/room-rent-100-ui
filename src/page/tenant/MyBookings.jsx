import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
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
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
} from "@chakra-ui/react";
import { FiCalendar, FiHome, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiArrowRight, FiDollarSign, FiDownload, FiAlertTriangle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import api from "../../api/axios";
import echo from "../../utils/echo";

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
      <Text fontSize="10px" fontWeight="bold" color={isActive || isCompleted ? "gray.700" : "gray.400"} textAlign="center" position="absolute" top="100%" mt={1} whiteSpace="nowrap">
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
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLive, setIsLive] = useState(false);

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
    };
  }, []);

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

  const cancelBooking = async (booking) => {
    const msg = booking.status === 'confirmed' 
      ? t('my_bookings.cancel_confirmed_warn') 
      : t('my_bookings.cancel_default_warn');
    if (!window.confirm(msg)) return;

    const previousBookings = [...bookings];
    setBookings(bookings.filter(b => b.id !== booking.id));

    try {
      await api.post(`/tenant/bookings/${booking.uid}/cancel`);
      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (error) {
      setBookings(previousBookings);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const downloadContract = async (booking) => {
    try {
      const res = await api.get(`/tenant/bookings/${booking.uid}/contract`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Failed to download contract");
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      pending: "yellow",
      confirmed: "blue",
      approved: "green",
      completed: "green",
      rejected: "red",
      cancelled: "gray",
      no_show: "red",
    };
    const labelMap = {
      pending: t('my_bookings.pending'),
      confirmed: t('my_bookings.confirmed'),
      approved: t('my_bookings.approved'),
      completed: t('my_bookings.completed'),
      rejected: t('my_bookings.rejected'),
      cancelled: t('my_bookings.cancelled'),
      no_show: t('my_bookings.no_show'),
    };
    return (
      <Badge colorScheme={colorMap[status] || "gray"} px={3} py={1} borderRadius="full" fontSize="xs">
        {labelMap[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const getDeadlineInfo = (booking) => {
    if (!booking.move_in_deadline) return null;
    const days = booking.days_until_deadline;
    if (days === null || days === undefined) return null;
    
    if (days < 0) return { color: "red", text: t('my_bookings.expired'), urgency: "expired" };
    if (days === 0) return { color: "red", text: t('my_bookings.today'), urgency: "critical" };
    if (days <= 7) return { color: "orange", text: t('my_bookings.days_left', { days }), urgency: "warning" };
    return { color: "green", text: t('my_bookings.days_left', { days }), urgency: "ok" };
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
              {t('my_bookings.title')}
            </Heading>
            <Text color={mutedText} fontSize="sm">{t('my_bookings.subtitle')}</Text>
          </VStack>
          
          <HStack bg={cardBg} px={4} py={2} borderRadius="full" shadow="sm" border="1px" borderColor={borderColor}>
            <Box w={2} h={2} borderRadius="full" bg={isLive ? "green.500" : "red.500"} />
            <Text fontSize="xs" fontWeight="bold" color={mutedText}>{isLive ? t('my_bookings.live_updates') : t('my_bookings.offline')}</Text>
          </HStack>
        </Flex>

        {bookings.length === 0 ? (
          <Box bg={cardBg} p={20} borderRadius="2xl" shadow="sm" textAlign="center" border="1px" borderColor={borderColor}>
            <Icon as={FiHome} boxSize={12} color="gray.300" mb={4} />
            <Heading size="md" mb={2}>{t('my_bookings.no_bookings_yet')}</Heading>
            <Text color={mutedText} mb={6}>{t('my_bookings.no_bookings_desc')}</Text>
            <Button colorScheme="blue" borderRadius="full" leftIcon={<FiArrowRight />} onClick={() => window.location.href='/dashboard/available-rooms'}>
              {t('my_bookings.find_a_room')}
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {bookings.map((b) => {
              const deadlineInfo = getDeadlineInfo(b);
              
              return (
                <Box key={b.id} bg={cardBg} borderRadius="2xl" shadow="md" overflow="hidden" border="1px" borderColor={borderColor}>
                  <Flex direction={{ base: "column", sm: "row" }}>
                    <Box w={{ base: "full", sm: "200px" }} h={{ base: "150px", sm: "auto" }} bg="gray.100" position="relative">
                      {b.room?.images?.[0] ? (
                        <Image src={b.room.images[0].url} alt={b.room.name} objectFit="cover" h="full" w="full" />
                      ) : (
                        <Flex h="full" w="full" align="center" justify="center" direction="column">
                          <Icon as={FiHome} boxSize={8} color="gray.400" />
                          <Text fontSize="xs" color="gray.400" mt={2}>{t('my_bookings.room_preview')}</Text>
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
                            <Text fontWeight="bold" fontSize="xl">{b.room?.name || t('my_bookings.room_details')}</Text>
                            <HStack spacing={1} color={mutedText} fontSize="sm">
                              <Icon as={FiCalendar} />
                              <Text>{b.desired_move_in_date ? t('my_bookings.move_in', { date: new Date(b.desired_move_in_date).toLocaleDateString() }) : t('my_bookings.anytime')}</Text>
                            </HStack>
                          </VStack>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontWeight="black" fontSize="xl" color="blue.600">{formatCurrency(b.down_payment_amount)}</Text>
                            <Text fontSize="xs" color={mutedText} fontWeight="bold">{t('my_bookings.down_payment')}</Text>
                          </VStack>
                        </Flex>

                        {/* Booking Steps */}
                        <Box py={4} px={2}>
                          <Flex justify="space-between" position="relative">
                            <BookingStep label={t('my_bookings.submitted')} isCompleted={true} isLast={false} />
                            <BookingStep 
                              label={t('my_bookings.payment')} 
                              isCompleted={b.down_payment_status === 'paid'} 
                              isActive={b.down_payment_status === 'unpaid' && b.status === 'pending'} 
                              isLast={false} 
                            />
                            <BookingStep 
                              label={t('my_bookings.confirmed')} 
                              isCompleted={['confirmed', 'completed'].includes(b.status)} 
                              isActive={b.down_payment_status === 'paid' && b.status === 'pending'} 
                              isLast={true} 
                            />
                          </Flex>
                        </Box>

                        {/* Move-in Deadline Alert */}
                        {b.status === 'confirmed' && b.move_in_deadline && deadlineInfo && (
                          <Box 
                            bg={`${deadlineInfo.color}.50`} 
                            p={3} 
                            borderRadius="xl" 
                            border="1px" 
                            borderColor={`${deadlineInfo.color}.200`}
                          >
                            <HStack spacing={3}>
                              <Icon 
                                as={deadlineInfo.urgency === 'ok' ? FiClock : FiAlertTriangle} 
                                color={`${deadlineInfo.color}.500`} 
                                boxSize={5} 
                              />
                              <VStack align="flex-start" spacing={0} flex={1}>
                                <Text fontSize="xs" fontWeight="bold" color={`${deadlineInfo.color}.700`}>
                                  {t('my_bookings.move_in_deadline')}
                                </Text>
                                <Text fontWeight="bold" fontSize="sm" color={`${deadlineInfo.color}.800`}>
                                  {new Date(b.move_in_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </Text>
                              </VStack>
                              <Badge colorScheme={deadlineInfo.color} borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="bold">
                                {deadlineInfo.text}
                              </Badge>
                            </HStack>
                            {deadlineInfo.urgency !== 'ok' && (
                              <Progress 
                                value={Math.max(0, 100 - ((b.days_until_deadline ?? 0) / 14) * 100)} 
                                size="xs" 
                                colorScheme={deadlineInfo.color} 
                                mt={2} 
                                borderRadius="full" 
                              />
                            )}
                          </Box>
                        )}

                        {/* No-Show Message */}
                        {b.status === 'no_show' && (
                          <Alert status="error" borderRadius="xl" variant="left-accent">
                            <AlertIcon />
                            <AlertDescription fontSize="sm">
                              {t('my_bookings.no_show_msg', {
                                date: b.move_in_deadline ? ` (${new Date(b.move_in_deadline).toLocaleDateString()})` : ''
                              })}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Completed Message */}
                        {b.status === 'completed' && (
                          <Alert status="success" borderRadius="xl" variant="left-accent">
                            <AlertIcon />
                            <AlertDescription fontSize="sm">
                              {t('my_bookings.completed_msg')}
                            </AlertDescription>
                          </Alert>
                        )}

                        <Divider />

                        <Flex justify="space-between" align="center">
                          <HStack>
                            <Icon as={b.down_payment_status === 'paid' ? FiCheckCircle : FiAlertCircle} color={b.down_payment_status === 'paid' ? "green.500" : "orange.500"} />
                            <Text fontSize="sm" fontWeight="medium">
                              {b.down_payment_status === 'paid' ? t('my_bookings.payment_verified') : t('my_bookings.awaiting_payment')}
                            </Text>
                          </HStack>
                          
                          <HStack spacing={2}>
                            {/* Download Contract */}
                            {b.status === 'confirmed' && (
                              <Button size="sm" colorScheme="purple" variant="outline" leftIcon={<FiDownload />} onClick={() => downloadContract(b)} borderRadius="full">
                                {t('my_bookings.contract')}
                              </Button>
                            )}
                            
                            {/* Cancel */}
                            {['pending', 'confirmed'].includes(b.status) && (
                              <Button size="sm" colorScheme="red" variant="ghost" leftIcon={<FiXCircle />} onClick={() => cancelBooking(b)}>
                                {t('my_bookings.cancel')}
                              </Button>
                            )}
                          </HStack>
                        </Flex>
                      </VStack>
                    </Box>
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
}
