import React, { useState, useEffect } from "react";
import { useSessionState } from "../../hooks/useSessionState";
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
  HStack,
  useDisclosure,
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
  InputGroup,
  InputLeftElement,
  VStack,
  Divider,
  SimpleGrid,
  Icon,
  Avatar,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
} from "@chakra-ui/react";
import { FiCalendar, FiHome, FiUser, FiInfo, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiDownload, FiAlertTriangle, FiUserX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import api from "../../api/axios";
import echo from "../../utils/echo";

const StatCard = ({ title, value, icon, color }) => (
  <Box px={5} py={4} bg={useColorModeValue("white", "gray.800")} borderRadius="xl" shadow="sm" border="1px" borderColor={useColorModeValue("gray.100", "gray.700")}>
    <Flex align="center" justify="space-between">
      <VStack align="flex-start" spacing={0}>
        <Text fontSize="sm" color="gray.500" fontWeight="medium">{title}</Text>
        <Text fontSize="2xl" fontWeight="bold">{value}</Text>
      </VStack>
      <Flex h={12} w={12} bg={`${color}.50`} color={`${color}.500`} borderRadius="xl" align="center" justify="center" _dark={{ bg: `${color}.900`, color: `${color}.200` }}>
        <Icon as={icon} boxSize={6} />
      </Flex>
    </Flex>
  </Box>
);

export default function AdminBookingManagement() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useSessionState("allBookings", []);
  const [noShows, setNoShows] = useSessionState("allNoShows", []);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Create Lease Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("6");
  const [startDate, setStartDate] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const calculatedEndDate = React.useMemo(() => {
    if (!startDate || !leaseDuration) return "N/A";
    const date = new Date(startDate);
    if (isNaN(date.getTime())) return "Invalid Date";
    date.setMonth(date.getMonth() + parseInt(leaseDuration, 10));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, [startDate, leaseDuration]);

  const bg = useColorModeValue("gray.50", "gray.900");
  const contentBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    fetchBookings();
    fetchNoShows();

    const channel = echo.channel('admin.bookings')
      .listen('BookingCreated', (e) => {
        toast.success("New booking confirmed!");
        fetchBookings();
      });

    echo.connector.pusher.connection.bind('connected', () => setIsLive(true));
    echo.connector.pusher.connection.bind('disconnected', () => setIsLive(false));
    setIsLive(echo.connector.pusher.connection.state === 'connected');

    return () => {
      channel.stopListening('BookingCreated');
      echo.leaveChannel('admin.bookings');
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get("/admin/bookings");
      setBookings(res.data);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNoShows = async () => {
    try {
      const res = await api.get("/admin/bookings/no-shows");
      setNoShows(res.data);
    } catch (error) {
      console.error("Failed to load no-shows");
    }
  };

  const handleCreateLeaseClick = (booking) => {
    setSelectedBooking(booking);
    setRentAmount(booking.room?.base_rent_price || "");
    setSecurityDeposit(booking.room?.base_rent_price || "");
    setLeaseDuration("6");
    setStartDate(booking.desired_move_in_date || new Date().toISOString().split('T')[0]);
    onOpen();
  };

  const submitCreateLease = async () => {
    if (!selectedBooking) return;
    setIsApproving(true);

    try {
      await api.post(`/admin/bookings/${selectedBooking.uid}/confirm-lease`, {
        rent_amount: rentAmount,
        security_deposit: securityDeposit,
        lease_duration_months: leaseDuration,
        start_date: startDate,
      });
      toast.success("Lease created successfully! Room is now occupied.");
      onClose();
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create lease");
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm("Cancel this booking and release the room back to available?")) return;

    const previousBookings = [...bookings];
    setBookings(bookings.map(b =>
      b.id === booking.id ? { ...b, status: 'cancelled' } : b
    ));

    try {
      await api.post(`/admin/bookings/${booking.uid}/cancel`);
      toast.success("Booking cancelled, room released.");
      fetchBookings();
    } catch (error) {
      setBookings(previousBookings);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const handleReject = async (booking) => {
    if (!window.confirm("Are you sure you want to reject this booking?")) return;

    const previousBookings = [...bookings];
    setBookings(bookings.map(b =>
      b.id === booking.id ? { ...b, status: 'rejected' } : b
    ));

    try {
      await api.post(`/admin/bookings/${booking.uid}/reject`);
      toast.success("Booking rejected");
    } catch (error) {
      setBookings(previousBookings);
      toast.error("Failed to reject booking");
    }
  };

  const downloadContract = async (booking) => {
    try {
      const res = await api.get(`/admin/bookings/${booking.uid}/contract`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Failed to generate contract");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "yellow", icon: FiClock },
      confirmed: { color: "blue", icon: FiCheckCircle },
      approved: { color: "green", icon: FiCheckCircle },
      completed: { color: "green", icon: FiCheckCircle },
      rejected: { color: "red", icon: FiXCircle },
      cancelled: { color: "gray", icon: FiInfo },
      no_show: { color: "red", icon: FiUserX },
    };
    const { color, icon } = config[status] || config.pending;
    return (
      <Badge colorScheme={color} px={2} py={1} borderRadius="full" textTransform="capitalize" variant="subtle" display="inline-flex" alignItems="center">
        <Icon as={icon} mr={1} />
        {status === 'no_show' ? t('booking_management.no_show_status') : status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    const isPaid = status === 'paid';
    return (
      <Badge colorScheme={isPaid ? "green" : "orange"} px={2} py={0.5} borderRadius="md" variant="solid" fontSize="2xs">
        {isPaid ? t('booking_management.paid') : t('booking_management.unpaid')}
      </Badge>
    );
  };

  const getDeadlineBadge = (booking) => {
    if (!booking.move_in_deadline) return null;
    const days = booking.days_until_deadline;
    if (days === null || days === undefined) return null;
    
    let color = "green";
    let text = t('booking_management.days_left', { days });
    if (days < 0) { color = "red"; text = t('booking_management.expired'); }
    else if (days === 0) { color = "red"; text = t('booking_management.today'); }
    else if (days <= 7) { color = "orange"; text = t('booking_management.days_left', { days }); }
    
    return (
      <Badge colorScheme={color} px={2} py={0.5} borderRadius="md" variant="outline" fontSize="2xs">
        {text}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    noShows: noShows.length,
  };

  if (isLoading) return (
    <Flex h="60vh" align="center" justify="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text color={mutedText} fontWeight="medium">Loading booking requests...</Text>
      </VStack>
    </Flex>
  );

  const renderBookingTable = (list, showActions = true) => (
    <Box bg={contentBg} borderRadius="2xl" shadow="sm" overflow="hidden" border="1px" borderColor={borderColor}>
      {list.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={20}>
          <Icon as={FiCalendar} boxSize={12} color="gray.300" mb={4} />
          <Text fontWeight="semibold" fontSize="lg" color="gray.600">{t('booking_management.no_bookings_found')}</Text>
          <Text color="gray.500">{t('booking_management.no_bookings_desc')}</Text>
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead bg={cardBg}>
              <Tr>
                <Th py={4}>{t('booking_management.tenant_details')}</Th>
                <Th>{t('booking_management.room_move_in')}</Th>
                <Th>{t('booking_management.financials')}</Th>
                <Th>{t('booking_management.status')}</Th>
                <Th>{t('booking_management.deadline')}</Th>
                {showActions && <Th textAlign="right">{t('booking_management.actions')}</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {list.map((b) => (
                <Tr key={b.id} _hover={{ bg: cardBg }} transition="background 0.2s">
                  <Td>
                    <HStack spacing={3}>
                      <Avatar size="sm" name={b.tenant?.name} src={b.tenant?.photo} />
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">{b.tenant?.name}</Text>
                        <Text fontSize="xs" color={mutedText}>{b.tenant?.email || b.tenant?.phone || t('booking_management.no_contact')}</Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <VStack align="flex-start" spacing={1}>
                      <HStack spacing={1}>
                        <Icon as={FiHome} size="12px" color="blue.500" />
                        <Text fontSize="sm" fontWeight="medium">{b.room?.name}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FiCalendar} size="12px" color="orange.500" />
                        <Text fontSize="xs" color={mutedText}>{b.desired_move_in_date ? new Date(b.desired_move_in_date).toLocaleDateString() : t('booking_management.not_specified')}</Text>
                      </HStack>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="flex-start" spacing={1}>
                      <HStack spacing={1}>
                        <Text fontSize="sm" fontWeight="bold">{formatCurrency(b.down_payment_amount)}</Text>
                        {getPaymentBadge(b.down_payment_status)}
                      </HStack>
                      {b.notes && (
                        <HStack spacing={1} maxW="150px">
                          <Icon as={FiInfo} size="10px" color="gray.400" />
                          <Text fontSize="xs" color={mutedText} isTruncated>{b.notes}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    {getStatusBadge(b.status)}
                  </Td>
                  <Td>
                    <VStack align="flex-start" spacing={1}>
                      {b.move_in_deadline ? (
                        <>
                          <Text fontSize="xs" color={mutedText}>
                            {new Date(b.move_in_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                          {b.status === 'confirmed' && getDeadlineBadge(b)}
                        </>
                      ) : (
                        <Text fontSize="xs" color={mutedText}>
                          {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  {showActions && (
                    <Td textAlign="right">
                      <HStack spacing={2} justify="flex-end" flexWrap="wrap">
                        {/* Confirmed: Create Lease + Download Contract + Cancel */}
                        {b.status === "confirmed" && (
                          <>
                            <Button
                              size="xs"
                              colorScheme="green"
                              leftIcon={<FiDollarSign />}
                              onClick={() => handleCreateLeaseClick(b)}
                              borderRadius="full"
                            >
                              {t('booking_management.create_lease')}
                            </Button>
                            <Button
                              size="xs"
                              colorScheme="purple"
                              variant="outline"
                              leftIcon={<FiDownload />}
                              onClick={() => downloadContract(b)}
                              borderRadius="full"
                            >
                              {t('booking_management.contract')}
                            </Button>

                          </>
                        )}



                        {/* Approved (legacy): Create Lease */}
                        {b.status === "approved" && (
                          <Button
                            size="xs"
                            colorScheme="green"
                            leftIcon={<FiDollarSign />}
                            onClick={() => handleCreateLeaseClick(b)}
                            borderRadius="full"
                          >
                            Create Lease
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="flex-start" spacing={0}>
            <Heading size="lg" color={textColor} letterSpacing="tight">
              {t('booking_management.title')}
            </Heading>
            <Text color={mutedText} fontSize="sm">{t('booking_management.subtitle')}</Text>
          </VStack>
          
          <HStack bg={contentBg} px={4} py={2} borderRadius="full" shadow="sm" border="1px" borderColor={borderColor}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={isLive ? "green.500" : "red.500"}
              boxShadow={isLive ? "0 0 10px #48BB78" : "none"}
            />
            <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={isLive ? "green.600" : "red.600"}>
              {isLive ? t('booking_management.live_sync_active') : t('booking_management.disconnected')}
            </Text>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
          <StatCard title={t('booking_management.total_bookings')} value={stats.total} icon={FiInfo} color="blue" />
          <StatCard title={t('booking_management.confirmed')} value={stats.confirmed} icon={FiCheckCircle} color="green" />
          <StatCard title={t('booking_management.pending')} value={stats.pending} icon={FiClock} color="yellow" />
          <StatCard title={t('booking_management.no_shows')} value={stats.noShows} icon={FiUserX} color="red" />
        </SimpleGrid>

        {/* Tabs: Active Bookings | No-Shows */}
        <Tabs colorScheme="blue" variant="enclosed-colored" borderRadius="xl">
          <TabList>
            <Tab fontWeight="bold" borderTopRadius="xl">{t('booking_management.active_bookings')}</Tab>
            <Tab fontWeight="bold" borderTopRadius="xl">
              {t('booking_management.no_shows_tab')}
              {noShows.length > 0 && (
                <Badge ml={2} colorScheme="red" borderRadius="full" fontSize="xs">{noShows.length}</Badge>
              )}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} pt={6}>
              {renderBookingTable(bookings, true)}
            </TabPanel>
            <TabPanel px={0} pt={6}>
              <Alert status="warning" borderRadius="xl" mb={4} variant="left-accent">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {t('booking_management.no_show_alert')}
                </AlertDescription>
              </Alert>
              {renderBookingTable(noShows, false)}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Create Lease Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" overflow="hidden">
          <ModalHeader bg="green.600" color="white" py={5}>{t('booking_management.finalize_lease')}</ModalHeader>
          <ModalCloseButton color="white" mt={2} />
          <ModalBody pb={8} pt={8}>
            
            {/* Booking Information Display */}
            <Box bg={cardBg} p={6} borderRadius="xl" mb={8} border="1px" borderColor={borderColor} shadow="sm">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <HStack>
                  <Avatar size="sm" name={selectedBooking?.tenant?.name} />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">{t('booking_management.tenant_uc')}</Text>
                    <Text fontWeight="semibold">{selectedBooking?.tenant?.name}</Text>
                  </VStack>
                </HStack>

                <HStack>
                  <Flex align="center" justify="center" h={8} w={8} bg="blue.100" color="blue.600" borderRadius="md">
                    <Icon as={FiHome} />
                  </Flex>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">{t('booking_management.room_uc')}</Text>
                    <Text fontWeight="semibold">{selectedBooking?.room?.name}</Text>
                  </VStack>
                </HStack>

                <HStack>
                  <Flex align="center" justify="center" h={8} w={8} bg="purple.100" color="purple.600" borderRadius="md">
                    <Icon as={FiCalendar} />
                  </Flex>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">{t('booking_management.move_in_deadline_uc')}</Text>
                    <Text fontWeight="semibold">{selectedBooking?.move_in_deadline ? new Date(selectedBooking.move_in_deadline).toLocaleDateString() : t('booking_management.n_a')}</Text>
                  </VStack>
                </HStack>
                
                {selectedBooking?.notes && (
                  <HStack gridColumn="span 2" align="flex-start" mt={2}>
                    <Icon as={FiInfo} color="yellow.500" mt={1} />
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">{t('booking_management.booking_notes_uc')}</Text>
                      <Text fontSize="sm" fontStyle="italic">{selectedBooking.notes}</Text>
                    </Box>
                  </HStack>
                )}
              </SimpleGrid>
            </Box>

            <Divider mb={6} />

            <VStack spacing={5} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>{t('booking_management.lease_start_date')}</FormLabel>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    borderRadius="md"
                    bg={bg}
                  />
                </FormControl>

                <FormControl isRequired>
                  <Flex justify="space-between" align="center" mb={2}>
                    <FormLabel fontWeight="bold" color={textColor} mb={0}>{t('booking_management.lease_duration')}</FormLabel>
                    <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2}>{t('booking_management.end', { date: calculatedEndDate })}</Badge>
                  </Flex>
                  <HStack spacing={2}>
                    {[1, 2, 3, 6].map((months) => (
                      <Button
                        key={months}
                        size="sm"
                        borderRadius="full"
                        variant={Number(leaseDuration) === months ? "solid" : "outline"}
                        colorScheme="blue"
                        onClick={() => setLeaseDuration(months.toString())}
                        flex={1}
                      >
                        {t('booking_management.months_m', { count: months })}
                      </Button>
                    ))}
                    <Input
                      type="number"
                      size="sm"
                      borderRadius="full"
                      value={leaseDuration}
                      onChange={(e) => setLeaseDuration(e.target.value)}
                      min="1"
                      bg={bg}
                      placeholder={t('booking_management.custom')}
                      w="70px"
                      textAlign="center"
                    />
                  </HStack>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>{t('booking_management.monthly_rent')}</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" color="gray.400" fontSize="1.2em">
                      $
                    </InputLeftElement>
                    <Input
                      type="number"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      borderRadius="md"
                      bg={bg}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>{t('booking_management.security_deposit')}</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" color="gray.400" fontSize="1.2em">
                      $
                    </InputLeftElement>
                    <Input
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      borderRadius="md"
                      bg={bg}
                    />
                  </InputGroup>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter bg={bg} borderTop="1px" borderColor={borderColor}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="full">
              {t('booking_management.cancel')}
            </Button>
            <Button
              colorScheme="green"
              onClick={submitCreateLease}
              isLoading={isApproving}
              isDisabled={!rentAmount || !securityDeposit || !leaseDuration || !startDate}
              borderRadius="full"
              shadow="md"
            >
              {t('booking_management.create_official_lease')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
