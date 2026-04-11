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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { FiCalendar, FiHome, FiUser, FiInfo, FiCheckCircle, FiXCircle, FiClock, FiDollarSign } from "react-icons/fi";
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
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Approve Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("6");
  const [isApproving, setIsApproving] = useState(false);

  const bg = useColorModeValue("gray.50", "gray.900");
  const contentBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    fetchBookings();

    const channel = echo.channel('admin.bookings')
      .listen('BookingCreated', (e) => {
        toast.success("New booking request received!");
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

  const handleApproveClick = (booking) => {
    setSelectedBooking(booking);
    setRentAmount(booking.room?.base_rent_price || "");
    setSecurityDeposit(booking.room?.base_rent_price || "");
    setLeaseDuration("6");
    onOpen();
  };

  const handleQuickApprove = async (booking, months) => {
    if (!window.confirm(`Quick approve for ${months} months?`)) return;

    setIsApproving(true);
    const previousBookings = [...bookings];
    setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'approved' } : b));

    try {
      await api.post(`/admin/bookings/${booking.uid}/approve`, {
        rent_amount: booking.room?.base_rent_price || 0,
        security_deposit: booking.room?.base_rent_price || 0,
        lease_duration_months: months,
      });
      toast.success(`Booking approved for ${months} months!`);
    } catch (error) {
      setBookings(previousBookings);
      toast.error(error.response?.data?.message || "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const submitApprove = async () => {
    if (!selectedBooking) return;
    setIsApproving(true);

    // Optimistic UI update
    const previousBookings = [...bookings];
    setBookings(bookings.map(b =>
      b.id === selectedBooking.id ? { ...b, status: 'approved' } : b
    ));

    try {
      await api.post(`/admin/bookings/${selectedBooking.uid}/approve`, {
        rent_amount: rentAmount,
        security_deposit: securityDeposit,
        lease_duration_months: leaseDuration,
      });
      toast.success("Booking approved and lease created successfully!");
      onClose();
    } catch (error) {
      setBookings(previousBookings);
      toast.error(error.response?.data?.message || "Failed to approve booking");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (booking) => {
    if (!window.confirm("Are you sure you want to reject this booking?")) return;

    // Optimistic UI update
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
  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "yellow", icon: FiClock },
      approved: { color: "green", icon: FiCheckCircle },
      rejected: { color: "red", icon: FiXCircle },
      cancelled: { color: "gray", icon: FiInfo },
    };
    const { color, icon } = config[status] || config.pending;
    return (
      <Badge colorScheme={color} px={2} py={1} borderRadius="full" textTransform="capitalize" variant="subtle" display="inline-flex" alignItems="center">
        <Icon as={icon} mr={1} />
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    const isPaid = status === 'paid';
    return (
      <Badge colorScheme={isPaid ? "green" : "orange"} px={2} py={0.5} borderRadius="md" variant="solid" fontSize="2xs">
        {isPaid ? "PAID" : "UNPAID"}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  if (isLoading) return (
    <Flex h="60vh" align="center" justify="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text color={mutedText} fontWeight="medium">Loading booking requests...</Text>
      </VStack>
    </Flex>
  );

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="flex-start" spacing={0}>
            <Heading size="lg" color={textColor} letterSpacing="tight">
              Booking Management
            </Heading>
            <Text color={mutedText} fontSize="sm">Track and manage room rental requests in real-time.</Text>
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
              {isLive ? "Live Sync Active" : "Disconnected"}
            </Text>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
          <StatCard title="Total Requests" value={stats.total} icon={FiInfo} color="blue" />
          <StatCard title="Pending Review" value={stats.pending} icon={FiClock} color="yellow" />
          <StatCard title="Approved" value={stats.approved} icon={FiCheckCircle} color="green" />
          <StatCard title="Rejected" value={stats.rejected} icon={FiXCircle} color="red" />
        </SimpleGrid>

        <Box bg={contentBg} borderRadius="2xl" shadow="sm" overflow="hidden" border="1px" borderColor={borderColor}>
          {bookings.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={20}>
              <Icon as={FiCalendar} boxSize={12} color="gray.300" mb={4} />
              <Text fontWeight="semibold" fontSize="lg" color="gray.600">No requests found</Text>
              <Text color="gray.500">New booking requests will appear here automatically.</Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={useColorModeValue("gray.50", "gray.900")}>
                  <Tr>
                    <Th py={4}>Tenant Details</Th>
                    <Th>Room & Move-in</Th>
                    <Th>Financials</Th>
                    <Th>Status</Th>
                    <Th>Timeline</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bookings.map((b) => (
                    <Tr key={b.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }} transition="background 0.2s">
                      <Td>
                        <HStack spacing={3}>
                          <Avatar size="sm" name={b.tenant?.name} src={b.tenant?.photo} />
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">{b.tenant?.name}</Text>
                            <Text fontSize="xs" color={mutedText}>{b.tenant?.email || "No email"}</Text>
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
                            <Text fontSize="xs" color={mutedText}>{b.desired_move_in_date || "Not specified"}</Text>
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
                        <Text fontSize="xs" color={mutedText}>
                          {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Td>
                      <Td textAlign="right">
                        {b.status === "pending" && (
                          <HStack spacing={2} justify="flex-end">
                            {b.down_payment_status === 'paid' && (
                              <Menu placement="bottom-end">
                                <MenuButton as={Button} size="xs" colorScheme="green" borderRadius="full" px={3}>
                                  Quick Approve
                                </MenuButton>
                                <MenuList p={1} borderRadius="lg">
                                  <MenuItem fontSize="xs" icon={<FiClock />} onClick={() => handleQuickApprove(b, 3)}>3 Months</MenuItem>
                                  <MenuItem fontSize="xs" icon={<FiClock />} onClick={() => handleQuickApprove(b, 6)}>6 Months</MenuItem>
                                  <MenuItem fontSize="xs" icon={<FiClock />} onClick={() => handleQuickApprove(b, 12)}>12 Months</MenuItem>
                                </MenuList>
                              </Menu>
                            )}
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="ghost"
                              leftIcon={<FiCheckCircle />}
                              onClick={() => handleApproveClick(b)}
                              borderRadius="full"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              leftIcon={<FiXCircle />}
                              onClick={() => handleReject(b)}
                              borderRadius="full"
                            >
                              Reject
                            </Button>
                          </HStack>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </VStack>

      {/* Approve Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" overflow="hidden">
          <ModalHeader bg="blue.600" color="white" py={5}>Approve Booking Request</ModalHeader>
          <ModalCloseButton color="white" mt={2} />
          <ModalBody pb={8} pt={8}>
            
            {/* Booking Information Display */}
            <Box bg={cardBg} p={6} borderRadius="xl" mb={8} border="1px" borderColor={borderColor} shadow="sm">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <HStack>
                  <Avatar size="sm" name={selectedBooking?.tenant?.name} />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">Tenant</Text>
                    <Text fontWeight="semibold">{selectedBooking?.tenant?.name}</Text>
                  </VStack>
                </HStack>

                <HStack>
                  <Flex align="center" justify="center" h={8} w={8} bg="blue.100" color="blue.600" borderRadius="md">
                    <Icon as={FiHome} />
                  </Flex>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">Room</Text>
                    <Text fontWeight="semibold">{selectedBooking?.room?.name}</Text>
                  </VStack>
                </HStack>

                <HStack>
                  <Flex align="center" justify="center" h={8} w={8} bg="purple.100" color="purple.600" borderRadius="md">
                    <Icon as={FiCalendar} />
                  </Flex>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">Move-in Date</Text>
                    <Text fontWeight="semibold">{selectedBooking?.desired_move_in_date || "Anytime"}</Text>
                  </VStack>
                </HStack>
                
                {selectedBooking?.notes && (
                  <HStack gridColumn="span 2" align="flex-start" mt={2}>
                    <Icon as={FiInfo} color="yellow.500" mt={1} />
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">Notes</Text>
                      <Text fontSize="sm" fontStyle="italic">{selectedBooking.notes}</Text>
                    </Box>
                  </HStack>
                )}
              </SimpleGrid>
            </Box>

            <Divider mb={6} />

            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="bold" color={textColor}>Lease Duration</FormLabel>
                <HStack spacing={3} wrap="wrap" align="center">
                  {['1', '3', '6', '12'].map((duration) => (
                    <Button
                      key={duration}
                      onClick={() => setLeaseDuration(duration)}
                      variant={leaseDuration === duration ? 'solid' : 'outline'}
                      colorScheme="blue"
                      borderRadius="full"
                      size="md"
                      px={5}
                    >
                      {duration} Month{duration !== '1' && 's'}
                    </Button>
                  ))}
                  <Input
                    type="number"
                    placeholder="Custom months"
                    value={!['1', '3', '6', '12'].includes(leaseDuration) ? leaseDuration : ""}
                    onChange={(e) => setLeaseDuration(e.target.value)}
                    min="1"
                    w="160px"
                    borderRadius="full"
                    size="md"
                    textAlign="center"
                    focusBorderColor="blue.500"
                    borderColor={!['1', '3', '6', '12'].includes(leaseDuration) && leaseDuration !== "" ? "blue.500" : "inherit"}
                    borderWidth={!['1', '3', '6', '12'].includes(leaseDuration) && leaseDuration !== "" ? "2px" : "1px"}
                  />
                </HStack>
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Monthly Rent</FormLabel>
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
                  <FormLabel fontWeight="bold" color={textColor}>Security Deposit</FormLabel>
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

          <ModalFooter bg={useColorModeValue("gray.50", "gray.900")} borderTop="1px" borderColor={borderColor}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="full">
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={submitApprove}
              isLoading={isApproving}
              isDisabled={!rentAmount || !securityDeposit || !leaseDuration}
              borderRadius="full"
              shadow="md"
            >
              Approve & Create Lease
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
