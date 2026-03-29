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

const API = "http://localhost:8000/api/v1/tenant";
const KHQR_LOGO = "https://api-bakong.nbc.gov.kh/images/khqr.png";
const BAKONG_LOGO_RED = "https://api-bakong.nbc.gov.kh/images/logo.png";
const CACHE_KEY = "tenant_lease_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const fmt = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rateItem = localStorage.getItem("exchangeRate");
    const r = rateItem ? Number(rateItem) : 4000;
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d) => d ? dayjs(d).format("MMM D, YYYY") : "—";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        setLease(data.lease || null);
        setPastLeases(data.past_leases || []);
        setRecentPayments(data.recent_payments || []);
        writeCache({ lease: data.lease, past_leases: data.past_leases, recent_payments: data.recent_payments });
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

  const handleOpenPayment = useCallback(() => {
    setSelectedItems({ rent: true, utilities: unpaidBills.map(b => b.id) });
    setQrString(null);
    setQrMd5(null);
    setPaymentConfirmed(false);
    onPayOpen();
  }, [unpaidBills, onPayOpen]);

  const handleClosePayment = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    onPayClose();
  }, [onPayClose]);

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
    <Box p={{ base: 3, md: 5 }} maxW="1200px" mx="auto">
      <Toaster position="top-right" />

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
                <Badge bg="whiteAlpha.200" color="white" px={2} py={0.5} borderRadius="full" mb={2} textTransform="uppercase" fontWeight="black" fontSize="10px" letterSpacing="wider" backdropFilter="blur(10px)">
                  {lease.status} Lease
                </Badge>
                <Heading size="xl" fontWeight="black" letterSpacing="tight" mb={1}>
                  {lease.room?.name || "Room Details"}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.800" fontWeight="medium">
                  {fmtDate(lease.start_date)} — {fmtDate(lease.end_date)} ({totalContractMonths} Months)
                </Text>
              </Box>
              <Box mt={{ base: 6, md: 0 }} textAlign={{ md: "right" }}>
                <Text fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="wider" fontWeight="bold" mb={1}>Monthly Rent</Text>
                <Heading size="xl" fontWeight="black">{fmt(lease.rent_amount)}</Heading>
                {(totalRentPaid < totalContractValue || unpaidBills.length > 0) && (
                  <Button mt={3} size="sm" bg="whiteAlpha.200" color="white" _hover={{ bg: "whiteAlpha.300" }} borderRadius="lg" fontWeight="black" onClick={handleOpenPayment}>
                    Pay with Bakong
                  </Button>
                )}
              </Box>
            </Flex>
          </Box>

          {/* ─── KPI Cards ─── */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
            {/* Progress */}
            <Box bg={bg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.2s" _hover={{ transform: "translateY(-2px)", shadow: "md" }}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" letterSpacing="wider">Lease Value Progress</Text>
                <Icon as={FiCheckCircle} color={rentProgress >= 100 ? "green.400" : "blue.400"} />
              </Flex>
              <Heading size="md" color={textColor} fontWeight="black" mb={1}>{rentProgress.toFixed(0)}% Paid</Heading>
              <Progress value={rentProgress} size="xs" colorScheme={rentProgress >= 100 ? "green" : "blue"} borderRadius="full" mb={2} bg={progressTrackBg} />
              <Flex justify="space-between" fontSize="xs" fontWeight="bold">
                <Text color={mutedText}>{fmt(totalRentPaid)} Paid</Text>
                <Text color={textColor}>{fmt(totalContractValue)} Total</Text>
              </Flex>
            </Box>

            {/* Unpaid Bills */}
            <Box bg={unpaidBills.length > 0 ? dangerBg : bg} p={4} borderRadius="xl" border="1px solid" borderColor={unpaidBills.length > 0 ? "red.200" : borderColor} shadow="sm" transition="all 0.2s" _hover={{ transform: "translateY(-2px)", shadow: "md" }}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="xs" fontWeight="black" color={unpaidBills.length > 0 ? "red.500" : mutedText} textTransform="uppercase" letterSpacing="wider">
                  {unpaidBills.length > 0 ? "Action Required" : "Utility Bills"}
                </Text>
                <Icon as={unpaidBills.length > 0 ? FiAlertCircle : FiZap} color={unpaidBills.length > 0 ? "red.500" : "yellow.400"} />
              </Flex>
              <Heading size="md" color={unpaidBills.length > 0 ? "red.600" : textColor} fontWeight="black" mb={1}>{fmt(totalUnpaidBills)}</Heading>
              <Text fontSize="xs" color={unpaidBills.length > 0 ? "red.500" : mutedText} fontWeight="bold" mb={2}>
                {unpaidBills.length > 0 ? `${unpaidBills.length} unpaid bill(s) pending` : "All utility bills paid up to date."}
              </Text>
              {unpaidBills.length > 0 && (
                <Button size="sm" w="full" colorScheme="red" variant="outline" onClick={handleOpenPayment}>Pay Now</Button>
              )}
            </Box>

            {/* Security Deposit */}
            <Box bg={bg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.2s" _hover={{ transform: "translateY(-2px)", shadow: "md" }}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" letterSpacing="wider">Security Deposit</Text>
                <Icon as={FiDollarSign} color="green.400" />
              </Flex>
              <Heading size="md" color={textColor} fontWeight="black" mb={1}>{fmt(lease.security_deposit)}</Heading>
              <Badge colorScheme={lease.deposit_status === 'held' ? "green" : "orange"} variant="subtle" px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="black" textTransform="uppercase" mt={1}>
                {lease.deposit_status || 'unpaid'}
              </Badge>
            </Box>
          </SimpleGrid>

          {/* ─── Utility Bills Table ─── */}
          <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden" shadow="sm">
            <Flex justify="space-between" align="center" px={4} py={3} borderBottom="1px solid" borderColor={borderColor} bg={tableHBg}>
              <Flex align="center" gap={3} flexWrap="wrap">
                <Heading size="sm" textTransform="uppercase" letterSpacing="wider" color={textColor}>Utility Bills</Heading>
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
                {selectedItems.utilities.length > 0 && (
                  <Button size="xs" colorScheme="blue" borderRadius="lg" fontWeight="black" onClick={() => {
                    setSelectedItems(prev => ({ ...prev, rent: false }));
                    setQrString(null); setQrMd5(null); setPaymentConfirmed(false);
                    onPayOpen();
                  }}>
                    Pay Selected ({selectedItems.utilities.length}) with Bakong
                  </Button>
                )}
                {unpaidBills.length > 0 && selectedItems.utilities.length === 0 && (
                  <Button size="xs" colorScheme="blue" variant="outline" borderRadius="lg" onClick={handleOpenPayment}>
                    Pay All ({unpaidBills.length})
                  </Button>
                )}
              </Flex>
            </Flex>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    {unpaidBills.length > 0 && (
                      <Th w="40px" py={4}>
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
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Type</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Amount</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Due Date</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Status</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Description</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Action</Th>
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
                            <Td w="40px" py={3}>
                              {bill.status === "unpaid" ? (
                                <Checkbox
                                  colorScheme="blue"
                                  isChecked={isSelected}
                                  onChange={() => handleToggleUtility(bill.id)}
                                />
                              ) : null}
                            </Td>
                          )}
                          <Td py={3}>
                            <Badge colorScheme={billColor(bill.type)} fontSize="10px" px={2} py={0.5} borderRadius="md" textTransform="capitalize">
                              <Flex align="center" gap={1}><Icon as={billIcon(bill.type)} boxSize={3} /> {bill.type}</Flex>
                            </Badge>
                          </Td>
                          <Td fontWeight="black" fontSize="sm" color={isOverdue ? "red.600" : textColor}>{fmt(bill.amount)}</Td>
                          <Td fontSize="xs" fontWeight="bold" color={isOverdue ? "red.500" : mutedText}>
                            {fmtDate(bill.due_date)}
                            {isOverdue && <Badge ml={2} colorScheme="red" fontSize="9px">OVERDUE</Badge>}
                          </Td>
                          <Td>
                            <Badge colorScheme={bill.status === "paid" ? "green" : "orange"} fontSize="10px" textTransform="uppercase">{bill.status}</Badge>
                          </Td>
                          <Td fontSize="xs" color={mutedText} maxW="200px" noOfLines={1}>{bill.description || "—"}</Td>
                          <Td py={3}>
                            {bill.status === "unpaid" ? (
                              <Button
                                size="xs"
                                colorScheme={isOverdue ? "red" : "blue"}
                                borderRadius="lg"
                                fontWeight="black"
                                onClick={() => {
                                  setSelectedItems({ rent: false, utilities: [bill.id] });
                                  setQrString(null); setQrMd5(null); setPaymentConfirmed(false);
                                  onPayOpen();
                                }}
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
            {/* Selected Total Bar */}
            {selectedItems.utilities.length > 0 && (
              <Flex justify="space-between" align="center" px={4} py={3} borderTop="1px solid" borderColor={borderColor} bg={itemBg}>
                <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase">
                  Selected Total: <Text as="span" color="blue.500" fontSize="md">{fmt(unpaidBills.filter(b => selectedItems.utilities.includes(b.id)).reduce((s, b) => s + Number(b.amount), 0))}</Text>
                </Text>
                <Button size="sm" colorScheme="blue" borderRadius="xl" fontWeight="black" onClick={() => {
                  setSelectedItems(prev => ({ ...prev, rent: false }));
                  setQrString(null); setQrMd5(null); setPaymentConfirmed(false);
                  onPayOpen();
                }}>
                  Pay with Bakong →
                </Button>
              </Flex>
            )}
          </Box>

          {/* ─── Recent Transactions & History ─── */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden" shadow="sm">
              <Flex justify="space-between" align="center" px={4} py={3} borderBottom="1px solid" borderColor={borderColor} bg={tableHBg}>
                <Heading size="sm" textTransform="uppercase" letterSpacing="wider" color={textColor}>Recent Transactions</Heading>
                <Button size="xs" variant="link" colorScheme="blue" rightIcon={<FiArrowRight />} onClick={onTxOpen}>View All</Button>
              </Flex>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Tbody>
                    {recentPayments.length === 0 ? (
                      <Tr><Td colSpan={3} textAlign="center" py={8} color={mutedText} borderBottom="none">No recent payments found.</Td></Tr>
                    ) : (
                      recentPayments.map(payment => (
                        <Tr key={payment.id} _hover={{ bg: tableHBg }}>
                          <Td py={2.5}>
                            <Badge colorScheme="purple" fontSize="10px" px={2} py={0.5} borderRadius="md" mb={1}>{payment.type || "rent"}</Badge>
                            <Text fontSize="xs" color={mutedText}>{fmtDate(payment.payment_date)}</Text>
                          </Td>
                          <Td py={2.5}><Text fontSize="xs" color={textColor} noOfLines={1} maxW="150px">{payment.payment_method}</Text></Td>
                          <Td isNumeric py={2.5} fontWeight="black" color={textColor}>{fmt(payment.amount_paid)}</Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} p={5} shadow="sm" display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center" transition="all 0.2s" _hover={{ shadow: "md" }}>
              <Icon as={FiClock} boxSize={8} color="blue.400" mb={2} />
              <Heading size="sm" color={textColor} mb={1}>History & Statements</Heading>
              <Text color={mutedText} fontSize="xs" mb={4} maxW="280px">Access your complete ledger, utility history, invoices, and receipts.</Text>
              <Button size="md" colorScheme="blue" borderRadius="lg" fontWeight="bold" w={{ base: "full", sm: "auto" }} onClick={onTxOpen}>View Transactions</Button>
            </Box>
          </SimpleGrid>

          {/* ─── Past Leases ─── */}
          {pastLeases.length > 0 && (
            <Box mt={2}>
              <Button onClick={onPastToggle} variant="ghost" colorScheme="gray" size="sm" rightIcon={<FiArchive />} mb={2}>
                {isPastOpen ? "Hide Past Leases" : `View Past Leases (${pastLeases.length})`}
              </Button>
              <Collapse in={isPastOpen} animateOpacity>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {pastLeases.map(pl => (
                    <Box key={pl.id} bg={bg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor} opacity={0.8} transition="all 0.2s" _hover={{ opacity: 1, borderColor: "blue.300", shadow: "sm" }}>
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
            <Heading size="md" fontWeight="black" color={textColor}>Transaction History</Heading>
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
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={3}>Date</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={3}>Type</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={3}>Method</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={3}>Reference</Th>
                    <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={3} isNumeric>Amount</Th>
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
              <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase">
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
                <Text fontSize="9px" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color="whiteAlpha.600">Invoice</Text>
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
                  <Text fontSize="9px" fontWeight="black" color={mutedText} textTransform="uppercase" letterSpacing="widest" mb={3}>Line Items — Select to Pay</Text>

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
                        <Text fontSize="9px" fontWeight="black" color={mutedText} textTransform="uppercase" letterSpacing="widest">Utility Bills ({unpaidBills.length})</Text>
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

                {/* Totals — compact */}
                <Box px={5} py={3} borderTop="2px dashed" borderColor={borderColor} bg={itemBg}>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase">
                      Selected ({(selectedItems.rent ? 1 : 0) + selectedItems.utilities.length} item{(selectedItems.rent ? 1 : 0) + selectedItems.utilities.length !== 1 ? "s" : ""})
                    </Text>
                    <Heading size="lg" fontWeight="black" color="blue.500">{fmt(calculateSubtotal())}</Heading>
                  </Flex>
                  <Button
                    w="full" size="md" colorScheme="blue" borderRadius="lg" fontWeight="black"
                    isDisabled={calculateSubtotal() <= 0} isLoading={loadingQr}
                    onClick={generateBakongQr}
                    leftIcon={<Icon as={FiZap} />}
                  >
                    Pay {fmt(calculateSubtotal())} with Bakong
                  </Button>
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
            <ModalFooter borderTop="1px solid" borderColor={borderColor} py={3}>
              <Button w="full" variant="ghost" onClick={handleClosePayment} fontWeight="bold" size="sm" color={mutedText}>Close</Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
}
