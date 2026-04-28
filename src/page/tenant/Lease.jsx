import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Button,
  VStack,
  HStack,
  Collapse,
  useDisclosure,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Checkbox,
  Divider,
  Center,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  FiClock, FiFileText, FiDollarSign, FiZap, FiArchive, FiArrowRight,
  FiCheckCircle, FiAlertCircle, FiDroplet,
} from "react-icons/fi";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import echo from "../../lib/echo";

const API = "http://localhost:8000/api/v1/tenant";
const BAKONG_LOGO_RED = "https://raw.githubusercontent.com/sokeng/khqr-gateway/main/assets/khqr.png";
const KHQR_LOGO = "https://nbc.gov.kh/images/khqr_logo.png";
const CACHE_KEY = "tenant_lease_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const fmt = (n) => {
  const c = (localStorage.getItem("currency") || sessionStorage.getItem("currency")) || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rateItem = (localStorage.getItem("exchangeRate") || sessionStorage.getItem("exchangeRate"));
    const r = rateItem ? Number(rateItem) : 4000;
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d) => d ? dayjs(d).format("MMM D, YYYY") : "—";

const authHeaders = () => ({
  Authorization: `Bearer ${(localStorage.getItem("token") || sessionStorage.getItem("token"))}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

// Read cached data from sessionStorage
const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
};

// Write data to sessionStorage cache
const writeCache = (data) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
};

export default function TenantLease() {
  const { t } = useTranslation();

  // Load from cache first for instant render (stale-while-revalidate)
  const cached = useMemo(() => readCache(), []);
  const [activeLeases, setActiveLeases] = useState(cached?.active_leases || []);
  const [lease, setLease] = useState(cached?.lease || null);
  const [pastLeases, setPastLeases] = useState(cached?.past_leases || []);
  const [recentPayments, setRecentPayments] = useState(cached?.recent_payments || []);
  const [loading, setLoading] = useState(!cached);

  // Bakong Payment States
  const [selectedItems, setSelectedItems] = useState({ rent: true, utilities: [] });
  const [qrString, setQrString] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const pollingRef = useRef(null);
  const [isPrintingContract, setIsPrintingContract] = useState(false);

  const { isOpen: isPastOpen, onToggle: onPastToggle } = useDisclosure();
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const { isOpen: isTxOpen, onOpen: onTxOpen, onClose: onTxClose } = useDisclosure();

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const tableHBg = useColorModeValue("gray.50", "#1c2333");
  const dangerBg = useColorModeValue("red.50", "rgba(229, 62, 62, 0.1)");
  const itemBg = useColorModeValue("gray.50", "#21262d");
  const progressTrackBg = useColorModeValue("gray.100", "gray.700");

  const fetchLease = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dashboard`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const allActive = data.active_leases || (data.lease ? [data.lease] : []);
        setActiveLeases(allActive);
        
        setLease(prev => {
          if (prev) {
            const updatedActive = allActive.find(l => l.id === prev.id);
            const updatedPast = (data.past_leases || []).find(l => l.id === prev.id);
            return updatedActive || updatedPast || allActive[0] || (data.past_leases || [])[0] || null;
          }
          return allActive[0] || (data.past_leases || [])[0] || null;
        });

        setPastLeases(data.past_leases || []);
        setRecentPayments(data.recent_payments || []);
        writeCache({ 
          active_leases: allActive, 
          lease: allActive[0] || null, 
          past_leases: data.past_leases, 
          recent_payments: data.recent_payments 
        });
      } else {
        toast.error("Failed to load lease information");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLease(); }, [fetchLease]);
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  // ─── Memoized Computed Values (must be before any early return) ───
  const rentPayments = useMemo(() => lease ? (lease.payments || []).filter(p => p.type === "rent") : [], [lease]);
  const totalRentPaid = useMemo(() => rentPayments.reduce((s, p) => s + Number(p.amount_paid), 0), [rentPayments]);
  const totalContractMonths = useMemo(() => lease ? Math.max(1, dayjs(lease.end_date).diff(dayjs(lease.start_date), 'month')) : 0, [lease]);
  const totalContractValue = useMemo(() => lease ? Number(lease.rent_amount) * totalContractMonths : 0, [lease, totalContractMonths]);
  const rentProgress = useMemo(() => totalContractValue > 0 ? Math.min((totalRentPaid / totalContractValue) * 100, 100) : 0, [totalRentPaid, totalContractValue]);

  const allBills = useMemo(() => lease ? (lease.utility_bills || []) : [], [lease]);
  const unpaidBills = useMemo(() => allBills.filter(b => b.status === "unpaid"), [allBills]);
  const totalUnpaidBills = useMemo(() => unpaidBills.reduce((s, b) => s + Number(b.amount), 0), [unpaidBills]);
  const overdueBills = useMemo(() => unpaidBills.filter(b => new Date(b.due_date) < new Date()), [unpaidBills]);
  const remainingBills = useMemo(() => unpaidBills.filter(b => new Date(b.due_date) >= new Date()), [unpaidBills]);
  const paidBills = useMemo(() => allBills.filter(b => b.status === "paid"), [allBills]);
  const sortedBills = useMemo(() => [...allBills].sort((a, b) => new Date(b.due_date) - new Date(a.due_date)), [allBills]);
  const sortedPayments = useMemo(() => [...(lease?.payments || [])].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)), [lease]);

  // ─── Memoized Handlers ───
  const handleToggleRent = useCallback(() => setSelectedItems(prev => ({ ...prev, rent: !prev.rent })), []);
  const handleToggleUtility = useCallback((id) => {
    setSelectedItems(prev => ({
      ...prev,
      utilities: prev.utilities.includes(id)
        ? prev.utilities.filter(i => i !== id)
        : [...prev.utilities, id]
    }));
  }, []);

  const calculateSubtotal = useCallback(() => {
    let total = 0;
    if (selectedItems.rent && lease?.rent_amount) total += Number(lease.rent_amount);
    unpaidBills.forEach(b => { if (selectedItems.utilities.includes(b.id)) total += Number(b.amount); });
    return total;
  }, [selectedItems, lease, unpaidBills]);

  const generateBakongQr = useCallback(async () => {
    setLoadingQr(true);
    setPaymentConfirmed(false);
    try {
      const res = await fetch(`${API}/payment/bakong/generate-qr`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          type: "bundle",
          id: lease.id,
          rent: selectedItems.rent,
          utility_ids: selectedItems.utilities,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setQrString(data.data.qrString);
        setQrMd5(data.data.md5);
        startPolling(data.data.md5);
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch (err) {
      toast.error("QR generation failed");
    } finally {
      setLoadingQr(false);
    }
  }, [lease, selectedItems]);

  const startPolling = useCallback((md5) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/payment/bakong/check-transaction`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ md5 }),
        });
        const data = await res.json();
        if (data.status === "success" && data.paid === true) {
          clearInterval(pollingRef.current);
          setPaymentConfirmed(true);
          toast.success("🎉 Payment Successful! Balance updated.", { duration: 6000 });
          sessionStorage.removeItem(CACHE_KEY);
          setTimeout(() => { fetchLease(); handleClosePayment(); }, 3000);
        }
      } catch (_) {}
    }, 5000);
  }, [fetchLease]);

  // Real-time WebSocket Listeners for Payment
  useEffect(() => {
    if (!qrMd5) return;

    // Listen to the public channel for this specific transaction MD5
    const channel = echo().channel(`bakong.payment.${qrMd5}`)
      .listen('.App\\Events\\BakongPaymentConfirmed', (e) => {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentConfirmed(true);
          toast.success("🎉 Webhook: Payment Verified instantly!", { duration: 6000 });
          sessionStorage.removeItem(CACHE_KEY);
          setTimeout(() => { fetchLease(); handleClosePayment(); }, 3000);
      });

    return () => {
      echo().leaveChannel(`bakong.payment.${qrMd5}`);
    };
  }, [qrMd5, fetchLease]);

  const handleOpenPayment = useCallback((bill = null) => {
    // Check if bill is actually our bill object and not a synthetic event from an onClick handler
    if (bill && bill.amount !== undefined) {
      setSelectedItems({ rent: false, utilities: [bill.id] });
    } else {
      setSelectedItems({ rent: true, utilities: unpaidBills.map(b => b.id) });
    }
    setQrString(null);
    setQrMd5(null);
    setPaymentConfirmed(false);
    onPayOpen();
  }, [unpaidBills, onPayOpen]);

  const handleClosePayment = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    onPayClose();
  }, [onPayClose]);

  const handlePrintContract = (lang = 'en') => {
    setIsPrintingContract(true);
    const printUrl = `http://localhost:8000/api/v1/tenant/print/contract/${lease.uid}?token=${(localStorage.getItem("token") || sessionStorage.getItem("token"))}&lang=${lang}`;
    window.open(printUrl, "_blank");
    setTimeout(() => setIsPrintingContract(false), 1000);
  };

  const billIcon = useCallback((type) => {
    if (type === "electricity") return FiZap;
    if (type === "water") return FiDroplet;
    return FiDollarSign;
  }, []);
  const billColor = useCallback((type) => {
    if (type === "electricity") return "yellow";
    if (type === "water") return "blue";
    return "gray";
  }, []);

  // ─── Early return for loading state (AFTER all hooks) ───
  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 3, md: 1 }} maxW="1600px" mx="auto">
      <Toaster position="top-right" />

      {overdueBills.length > 0 && (
        <Alert status="error" variant="solid" borderRadius="2xl" mb={5} shadow="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="sm" fontWeight="black" letterSpacing="wider">
              Payment Overdue
            </AlertTitle>
            <AlertDescription fontSize="xs" fontWeight="bold">
              This room ({lease?.room?.name}) has {overdueBills.length} utility bill(s) past the due date. Please settle these payments as soon as possible.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {(activeLeases.length + pastLeases.length) > 1 && (
        <Flex mb={4} overflowX="auto" pb={2} gap={3}>
          {[...activeLeases, ...pastLeases].map(l => {
            const isExpired = l.status === "expired" || l.status === "terminated";
            return (
              <Button
                key={l.id}
                size="sm"
                borderRadius="full"
                colorScheme={lease?.id === l.id ? (isExpired ? "orange" : "blue") : "gray"}
                variant={lease?.id === l.id ? "solid" : "outline"}
                onClick={() => setLease(l)}
                flexShrink={0}
                leftIcon={<Icon as={isExpired ? FiArchive : FiFileText} />}
              >
                {l.room?.name || `Lease #${l.id}`} {isExpired && "(Expired)"}
              </Button>
            );
          })}
        </Flex>
      )}

      {!lease ? (
        <Flex direction="column" align="center" justify="center" p={12} bg={bg} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <Icon as={FiFileText} boxSize={16} color="gray.300" mb={6} />
          <Heading size="md" color={textColor} mb={2}>No active lease found.</Heading>
          <Text color={mutedText} textAlign="center" maxW="400px">
            You do not currently have an active lease agreement. Please contact property management.
          </Text>
        </Flex>
      ) : (
        <VStack spacing={5} align="stretch">

          {/* ─── Hero Banner ─── */}
          <Box position="relative" borderRadius="2xl" overflow="hidden" bgGradient="linear(to-br, blue.600, purple.700)" color="white" shadow="lg">
            <Box position="absolute" top={0} left={0} right={0} bottom={0} opacity={0.1} backgroundImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)" backgroundSize="32px 32px" />
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "flex-end" }} p={{ base: 5, md: 7 }} position="relative" zIndex={1}>
              <Box>
                <Badge bg="whiteAlpha.200" color="white" px={3} py={1} borderRadius="full" mb={2} fontWeight="black" fontSize="xs" letterSpacing="wider" backdropFilter="blur(10px)">
                  {lease.status} Lease
                </Badge>
                <Heading size="2xl" fontWeight="black" letterSpacing="tight" mb={1}>
                  {lease.room?.name || "Room Details"}
                </Heading>
                <Text fontSize="md" color="whiteAlpha.800" fontWeight="medium">
                  {fmtDate(lease.start_date)} — {fmtDate(lease.end_date)} ({totalContractMonths} Months)
                </Text>
              </Box>
              <Box mt={{ base: 6, md: 0 }} textAlign={{ md: "right" }}>
                <Text fontSize="md" color="whiteAlpha.800" letterSpacing="wider" fontWeight="bold" mb={1}>Monthly Rent</Text>
                <Heading size="2xl" fontWeight="bold">{fmt(lease.rent_amount)}</Heading>
                <Flex direction={{ base: "column", md: "row" }} justify={{ md: "flex-end" }} gap={3} mt={4}>
                  {(totalRentPaid < totalContractValue || unpaidBills.length > 0) && (
                  <Button size="md" colorScheme="blue" rounded="full" fontWeight="bold" px={8} w={{ base: "full", md: "auto" }} onClick={handleOpenPayment} shadow="lg" _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }} transition="all 0.2s">
                    Pay with Bakong
                  </Button>
                  )}
                  <Button size="md" colorScheme="whiteAlpha" rounded="full" fontWeight="bold" px={8} w={{ base: "full", md: "auto" }} onClick={() => handlePrintContract()} isLoading={isPrintingContract} leftIcon={<Icon as={FiFileText} />}>
                    View Contract
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Box>

          {/* ─── KPI Cards ─── */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
            {/* Progress */}
            <Box bg={bg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.2s" _hover={{ transform: "translateY(-2px)", shadow: "md" }}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color={mutedText} letterSpacing="wider">Lease Value Progress</Text>
                <Icon as={FiCheckCircle} color={rentProgress >= 100 ? "green.400" : "blue.400"} />
              </Flex>
              <Heading size="lg" color={textColor} fontWeight="black" mb={1}>{rentProgress.toFixed(0)}% Paid</Heading>
              <Progress value={rentProgress} size="xs" colorScheme={rentProgress >= 100 ? "green" : "blue"} borderRadius="full" mb={2} bg={progressTrackBg} />
              <Flex justify="space-between" fontSize="sm" fontWeight="bold">
                <Text color={mutedText}>{fmt(totalRentPaid)} Paid</Text>
                <Text color={textColor}>{fmt(totalContractValue)} Total</Text>
              </Flex>
            </Box>

            {/* Unpaid Bills */}
            <Box bg={unpaidBills.length > 0 ? dangerBg : bg} p={4} borderRadius="xl" border="1px solid" borderColor={unpaidBills.length > 0 ? "red.200" : borderColor} shadow="sm" transition="all 0.2s" _hover={{ transform: "translateY(-2px)", shadow: "md" }}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="black" color={unpaidBills.length > 0 ? "red.500" : mutedText} letterSpacing="wider">
                  {unpaidBills.length > 0 ? "Action Required" : "Utility Bills"}
                </Text>
                <Icon as={unpaidBills.length > 0 ? FiAlertCircle : FiZap} color={unpaidBills.length > 0 ? "red.500" : "yellow.400"} />
              </Flex>
              <Heading size="lg" color={unpaidBills.length > 0 ? "red.600" : textColor} fontWeight="black" mb={1}>{fmt(totalUnpaidBills)}</Heading>
              <Text fontSize="sm" color={unpaidBills.length > 0 ? "red.500" : mutedText} fontWeight="bold" mb={2}>
                {unpaidBills.length > 0 ? `${unpaidBills.length} unpaid bill(s) pending` : "All utility bills paid up to date."}
              </Text>
              {unpaidBills.length > 0 && (
                <Button size="sm" w="full" colorScheme="red" variant="outline" onClick={handleOpenPayment}>Pay Now</Button>
              )}
            </Box>

            {/* Security Deposit */}
            <Box bg={bg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.2s" _hover={{ transform: "translateY(-2px)", shadow: "md" }}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color={mutedText} letterSpacing="wider">Security Deposit</Text>
                <Icon as={FiDollarSign} color="green.400" />
              </Flex>
              <Heading size="lg" color={textColor} fontWeight="bold" mb={1}>{fmt(lease.security_deposit)}</Heading>
              <Badge colorScheme={lease.deposit_status === 'held' ? "green" : "orange"} variant="subtle" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="bold" mt={1}>
                {lease.deposit_status || 'unpaid'}
              </Badge>
            </Box>
          </SimpleGrid>

          {/* ─── Utility Bills Table ─── */}
          <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden" shadow="sm">
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} px={4} py={3} borderBottom="1px solid" borderColor={borderColor} bg={tableHBg}>
              <Flex align="center" gap={3} flexWrap="wrap">
                <Heading size="md" letterSpacing="wider" color={textColor}>Utility Bills</Heading>
                {overdueBills.length > 0 && (
                  <Badge colorScheme="red" fontSize="xs" borderRadius="full" px={2} py={0.5}>🔴 {overdueBills.length} Overdue</Badge>
                )}
                {remainingBills.length > 0 && (
                  <Badge colorScheme="orange" fontSize="xs" borderRadius="full" px={2} py={0.5}>🟡 {remainingBills.length} Remaining</Badge>
                )}
                {paidBills.length > 0 && (
                  <Badge colorScheme="green" fontSize="xs" borderRadius="full" px={2} py={0.5}>✅ {paidBills.length} Paid</Badge>
                )}
                {selectedItems.utilities.length > 0 && (
                  <Badge colorScheme="blue" fontSize="xs" borderRadius="full" px={2} py={0.5}>{selectedItems.utilities.length} selected</Badge>
                )}
              </Flex>
              <Flex align="center" gap={3}>

                {unpaidBills.length > 0 && selectedItems.utilities.length === 0 && (
                  <Button size="xs" colorScheme="blue" variant="outline" rounded="full" fontWeight="bold" px={4} onClick={handleOpenPayment}>
                    Pay All ({unpaidBills.length})
                  </Button>
                )}
              </Flex>
            </Flex>
            <TableContainer whiteSpace="nowrap" display={{ base: "none", md: "block" }}>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    {unpaidBills.length > 0 && (
                      <Th w={{ base: "30px", md: "40px" }} px={{ base: 2, md: 4 }}>
                        <Checkbox
                          colorScheme="blue"
                          isChecked={unpaidBills.length > 0 && selectedItems.utilities.length === unpaidBills.length}
                          isIndeterminate={selectedItems.utilities.length > 0 && selectedItems.utilities.length < unpaidBills.length}
                          onChange={(e) => setSelectedItems(prev => ({
                            ...prev,
                            utilities: e.target.checked ? unpaidBills.map(b => b.id) : []
                          }))}
                        />
                      </Th>
                    )}
                    <Th px={{ base: 2, md: 4 }} fontSize="xs" fontWeight="bold" letterSpacing="wider">Type</Th>
                    <Th px={{ base: 2, md: 4 }} fontSize="xs" fontWeight="bold" letterSpacing="wider">Amount</Th>
                    <Th px={{ base: 2, md: 4 }} fontSize="xs" fontWeight="bold" letterSpacing="wider">Due Date</Th>
                    <Th display={{ base: "none", lg: "table-cell" }} fontSize="xs" fontWeight="bold" letterSpacing="wider">Status</Th>
                    <Th display={{ base: "none", lg: "table-cell" }} fontSize="xs" fontWeight="bold" letterSpacing="wider">Description</Th>
                    <Th display={{ base: "none", md: "table-cell" }} px={{ base: 2, md: 4 }} fontSize="xs" fontWeight="bold" letterSpacing="wider">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {allBills.length === 0 ? (
                    <Tr><Td colSpan={unpaidBills.length > 0 ? 8 : 7} textAlign="center" py={10} color={mutedText} borderBottom="none">No utility bills found.</Td></Tr>
                  ) : (
                    sortedBills.map(bill => {
                      const isOverdue = bill.status === "unpaid" && new Date(bill.due_date) < new Date();
                      const isSelected = selectedItems.utilities.includes(bill.id);
                      return (
                        <Tr key={bill.id} bg={isSelected ? "blue.50" : isOverdue ? dangerBg : "transparent"} _hover={{ bg: tableHBg }} _dark={isSelected ? { bg: "blue.900" } : {}}>
                          {unpaidBills.length > 0 && (
                            <Td w={{ base: "30px", md: "40px" }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }}>
                              {bill.status === "unpaid" ? (
                                <Checkbox
                                  colorScheme="blue"
                                  isChecked={isSelected}
                                  onChange={() => handleToggleUtility(bill.id)}
                                />
                              ) : null}
                            </Td>
                          )}
                          <Td px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }}>
                            <Badge colorScheme={billColor(bill.type)} fontSize="10px" px={2} py={0.5} borderRadius="md" textTransform="capitalize">
                              <Flex align="center" gap={1}><Icon as={billIcon(bill.type)} boxSize={3} /> <Text display={{ base: "none", md: "inline" }}>{bill.type}</Text></Flex>
                            </Badge>
                          </Td>
                          <Td px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} fontWeight="900" fontSize={{ base: "sm", md: "md" }} color={isOverdue ? "red.600" : textColor}>{fmt(bill.amount)}</Td>
                          <Td px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" color={isOverdue ? "red.500" : mutedText}>
                            {fmtDate(bill.due_date)}
                            {isOverdue && <Badge ml={{ base: 1, md: 2 }} colorScheme="red" fontSize="9px">OVERDUE</Badge>}
                          </Td>
                          <Td display={{ base: "none", lg: "table-cell" }} px={4} py={{ base: 2, md: 3 }}>
                            <Badge colorScheme={bill.status === "paid" ? "green" : "orange"} fontSize="10px">{bill.status}</Badge>
                          </Td>
                          <Td display={{ base: "none", lg: "table-cell" }} px={4} py={{ base: 2, md: 3 }} fontSize="xs" color={mutedText} maxW="200px" noOfLines={1}>{bill.description || "—"}</Td>
                          <Td display={{ base: "none", md: "table-cell" }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }}>
                            {bill.status === "unpaid" ? (
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  rounded="full"
                                  fontWeight="bold"
                                  variant="solid"
                                  onClick={() => handleOpenPayment(bill)}
                                  fontSize="xs"
                                  px={4}
                                >
                                  Pay
                                </Button>
                            ) : (
                              <Text fontSize="xs" color="green.500" fontWeight="bold">✓ Done</Text>
                            )}
                          </Td>
                        </Tr>
                      );
                     })
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            {/* ─── Mobile Utility Cards (Only visible on Base layout) ─── */}
            <VStack display={{ base: "flex", md: "none" }} align="stretch" spacing={0} divider={<Box borderBottom="1px solid" borderColor={borderColor} />}>
              {allBills.length === 0 ? (
                 <Box textAlign="center" py={10} color={mutedText}>No utility bills found.</Box>
              ) : (
                sortedBills.map(bill => {
                  const isOverdue = bill.status === "unpaid" && new Date(bill.due_date) < new Date();
                  const isSelected = selectedItems.utilities.includes(bill.id);
                  return (
                    <Box key={`mbill-${bill.id}`} p={5} bg={isSelected ? "blue.50" : isOverdue ? dangerBg : "transparent"} _dark={isSelected ? { bg: "blue.900" } : {}} transition="all 0.2s" _hover={{ bg: tableHBg }}>
                      <Flex justify="space-between" align="flex-start" mb={4}>
                        <Flex gap={3} align="flex-start">
                          {unpaidBills.length > 0 && bill.status === "unpaid" ? (
                            <Checkbox
                              mt={1}
                              colorScheme="blue"
                              isChecked={isSelected}
                              onChange={() => handleToggleUtility(bill.id)}
                            />
                          ) : unpaidBills.length > 0 ? (
                            <Box w={4} /> /* Spacer if no checkbox */
                          ) : null}
                          <Box>
                             <Badge colorScheme={billColor(bill.type)} fontSize="10px" px={2.5} py={1} borderRadius="md" textTransform="capitalize" mb={1}>
                               <Flex align="center" gap={1.5}><Icon as={billIcon(bill.type)} boxSize={3.5} /> {bill.type}</Flex>
                             </Badge>
                             {bill.description && <Text fontSize="11px" color={mutedText} noOfLines={1} maxW="150px">{bill.description}</Text>}
                          </Box>
                        </Flex>
                        <Flex flexDir="column" align="flex-end" textAlign="right">
                          <Text fontSize="11px" fontWeight="bold" color={isOverdue ? "red.500" : mutedText}>{fmtDate(bill.due_date)}</Text>
                          {isOverdue && <Badge colorScheme="red" fontSize="8px" mt={1}>OVERDUE</Badge>}
                        </Flex>
                      </Flex>
                      <Flex justify="space-between" align="flex-end" pl={unpaidBills.length > 0 && bill.status === "unpaid" ? 7 : 0}>
                        <Box>
                          <Text fontSize="10px" color={mutedText} fontWeight="bold" letterSpacing="widest" mb={0.5}>Amount Due</Text>
                          <Text fontWeight="900" fontSize="2xl" color={isOverdue ? "red.600" : textColor} lineHeight="1">{fmt(bill.amount)}</Text>
                        </Box>
                        <Box>
                          {bill.status === "unpaid" ? (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              rounded="full"
                              fontWeight="bold"
                              variant="solid"
                              onClick={() => handleOpenPayment(bill)}
                              fontSize="xs"
                              px={6}
                              h={8}
                            >
                              Pay
                            </Button>
                          ) : (
                            <Badge colorScheme="green" fontSize="10px" px={3} py={1.5} rounded="md">✓ PAID</Badge>
                          )}
                        </Box>
                      </Flex>
                    </Box>
                  )
                })
              )}
            </VStack>
            {/* Selected Total Bar */}
            {selectedItems.utilities.length > 0 && (
              <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "center" }} gap={3} px={4} py={3} borderTop="1px solid" borderColor={borderColor} bg={itemBg}>
                <Text fontSize="xs" fontWeight="bold" color={mutedText} textAlign={{ base: "left", sm: "auto" }}>
                  Selected Total: <Text as="span" color="blue.500" fontSize="md">{fmt(unpaidBills.filter(b => selectedItems.utilities.includes(b.id)).reduce((s, b) => s + Number(b.amount), 0))}</Text>
                </Text>
                <Button size="sm" colorScheme="blue" borderRadius="full" fontWeight="bold" w={{ base: "full", sm: "auto" }} onClick={() => {
                  setSelectedItems(prev => ({ ...prev, rent: false }));
                  setQrString(null); setQrMd5(null); setPaymentConfirmed(false);
                  onPayOpen();
                }}>
                  Pay with Bakong →
                </Button>
              </Flex>
            )}
          </Box>

          {/* ─── History & Statements ─── */}
          <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} p={5} shadow="sm" display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center" transition="all 0.2s" _hover={{ shadow: "md" }}>
            <Icon as={FiClock} boxSize={8} color="blue.400" mb={2} />
            <Heading size="sm" color={textColor} mb={1}>History & Statements</Heading>
            <Text color={mutedText} fontSize="xs" mb={4} maxW="280px">Access your complete ledger, utility history, invoices, and receipts.</Text>
            <Button size="md" colorScheme="blue" borderRadius="lg" fontWeight="bold" w={{ base: "full", sm: "auto" }} onClick={onTxOpen}>View Transactions</Button>
          </Box>

          {/* ─── Past Leases ─── */}
          {pastLeases.length > 0 && (
            <Box mt={2}>
              <Button onClick={onPastToggle} variant="ghost" colorScheme="gray" size="sm" rightIcon={<FiArchive />} mb={2}>
                {isPastOpen ? "Hide Past Leases" : `View Past Leases (${pastLeases.length})`}
              </Button>
              <Collapse in={isPastOpen} animateOpacity>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {pastLeases.map(pl => (
                    <Box key={pl.id} bg={bg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor} opacity={0.8} transition="all 0.2s" _hover={{ opacity: 1, borderColor: "blue.300", shadow: "sm", cursor: "pointer" }} onClick={() => { setLease(pl); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <Flex justify="space-between" align="flex-start" mb={2}>
                        <Box>
                          <Text fontWeight="bold" color={textColor}>{pl.room?.name || "Unknown Room"}</Text>
                          <Text fontSize="xs" color={mutedText}>{fmtDate(pl.start_date)} — {fmtDate(pl.end_date)}</Text>
                        </Box>
                        <Badge colorScheme="gray" fontSize="10px">{pl.status}</Badge>
                      </Flex>
                      <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmt(pl.rent_amount)} <Text as="span" fontSize="xs" color={mutedText} fontWeight="normal">/mo</Text></Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Collapse>
            </Box>
          )}
        </VStack>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* ═══  TRANSACTIONS HISTORY MODAL  ═══ */}
      {/* ══════════════════════════════════════════ */}
      <Modal isOpen={isTxOpen} onClose={onTxClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" bg={bg} overflow="hidden">
          <ModalHeader py={5} borderBottom="1px solid" borderColor={borderColor}>
            <Heading size="md" fontWeight="bold" color={textColor}>Transaction History</Heading>
            <Text fontSize="xs" color={mutedText} fontWeight="bold" mt={1}>
              All payments recorded for this lease • {(lease?.payments || []).length} transaction(s)
            </Text>
          </ModalHeader>
          <ModalCloseButton mt={2} />
          <ModalBody py={4} px={0}>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th fontSize="xs" fontWeight="black" letterSpacing="wider" py={3}>Date</Th>
                    <Th fontSize="xs" fontWeight="black" letterSpacing="wider" py={3}>Type</Th>
                    <Th fontSize="xs" fontWeight="black" letterSpacing="wider" py={3}>Method</Th>
                    <Th fontSize="xs" fontWeight="black" letterSpacing="wider" py={3}>Reference</Th>
                    <Th fontSize="xs" fontWeight="black" letterSpacing="wider" py={3} isNumeric>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(lease?.payments || []).length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={12} color={mutedText} borderBottom="none">
                        <Icon as={FiFileText} boxSize={8} color="gray.300" mb={3} display="block" mx="auto" />
                        No transactions found for this lease.
                      </Td>
                    </Tr>
                  ) : (
                    sortedPayments.map(p => (
                      <Tr key={p.id} _hover={{ bg: tableHBg }}>
                        <Td py={3}>
                          <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(p.payment_date)}</Text>
                        </Td>
                        <Td py={3}>
                          <Badge colorScheme={p.type === "rent" ? "purple" : p.type === "utility" ? "teal" : "gray"} fontSize="10px" px={2} py={0.5} borderRadius="md" textTransform="capitalize">
                            {p.type || "other"}
                          </Badge>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="xs" fontWeight="bold" color={textColor} textTransform="capitalize">{p.payment_method || "—"}</Text>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="xs" color={mutedText} noOfLines={1} maxW="150px">{p.reference || "—"}</Text>
                        </Td>
                        <Td py={3} isNumeric fontWeight="black" color="green.500" fontSize="sm">
                          {fmt(p.amount_paid)}
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>
          {(lease?.payments || []).length > 0 && (
            <ModalFooter borderTop="1px solid" borderColor={borderColor} bg={itemBg} justifyContent="space-between">
              <Text fontSize="xs" fontWeight="black" color={mutedText}>
                Total Paid
              </Text>
              <Heading size="md" fontWeight="black" color="green.500">
                {fmt((lease?.payments || []).reduce((s, p) => s + Number(p.amount_paid), 0))}
              </Heading>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* ══════════════════════════════════════════ */}
      {/* ═══  INVOICE & BAKONG PAYMENT MODAL  ═══ */}
      {/* ══════════════════════════════════════════ */}
      <Modal isOpen={isPayOpen} onClose={handleClosePayment} size="xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
        <ModalContent borderRadius="2xl" bg={bg} overflow="hidden" shadow="2xl">
          
          {/* Invoice Header — compact */}
          <Box bgGradient="linear(to-r, blue.600, purple.600)" color="white" px={6} py={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="9px" fontWeight="black" letterSpacing="widest" color="whiteAlpha.600">Invoice</Text>
                <Heading size="md" fontWeight="black">Statement of Account</Heading>
              </Box>
              <Box textAlign="right">
                <Text fontSize="xs" color="whiteAlpha.800" fontWeight="bold">{lease?.room?.name}</Text>
                <Text fontSize="10px" color="whiteAlpha.500">{dayjs().format("MMM D, YYYY")}</Text>
              </Box>
            </Flex>
            <ModalCloseButton color="white" size="sm" />
          </Box>

          <ModalBody py={0} px={0}>
            {!qrString ? (
              <Box>
                {/* Line Items — compact */}
                <Box px={5} py={4}>
                  <Text fontSize="9px" fontWeight="black" color={mutedText} letterSpacing="widest" mb={3}>Line Items — Select to Pay</Text>

                  {/* Rent */}
                  <Flex
                    align="center" justify="space-between" px={3} py={2.5}
                    bg={selectedItems.rent ? "blue.50" : itemBg}
                    _dark={selectedItems.rent ? { bg: "blue.900" } : {}}
                    borderRadius="lg" border="1px solid"
                    borderColor={selectedItems.rent ? "blue.200" : borderColor}
                    cursor="pointer" transition="all 0.15s"
                    onClick={handleToggleRent}
                    _hover={{ borderColor: "blue.300" }}
                  >
                    <HStack spacing={3}>
                      <Checkbox colorScheme="blue" isChecked={selectedItems.rent} onChange={handleToggleRent} size="md" pointerEvents="none" />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>Monthly Rent</Text>
                        <Text fontSize="11px" color={mutedText}>Recurring • Due monthly</Text>
                      </Box>
                    </HStack>
                    <Text fontWeight="black" fontSize="sm" color={textColor}>{fmt(lease?.rent_amount)}</Text>
                  </Flex>

                  {/* Utility Bills */}
                  {unpaidBills.length > 0 && (
                    <Box mt={3}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="9px" fontWeight="black" color={mutedText} letterSpacing="widest">Utility Bills ({unpaidBills.length})</Text>
                        <Button size="xs" variant="link" colorScheme="blue" fontSize="11px" onClick={() => {
                          const allSelected = selectedItems.utilities.length === unpaidBills.length;
                          setSelectedItems(prev => ({ ...prev, utilities: allSelected ? [] : unpaidBills.map(b => b.id) }));
                        }}>
                          {selectedItems.utilities.length === unpaidBills.length ? "Deselect All" : "Select All"}
                        </Button>
                      </Flex>
                      <VStack spacing={1.5} align="stretch">
                        {unpaidBills.map(bill => {
                          const isSelected = selectedItems.utilities.includes(bill.id);
                          const isOverdue = new Date(bill.due_date) < new Date();
                          return (
                            <Flex
                              key={bill.id} align="center" justify="space-between" px={3} py={2.5}
                              bg={isSelected ? (isOverdue ? "red.50" : "blue.50") : itemBg}
                              _dark={isSelected ? { bg: isOverdue ? "red.900" : "blue.900" } : {}}
                              borderRadius="lg" border="1px solid"
                              borderColor={isOverdue ? "red.200" : isSelected ? "blue.200" : borderColor}
                              cursor="pointer" transition="all 0.15s"
                              onClick={() => handleToggleUtility(bill.id)}
                              _hover={{ borderColor: isOverdue ? "red.300" : "blue.300" }}
                            >
                              <HStack spacing={3}>
                                <Checkbox colorScheme={isOverdue ? "red" : "blue"} isChecked={isSelected} onChange={() => handleToggleUtility(bill.id)} size="md" pointerEvents="none" />
                                <Box>
                                  <HStack spacing={1.5}>
                                    <Icon as={billIcon(bill.type)} boxSize={3} color={isOverdue ? "red.500" : `${billColor(bill.type)}.500`} />
                                    <Text fontWeight="bold" fontSize="sm" color={textColor} textTransform="capitalize">{bill.type}</Text>
                                    {isOverdue && <Badge colorScheme="red" fontSize="8px" lineHeight="1.2">OVERDUE</Badge>}
                                  </HStack>
                                  <Text fontSize="11px" color={mutedText} mt={0.5}>
                                    Due: {dayjs(bill.due_date).format("MMM D, YYYY")}
                                    {(bill.previous_reading != null && bill.current_reading != null) && ` • ${bill.previous_reading}→${bill.current_reading} (${bill.usage})`}
                                  </Text>
                                </Box>
                              </HStack>
                              <Text fontWeight="black" fontSize="sm" color={isOverdue ? "red.600" : textColor}>{fmt(bill.amount)}</Text>
                            </Flex>
                          );
                        })}
                      </VStack>
                    </Box>
                  )}

                  {unpaidBills.length === 0 && (
                    <Flex align="center" justify="center" gap={2} py={3} mt={2} color="green.500">
                      <Icon as={FiCheckCircle} boxSize={4} />
                      <Text fontSize="xs" fontWeight="bold">All utility bills are paid!</Text>
                    </Flex>
                  )}
                </Box>

              </Box>
            ) : (
              /* QR Code / Confirmation View */
              <Box>
                {paymentConfirmed ? (
                  <Box bgGradient="linear(to-br, green.400, green.600, teal.500)" p={12} textAlign="center">
                    <Flex w={20} h={20} mx="auto" mb={4} bg="whiteAlpha.300" borderRadius="full" align="center" justify="center">
                      <Icon as={FiCheckCircle} boxSize={10} color="white" />
                    </Flex>
                    <Heading size="lg" color="white" mb={2}>Payment Received!</Heading>
                    <Text color="whiteAlpha.900" fontWeight="bold">All selected items have been marked as paid.</Text>
                    <Badge mt={6} bg="whiteAlpha.200" color="white" px={4} py={2} borderRadius="full">✓ Transaction Confirmed</Badge>
                  </Box>
                ) : (
                  <VStack spacing={0} align="stretch">
                    <Box bg="blue.500" px={6} py={3}>
                      <Flex align="center" justify="space-between">
                        <HStack><Icon as={FiZap} color="white" /><Text fontSize="sm" fontWeight="black" color="white">SCAN TO PAY</Text></HStack>
                        <Badge bg="whiteAlpha.200" color="white" rounded="full" px={3} fontSize="sm" fontWeight="black">{fmt(calculateSubtotal())}</Badge>
                      </Flex>
                    </Box>
                    <Box p={8} textAlign="center">
                      <VStack spacing={6}>
                        <Box w="280px" bg="white" p={4} borderRadius="2xl" shadow="xl" border="1px solid" borderColor="gray.100" mx="auto">
                          <Box bg="#005EAA" p={3} mb={3} borderTopRadius="xl">
                            <Image src={KHQR_LOGO} h="20px" mx="auto" />
                          </Box>
                          <Center>
                            <QRCodeCanvas
                              value={qrString} size={220} level="H"
                              imageSettings={{ src: BAKONG_LOGO_RED, height: 40, width: 40, excavate: true }}
                            />
                          </Center>
                          <Text fontSize="xs" fontWeight="bold" color="gray.500" textAlign="center" mt={3} pb={2}>
                            Exchange Rate: 1$ = 4000 Riel
                          </Text>
                        </Box>
                        <Box p={3} bg="blue.50" rounded="xl" w="full">
                          <HStack justify="center" spacing={3}>
                            <Spinner size="xs" color="blue.500" />
                            <Text fontSize="xs" fontWeight="black" color="blue.700">Awaiting payment confirmation...</Text>
                          </HStack>
                        </Box>
                        <Button variant="ghost" size="sm" color={mutedText} onClick={() => setQrString(null)}>← Back to Invoice</Button>
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </Box>
            )}
          </ModalBody>

          {!qrString && (
            <ModalFooter borderTop="2px dashed" borderColor={borderColor} bg={itemBg} display="flex" flexDirection="column" px={5} py={4}>
              <Flex justify="space-between" align="center" mb={4} w="full">
                <Text fontSize="xs" fontWeight="black" color={mutedText}>
                  Selected ({(selectedItems.rent ? 1 : 0) + selectedItems.utilities.length} item{(selectedItems.rent ? 1 : 0) + selectedItems.utilities.length !== 1 ? "s" : ""})
                </Text>
                <Heading size="lg" fontWeight="black" color="blue.500">{fmt(calculateSubtotal())}</Heading>
              </Flex>
              <Flex w="full" gap={3}>
                <Button variant="ghost" onClick={handleClosePayment} fontWeight="bold" size="md" color={mutedText} px={6}>Close</Button>
                <Button
                  flex="1" size="md" colorScheme="blue" borderRadius="lg" fontWeight="black"
                  isDisabled={calculateSubtotal() <= 0} isLoading={loadingQr}
                  onClick={generateBakongQr}
                  leftIcon={<Icon as={FiZap} />}
                >
                  Pay with Bakong
                </Button>
              </Flex>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
}
