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
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiPrinter, FiDollarSign, FiBell
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
  const [billForm, setBillForm] = useState({ type: "electricity", amount: "", due_date: "", status: "unpaid", description: "", previous_reading: "", current_reading: "", cost_per_unit: "" });
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [lastReading, setLastReading] = useState(0);

  const isMetered = ["electricity", "water"].includes(billForm.type);
  const usage = isMetered ? Math.max(0, Number(billForm.current_reading || 0) - Number(billForm.previous_reading || 0)) : 0;

  // Pay-All/Selected modal
  const { isOpen: isPayAllOpen, onOpen: onPayAllOpen, onClose: onPayAllClose } = useDisclosure();
  const [payAllForm, setPayAllForm] = useState({ payment_date: new Date().toISOString().split("T")[0], payment_method: "cash", notes: "" });
  const [isPayingAll, setIsPayingAll] = useState(false);

  // Refund modal
  const { isOpen: isRefundOpen, onOpen: onRefundOpen, onClose: onRefundClose } = useDisclosure();
  const [refundForm, setRefundForm] = useState({ amount: "", notes: "" });
  const [isRefunding, setIsRefunding] = useState(false);

  // Edit Lease modal
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editForm, setEditForm] = useState({ tenant_id: "", room_id: "", start_date: "", end_date: "", rent_amount: "", security_deposit: 0, status: "active", deposit_status: "unpaid" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isPrintingContract, setIsPrintingContract] = useState(false);
  const [allTenants, setAllTenants] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [tenantSearch, setTenantSearch] = useState("");
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

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

  // Fetch last meter reading when bill type changes
  const fetchLastReading = async (type) => {
    if (!lease || !["electricity", "water"].includes(type)) { setLastReading(0); return; }
    try {
      const res = await fetch(`${API}/utility-bills/last-reading/${lease.room_id}?type=${type}`, { headers: headers() });
      const data = await res.json();
      const reading = parseFloat(data.reading) || 0;
      setLastReading(reading);
      setBillForm(prev => ({ ...prev, previous_reading: reading }));
    } catch (e) { setLastReading(0); }
  };

  // Auto-calculate amount when meter values change
  useEffect(() => {
    if (isMetered && billForm.cost_per_unit) {
      const calc = (usage * Number(billForm.cost_per_unit)).toFixed(2);
      setBillForm(prev => ({ ...prev, amount: calc }));
    }
  }, [billForm.current_reading, billForm.previous_reading, billForm.cost_per_unit]);

  // Fetch reading when bill type changes
  useEffect(() => {
    if (isBillOpen) fetchLastReading(billForm.type);
  }, [billForm.type, isBillOpen]);

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

  // Pay Selected Bills
  const handlePaySelected = async (e) => {
    e.preventDefault();
    if (selectedBillIds.length === 0) { toast.error("Select bills to pay first."); return; }
    setIsPayingAll(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}/utility-bills/pay-selected`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ bill_ids: selectedBillIds, ...payAllForm }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Bills paid successfully");
        onPayAllClose();
        setSelectedBillIds([]);
        fetchLease();

        // Auto-print receipt
        if (data.payment_id) {
          try {
            const receiptRes = await fetch(`${API}/payments/print-receipt`, {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({ payment_ids: [data.payment_id] }),
            });
            if (receiptRes.ok) {
              const blob = await receiptRes.blob();
              const url = window.URL.createObjectURL(blob);
              window.open(url, "_blank");
            }
          } catch (err) { console.error("Failed to auto-print receipt:", err); }
        }
      } else {
        toast.error(data.error || data.message || "Failed to pay bills");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsPayingAll(false); }
  };

  // Refund Deposit
  const handleRefundDeposit = async (e) => {
    e.preventDefault();
    setIsRefunding(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}/refund-deposit`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(refundForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Deposit refunded");
        onRefundClose();
        fetchLease();
      } else {
        toast.error(data.error || data.message || "Failed to refund deposit");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsRefunding(false); }
  };

  // Edit Lease
  const handleEditLease = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Lease updated successfully");
        onEditClose();
        fetchLease();
      } else {
        toast.error(data.message || "Failed to update lease");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsSavingEdit(false); }
  };

  // Send Bill Notification
  const handleSendNotification = async (billId) => {
    if (!window.confirm("Send a reminder notification for this bill?")) return;
    try {
      const res = await fetch(`${API}/utility-bills/${billId}/notify`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "Notification sent");
      else toast.error(data.error || "Failed to send notification");
    } catch (e) { toast.error("Network error"); }
  };

  // Print Invoice for selected bills
  const handlePrintInvoice = async () => {
    if (selectedBillIds.length === 0) { toast.error("Select bills to print."); return; }
    try {
      const res = await fetch(`${API}/utility-bills/print-invoice`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ bill_ids: selectedBillIds }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        toast.error("Failed to generate invoice");
      }
    } catch (e) { toast.error("Network error"); }
  };

  // Print Receipt for selected/given payment IDs
  const handlePrintReceipt = async (paymentIds) => {
    const ids = Array.isArray(paymentIds) ? paymentIds : [paymentIds];
    if (ids.length === 0) { toast.error("Select payments to print."); return; }
    try {
      const res = await fetch(`${API}/payments/print-receipt`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ payment_ids: ids }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        toast.error("Failed to generate receipt");
      }
    } catch (e) { toast.error("Network error"); }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return { bg: "green.100", color: "green.700" };
      case "expired": return { bg: "red.100", color: "red.700" };
      case "terminated": return { bg: "gray.200", color: "gray.700" };
      default: return { bg: "gray.100", color: "gray.600" };
    }
  };

  const handlePrintContract = async () => {
    setIsPrintingContract(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/leases/${id}/print`, {
        headers: headers(),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        toast.error("Failed to generate contract PDF");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsPrintingContract(false);
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
              leftIcon={<FiPrinter />}
              size="sm"
              colorScheme="purple"
              variant="outline"
              isLoading={isPrintingContract}
              loadingText="Generating..."
              onClick={handlePrintContract}
            >
              Print Contract
            </Button>
            <Button
              leftIcon={<FiEdit2 />}
              size="sm"
              colorScheme="gray"
              onClick={() => {
                setEditForm({
                  tenant_id: lease.tenant?.id || "",
                  room_id: lease.room?.id || "",
                  start_date: lease.start_date ? lease.start_date.split("T")[0] : "",
                  end_date: lease.end_date ? lease.end_date.split("T")[0] : "",
                  rent_amount: lease.rent_amount || "",
                  security_deposit: lease.security_deposit || 0,
                  status: lease.status || "active",
                  deposit_status: lease.deposit_status || "unpaid",
                });
                setTenantSearch("");
                setShowTenantDropdown(false);
                onEditOpen();
                // Fetch tenants & rooms in the background (non-blocking)
                const token = localStorage.getItem("token");
                const h = { Authorization: `Bearer ${token}`, Accept: "application/json" };
                Promise.all([
                  fetch(`${API}/tenants?per_page=all`, { headers: h }),
                  fetch(`${API}/rooms?per_page=all`, { headers: h }),
                ]).then(async ([tRes, rRes]) => {
                  if (tRes.ok) { const d = await tRes.json(); setAllTenants(d.data || d); }
                  if (rRes.ok) { const d = await rRes.json(); setAllRooms(d.data || d); }
                }).catch(err => console.error(err));
              }}
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
            {lease.deposit_status === "held" && (
              <Button mt={4} size="xs" colorScheme="orange" variant="link" onClick={() => { setRefundForm({ amount: lease.security_deposit, notes: "" }); onRefundOpen(); }}>
                Initiate Refund →
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
                    {selectedBillIds.length > 0 && (
                      <Button size="xs" colorScheme="purple" variant="link" leftIcon={<FiPrinter />} onClick={handlePrintInvoice}>
                        Print Invoice ({selectedBillIds.length})
                      </Button>
                    )}
                    <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onBillOpen}>
                      Add New Bill
                    </Button>
                    {unpaidBillsTotal > 0 && (
                      <Button
                        size="xs"
                        colorScheme={selectedBillIds.length > 0 ? "green" : "gray"}
                        onClick={onPayAllOpen}
                      >
                        {selectedBillIds.length > 0 ? `Pay Selected (${selectedBillIds.length})` : "Pay Bills"}
                      </Button>
                    )}
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
                              <Flex justify="flex-end" gap={1}>
                                {bill.status === "unpaid" && (
                                  <Tooltip label="Send Reminder" hasArrow>
                                    <IconButton icon={<FiBell />} size="xs" colorScheme="orange" variant="ghost" onClick={() => handleSendNotification(bill.id)} aria-label="Send notification" />
                                  </Tooltip>
                                )}
                                <Tooltip label="Delete" hasArrow>
                                  <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteBill(bill.id)} aria-label="Delete bill" />
                                </Tooltip>
                              </Flex>
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
                  <Flex align="center" gap={3}>
                    {selectedPayments.length > 0 && (
                      <Button size="xs" colorScheme="purple" variant="link" leftIcon={<FiPrinter />} onClick={() => handlePrintReceipt(selectedPayments)}>
                        Print Receipt ({selectedPayments.length})
                      </Button>
                    )}
                    <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onPayOpen}>
                      New Entry
                    </Button>
                  </Flex>
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
                              <Flex gap={1} justify="flex-end">
                                <Tooltip label="Print Receipt" hasArrow>
                                  <IconButton icon={<FiPrinter />} size="xs" colorScheme="purple" variant="ghost" onClick={() => handlePrintReceipt(payment.id)} aria-label="Print receipt" />
                                </Tooltip>
                                <Tooltip label="Delete" hasArrow>
                                  <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeletePayment(payment.id)} aria-label="Delete payment" />
                                </Tooltip>
                              </Flex>
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
        <ModalOverlay bg="blackAlpha.600" />
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
      <Modal isOpen={isBillOpen} onClose={onBillClose} isCentered size="4xl">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSaveBill}>
            <ModalHeader color={textColor} textTransform="uppercase" fontWeight="black">Add New Utility Bill</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {/* Room (read-only) */}
              <FormControl mb={4}>
                <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Room</FormLabel>
                <Box p={3} bg="gray.100" border="1px solid" borderColor="gray.200" borderRadius="md" fontWeight="bold" color="gray.700" fontSize="sm">
                  {lease.room?.name || "—"} <Text as="span" fontSize="xs" fontWeight="normal" color="gray.500">(Current Room)</Text>
                </Box>
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                {/* Bill Type */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Bill Type</FormLabel>
                  <Select size="sm" value={billForm.type} onChange={e => setBillForm({ ...billForm, type: e.target.value })}>
                    <option value="electricity">Electricity</option>
                    <option value="water">Water</option>
                    <option value="trash">Trash (Fixed)</option>
                    <option value="internet">Internet (Fixed)</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                <Box /> {/* spacer */}

                {/* Meter Reading Section — only for electricity/water */}
                {isMetered && (
                  <Box gridColumn="span 2" bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                    <SimpleGrid columns={3} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Previous Reading</FormLabel>
                        <Input size="sm" type="number" step="0.01" bg="gray.100" value={billForm.previous_reading} readOnly />
                        <Text fontSize="xs" color="gray.500" mt={1}>Auto-fetched.</Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Current Reading</FormLabel>
                        <Input size="sm" type="number" step="0.01" value={billForm.current_reading} onChange={e => setBillForm({ ...billForm, current_reading: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Rate per Unit ($)</FormLabel>
                        <Input size="sm" type="number" step="0.01" value={billForm.cost_per_unit} onChange={e => setBillForm({ ...billForm, cost_per_unit: e.target.value })} />
                      </FormControl>
                    </SimpleGrid>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600" textAlign="right" mt={2}>
                      Usage: <Text as="span" fontWeight="black">{usage}</Text> units
                    </Text>
                  </Box>
                )}

                {/* Total Amount */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Total Amount ($)</FormLabel>
                  <Input size="sm" type="number" step="0.01" bg={isMetered ? "yellow.50" : undefined} fontWeight="bold" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })} />
                  {isMetered && <Text fontSize="xs" color="gray.500" mt={1}>Auto-calculated, but you can override.</Text>}
                </FormControl>

                {/* Due Date */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Due Date</FormLabel>
                  <Input size="sm" type="date" value={billForm.due_date} onChange={e => setBillForm({ ...billForm, due_date: e.target.value })} />
                </FormControl>

                {/* Status */}
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Status</FormLabel>
                  <Select size="sm" value={billForm.status} onChange={e => setBillForm({ ...billForm, status: e.target.value })}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </Select>
                </FormControl>
                <Box /> {/* spacer */}

                {/* Description */}
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Description (Optional)</FormLabel>
                  <Textarea size="sm" rows={2} value={billForm.description} onChange={e => setBillForm({ ...billForm, description: e.target.value })} placeholder="e.g., September 2023 Usage" />
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

      {/* ===== PAY SELECTED BILLS MODAL ===== */}
      <Modal isOpen={isPayAllOpen} onClose={onPayAllClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handlePaySelected}>
            <ModalHeader color={textColor}>Pay Selected Bills</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {/* Bill list */}
              <Box maxH="200px" overflowY="auto" border="1px solid" borderColor={borderColor} borderRadius="lg" mb={4}>
                {(lease.utility_bills || []).filter(b => b.status === "unpaid").map(bill => (
                  <Flex key={bill.id} align="center" justify="space-between" px={3} py={2} borderBottom="1px solid" borderColor={borderColor} bg={selectedBillIds.includes(bill.id) ? "green.50" : "transparent"}>
                    <Flex align="center" gap={2}>
                      <Checkbox
                        isChecked={selectedBillIds.includes(bill.id)}
                        onChange={(e) => setSelectedBillIds(e.target.checked ? [...selectedBillIds, bill.id] : selectedBillIds.filter(i => i !== bill.id))}
                      />
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">{bill.type}</Text>
                        <Text fontSize="10px" color={mutedText}>Due: {fmtDate(bill.due_date)}</Text>
                      </Box>
                    </Flex>
                    <Text fontWeight="black">{fmt(bill.amount)}</Text>
                  </Flex>
                ))}
              </Box>

              {/* Total */}
              <Flex justify="space-between" align="flex-end" borderTop="1px solid" borderColor={borderColor} pt={3} mb={4}>
                <Text fontSize="xs" fontWeight="black" textTransform="uppercase" color={mutedText}>Total To Pay</Text>
                <Text fontSize="xl" fontWeight="black" color="green.600">
                  {fmt((lease.utility_bills || []).filter(b => b.status === "unpaid" && selectedBillIds.includes(b.id)).reduce((s, b) => s + Number(b.amount), 0))}
                </Text>
              </Flex>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Date</FormLabel>
                  <Input size="sm" type="date" value={payAllForm.payment_date} onChange={e => setPayAllForm({ ...payAllForm, payment_date: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Method</FormLabel>
                  <Select size="sm" value={payAllForm.payment_method} onChange={e => setPayAllForm({ ...payAllForm, payment_method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                  </Select>
                </FormControl>
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Notes (optional)</FormLabel>
                  <Textarea size="sm" rows={2} value={payAllForm.notes} onChange={e => setPayAllForm({ ...payAllForm, notes: e.target.value })} placeholder="e.g. Cleared by tenant" />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onPayAllClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="green" type="submit" size="sm" isLoading={isPayingAll} isDisabled={selectedBillIds.length === 0}>Confirm Pay</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== REFUND DEPOSIT MODAL ===== */}
      <Modal isOpen={isRefundOpen} onClose={onRefundClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleRefundDeposit}>
            <ModalHeader color={textColor}>Deposit Refund</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={1} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Amount to Refund ($)</FormLabel>
                  <Input size="sm" type="number" step="0.01" max={lease.security_deposit} value={refundForm.amount} onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Settlement Notes</FormLabel>
                  <Textarea size="sm" rows={3} value={refundForm.notes} onChange={e => setRefundForm({ ...refundForm, notes: e.target.value })} />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onRefundClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="orange" type="submit" size="sm" isLoading={isRefunding}>Confirm Settlement</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== EDIT LEASE MODAL ===== */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="5xl" scrollBehavior="inside" motionPreset="scale">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl" maxH="85vh" my="auto" display="flex" flexDirection="column">
          <form onSubmit={handleEditLease} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
            <ModalHeader color={textColor} fontSize="lg" fontWeight="black" textTransform="uppercase" letterSpacing="tight">
              Edit Lease Agreement
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>

              {/* 1. Select Tenant */}
              <Box mb={6}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>Select Tenant</Text>
                <Box position="relative">
                  {/* Selected tenant display */}
                  <Box
                    border="1px solid" borderColor={borderColor} borderRadius="md" p={2.5} cursor="pointer"
                    onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                    display="flex" justifyContent="space-between" alignItems="center"
                    _hover={{ borderColor: "blue.400" }}
                  >
                    <Text fontSize="sm" color={editForm.tenant_id ? textColor : mutedText}>
                      {editForm.tenant_id
                        ? (() => { const t = allTenants.find(t => t.id === editForm.tenant_id); return t ? `${t.name} (${t.email})` : "Select..." })()
                        : "Select Tenant..."}
                    </Text>
                    <Text color={mutedText} fontSize="xs">▼</Text>
                  </Box>

                  {/* Dropdown */}
                  {showTenantDropdown && (
                    <Box
                      position="absolute" top="100%" left={0} right={0} zIndex={20}
                      bg={cardBg} border="1px solid" borderColor="blue.400" borderRadius="md"
                      shadow="lg" maxH="220px" overflowY="auto"
                    >
                      <Box p={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Input
                          size="sm" placeholder="Search name or email..." autoFocus
                          value={tenantSearch}
                          onChange={e => setTenantSearch(e.target.value)}
                          borderColor="blue.400"
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        />
                      </Box>
                      {allTenants
                        .filter(t => {
                          const q = tenantSearch.toLowerCase();
                          return !q || (t.name || "").toLowerCase().includes(q) || (t.email || "").toLowerCase().includes(q);
                        })
                        .map(t => (
                          <Box
                            key={t.id}
                            px={3} py={2}
                            cursor="pointer"
                            bg={editForm.tenant_id === t.id ? "blue.50" : "transparent"}
                            _hover={{ bg: "gray.50" }}
                            onClick={() => { setEditForm({ ...editForm, tenant_id: t.id }); setShowTenantDropdown(false); setTenantSearch(""); }}
                            display="flex" alignItems="center" gap={2}
                          >
                            {editForm.tenant_id === t.id && <Text color="blue.500" fontWeight="bold">✓</Text>}
                            <Text fontSize="sm" fontWeight="bold" color={textColor}>{t.name}</Text>
                            <Text fontSize="xs" color={mutedText}>{t.email}</Text>
                          </Box>
                        ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 2. Select Room */}
              <Box mb={6}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>1. Select Property / Room</Text>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                  {allRooms.map(room => {
                    const isSelected = editForm.room_id === room.id;
                    const isOccupied = room.status === "occupied" && !isSelected;
                    return (
                      <Box
                        key={room.id}
                        border="2px solid"
                        borderColor={isSelected ? "blue.500" : borderColor}
                        borderRadius="lg"
                        p={4}
                        cursor={isOccupied ? "not-allowed" : "pointer"}
                        opacity={isOccupied ? 0.5 : 1}
                        bg={isSelected ? "blue.50" : cardBg}
                        _hover={!isOccupied ? { borderColor: "blue.400", shadow: "md" } : {}}
                        transition="all 0.2s"
                        onClick={() => {
                          if (isOccupied) return;
                          setEditForm({ ...editForm, room_id: room.id, rent_amount: room.price || editForm.rent_amount });
                        }}
                      >
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{room.name}</Text>
                        <Text fontSize="xs" color={mutedText}>Size: {room.size || "N/A"}</Text>
                        <Text fontSize="xs" fontWeight="bold" color={isOccupied ? "red.500" : isSelected ? "blue.500" : "green.500"} mt={1}>
                          {isOccupied ? "Occupied" : isSelected ? "Available / Selected" : "Available"}
                        </Text>
                        <Text fontWeight="black" color={textColor} mt={2} fontSize="md">${Number(room.price || 0).toFixed(2)}</Text>
                        <Text fontSize="9px" fontWeight="bold" color={mutedText} textTransform="uppercase">/ Month</Text>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>

              <Divider mb={6} />

              {/* 3. Lease Details & Financials */}
              <Box mb={6}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>2. Lease Details & Financials</Text>
                <Flex gap={4} mb={4} direction={{ base: "column", md: "row" }}>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Start Date</FormLabel>
                    <Input size="sm" type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>End Date</FormLabel>
                    <Input size="sm" type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Agreed Monthly Rent ($)</FormLabel>
                    <Input size="sm" type="number" step="0.01" value={editForm.rent_amount} onChange={e => setEditForm({ ...editForm, rent_amount: e.target.value })} borderColor="blue.400" />
                  </FormControl>
                </Flex>
                <FormControl mb={4}>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Security Deposit ($)</FormLabel>
                  <Input size="sm" type="number" step="0.01" value={editForm.security_deposit} onChange={e => setEditForm({ ...editForm, security_deposit: e.target.value })} />
                </FormControl>

                {/* Lease Status */}
                <Box mb={4}>
                  <Text fontSize="xs" fontWeight="bold" color={mutedText} mb={2}>Lease Status</Text>
                  <SimpleGrid columns={3} spacing={2}>
                    {["active", "expired", "ended"].map(s => (
                      <Button
                        key={s} size="sm" variant={editForm.status === s ? "solid" : "outline"}
                        colorScheme={editForm.status === s ? (s === "active" ? "green" : s === "expired" ? "orange" : "gray") : "gray"}
                        onClick={() => setEditForm({ ...editForm, status: s })}
                        textTransform="uppercase" fontWeight="black" fontSize="10px" letterSpacing="wider"
                      >
                        {s}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Deposit Status */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color={mutedText} mb={2}>Deposit Status</Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                    {["unpaid", "held", "refunded", "forfeited"].map(s => (
                      <Button
                        key={s} size="sm" variant={editForm.deposit_status === s ? "solid" : "outline"}
                        colorScheme={editForm.deposit_status === s ? (s === "held" ? "green" : s === "refunded" ? "blue" : s === "forfeited" ? "red" : "gray") : "gray"}
                        onClick={() => setEditForm({ ...editForm, deposit_status: s })}
                        textTransform="capitalize" fontWeight="bold" fontSize="xs"
                      >
                        {s}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>
              </Box>

            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor}>
              <Button onClick={onEditClose} variant="ghost" mr={3} size="sm" fontWeight="bold">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingEdit} fontWeight="bold" px={6}>Update Agreement</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </Box>
  );
}
