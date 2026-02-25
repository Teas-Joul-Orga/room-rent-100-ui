import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Box, Flex, Text, Heading, Badge, Spinner, Button, Avatar,
  SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, useDisclosure, FormControl, FormLabel,
  Input, Select, Textarea, Checkbox, IconButton, Tooltip,
  useColorModeValue, Divider
} from "@chakra-ui/react";
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiPrinter, FiDollarSign
} from "react-icons/fi";

const API = "http://localhost:8000/api/v1/admin";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function ViewLease() {
  const { id } = useParams(); // uid
  const navigate = useNavigate();

  const [lease, setLease] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  // Payment modal
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const [payForm, setPayForm] = useState({ type: "rent", amount_paid: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], notes: "" });
  const [isSavingPay, setIsSavingPay] = useState(false);

  // Bill modal
  const { isOpen: isBillOpen, onOpen: onBillOpen, onClose: onBillClose } = useDisclosure();
  const [billForm, setBillForm] = useState({ type: "electricity", amount: "", due_date: "", status: "unpaid", description: "" });
  const [isSavingBill, setIsSavingBill] = useState(false);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const tableHBg = useColorModeValue("gray.50", "gray.700");

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const fetchLease = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/leases/${id}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setLease(data.data || data);
      } else {
        toast.error("Failed to load lease details");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLease(); }, [id]);

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      const res = await fetch(`${API}/payments/${paymentId}`, { method: "DELETE", headers: headers() });
      if (res.ok) { toast.success("Payment deleted"); fetchLease(); }
      else toast.error("Failed to delete payment");
    } catch (e) { toast.error("Network error"); }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Delete this utility bill?")) return;
    try {
      const res = await fetch(`${API}/utility-bills/${billId}`, { method: "DELETE", headers: headers() });
      if (res.ok) { toast.success("Bill deleted"); fetchLease(); }
      else toast.error("Failed to delete bill");
    } catch (e) { toast.error("Network error"); }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setIsSavingPay(true);
    try {
      const res = await fetch(`${API}/payments`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ ...payForm, lease_id: lease.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payment recorded");
        onPayClose();
        fetchLease();
      } else {
        toast.error(data.message || "Failed to save payment");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsSavingPay(false); }
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    setIsSavingBill(true);
    try {
      const res = await fetch(`${API}/utility-bills`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ ...billForm, room_id: lease.room_id, lease_id: lease.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Utility bill added");
        onBillClose();
        fetchLease();
      } else {
        toast.error(data.message || "Failed to save bill");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsSavingBill(false); }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return { bg: "green.100", color: "green.700" };
      case "expired": return { bg: "red.100", color: "red.700" };
      case "terminated": return { bg: "gray.200", color: "gray.700" };
      default: return { bg: "gray.100", color: "gray.600" };
    }
  };

  const totalContractValue = lease ? Number(lease.rent_amount) * (
    Math.max(1, Math.round((new Date(lease.end_date) - new Date(lease.start_date)) / (1000 * 60 * 60 * 24 * 30)))
  ) : 0;
  const totalRentPaid = lease ? (lease.payments || []).filter(p => p.type === "rent").reduce((s, p) => s + Number(p.amount_paid), 0) : 0;
  const unpaidBillsTotal = lease ? (lease.utility_bills || []).filter(b => b.status === "unpaid").reduce((s, b) => s + Number(b.amount), 0) : 0;

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (!lease) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <Text color={mutedText}>Lease not found.</Text>
      </Box>
    );
  }

  const statusBadge = getStatusBadge(lease.status);

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">

        {/* Header */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Flex align="center" gap={3}>
            <IconButton
              icon={<FiArrowLeft />}
              size="sm"
              variant="ghost"
              onClick={() => navigate(-1)}
              aria-label="Back"
            />
            <Box>
              <Heading size="md" color={textColor}>Lease Statement</Heading>
              <Text fontSize="xs" color={mutedText} mt={0.5}>
                {fmtDate(lease.start_date)} — {fmtDate(lease.end_date)}
              </Text>
            </Box>
          </Flex>
          <Flex gap={2}>
            <Button
              leftIcon={<FiEdit2 />}
              size="sm"
              colorScheme="gray"
              onClick={() => navigate(`/dashboard/lease`)}
            >
              Edit Lease
            </Button>
          </Flex>
        </Flex>

        {/* Resident & Lease Profile */}
        <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} p={8} mb={6}>
          <Flex direction={{ base: "column", xl: "row" }} gap={8} align={{ xl: "start" }}>

            {/* Avatar + Status */}
            <Flex direction="column" align="center" gap={3} flexShrink={0}>
              <Box position="relative">
                <Avatar
                  name={lease.tenant?.name}
                  src={lease.tenant?.photo_path ? `http://localhost:8000/storage/${lease.tenant.photo_path}` : undefined}
                  size="xl"
                  borderRadius="xl"
                  shadow="lg"
                />
                <Box
                  position="absolute"
                  bottom="-2"
                  right="-2"
                  bg="white"
                  p={1}
                  borderRadius="lg"
                  shadow="md"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Box
                    h={3} w={3}
                    borderRadius="full"
                    bg={lease.status === "active" ? "green.500" : "red.500"}
                  />
                </Box>
              </Box>
              <Badge
                bg={statusBadge.bg}
                color={statusBadge.color}
                px={3} py={1}
                borderRadius="full"
                fontSize="9px"
                fontWeight="black"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {lease.status}
              </Badge>
            </Flex>

            {/* Info */}
            <Box flex={1}>
              <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "flex-end" }} borderBottom="1px solid" borderColor={borderColor} pb={5} mb={5}>
                <Box>
                  <Heading size="lg" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                    {lease.room?.name || "Unknown Room"}
                  </Heading>
                  <Text fontSize="xs" fontWeight="bold" color={mutedText} mt={1} textTransform="uppercase" letterSpacing="tight">
                    {fmtDate(lease.start_date)} — {fmtDate(lease.end_date)}
                  </Text>
                </Box>
                <Box textAlign={{ md: "right" }} mt={{ base: 3, md: 0 }}>
                  <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
                    Current Resident
                  </Text>
                  <Text fontSize="lg" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                    {lease.tenant?.name || "Unknown"}
                  </Text>
                </Box>
              </Flex>

              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                <Box>
                  <Text fontSize="9px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Email</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} wordBreak="break-all">{lease.tenant?.email || "—"}</Text>
                </Box>
                <Box>
                  <Text fontSize="9px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Phone</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{lease.tenant?.phone || "N/A"}</Text>
                </Box>
                <Box>
                  <Text fontSize="9px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Occupation</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} textTransform="uppercase">{lease.tenant?.job || "N/A"}</Text>
                </Box>
                <Box>
                  <Text fontSize="9px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Deposit Status</Text>
                  <Badge
                    fontSize="xs"
                    colorScheme={lease.deposit_status === "held" ? "green" : lease.deposit_status === "refunded" ? "gray" : "orange"}
                    textTransform="uppercase"
                  >
                    {lease.deposit_status || "unpaid"}
                  </Badge>
                </Box>
              </SimpleGrid>
            </Box>
          </Flex>
        </Box>

        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
          {/* Monthly Rent */}
          <Box bg={cardBg} p={8} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
            <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>Monthly Rent</Text>
            <Heading size="xl" fontWeight="black" color={textColor}>{fmt(lease.rent_amount)}</Heading>
            {totalRentPaid >= totalContractValue ? (
              <Text mt={4} fontSize="10px" fontWeight="black" textTransform="uppercase" color="green.600">
                ✓ Fully Paid
              </Text>
            ) : (
              <Button mt={4} size="xs" colorScheme="blue" variant="link" leftIcon={<FiDollarSign />} onClick={() => { setPayForm({ ...payForm, amount_paid: lease.rent_amount }); onPayOpen(); }}>
                Record Payment →
              </Button>
            )}
          </Box>

          {/* Security Deposit */}
          <Box bg={cardBg} p={8} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} position="relative">
            <Badge position="absolute" top={8} right={8} fontSize="9px" fontWeight="black" textTransform="uppercase" colorScheme={lease.deposit_status === "held" ? "green" : "gray"} variant="outline" px={2} py={1}>
              {lease.deposit_status || "unpaid"}
            </Badge>
            <Text fontSize="10px" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>Security Deposit</Text>
            <Heading size="xl" fontWeight="black" color={textColor}>{fmt(lease.security_deposit)}</Heading>
            {(!lease.deposit_status || lease.deposit_status === "unpaid") && (
              <Button mt={4} size="xs" colorScheme="green" variant="link" onClick={() => { setPayForm({ ...payForm, type: "deposit", amount_paid: lease.security_deposit }); onPayOpen(); }}>
                Collect Deposit →
              </Button>
            )}
          </Box>

          {/* Unpaid Utilities */}
          <Box bg="gray.900" p={8} borderRadius="xl" shadow="xl">
            <Text fontSize="10px" fontWeight="black" color="blue.400" textTransform="uppercase" letterSpacing="wider" mb={2}>Unpaid Utilities</Text>
            <Heading size="xl" fontWeight="black" color="white">{fmt(unpaidBillsTotal)}</Heading>
            <Button mt={4} size="xs" color="blue.400" variant="link" _hover={{ color: "white" }}>
              Manage Bills →
            </Button>
          </Box>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs variant="line" colorScheme="blue" isLazy>
          <Flex direction={{ base: "column", md: "row" }} align={{ md: "center" }} justify="space-between" borderBottom="1px solid" borderColor={borderColor} mb={0}>
            <TabList border="none">
              <Tab fontSize="10px" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                Utility Statement
              </Tab>
              <Tab fontSize="10px" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                Payment Ledger
              </Tab>
            </TabList>
            <Text fontSize="10px" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color="gray.300" pb={{ md: 2 }}>
              Transaction History Mode
            </Text>
          </Flex>

          <TabPanels>
            {/* ===== UTILITY BILLS TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex align="center" justify="space-between" px={6} py={4} bg={tableHBg} borderBottom="1px solid" borderColor={borderColor}>
                  <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                    Utility Statement
                  </Text>
                  <Flex align="center" gap={4}>
                    <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onBillOpen}>
                      Add New Bill
                    </Button>
                  </Flex>
                </Flex>

                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th w="40px"><Checkbox onChange={(e) => {
                          const bills = lease.utility_bills || [];
                          setSelectedBillIds(e.target.checked ? bills.map(b => b.id) : []);
                        }} /></Th>
                        <Th>Type</Th>
                        <Th>Amount</Th>
                        <Th>Due Date</Th>
                        <Th>Status</Th>
                        <Th>Description</Th>
                        <Th textAlign="right"></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(lease.utility_bills || []).length === 0 ? (
                        <Tr><Td colSpan={7} textAlign="center" py={10} color={mutedText}>No utility bills found.</Td></Tr>
                      ) : (
                        [...(lease.utility_bills || [])].sort((a, b) => new Date(b.due_date) - new Date(a.due_date)).map(bill => (
                          <Tr key={bill.id} bg={selectedBillIds.includes(bill.id) ? "blue.50" : "transparent"}>
                            <Td><Checkbox isChecked={selectedBillIds.includes(bill.id)} onChange={(e) => {
                              setSelectedBillIds(e.target.checked ? [...selectedBillIds, bill.id] : selectedBillIds.filter(i => i !== bill.id));
                            }} /></Td>
                            <Td>
                              <Badge fontSize="9px" fontWeight="black" textTransform="uppercase" colorScheme={
                                bill.type === "electricity" ? "yellow" : bill.type === "water" ? "blue" : "gray"
                              }>{bill.type}</Badge>
                            </Td>
                            <Td fontWeight="bold" color={textColor}>{fmt(bill.amount)}</Td>
                            <Td fontSize="xs" color={mutedText}>{fmtDate(bill.due_date)}</Td>
                            <Td>
                              <Badge fontSize="9px" fontWeight="black" textTransform="uppercase" colorScheme={bill.status === "paid" ? "green" : "red"}>
                                {bill.status}
                              </Badge>
                            </Td>
                            <Td fontSize="xs" color={mutedText}>{bill.description || "—"}</Td>
                            <Td textAlign="right">
                              <Tooltip label="Delete" hasArrow>
                                <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteBill(bill.id)} aria-label="Delete bill" />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== PAYMENTS TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex align="center" justify="space-between" px={6} py={4} bg={tableHBg} borderBottom="1px solid" borderColor={borderColor}>
                  <Flex align="center" gap={3}>
                    <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                      Payment Ledger
                    </Text>
                    {selectedPayments.length > 0 && (
                      <Badge colorScheme="purple" fontSize="xs">{selectedPayments.length} selected</Badge>
                    )}
                  </Flex>
                  <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onPayOpen}>
                    New Entry
                  </Button>
                </Flex>

                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th w="40px"><Checkbox onChange={(e) => {
                          const payments = lease.payments || [];
                          setSelectedPayments(e.target.checked ? payments.map(p => p.id) : []);
                        }} /></Th>
                        <Th>Date</Th>
                        <Th>Amount</Th>
                        <Th>Type</Th>
                        <Th>Method</Th>
                        <Th>Notes</Th>
                        <Th textAlign="right"></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(lease.payments || []).length === 0 ? (
                        <Tr><Td colSpan={7} textAlign="center" py={10} color={mutedText}>No payment records found.</Td></Tr>
                      ) : (
                        [...(lease.payments || [])].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)).map(payment => (
                          <Tr key={payment.id} bg={selectedPayments.includes(payment.id) ? "purple.50" : "transparent"}>
                            <Td><Checkbox isChecked={selectedPayments.includes(payment.id)} onChange={(e) => {
                              setSelectedPayments(e.target.checked ? [...selectedPayments, payment.id] : selectedPayments.filter(i => i !== payment.id));
                            }} /></Td>
                            <Td fontSize="xs" fontWeight="bold" color={mutedText}>{fmtDate(payment.payment_date)}</Td>
                            <Td fontWeight="black" color={textColor}>{fmt(payment.amount_paid)}</Td>
                            <Td>
                              <Badge fontSize="9px" fontWeight="black" textTransform="uppercase" colorScheme={payment.type === "rent" ? "green" : payment.type === "deposit" ? "blue" : "orange"}>
                                {payment.type}
                              </Badge>
                            </Td>
                            <Td fontSize="10px" fontWeight="bold" color={mutedText} textTransform="uppercase">{payment.payment_method}</Td>
                            <Td fontSize="xs" color={mutedText}>{payment.notes || "—"}</Td>
                            <Td textAlign="right">
                              <Tooltip label="Delete" hasArrow>
                                <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeletePayment(payment.id)} aria-label="Delete payment" />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

      </Box>

      {/* ===== RECORD PAYMENT MODAL ===== */}
      <Modal isOpen={isPayOpen} onClose={onPayClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSavePayment}>
            <ModalHeader color={textColor}>Record Payment</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Payment Type</FormLabel>
                  <Select size="sm" value={payForm.type} onChange={e => setPayForm({ ...payForm, type: e.target.value })}>
                    <option value="rent">Rent</option>
                    <option value="deposit">Security Deposit</option>
                    <option value="utility">Utility Bill</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Amount ($)</FormLabel>
                  <Input size="sm" type="number" step="0.01" value={payForm.amount_paid} onChange={e => setPayForm({ ...payForm, amount_paid: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Payment Method</FormLabel>
                  <Select size="sm" value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Date</FormLabel>
                  <Input size="sm" type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
                </FormControl>
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Notes (optional)</FormLabel>
                  <Textarea size="sm" rows={2} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onPayClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingPay}>Save Payment</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== ADD BILL MODAL ===== */}
      <Modal isOpen={isBillOpen} onClose={onBillClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSaveBill}>
            <ModalHeader color={textColor}>Add Utility Bill</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Bill Type</FormLabel>
                  <Select size="sm" value={billForm.type} onChange={e => setBillForm({ ...billForm, type: e.target.value })}>
                    <option value="electricity">Electricity</option>
                    <option value="water">Water</option>
                    <option value="trash">Trash</option>
                    <option value="internet">Internet</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Amount ($)</FormLabel>
                  <Input size="sm" type="number" step="0.01" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Due Date</FormLabel>
                  <Input size="sm" type="date" value={billForm.due_date} onChange={e => setBillForm({ ...billForm, due_date: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Status</FormLabel>
                  <Select size="sm" value={billForm.status} onChange={e => setBillForm({ ...billForm, status: e.target.value })}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </Select>
                </FormControl>
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Description (optional)</FormLabel>
                  <Textarea size="sm" rows={2} value={billForm.description} onChange={e => setBillForm({ ...billForm, description: e.target.value })} placeholder="e.g. September 2024 Usage" />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onBillClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingBill}>Create Bill</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </Box>
  );
}
