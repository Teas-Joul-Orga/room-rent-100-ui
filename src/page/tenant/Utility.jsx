import React, { useState, useEffect, useRef } from "react";
import {
  HStack,
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Spinner,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Button,
  VStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { 
  FiFileText, FiZap, FiDroplet, FiTrash2, FiWifi, FiEye, 
  FiCheckCircle, FiInfo, FiCalendar, FiActivity, FiClock, FiAlertCircle 
} from "react-icons/fi";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";

const KHQR_LOGO = "https://api-bakong.nbc.gov.kh/images/khqr.png";
const BAKONG_LOGO_RED = "https://api-bakong.nbc.gov.kh/images/logo.png";

const API = "http://localhost:8000/api/v1/tenant";

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

export default function TenantUtility() {
  const { t } = useTranslation();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBill, setSelectedBill] = useState(null);
  const [qrString, setQrString] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const pollingRef = useRef(null);

  const fetchBills = async () => {
    try {
      const res = await fetch(`${API}/billing`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const allBills = (data.leases || []).flatMap(l => 
          (l.utility_bills || []).map(b => ({ ...b, room_name: l.room?.name }))
        );
        setBills(allBills);
      } else {
        toast.error("Failed to load utility bills");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const getBillIcon = (type) => {
    switch (type) {
      case 'electricity': return FiZap;
      case 'water': return FiDroplet;
      case 'internet': return FiWifi;
      case 'trash': return FiTrash2;
      default: return FiFileText;
    }
  };

  const getStatusBadge = (bill) => {
    if (bill.status === 'unpaid' && dayjs().isAfter(dayjs(bill.due_date), 'day')) return 'orange';
    switch (bill.status) {
      case 'paid': return 'green';
      case 'unpaid': return 'red';
      default: return 'gray';
    }
  };

  const generateQrForBill = async (bill) => {
    setLoadingQr(true);
    setPaymentConfirmed(false);
    try {
      const rate = localStorage.getItem("exchangeRate") || 4000;
      const amountKhr = Math.round(bill.amount * rate);

      const res = await fetch(`${API}/payment/bakong/generate-qr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          type: "utility",
          id: bill.id,
          currency: "KHR",
          amount: amountKhr
        })
      });
      const data = await res.json();
      console.log(data);
      if (res.ok && data.status === "success") {
        setQrString(data.data.qrString);
        const md5 = data.data.md5;
        if (md5) {
          setQrMd5(md5);
          startPolling(md5, bill);
        }
      } else {
        toast.error(data.message || "Failed to generate QR Code");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleGenerateQr = () => generateQrForBill(selectedBill);

  const startPolling = (md5, bill) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/payment/bakong/check-transaction`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ md5, bill_id: bill.id, type: "utility" })
        });
        const data = await res.json();
        if (res.ok && data.status === "success" && data.paid === true) {
          clearInterval(pollingRef.current);
          setPaymentConfirmed(true);
          toast.success("🎉 Payment Successful! Your bill has been paid.", { duration: 6000 });
          fetchBills();
          // Auto-close modal after 3s so user sees the success animation
          setTimeout(() => {
            handleClose();
          }, 3000);
        }
      } catch (_) {}
    }, 5000);
  };

  const handleOpenBill = (bill) => {
    setSelectedBill(bill);
    setQrString(null);
    setQrMd5(null);
    setPaymentConfirmed(false);
    if (pollingRef.current) clearInterval(pollingRef.current);
    onOpen();
    if (bill.status === 'unpaid') {
      generateQrForBill(bill);
    }
  };

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setQrString(null);
    setQrMd5(null);
    onClose();
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  const unpaidTotal = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + Number(b.amount), 0);
  const unpaidCount = bills.filter(b => b.status === 'unpaid').length;

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Toaster position="top-right" />
      <Flex justify="space-between" align="center" mb={10} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" letterSpacing="tight" color={textColor}>
            {t("utility.title")}
          </Heading>
          <Text fontSize="sm" color={mutedText} mt={1}>
            Track and pay your property utility statements
          </Text>
        </Box>
        
        {unpaidTotal > 0 && (
          <Box bg="red.50" border="1px solid" borderColor="red.100" p={4} borderRadius="xl" textAlign="right">
            <Text fontSize="10px" fontWeight="black" color="red.400" textTransform="uppercase" letterSpacing="widest">
              Total Outstanding
            </Text>
            <Heading size="md" color="red.600" fontWeight="black">
              {fmt(unpaidTotal)}
            </Heading>
            <Text fontSize="10px" color="red.400" fontWeight="bold">
              {unpaidCount} Unpaid Bill(s)
            </Text>
          </Box>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={10}>
        {bills.length === 0 ? (
          <Box gridColumn="1 / -1" textAlign="center" py={20}>
            <Icon as={FiFileText} boxSize={12} color="gray.300" mb={4} />
            <Heading size="md" color={mutedText}>No utility bills recorded.</Heading>
            <Text color={mutedText} mt={2}>Your property manager has not issued any bills yet.</Text>
          </Box>
        ) : (
          [...bills].sort((a,b) => dayjs(b.due_date).diff(dayjs(a.due_date))).map((bill) => {
            const isOverdue = bill.status === 'unpaid' && dayjs().isAfter(dayjs(bill.due_date), 'day');
            const overdueDays = isOverdue ? dayjs().diff(dayjs(bill.due_date), 'day') : 0;

            return (
              <Box 
                key={bill.id} 
                bg={bg} 
                p={6} 
                borderRadius="2xl" 
                borderWidth={isOverdue ? "2px" : "1px"} 
                borderStyle="solid"
                borderColor={isOverdue ? "red.400" : borderColor} 
                shadow={isOverdue ? "0 0 20px -5px rgba(229, 62, 62, 0.2)" : "sm"}
                _hover={{ 
                  shadow: isOverdue ? "0 0 25px -3px rgba(229, 62, 62, 0.3)" : 'md', 
                  transform: 'translateY(-2px)' 
                }}
                transition="all 0.2s"
                position="relative"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                minH="350px"
              >
              <Icon 
                as={getBillIcon(bill.type)} 
                position="absolute" 
                top="-4" 
                right="-4" 
                boxSize={24} 
                opacity={0.03} 
                pointerEvents="none" 
              />

              <Flex justify="space-between" align="start" mb={4}>
                <Flex align="center" gap={3}>
                  <Flex 
                    h={10} w={10} 
                    bg={useColorModeValue("blue.50", "blue.900")} 
                    color="blue.500" 
                    borderRadius="lg" 
                    align="center" 
                    justify="center"
                  >
                    <Icon as={getBillIcon(bill.type)} boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase">
                      {t(`utility.${bill.type}`)}
                    </Text>
                    <Text fontSize="xs" color={mutedText} fontWeight="bold">
                      {dayjs(bill.due_date).format('MMMM YYYY')}
                    </Text>
                  </Box>
                </Flex>
                <VStack align="flex-end" spacing={1}>
                  <Badge 
                    colorScheme={getStatusBadge(bill)} 
                    variant="solid" 
                    fontSize="10px" 
                    borderRadius="md"
                    animation={isOverdue ? "pulse 2s infinite" : "none"}
                  >
                    {isOverdue ? t("utility.past_due") : t(`utility.${bill.status}`)}
                  </Badge>
                  {isOverdue && (
                    <Text fontSize="2xs" color="red.500" fontWeight="black" textTransform="uppercase">
                      {t("utility.days_overdue", { count: overdueDays })}
                    </Text>
                  )}
                </VStack>
              </Flex>

              <Divider mb={4} />

              <VStack align="stretch" spacing={3} mb={6}>
                {bill.previous_reading !== null && (
                  <Flex justify="space-between" fontSize="xs">
                    <Text color={mutedText}>Readings</Text>
                    <Text fontWeight="bold" color={textColor}>{bill.previous_reading} → {bill.current_reading}</Text>
                  </Flex>
                )}
                <Flex justify="space-between" fontSize="sm">
                  <Text color={mutedText} fontWeight="medium">Due Date</Text>
                  <Text fontWeight="bold" color={textColor}>{fmtDate(bill.due_date)}</Text>
                </Flex>
                <Flex justify="space-between" align="flex-end" pt={2}>
                  <Text color={mutedText} fontSize="xs" fontWeight="black" textTransform="uppercase">Total Amount</Text>
                  <Text fontSize="xl" fontWeight="black" color={bill.status === 'unpaid' ? "red.500" : "green.500"}>
                    {fmt(bill.amount)}
                  </Text>
                </Flex>
                {bill.status === 'paid' && bill.payments?.[0] && (
                  <Flex justify="space-between" fontSize="10px" mt={1} pt={1} borderTop="1px dashed" borderColor="green.100">
                    <Text color="green.500" fontWeight="bold">{t("utility.paid_on")}</Text>
                    <Text color="green.600" fontWeight="black">
                      {dayjs(bill.payments[0].created_at || bill.payments[0].payment_date).format('MMM D, YYYY | h:mm A')}
                    </Text>
                  </Flex>
                )}
              </VStack>

              <Box mt="auto">
                <Button 
                  w="full" 
                  size="sm" 
                  colorScheme={bill.status === 'unpaid' ? "blue" : "gray"} 
                  variant={bill.status === 'unpaid' ? "solid" : "outline"}
                  leftIcon={<FiEye />}
                  onClick={() => handleOpenBill(bill)}
                >
                  {t("common.view_detail")}
                </Button>
              </Box>
            </Box>
          );
        })
      )}
    </SimpleGrid>

      {/* View Detail Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent borderRadius="2xl" bg={bg} overflow="hidden">
          <ModalHeader py={6} borderBottom="1px solid" borderColor={borderColor}>
            <Flex align="center" gap={3}>
              <Box p={2} bg="blue.500" color="white" borderRadius="lg">
                <Icon as={selectedBill ? getBillIcon(selectedBill.type) : FiFileText} />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>
                  {selectedBill ? t(`utility.${selectedBill.type}`) : t("utility.details")} {t("utility.details")}
                </Text>
                <Text fontSize="xs" color={mutedText} fontWeight="bold">
                  {selectedBill ? dayjs(selectedBill.due_date).format('MMMM YYYY') : ""}
                </Text>
              </Box>
            </Flex>
          </ModalHeader>
          <ModalCloseButton mt={2} />
          
          <ModalBody py={8}>
            {selectedBill && (
              <VStack align="stretch" spacing={6}>
                {/* Status & Amount */}
                <Flex justify="space-between" align="center" p={4} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="xl">
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" mb={1}>{t("utility.status")}</Text>
                    <Badge colorScheme={getStatusBadge(selectedBill.status)} variant="solid" px={3} py={1} borderRadius="full">
                      {t(`utility.${selectedBill.status}`)}
                    </Badge>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" mb={1}>{t("utility.amount")}</Text>
                    <Heading size="lg" fontWeight="black" color={selectedBill.status === 'unpaid' ? "red.500" : "green.500"}>
                      {fmt(selectedBill.amount)}
                    </Heading>
                  </Box>
                </Flex>

                {/* Usage Detail */}
                {(selectedBill.previous_reading !== null || selectedBill.usage) && (
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" mb={3} letterSpacing="wider">
                      {t("utility.consumption_details")}
                    </Text>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box p={3} border="1px" borderColor={borderColor} borderRadius="lg">
                        <Text fontSize="2xs" fontWeight="bold" color={mutedText} mb={1}>{t("utility.previous_reading")}</Text>
                        <Text fontWeight="bold" color={textColor}>{selectedBill.previous_reading || 0}</Text>
                      </Box>
                      <Box p={3} border="1px" borderColor={borderColor} borderRadius="lg">
                        <Text fontSize="2xs" fontWeight="bold" color={mutedText} mb={1}>{t("utility.current_reading")}</Text>
                        <Text fontWeight="bold" color={textColor}>{selectedBill.current_reading || 0}</Text>
                      </Box>
                      <Box p={3} border="1px" borderColor={borderColor} borderRadius="lg" bg="blue.50">
                        <Text fontSize="2xs" fontWeight="bold" color="blue.500" mb={1}>{t("utility.total_usage")}</Text>
                        <Text fontWeight="black" color="blue.600">
                          {selectedBill.usage || (selectedBill.current_reading - selectedBill.previous_reading).toFixed(2)} {t("utility.units")}
                        </Text>
                      </Box>
                      <Box p={3} border="1px" borderColor={borderColor} borderRadius="lg">
                        <Text fontSize="2xs" fontWeight="bold" color={mutedText} mb={1}>{t("utility.rate")}</Text>
                        <Text fontWeight="bold" color={textColor}>
                          {selectedBill.cost_per_unit ? fmt(selectedBill.cost_per_unit) : 'N/A'} / {t("utility.units")}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>
                )}

                {/* Dates */}
                <Box>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" mb={3} letterSpacing="wider">
                    {t("utility.timeline")}
                  </Text>
                  <SimpleGrid columns={2} spacing={4}>
                    <Flex align="center" gap={3}>
                      <Icon as={FiCalendar} color="blue.500" />
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color={mutedText}>{t("utility.issued_date")}</Text>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>{dayjs(selectedBill.created_at).format('MMM D, YYYY')}</Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Icon as={FiClock} color="orange.500" />
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color={mutedText}>{t("utility.due_date")}</Text>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(selectedBill.due_date)}</Text>
                      </Box>
                    </Flex>
                  </SimpleGrid>
                </Box>

                {/* Notes */}
                {selectedBill.description && (
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" mb={2} letterSpacing="wider">
                      {t("utility.remarks")}
                    </Text>
                    <Text fontSize="sm" color={textColor} fontStyle="italic" p={3} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="lg">
                      "{selectedBill.description}"
                    </Text>
                  </Box>
                )}

                {/* Payment History */}
                {selectedBill.payments && selectedBill.payments.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color={mutedText} textTransform="uppercase" mb={3} letterSpacing="wider">
                      {t("utility.payment_records")}
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {selectedBill.payments.map((p, i) => (
                        <Flex key={i} p={3} border="1px" borderColor="green.100" borderRadius="lg" bg="green.50" justify="space-between" align="center">
                          <Flex align="center" gap={2}>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="green.700">{t("utility.paid_via", { method: p.payment_method })}</Text>
                              <Text fontSize="2xs" color="green.600">{dayjs(p.created_at || p.payment_date).format('MMM D, YYYY h:mm A')}</Text>
                            </Box>
                          </Flex>
                          <Text fontWeight="black" color="green.700">{fmt(p.amount_paid)}</Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Bakong KHQR Payment Section */}
                {selectedBill.status === 'unpaid' && (
                  <Box 
                    mt={4} 
                    p={0} 
                    borderRadius="2xl" 
                    overflow="hidden"
                    border="2px solid"
                    borderColor={paymentConfirmed ? "green.400" : qrString ? "blue.300" : "red.200"}
                    transition="all 0.5s ease"
                    shadow={qrString && !paymentConfirmed ? "0 0 30px -5px rgba(66,153,225,0.4)" : paymentConfirmed ? "0 0 30px -5px rgba(72,187,120,0.5)" : "none"}
                  >
                    {paymentConfirmed ? (
                      /* ═══ SUCCESS STATE ═══ */
                      <Box 
                        bgGradient="linear(to-br, green.400, green.600, teal.500)" 
                        p={10} 
                        textAlign="center" 
                        position="relative"
                        overflow="hidden"
                      >
                        {/* Confetti dots */}
                        {[...Array(12)].map((_, i) => (
                          <Box
                            key={i}
                            position="absolute"
                            w={`${6 + Math.random() * 8}px`}
                            h={`${6 + Math.random() * 8}px`}
                            borderRadius="full"
                            bg={["yellow.300", "pink.300", "cyan.200", "orange.300", "purple.300"][i % 5]}
                            top={`${Math.random() * 100}%`}
                            left={`${Math.random() * 100}%`}
                            opacity={0.7}
                            animation={`confettiFall ${1.5 + Math.random() * 2}s ease-in-out infinite`}
                            style={{ animationDelay: `${Math.random() * 2}s` }}
                          />
                        ))}

                        <Box animation="successBounce 0.6s ease-out">
                          <Flex 
                            w={20} h={20} 
                            mx="auto" 
                            mb={4} 
                            bg="whiteAlpha.300" 
                            borderRadius="full" 
                            align="center" 
                            justify="center"
                            shadow="0 0 40px rgba(255,255,255,0.3)"
                          >
                            <Icon as={FiCheckCircle} boxSize={10} color="white" />
                          </Flex>
                          <Heading size="lg" color="white" mb={2}>Payment Received!</Heading>
                          <Text fontSize="md" color="whiteAlpha.900" fontWeight="semibold">
                            {fmt(selectedBill.amount)} paid successfully
                          </Text>
                          <Text fontSize="xs" color="whiteAlpha.700" mt={2}>
                            Your bill has been automatically marked as paid
                          </Text>
                        </Box>

                        <Badge 
                          mt={6} 
                          bg="whiteAlpha.200" 
                          color="white" 
                          px={4} py={2} 
                          borderRadius="full" 
                          fontSize="xs" 
                          fontWeight="black"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          ✓ Transaction Confirmed
                        </Badge>
                      </Box>
                    ) : (
                      <>
                        {/* ═══ HEADER BAR ═══ */}
                        <Box bg={qrString ? "blue.500" : "red.500"} px={5} py={3} transition="background 0.4s">
                          <Flex align="center" justify="space-between">
                            <HStack spacing={2}>
                              <Icon as={FiZap} color="white" />
                              <Text fontSize="sm" fontWeight="black" color="white" textTransform="uppercase" letterSpacing="wider">
                                {qrString ? "Scan & Pay" : "Bakong KHQR"}
                              </Text>
                            </HStack>
                            <Badge bg="whiteAlpha.200" color="white" fontSize="10px" fontWeight="bold" px={3} py={1} borderRadius="full">
                              {fmt(selectedBill.amount)}
                            </Badge>
                          </Flex>
                        </Box>

                        <Box p={6} bg={useColorModeValue("gray.50", "whiteAlpha.50")} textAlign="center">
                          {loadingQr ? (
                            /* ═══ LOADING STATE ═══ */
                            <VStack spacing={4} py={8}>
                              <Box position="relative">
                                <Spinner size="xl" color="blue.500" thickness="4px" speed="0.8s" />
                                <Box position="absolute" inset={0} borderRadius="full" animation="qrGlow 2s ease-in-out infinite" />
                              </Box>
                              <VStack spacing={1}>
                                <Text fontSize="sm" fontWeight="bold" color={textColor}>Generating Secure QR Code</Text>
                                <Text fontSize="xs" color={mutedText}>Connecting to Bakong gateway...</Text>
                              </VStack>
                            </VStack>
                          ) : qrString ? (
                            /* ═══ QR DISPLAYED + POLLING STATE ═══ */
                            <VStack spacing={5}>
                              {/* ═══ Branded KHQR Template ═══ */}
                              <Box 
                                w="320px" 
                                bg="white" 
                                borderRadius="2xl" 
                                overflow="hidden" 
                                shadow="2xl" 
                                border="1px solid" 
                                borderColor="gray.200"
                                animation="qrGlow 3s ease-in-out infinite"
                              >
                                {/* KHQR Header */}
                                <Box bg="#005EAA" p={4}>
                                  <Flex align="center" justify="space-between">
                                    <Image src={KHQR_LOGO} h="24px" alt="KHQR" fallback={<Text color="white" fontWeight="black">KHQR</Text>} />
                                    <Text fontSize="10px" fontWeight="black" color="whiteAlpha.800" textTransform="uppercase">Scan to Pay</Text>
                                  </Flex>
                                </Box>

                                {/* QR Code Area with Bakong Center Logo */}
                                <Box p={4} bg="white" position="relative">
                                  <Flex justify="center" align="center" py={2}>
                                    <QRCodeCanvas 
                                      value={qrString} 
                                      size={240} 
                                      level="H" 
                                      includeMargin={false}
                                      imageSettings={{
                                        src: BAKONG_LOGO_RED,
                                        x: undefined,
                                        y: undefined,
                                        height: 44,
                                        width: 44,
                                        excavate: true,
                                      }}
                                    />
                                  </Flex>
                                </Box>

                                {/* Merchant Info Footer */}
                                <Box px={5} pb={5} pt={2} textAlign="center">
                                  <VStack spacing={0}>
                                    <Text fontSize="md" fontWeight="black" color="gray.800">PHEAK SIEVTHAI</Text>
                                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                      {selectedBill.currency === "KHR" ? `${Number(selectedBill.amount * (localStorage.getItem("exchangeRate") || 4000)).toLocaleString()} KHR` : `$${Number(selectedBill.amount).toFixed(2)}`}
                                    </Text>
                                  </VStack>
                                  <Divider my={3} />
                                  <Text fontSize="9px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="widest">
                                    Powered by Bakong
                                  </Text>
                                </Box>
                              </Box>

                              {/* Step Progress Tracker */}
                              <Box w="full" px={2}>
                                <Flex justify="space-between" align="center" position="relative">
                                  <Box position="absolute" top="14px" left="15%" right="15%" h="3px" bg={useColorModeValue("gray.200", "gray.600")} borderRadius="full">
                                    <Box h="full" bg="blue.400" borderRadius="full" w="33%" transition="width 0.5s" />
                                  </Box>
                                  <VStack spacing={1} zIndex={1}>
                                    <Flex w={7} h={7} borderRadius="full" bg="blue.500" align="center" justify="center" shadow="sm">
                                      <Icon as={FiCheckCircle} color="white" boxSize={3.5} />
                                    </Flex>
                                    <Text fontSize="9px" fontWeight="black" color="blue.600" textTransform="uppercase">Generated</Text>
                                  </VStack>
                                  <VStack spacing={1} zIndex={1}>
                                    <Flex w={7} h={7} borderRadius="full" bg="orange.400" align="center" justify="center" animation="stepPulse 2s ease-in-out infinite" shadow="0 0 12px rgba(237,137,54,0.5)">
                                      <Spinner size="xs" color="white" speed="1.2s" />
                                    </Flex>
                                    <Text fontSize="9px" fontWeight="black" color="orange.500" textTransform="uppercase">Awaiting</Text>
                                  </VStack>
                                  <VStack spacing={1} zIndex={1}>
                                    <Flex w={7} h={7} borderRadius="full" bg={useColorModeValue("gray.200", "gray.600")} align="center" justify="center">
                                      <Icon as={FiCheckCircle} color={useColorModeValue("gray.400", "gray.500")} boxSize={3.5} />
                                    </Flex>
                                    <Text fontSize="9px" fontWeight="bold" color={mutedText} textTransform="uppercase">Confirmed</Text>
                                  </VStack>
                                </Flex>
                              </Box>

                              <Box w="full" p={3} bg={useColorModeValue("blue.50", "blue.900")} borderRadius="lg" border="1px solid" borderColor={useColorModeValue("blue.100", "blue.700")}>
                                <HStack justify="center" spacing={3}>
                                  <Box position="relative" w={4} h={4}>
                                    <Box position="absolute" inset={0} borderRadius="full" bg="green.400" animation="liveDot 2s ease-in-out infinite" />
                                    <Box w={2} h={2} borderRadius="full" bg="green.500" position="absolute" top="4px" left="4px" />
                                  </Box>
                                  <Text fontSize="xs" fontWeight="bold" color={useColorModeValue("blue.700", "blue.200")}>Listening for payment — auto-confirms when received</Text>
                                </HStack>
                              </Box>

                              <Divider />
                              <Button colorScheme="blue" size="sm" variant="ghost" onClick={handleGenerateQr} isLoading={loadingQr} fontSize="xs">
                                ↻ Regenerate QR Code
                              </Button>
                            </VStack>
                          ) : (
                            /* ═══ FALLBACK: GENERATE BUTTON ═══ */
                            <VStack spacing={3} py={4}>
                              <Icon as={FiZap} boxSize={8} color="red.400" />
                              <Text fontSize="sm" fontWeight="bold" color={textColor}>Ready to Pay?</Text>
                              <Button colorScheme="red" onClick={handleGenerateQr} leftIcon={<FiZap />} size="lg" w="full" borderRadius="xl">
                                Generate QR — {fmt(selectedBill.amount)}
                              </Button>
                            </VStack>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter py={6} borderTop="1px solid" borderColor={borderColor}>
            <Button w="full" onClick={handleClose} fontWeight="black" textTransform="uppercase" letterSpacing="widest" fontSize="xs">
              {t("utility.close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

const paymentKeyframes = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes qrGlow {
  0%, 100% { box-shadow: 0 0 15px -3px rgba(66,153,225,0.3); }
  50% { box-shadow: 0 0 30px -3px rgba(66,153,225,0.6); }
}
@keyframes stepPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@keyframes liveDot {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.8); opacity: 0; }
}
@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
  50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
  100% { transform: translateY(0) rotate(360deg); opacity: 0.7; }
}
@keyframes successBounce {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = paymentKeyframes;
  document.head.appendChild(style);
}
