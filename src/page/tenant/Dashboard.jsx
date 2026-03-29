import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box, Grid, GridItem, Flex, Text, Heading, Icon, useColorModeValue, useColorMode,
  VStack, HStack, Spinner, Button, Badge, Avatar, Progress, SimpleGrid,
  Table, Tbody, Tr, Td, TableContainer, Divider, Center,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  useDisclosure, Checkbox, Image
} from "@chakra-ui/react";
import {
  LuReceipt, LuWrench, LuDoorOpen
} from "react-icons/lu";
import {
  FiMessageSquare, FiBell, FiUser, FiZap, FiDroplet, FiCalendar, 
  FiArrowRight, FiCheckCircle, FiInfo, FiFileText
} from "react-icons/fi";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../../api/axios";
import { QRCodeCanvas } from "qrcode.react";
import toast, { Toaster } from "react-hot-toast";

dayjs.extend(relativeTime);

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
const KHQR_LOGO = "https://api-bakong.nbc.gov.kh/images/khqr.png";
const BAKONG_LOGO_RED = "https://api-bakong.nbc.gov.kh/images/logo.png";

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Payment States
  const [selectedItems, setSelectedItems] = useState({ rent: true, utilities: [] });
  const [qrString, setQrString] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const pollingRef = useRef(null);

  // Aesthetic Colors
  const bg = useColorModeValue("gray.25", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const textColor = useColorModeValue("gray.900", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const annItemBg = useColorModeValue("gray.50", "#21262d");
  const docHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const roadmapTextColor = useColorModeValue("gray.900", "white");
  const roadmapMutedText = useColorModeValue("gray.500", "gray.400");
  const actionCardBg = useColorModeValue("white", "#161b22");
  const actionCardBorder = useColorModeValue("gray.100", "#30363d");

  // Cached localization parsing
  const currencySettings = useMemo(() => {
    const rateItem = localStorage.getItem("exchangeRate");
    return {
      c: localStorage.getItem("currency") || "$",
      r: rateItem ? Number(rateItem) : 4000
    };
  }, []);

  const fmt = React.useCallback((n) => {
    const num = Number(n || 0);
    if (currencySettings.c === "៛" || currencySettings.c === "KHR" || currencySettings.c === "Riel") {
      return "៛" + (num * currencySettings.r).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currencySettings]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tenant/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("API error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRent = () => {
    setSelectedItems(prev => ({ ...prev, rent: !prev.rent }));
  };

  const handleToggleUtility = (id) => {
    setSelectedItems(prev => {
      const utilities = prev.utilities.includes(id)
        ? prev.utilities.filter(i => i !== id)
        : [...prev.utilities, id];
      return { ...prev, utilities };
    });
  };

  const calculateSubtotal = () => {
    let total = 0;
    if (selectedItems.rent && data?.lease?.rent_amount) {
      total += Number(data.lease.rent_amount);
    }
    const unpaidBills = data?.lease?.utility_bills?.filter(b => b.status === "unpaid") || [];
    unpaidBills.forEach(b => {
      if (selectedItems.utilities.includes(b.id)) {
        total += Number(b.amount);
      }
    });
    return total;
  };

  const generateBakongQr = async () => {
    setLoadingQr(true);
    setPaymentConfirmed(false);
    try {
      const res = await api.post("/tenant/payment/bakong/generate-qr", {
        type: "bundle",
        id: data.lease.id,
        rent: selectedItems.rent,
        utility_ids: selectedItems.utilities
      });
      
      const resData = res.data;
      if (resData.status === "success") {
        setQrString(resData.data.qrString);
        setQrMd5(resData.data.md5);
        startPolling(resData.data.md5);
      }
    } catch (err) {
      console.error("QR Generation failed", err);
    } finally {
      setLoadingQr(false);
    }
  };

  const startPolling = (md5) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.post("/tenant/payment/bakong/check-transaction", { md5 });
        if (res.data.status === "success" && res.data.paid === true) {
          clearInterval(pollingRef.current);
          setPaymentConfirmed(true);
          toast.success("🎉 Payment Successful! Balance updated.", { duration: 6000 });
          setTimeout(() => {
            fetchDashboardData();
            handleClosePayment();
          }, 3000);
        }
      } catch (_) {}
    }, 5000);
  };

  const handleOpenPayment = () => {
    const unpaidBills = data?.lease?.utility_bills?.filter(b => b.status === "unpaid") || [];
    setSelectedItems({ rent: true, utilities: unpaidBills.map(b => b.id) });
    setQrString(null);
    setQrMd5(null);
    setPaymentConfirmed(false);
    onOpen();
  };

  const handleClosePayment = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    onClose();
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Center>
    );
  }

  if (!data) return <Center h="70vh"><Text color="red.400">Error loading your portal. Please try again.</Text></Center>;

  const { lease, stats, recent_requests, recent_payments, tenant, utilityTrends, announcements } = data;
  const totalDue = stats?.total_due || 0;
  
  // Chart Data Preparation
  const billBreakdownData = lease?.utility_bills?.filter(b => b.status === "unpaid").map(b => ({
    name: b.type, value: Number(b.amount)
  })) || [];

  const consumptionData = utilityTrends?.months?.map((m, i) => ({
    month: m,
    electric: utilityTrends.electric[i] || 0,
    water: utilityTrends.water[i] || 0
  })) || [];

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      
      {/* Header & Resident Profile Card */}
      <Flex direction={{ base: "column", lg: "row" }} gap={8} mb={10}>
        
        {/* Profile Glass Card */}
        <MotionBox 
          flex="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          p={8} borderRadius="3xl" position="relative" overflow="hidden" boxShadow="2xl"
          bgGradient="linear(to-br, blue.600, purple.700)" color="white"
        >
          <Flex direction={{ base: "column", sm: "row" }} align="center" gap={8} position="relative" zIndex={2}>
            <Avatar size="2xl" name={tenant?.name} src={tenant?.profile_image} border="4px solid rgba(255,255,255,0.2)" />
            <Box textAlign={{ base: "center", sm: "left" }}>
              <Badge colorScheme="whiteAlpha" mb={2} px={3} py={1} rounded="full">ACTIVE RESIDENT</Badge>
              <Heading size="xl" fontWeight="900" mb={1}>{tenant?.name}</Heading>
              <HStack spacing={4} opacity={0.9} justify={{ base: "center", sm: "flex-start" }}>
                <HStack><Icon as={LuDoorOpen} /><Text fontSize="sm" fontWeight="800">{lease?.room?.name || "No Unit Assigned"}</Text></HStack>
                <HStack><Icon as={FiCalendar} /><Text fontSize="sm" fontWeight="800">Ends {dayjs(lease?.end_date).format('MMM D, YYYY')}</Text></HStack>
              </HStack>
              <Button size="sm" mt={6} variant="outline" colorScheme="whiteAlpha" rounded="full" leftIcon={<FiUser />} onClick={() => navigate("/dashboard/profile")}>
                View Profile
              </Button>
            </Box>
          </Flex>
          {/* Decorative Elements */}
          <Box position="absolute" top="-10" right="-10" w="60" h="60" bg="white" opacity={0.05} borderRadius="full" />
          <Box position="absolute" bottom="-20" left="10%" w="80" h="80" bg="purple.400" opacity={0.1} borderRadius="full" filter="blur(60px)" />
        </MotionBox>

        {/* Financial Snapshot Card */}
        <MotionBox 
          flex="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="xl"
          display="flex" flexDirection="column" justify="space-between"
        >
          <Box>
            <Text fontSize="xs" fontWeight="900" color={mutedText} textTransform="uppercase" letterSpacing="widest" mb={1}>Current Balance</Text>
            <Heading size="2xl" fontWeight="900" color={totalDue > 0 ? "red.500" : "emerald.500"}>
              {fmt(totalDue)}
            </Heading>
            <Text fontSize="sm" color={mutedText} fontWeight="700" mt={2}>
              {totalDue > 0 ? `${stats.unpaid_bills_count} bills pending payment` : "Fantastic! You're all settled."}
            </Text>
          </Box>
          <Button 
            mt={8} size="lg" colorScheme={totalDue > 0 ? "red" : "emerald"} rounded="2xl" w="full" shadow="lg"
            onClick={totalDue > 0 ? handleOpenPayment : () => navigate("/dashboard/utility")}
          >
            {totalDue > 0 ? "PAY SELECTED" : "BILLING HISTORY"}
          </Button>
        </MotionBox>
      </Flex>

      {/* Action Row */}
      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={10}>
        {[
          { label: "Pay Rent", icon: LuReceipt, color: "blue", link: "/dashboard/utility" },
          { label: "Fix Request", icon: LuWrench, color: "orange", link: "/dashboard/maintenance" },
          { label: "Messenger", icon: FiMessageSquare, color: "purple", link: "/dashboard/chat" },
          { label: "My Lease", icon: FiInfo, color: "teal", link: "/dashboard/lease/my-lease" },
          { label: "Updates", icon: FiBell, color: "pink", link: "/dashboard/notifications" },
        ].map((act, i) => (
          <ActionCard key={i} {...act} delay={i * 0.05} />
        ))}
      </SimpleGrid>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1.8fr 1.2fr" }} gap={8}>
        
        {/* Left Column: Analytics */}
        <Box>
          
          {/* Consumption Trends */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="md" mb={8}>
            <Flex justify="space-between" align="center" mb={10}>
              <Box>
                <Text fontWeight="900" fontSize="xs" color={mutedText} textTransform="uppercase" letterSpacing="widest">Usage Insights</Text>
                <Heading size="md" fontWeight="900">Utility Consumption</Heading>
              </Box>
              <HStack spacing={4}>
                <HStack><Box w="3" h="3" rounded="full" bg="blue.400" /><Text fontSize="xs" fontWeight="800">Electric</Text></HStack>
                <HStack><Box w="3" h="3" rounded="full" bg="cyan.400" /><Text fontSize="xs" fontWeight="800">Water</Text></HStack>
              </HStack>
            </Flex>
            <Box h="300px" minWidth={0}>
              {consumptionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                    <XAxis dataKey="month" tick={{fontSize: 10, fill: mutedText}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: mutedText}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '15px', border: 'none', shadow: 'xl', background: cardBg }} />
                    <Bar dataKey="electric" fill="#3182ce" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="water" fill="#0bc5ea" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Center h="full"><Text fontSize="sm" color={mutedText}>No usage data yet.</Text></Center>
              )}
            </Box>
          </Box>

          {/* Billboard / Announcements */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="md">
            <Text fontWeight="900" fontSize="xs" color={mutedText} textTransform="uppercase" letterSpacing="widest" mb={6}>Community Hub</Text>
            <VStack spacing={6} align="stretch">
               {announcements?.slice(0, 3).map((anc, i) => (
                 <Flex key={i} gap={4} p={6} bg={annItemBg} borderRadius="2xl" border="1px" borderColor={borderColor}>
                    <Center w="12" h="12" bg="brand.50" color="brand.600" rounded="xl" flexShrink={0}>
                       <Icon as={FiBell} boxSize={5} />
                    </Center>
                    <Box>
                       <Text fontSize="sm" fontWeight="900" mb={1}>{anc.title}</Text>
                       <Text fontSize="xs" color={mutedText} mb={3} noOfLines={2}>{anc.content}</Text>
                       <Text fontSize="10px" fontWeight="900" color="brand.500">{dayjs(anc.created_at).fromNow()}</Text>
                    </Box>
                 </Flex>
               ))}
               {!announcements?.length && <Text fontSize="sm" color={mutedText} textAlign="center">No community news at the moment.</Text>}
            </VStack>
          </Box>

        </Box>

        {/* Right Column: Next Steps & Breakdown */}
        <Box>
          
          {/* Next Steps Guide */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="md" mb={8}>
            <Heading size="sm" fontWeight="900" mb={8}>Resident Roadmap</Heading>
            <VStack spacing={8} align="stretch" position="relative">
               <Box position="absolute" left="15px" top="10px" bottom="10px" w="2px" bg={borderColor} />
               <StepItem title="Monthly Rent" desc="Payment due by the 5th" active icon={FiZap} color="orange" />
               <StepItem title="Utility Reading" desc="Recorded on 1st of month" active icon={FiDroplet} color="blue" />
               <StepItem title="Lease Check" desc="Ends in 120 days" icon={FiCheckCircle} color="green" />
            </VStack>
          </Box>

          {/* Unpaid Breakdown Pie */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="md" mb={8}>
            <Heading size="sm" fontWeight="900" mb={6}>Balance Breakdown</Heading>
            <Box h="250px" mb={6} minWidth={0}>
              {billBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={billBreakdownData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                      {billBreakdownData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '15px', border: 'none', shadow: 'xl', background: cardBg }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <Center h="full" flexDir="column" gap={2}>
                   <Icon as={FiCheckCircle} boxSize={8} color="emerald.500" />
                   <Text fontSize="sm" fontWeight="800" color="emerald.500">All cleared!</Text>
                </Center>
              )}
            </Box>
            <VStack spacing={2} align="stretch">
               {billBreakdownData.map((b, i) => (
                 <Flex key={i} justify="space-between" align="center" fontSize="xs" fontWeight="700">
                    <HStack><Box w="2" h="2" rounded="full" bg={COLORS[i % COLORS.length]} /><Text color={mutedText}>{b.name}</Text></HStack>
                    <Text>{fmt(b.value)}</Text>
                 </Flex>
               ))}
            </VStack>
          </Box>

          {/* My Documents Section */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="md">
            <Text fontWeight="900" fontSize="xs" color={mutedText} textTransform="uppercase" letterSpacing="widest" mb={6}>My Documents</Text>
            <VStack spacing={4} align="stretch">
               {[
                 { name: "Lease Agreement", size: "2.4 MB", date: "Mar 12, 2026" },
                 { name: "House Rules & Policies", size: "1.1 MB", date: "Jan 05, 2026" },
                 { name: "Utility Rate Chart", size: "0.5 MB", date: "Feb 20, 2026" }
               ].map((doc, i) => (
                 <Flex key={i} align="center" justify="space-between" p={3} borderRadius="xl" _hover={{ bg: docHoverBg }} cursor="pointer">
                    <HStack spacing={3}>
                       <Center w="10" h="10" bg="blue.50" color="blue.500" rounded="lg">
                          <Icon as={FiFileText} boxSize={5} />
                       </Center>
                       <Box>
                          <Text fontSize="xs" fontWeight="800">{doc.name}</Text>
                          <Text fontSize="10px" color={mutedText}>{doc.size} • {doc.date}</Text>
                       </Box>
                    </HStack>
                    <Icon as={FiArrowRight} color={mutedText} />
                 </Flex>
               ))}
            </VStack>
          </Box>

        </Box>

      </Grid>
      


      <Modal isOpen={isOpen} onClose={handleClosePayment} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
        <ModalContent borderRadius="3xl" bg={cardBg} overflow="hidden">
          <ModalHeader py={6} borderBottom="1px solid" borderColor={borderColor}>
            <Heading size="md" fontWeight="900" color={textColor}>Checkout & Pay</Heading>
            <Text fontSize="xs" color={mutedText} fontWeight="bold">Select the items you wish to pay now</Text>
          </ModalHeader>
          <ModalCloseButton mt={2} />
          
          <ModalBody py={8}>
            {!qrString ? (
              <VStack align="stretch" spacing={6}>
                 <Box>
                    <Text fontSize="xs" fontWeight="900" color={mutedText} textTransform="uppercase" letterSpacing="widest" mb={4}>Select Line Items</Text>
                    <VStack align="stretch" spacing={3}>
                       {/* Rent Item */}
                       <Flex align="center" justify="space-between" p={4} bg={annItemBg} borderRadius="2xl" border="1px" borderColor={borderColor}>
                          <HStack spacing={4}>
                             <Checkbox colorScheme="blue" isChecked={selectedItems.rent} onChange={handleToggleRent} size="lg" />
                             <VStack align="flex-start" spacing={0}>
                                <Text fontWeight="900" fontSize="sm">Monthly Rent</Text>
                                <Text fontSize="xs" color={mutedText}>Monthly housing agreement</Text>
                             </VStack>
                          </HStack>
                          <Text fontWeight="900" fontSize="sm">{fmt(data?.lease?.rent_amount)}</Text>
                       </Flex>
                       
                       {/* Utility Items */}
                       {data?.lease?.utility_bills?.filter(b => b.status === "unpaid").map(bill => (
                          <Flex key={bill.id} align="center" justify="space-between" p={4} bg={annItemBg} borderRadius="2xl" border="1px" borderColor={borderColor}>
                             <HStack spacing={4}>
                                <Checkbox colorScheme="blue" isChecked={selectedItems.utilities.includes(bill.id)} onChange={() => handleToggleUtility(bill.id)} size="lg" />
                                <VStack align="flex-start" spacing={0}>
                                   <Text fontWeight="900" fontSize="sm" textTransform="capitalize">{bill.type} Bill</Text>
                                   <Text fontSize="xs" color={mutedText}>Cycle end: {dayjs(bill.due_date).format('MMM D')}</Text>
                                </VStack>
                             </HStack>
                             <Text fontWeight="900" fontSize="sm">{fmt(bill.amount)}</Text>
                          </Flex>
                       ))}
                    </VStack>
                 </Box>

                 <Divider borderColor={borderColor} />

                 <Flex justify="space-between" align="center">
                    <Box>
                       <Text fontSize="xs" fontWeight="900" color={mutedText} textTransform="uppercase">Selected Total</Text>
                       <Heading size="lg" fontWeight="900" color="blue.500">{fmt(calculateSubtotal())}</Heading>
                    </Box>
                    <Button 
                       size="lg" colorScheme="blue" rounded="2xl" px={8} fontWeight="900" 
                       isDisabled={calculateSubtotal() <= 0} isLoading={loadingQr}
                       onClick={generateBakongQr}
                    >
                       CONTINUE TO PAY
                    </Button>
                 </Flex>
              </VStack>
            ) : (
                <Box 
                  p={0} borderRadius="2xl" overflow="hidden" border="2px solid"
                  borderColor={paymentConfirmed ? "green.400" : "blue.300"}
                  transition="all 0.5s ease"
                  shadow={qrString && !paymentConfirmed ? "0 0 30px -5px rgba(66,153,225,0.4)" : paymentConfirmed ? "0 0 30px -5px rgba(72,187,120,0.5)" : "none"}
                >
                  {paymentConfirmed ? (
                    <Box bgGradient="linear(to-br, green.400, green.600, teal.500)" p={10} textAlign="center">
                      <Flex w={20} h={20} mx="auto" mb={4} bg="whiteAlpha.300" borderRadius="full" align="center" justify="center">
                        <Icon as={FiCheckCircle} boxSize={10} color="white" />
                      </Flex>
                      <Heading size="lg" color="white" mb={2}>Payment Received!</Heading>
                      <Text color="whiteAlpha.900" fontWeight="bold">Items marked as paid successfully.</Text>
                      <Badge mt={6} bg="whiteAlpha.200" color="white" px={4} py={2} borderRadius="full">✓ Transaction Confirmed</Badge>
                    </Box>
                  ) : (
                    <VStack spacing={0} align="stretch">
                       <Box bg="blue.500" px={5} py={3}>
                          <Flex align="center" justify="space-between">
                             <HStack><Icon as={FiZap} color="white" /><Text fontSize="sm" fontWeight="900" color="white">SCAN TO PAY</Text></HStack>
                             <Badge bg="whiteAlpha.200" color="white" rounded="full">{fmt(calculateSubtotal())}</Badge>
                          </Flex>
                       </Box>
                       <Box p={8} bg={bg} textAlign="center">
                          <VStack spacing={6}>
                             <Box w="280px" bg="white" p={4} borderRadius="2xl" shadow="xl" border="1px solid" borderColor="gray.100">
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
                                   <Text fontSize="xs" fontWeight="900" color="blue.700">Awaiting your payment confirm...</Text>
                                </HStack>
                             </Box>
                             <Button variant="ghost" size="sm" color={mutedText} onClick={() => setQrString(null)}>← Edit Selection</Button>
                          </VStack>
                       </Box>
                    </VStack>
                  )}
                </Box>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={borderColor} bg={annItemBg}>
            <Button w="full" variant="ghost" onClick={handleClosePayment} fontWeight="900">CANCEL</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function ActionCard({ label, icon, color, link, delay }) {
  const navigate = useNavigate();
  const actionCardBg = useColorModeValue("white", "#161b22");
  const actionCardBorder = useColorModeValue("gray.100", "#30363d");

  return (
    <MotionBox 
      whileHover={{ y: -5, shadow: "xl" }} whileActive={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
      bg={actionCardBg} p={6} borderRadius="2xl" border="1px" borderColor={actionCardBorder} shadow="sm"
      cursor="pointer" onClick={() => navigate(link)} textAlign="center"
    >
      <Center w="12" h="12" bg={`${color}.50`} color={`${color}.500`} _dark={{ bg: `${color}.900`, color: `${color}.300` }} rounded="2xl" mx="auto" mb={4}>
        <Icon as={icon} boxSize={6} />
      </Center>
      <Text fontSize="xs" fontWeight="900" textTransform="uppercase" letterSpacing="wide">{label}</Text>
    </MotionBox>
  );
}

function StepItem({ title, desc, active, icon, color }) {
  const iconColor = active ? `${color}.500` : "gray.400";
  const textColor = useColorModeValue("gray.900", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex align="flex-start" gap={4} position="relative">
      <Center w="8" h="8" rounded="full" bg={active ? "white" : "gray.100"} border="2px solid" borderColor={active ? iconColor : "gray.200"} zIndex={2} shadow={active ? "md" : "none"}>
        <Icon as={icon} color={iconColor} boxSize={4} />
      </Center>
      <Box>
        <Text fontSize="sm" fontWeight="900" color={active ? textColor : "gray.400"}>{title}</Text>
        <Text fontSize="xs" fontWeight="600" color={mutedText}>{desc}</Text>
      </Box>
    </Flex>
  );
}
