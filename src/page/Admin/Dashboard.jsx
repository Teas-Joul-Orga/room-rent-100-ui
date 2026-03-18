import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Flex, Text, SimpleGrid, useColorModeValue, Spinner, Select, Button,
  Stat, StatLabel, StatNumber, StatHelpText, Badge,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Icon, Grid, GridItem, Skeleton,
  Avatar, AvatarGroup, Tooltip, IconButton, Menu, MenuButton, MenuList, MenuItem,
  Progress, Divider, Heading, Center, useColorMode, VStack, HStack
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiHome, FiTool, FiActivity, 
  FiBell, FiCalendar, FiUsers, FiPlus, FiArrowRight, FiMoreVertical, FiClock
} from "react-icons/fi";
import { LuWrench, LuReceipt, LuDoorOpen, LuUserPlus, LuRefreshCw } from "react-icons/lu";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionGridItem = motion(GridItem);

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState(dayjs().format('YYYY'));
  const [dashboardData, setDashboardData] = useState(null);

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
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }, [currencySettings]);

  // Aesthetic Colors
  const bg = useColorModeValue("white", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const glassBg = useColorModeValue("rgba(255, 255, 255, 0.7)", "rgba(22, 27, 34, 0.7)");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "#21262d");
  const tableHeaderBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const statBgBlue = useColorModeValue("blue.50", "blue.900");
  const statBgRed = useColorModeValue("red.50", "red.900");
  const statBgGreen = useColorModeValue("green.50", "green.900");
  const statBgPurple = useColorModeValue("purple.50", "purple.900");
  const statBgOrange = useColorModeValue("orange.50", "orange.900");
  const progressBg = useColorModeValue("gray.100", "gray.700");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ filter_type: 'yearly', year: yearFilter }).toString();
      const res = await api.get(`/admin/reports/unified_dashboard?${qs}`);
      setDashboardData(res.data);
    } catch (e) {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [yearFilter]);

  if (loading || !dashboardData) {
    return (
      <Box p={6}>
        <Skeleton height="40px" width="300px" mb={8} />
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          {[1,2,3,4].map(i => <Skeleton key={i} height="120px" borderRadius="2xl" />)}
        </SimpleGrid>
        <Grid templateColumns={{ base: "1fr", lg: "2.5fr 1fr" }} gap={6}>
          <Skeleton height="500px" borderRadius="2xl" />
          <Skeleton height="500px" borderRadius="2xl" />
        </Grid>
      </Box>
    );
  }

  const { financials, occupancy, trends, maintenance, urgentStats, recentActivity, expenseBreakdown, detailedPayments } = dashboardData;

  const trendData = trends.trendLabels.map((label, i) => ({
    month: label,
    revenue: trends.trendIncome[i] || 0,
    expenses: trends.trendExpense[i] || 0,
    profit: (trends.trendIncome[i] || 0) - (trends.trendExpense[i] || 0)
  }));

  const radarData = [
    { subject: 'Efficiency', A: maintenance.resolutionRate || 0, fullMark: 100 },
    { subject: 'Response', A: 90, fullMark: 100 }, // Mock response time meta
    { subject: 'Cost Control', A: 75, fullMark: 100 },
    { subject: 'Satisfaction', A: 85, fullMark: 100 },
    { subject: 'Uptime', A: 95, fullMark: 100 },
  ];

  const urgentCards = [
    { title: "Pending Fixes", val: urgentStats.pending_maintenance, icon: FiTool, color: "orange", link: "/dashboard/maintenance", bg: statBgOrange },
    { title: "Overdue Bills", val: urgentStats.overdue_bills, icon: FiClock, color: "red", link: "/dashboard/utility", bg: statBgRed },
    { title: "Vacant Units", val: urgentStats.available_rooms, icon: FiHome, color: "green", link: "/dashboard/rooms", bg: statBgGreen },
    { title: "New Leases", val: urgentStats.expiring_leases, icon: FiCalendar, color: "purple", link: "/dashboard/lease", bg: statBgPurple },
  ];

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">
      
      {/* Top Header Section */}
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} mb={10} gap={4}>
        <Box>
          <Heading size="xl" fontWeight="900" letterSpacing="tight" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Command Center
          </Heading>
          <Text fontSize="sm" color={mutedText} fontWeight="600">
            Strategic operations and real estate intelligence
          </Text>
        </Box>
        <Flex gap={3} align="center">
          <Select 
            size="sm" w="120px" rounded="full" bg={cardBg} borderColor={borderColor} fontWeight="800"
            value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <IconButton icon={<FiPlus />} colorScheme="blue" rounded="full" shadow="lg" onClick={() => navigate("/dashboard/lease/createnewlease")} />
        </Flex>
      </Flex>

      {/* Main Grid Layout */}
      <Grid templateColumns={{ base: "1fr", lg: "3fr 1.2fr" }} gap={8}>
        
        {/* LEFT COLUMN: Main Analytics */}
        <Box>
          
          {/* 1. Core KPIs */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <KPIStat 
              label="Revenue" value={fmt(financials.revenueCollected)} 
              sub={`Expected: ${fmt(financials.revenueExpected)}`} 
              percent={financials.collectionRate} icon={FiDollarSign} color="blue" 
            />
            <KPIStat 
              label="Occupancy" value={`${occupancy.occupancyRate.toFixed(1)}%`} 
              sub={`${occupancy.occupiedRooms} / ${occupancy.totalRooms} Units`} 
              percent={occupancy.occupancyRate} icon={FiHome} color="purple" 
            />
            <KPIStat 
              label="Net Profit" value={fmt(financials.netProfit)} 
              sub={`${financials.revenueCollected > 0 ? ((financials.netProfit / financials.revenueCollected) * 100).toFixed(1) : 0}% Margin`} 
              percent={financials.revenueCollected > 0 ? (financials.netProfit / financials.revenueCollected) * 100 : 0} icon={FiTrendingUp} color="emerald" 
            />
          </SimpleGrid>

          {/* 2. Main Chart: Revenue & Forecast */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="sm" mb={8}>
            <Flex justify="space-between" align="center" mb={8}>
              <Box>
                <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="xs" color={mutedText}>Market Performance</Text>
                <Text fontSize="lg" fontWeight="900">Revenue & Expense Matrix</Text>
              </Box>
              <HStack spacing={4}>
                 <HStack><Box w="3" h="3" rounded="full" bg="blue.400" /><Text fontSize="xs" fontWeight="800">Revenue</Text></HStack>
                 <HStack><Box w="3" h="3" rounded="full" bg="red.400" /><Text fontSize="xs" fontWeight="800">Expenses</Text></HStack>
              </HStack>
            </Flex>
            <Box h="350px" minWidth={0}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3182ce" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3182ce" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#e53e3e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                  <XAxis dataKey="month" tick={{fontSize: 10, fill: mutedText}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tickFormatter={(v) => `$${v/1000}k`} tick={{fontSize: 10, fill: mutedText}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', background: cardBg }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3182ce" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#e53e3e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* 3. Distribution Metrics */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            {/* Occupancy Chart */}
            <Box bg={cardBg} p={6} borderRadius="3xl" border="1px" borderColor={borderColor}>
               <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="10px" color={mutedText} mb={4}>Unit Utilization</Text>
               <Center h="180px" position="relative" minWidth={0}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Occupied', value: occupancy.occupiedRooms },
                          { name: 'Vacant', value: occupancy.vacantRooms },
                          { name: 'Fixing', value: occupancy.maintenanceRooms }
                        ]}
                        innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none"
                      >
                        {[ '#6366f1', '#94a3b8', '#f59e0b' ].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <VStack position="absolute" spacing={0}>
                     <Text fontSize="2xl" fontWeight="900">{occupancy.totalRooms}</Text>
                     <Text fontSize="9px" color={mutedText} fontWeight="bold">UNITS</Text>
                  </VStack>
               </Center>
            </Box>

            {/* Expense Breakdown */}
            <Box bg={cardBg} p={6} borderRadius="3xl" border="1px" borderColor={borderColor}>
               <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="10px" color={mutedText} mb={4}>Cost Distribution</Text>
                <Center h="180px" minWidth={0}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown.length > 0 ? expenseBreakdown : [{ name: 'No Data', value: 1 }]}
                        innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none"
                        label={({ name, percent }) => percent > 0.1 ? name : ''}
                      >
                        {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '15px', border: 'none', background: cardBg, fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
               </Center>
            </Box>

            {/* Maintenance Radar */}
            <Box bg={cardBg} p={6} borderRadius="3xl" border="1px" borderColor={borderColor}>
               <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="10px" color={mutedText} mb={4}>Operational Health</Text>
               <Box h="180px" minWidth={0}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke={borderColor} />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fill: mutedText}} />
                      <Radar name="Status" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
               </Box>
            </Box>
          </SimpleGrid>

          {/* 4. Occupancy Heatmap Grid */}
          <Box bg={cardBg} p={8} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="sm" mb={8}>
            <Flex justify="space-between" align="center" mb={8}>
              <Box>
                <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="xs" color={mutedText}>Property Topology</Text>
                <Text fontSize="lg" fontWeight="900">Real Estate Heatmap</Text>
              </Box>
                <HStack spacing={4}>
                  <HStack><Box w="2" h="2" rounded="full" bg="green.400" /><Text fontSize="10px" fontWeight="bold">Occupied</Text></HStack>
                  <HStack><Box w="2" h="2" rounded="full" bg="gray.300" /><Text fontSize="10px" fontWeight="bold">Vacant</Text></HStack>
                  <HStack><Box w="2" h="2" rounded="full" bg="orange.400" /><Text fontSize="10px" fontWeight="bold">Fixing</Text></HStack>
                </HStack>
              </Flex>
              <SimpleGrid columns={{ base: 4, sm: 8, md: 10, xl: 15 }} spacing={3}>
                {occupancy.all_rooms?.map((room) => (
                  <Tooltip key={room.id} label={`${room.name} (${room.status})`} hasArrow>
                    <Box 
                      h="10" borderRadius="lg" cursor="pointer" transition="all 0.2s"
                      bg={
                        room.status === 'occupied' ? 'green.400' : 
                        room.status === 'available' || room.status === 'vacant' ? 'gray.200' : 
                        'orange.400'
                      }
                      _hover={{ transform: "scale(1.15)", shadow: "xl", zIndex: 10 }}
                      bgGradient={
                        room.status === 'occupied' ? "linear(to-br, green.400, green.600)" : 
                        room.status === 'available' || room.status === 'vacant' ? "linear(to-br, gray.100, gray.300)" : 
                        "linear(to-br, orange.300, orange.500)"
                      }
                      onClick={() => navigate(`/dashboard/rooms`)}
                    />
                  </Tooltip>
                ))}
              </SimpleGrid>
          </Box>

          {/* 5. Global Payments Ledger */}
          <Box bg={cardBg} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
             <Flex p={6} borderBottom="1px" borderColor={borderColor} justify="space-between" align="center" bg={tableHeaderBg}>
                <Box>
                   <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="xs" color={mutedText}>Treasury</Text>
                   <Text fontSize="lg" fontWeight="900">Recent Transactions</Text>
                </Box>
                <Button size="sm" variant="ghost" colorScheme="blue" rightIcon={<FiArrowRight />}>Full Ledger</Button>
             </Flex>
             <TableContainer>
                <Table variant="simple" size="sm">
                   <Thead>
                      <Tr>
                         <Th color={mutedText}>Tenant / Unit</Th>
                         <Th color={mutedText}>Date</Th>
                         <Th color={mutedText}>Amount</Th>
                         <Th color={mutedText}>Type</Th>
                         <Th color={mutedText}>Method</Th>
                      </Tr>
                   </Thead>
                   <Tbody>
                      {detailedPayments.map((p, i) => (
                        <Tr key={i} _hover={{ bg: hoverBg }} cursor="pointer">
                           <Td>
                              <VStack align="start" spacing={0}>
                                 <Text fontWeight="800" fontSize="xs">{p.tenant_name}</Text>
                                 <Text fontSize="10px" color={mutedText}>{p.room_name}</Text>
                              </VStack>
                           </Td>
                           <Td fontSize="xs" fontWeight="700">{dayjs(p.date).format('MMM DD, YYYY')}</Td>
                           <Td fontSize="xs" fontWeight="900" color="emerald.500">+{fmt(p.amount)}</Td>
                           <Td><Badge size="xs" colorScheme="blue" rounded="full" px={2}>{p.type}</Badge></Td>
                           <Td fontSize="xs" color={mutedText} fontWeight="600">{p.method}</Td>
                        </Tr>
                      ))}
                   </Tbody>
                </Table>
             </TableContainer>
          </Box>

        </Box>

        {/* RIGHT COLUMN: Urgent Actions & Feed */}
        <Box>
          
          {/* 1. Urgent Command Center */}
          <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="11px" color={mutedText} mb={4}>Command Center</Text>
          <VStack spacing={4} mb={10} align="stretch">
            {urgentCards.map((card, i) => (
              <MotionBox 
                 key={i} whileHover={{ x: 5 }} whileActive={{ scale: 0.98 }}
                 bg={cardBg} p={4} borderRadius="2xl" border="1px" borderColor={borderColor} shadow="sm"
                 cursor="pointer" onClick={() => navigate(card.link)}
              >
                <Flex align="center" gap={4}>
                  <Center w="12" h="12" bg={card.bg} color={`${card.color}.500`} _dark={{ color: `${card.color}.300` }} rounded="xl">
                    <Icon as={card.icon} boxSize={5} />
                  </Center>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="800" color={textColor}>{card.title}</Text>
                    <Text fontSize="xs" color={mutedText} fontWeight="600">{card.val} Items Pending</Text>
                  </Box>
                  <Icon as={FiArrowRight} color={mutedText} />
                </Flex>
              </MotionBox>
            ))}
          </VStack>

          {/* 2. Real-time Activity Feed */}
          <Box bg={cardBg} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
            <Flex p={6} borderBottom="1px" borderColor={borderColor} justify="space-between" align="center">
              <Text fontWeight="900" fontSize="sm">Live Activity</Text>
              <Badge colorScheme="green" variant="subtle" rounded="full" className="pulse">Live</Badge>
            </Flex>
            <Box maxH="600px" overflowY="auto" p={4}>
              <VStack spacing={6} align="stretch">
                {recentActivity.map((act, i) => (
                  <Flex key={i} gap={4} position="relative">
                    {i !== recentActivity.length - 1 && <Box position="absolute" left="19px" top="35px" bottom="-25px" w="1px" bg={borderColor} />}
                    <Avatar 
                      size="sm" bg={act.type === 'payment' ? 'emerald.500' : act.type === 'maintenance' ? 'orange.500' : 'blue.500'} 
                      icon={act.type === 'payment' ? <FiDollarSign color="white"/> : act.type === 'maintenance' ? <FiTool color="white"/> : <FiCalendar color="white"/>}
                    />
                    <Box flex="1">
                      <Flex justify="space-between">
                        <Text fontSize="xs" fontWeight="900">{act.title}</Text>
                        <Text fontSize="10px" color={mutedText}>{dayjs(act.time).fromNow()}</Text>
                      </Flex>
                      <Text fontSize="xs" color={mutedText} noOfLines={2} mt={1}>{act.description}</Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
            <Box p={4} borderTop="1px" borderColor={borderColor}>
               <Text as="button" fontSize="xs" fontWeight="900" color="blue.500" w="full">VIEW ALL AUDIT LOGS</Text>
            </Box>
          </Box>

        </Box>

      </Grid>
      
      {/* Footer Branding */}

    </Box>
  );
}

function KPIStat({ label, value, sub, percent, icon, color }) {
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const cardBg = useColorModeValue("white", "#161b22");
  const kpiProgressBg = useColorModeValue("gray.100", "gray.700");

  return (
    <MotionBox 
      whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}
      bg={cardBg} p={6} borderRadius="3xl" border="1px" borderColor={borderColor} shadow="sm"
    >
      <Flex align="center" gap={4} mb={4}>
        <Center w="10" h="10" bg={`${color}.50`} color={`${color}.500`} _dark={{ bg: `${color}.900`, color: `${color}.300` }} rounded="xl">
          <Icon as={icon} boxSize={5} />
        </Center>
        <Text fontWeight="800" textTransform="uppercase" letterSpacing="widest" fontSize="xs" color={mutedText}>{label}</Text>
      </Flex>
      <Text fontSize="3xl" fontWeight="900" color={textColor} mb={1}>{value}</Text>
      <Text fontSize="xs" color={mutedText} fontWeight="700" mb={3}>{sub}</Text>
       <Progress value={percent} size="xs" colorScheme={color} rounded="full" bg={kpiProgressBg} />
    </MotionBox>
  );
}
