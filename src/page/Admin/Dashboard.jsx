import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Flex, Text, SimpleGrid, useColorModeValue, Spinner, Select,
  Stat, StatLabel, StatNumber, StatHelpText, Badge,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Icon, Grid, GridItem, Skeleton
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiHome, FiTool, FiActivity } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import api from "../../api/axios";

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionGridItem = motion(GridItem);

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const { t } = useTranslation();
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
  const bg = useColorModeValue("white", "#161b22");
  const glassBg = useColorModeValue("rgba(255, 255, 255, 0.7)", "rgba(22, 27, 34, 0.7)");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ filter_type: 'yearly', year: yearFilter }).toString();
      const res = await api.get(`/admin/reports/unified_dashboard?${qs}`);
      
      const { financials, occupancy, trends, maintenance } = res.data;
      
      const mappedTrend = trends.trendLabels.map((label, i) => ({
        month: label,
        revenue: trends.trendIncome[i] || 0,
        expenses: trends.trendExpense[i] || 0,
        profit: (trends.trendIncome[i] || 0) - (trends.trendExpense[i] || 0)
      }));

      setDashboardData({ financials, occupancy, trendData: mappedTrend, maintenance });
    } catch (e) {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [yearFilter]);

  // Animation variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } } };

  if (loading || !dashboardData) {
    return (
      <Box p={6}>
        <Flex justify="space-between" mb={8}>
          <Skeleton height="40px" width="300px" borderRadius="lg" />
          <Skeleton height="40px" width="120px" borderRadius="lg" />
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          {[1,2,3,4].map(i => <Skeleton key={i} height="130px" borderRadius="2xl" />)}
        </SimpleGrid>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} mb={8}>
           <Skeleton height="400px" borderRadius="2xl" />
           <Skeleton height="400px" borderRadius="2xl" />
        </Grid>
      </Box>
    );
  }

  const { financials, occupancy, trendData, maintenance } = dashboardData;
  const pieData = [
    { name: 'Occupied', value: occupancy.occupiedRooms },
    { name: 'Available', value: occupancy.vacantRooms },
    { name: 'Maintenance', value: occupancy.maintenanceRooms }
  ];

  return (
    <Box p={{ base: 4, md: 6 }}>
      
      {/* Header */}
      <MotionFlex 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} mb={8} gap={4}
      >
        <Box>
          <Text fontSize="3xl" fontWeight="black" letterSpacing="tight" color={textColor} bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Command Center
          </Text>
          <Text fontSize="sm" color={mutedText} fontWeight="medium">
             Live analytics for {yearFilter}
          </Text>
        </Box>
        <Select 
          size="sm" w="140px" bg={bg} borderRadius="full" shadow="sm" fontWeight="bold" 
          value={yearFilter} onChange={e => setYearFilter(e.target.value)}
        >
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
      </MotionFlex>

      {/* KPI Row */}
      <MotionBox variants={container} initial="hidden" animate="show" mb={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {/* Revenue */}
          <MotionBox variants={item}>
            <Stat bg={glassBg} backdropFilter="blur(10px)" p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.3s" _hover={{ transform: "translateY(-4px)", shadow: "md" }}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="10" h="10" bg="blue.50" color="blue.500" _dark={{ bg: "rgba(59, 130, 246, 0.1)", color: "blue.400" }} borderRadius="xl" justify="center" align="center">
                  <Icon as={FiDollarSign} boxSize={5} />
                </Flex>
                <StatLabel fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="widest">Total Revenue</StatLabel>
              </Flex>
              <StatNumber fontSize="4xl" fontWeight="black" color={textColor} lineHeight="1">{fmt(financials.revenueCollected)}</StatNumber>
              <StatHelpText m={0} mt={2} fontSize="sm" fontWeight="bold" color="blue.500">Collected</StatHelpText>
            </Stat>
          </MotionBox>

          {/* Expenses */}
          <MotionBox variants={item}>
            <Stat bg={glassBg} backdropFilter="blur(10px)" p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.3s" _hover={{ transform: "translateY(-4px)", shadow: "md" }}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="10" h="10" bg="red.50" color="red.500" _dark={{ bg: "rgba(239, 68, 68, 0.1)", color: "red.400" }} borderRadius="xl" justify="center" align="center">
                  <Icon as={FiTrendingDown} boxSize={5} />
                </Flex>
                <StatLabel fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="widest">Total Expenses</StatLabel>
              </Flex>
              <StatNumber fontSize="4xl" fontWeight="black" color={textColor} lineHeight="1">{fmt(financials.totalExpenses)}</StatNumber>
              <StatHelpText m={0} mt={2} fontSize="sm" fontWeight="bold" color="red.500">Outflow</StatHelpText>
            </Stat>
          </MotionBox>

          {/* Net Profit */}
          <MotionBox variants={item}>
            <Stat bg={glassBg} backdropFilter="blur(10px)" p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.3s" _hover={{ transform: "translateY(-4px)", shadow: "md" }}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="10" h="10" bg="emerald.50" color="emerald.500" _dark={{ bg: "rgba(16, 185, 129, 0.1)", color: "emerald.400" }} borderRadius="xl" justify="center" align="center">
                  <Icon as={FiTrendingUp} boxSize={5} />
                </Flex>
                <StatLabel fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="widest">Net Profit</StatLabel>
              </Flex>
              <StatNumber fontSize="4xl" fontWeight="black" color={textColor} lineHeight="1">{fmt(financials.netProfit)}</StatNumber>
              <StatHelpText m={0} mt={2} fontSize="sm" fontWeight="bold" color="emerald.500">
                {financials.revenueCollected > 0 ? ((financials.netProfit / financials.revenueCollected) * 100).toFixed(1) : 0}% Margin
              </StatHelpText>
            </Stat>
          </MotionBox>

          {/* Occupancy */}
          <MotionBox variants={item}>
            <Stat bg={glassBg} backdropFilter="blur(10px)" p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" transition="all 0.3s" _hover={{ transform: "translateY(-4px)", shadow: "md" }}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w="10" h="10" bg="purple.50" color="purple.500" _dark={{ bg: "rgba(168, 85, 247, 0.1)", color: "purple.400" }} borderRadius="xl" justify="center" align="center">
                  <Icon as={FiHome} boxSize={5} />
                </Flex>
                <StatLabel fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="widest">Occupancy</StatLabel>
              </Flex>
              <StatNumber fontSize="4xl" fontWeight="black" color={textColor} lineHeight="1">{occupancy.occupancyRate.toFixed(1)}%</StatNumber>
              <StatHelpText m={0} mt={2} fontSize="sm" fontWeight="bold" color="purple.500">
                 {occupancy.occupiedRooms} / {occupancy.totalRooms} Leased
              </StatHelpText>
            </Stat>
          </MotionBox>
        </SimpleGrid>
      </MotionBox>

      {/* Charts Row */}
      <MotionBox variants={container} initial="hidden" animate="show" mb={8}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          <MotionGridItem variants={item}>
            <Box bg={glassBg} backdropFilter="blur(10px)" p={7} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" h="420px">
              <Flex justify="space-between" align="center" mb={6}>
                 <Text fontSize="md" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="wide">Revenue vs Expenses</Text>
                 <Icon as={FiActivity} color={mutedText} />
              </Flex>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: mutedText }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (currencySettings.c === '៛' || currencySettings.c === 'KHR' || currencySettings.c === 'Riel') {
                        const converted = value * currencySettings.r;
                        return '៛' + (converted >= 1000000 ? (converted/1000000).toFixed(1) + 'M' : (converted/1000).toFixed(0) + 'k');
                      }
                      return '$' + (value/1000).toFixed(0) + 'k';
                    }} 
                    tick={{ fontSize: 12, fill: mutedText }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [fmt(value), name.toUpperCase()]}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: bg }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{ fill: useColorModeValue('rgba(0,0,0,0.02)', 'rgba(255,255,255,0.02)') }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </MotionGridItem>
          
          <MotionGridItem variants={item}>
            <Box bg={glassBg} backdropFilter="blur(10px)" p={7} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" h="420px">
              <Text fontSize="md" fontWeight="black" color={textColor} mb={6} textTransform="uppercase" letterSpacing="wide">Space Utilization</Text>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} Units`, 'Count']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: bg }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Flex justify="center" gap={6} mt={2}>
                 {pieData.map((d, i) => (
                   <Flex key={d.name} align="center" gap={2}>
                     <Box w="3" h="3" borderRadius="full" bg={COLORS[i]} />
                     <Text fontSize="xs" fontWeight="bold" color={mutedText}>{d.name}</Text>
                   </Flex>
                 ))}
              </Flex>
            </Box>
          </MotionGridItem>
        </Grid>
      </MotionBox>

      {/* Data Tables Row */}
      <MotionBox variants={container} initial="hidden" animate="show">
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          <MotionGridItem variants={item}>
            <Box bg={glassBg} backdropFilter="blur(10px)" borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
              <Flex p={5} bg={useColorModeValue("orange.50", "rgba(249, 115, 22, 0.1)")} align="center" justify="space-between" borderBottom="1px solid" borderColor={borderColor}>
                <Flex align="center" gap={3}>
                  <Flex w="8" h="8" bg="orange.500" color="white" borderRadius="lg" justify="center" align="center"><Icon as={FiTool} /></Flex>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>Heavy Maintenance Consumers</Text>
                </Flex>
                <Badge bg="orange.500" color="white" px={3} py={1} borderRadius="full">{maintenance?.totalRequests || 0} Tickets</Badge>
              </Flex>
              <TableContainer>
                <Table size="md" variant="unstyled">
                  <Thead borderBottom="1px solid" borderColor={borderColor}>
                    <Tr>
                      <Th color={mutedText} fontSize="10px">LOCATION</Th>
                      <Th isNumeric color={mutedText} fontSize="10px">REPAIR COSTS</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {maintenance?.mostExpensiveRooms && Object.entries(maintenance.mostExpensiveRooms).length > 0 ? (
                      Object.entries(maintenance.mostExpensiveRooms).map(([room, cost]) => (
                        <Tr key={room} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }} transition="background 0.2s">
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{room}</Td>
                          <Td isNumeric fontSize="sm" fontWeight="black" color="orange.500">{fmt(cost)}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr><Td colSpan={2} textAlign="center" py={10} color={mutedText} fontSize="sm">No maintenance repair costs found this year.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </MotionGridItem>

          <MotionGridItem variants={item}>
             <Box bg={glassBg} backdropFilter="blur(10px)" borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
              <Flex p={5} bg={useColorModeValue("red.50", "rgba(239, 68, 68, 0.1)")} align="center" justify="space-between" borderBottom="1px solid" borderColor={borderColor}>
                <Flex align="center" gap={3}>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>Upcoming Expirations</Text>
                </Flex>
                <Badge bg="red.500" color="white" px={3} py={1} borderRadius="full">{occupancy?.expiringSoon?.length || 0} Leases</Badge>
              </Flex>
              <TableContainer>
                <Table size="md" variant="unstyled">
                  <Thead borderBottom="1px solid" borderColor={borderColor}>
                    <Tr>
                      <Th color={mutedText} fontSize="10px">TENANT</Th>
                      <Th color={mutedText} fontSize="10px">UNIT</Th>
                      <Th isNumeric color={mutedText} fontSize="10px">EXPIRES</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {occupancy?.expiringSoon && occupancy.expiringSoon.length > 0 ? (
                      occupancy.expiringSoon.map((lease) => (
                        <Tr key={lease.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }} transition="background 0.2s">
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{lease.tenant?.name}</Td>
                          <Td fontSize="sm" fontWeight="bold" color="blue.500">{lease.room?.name}</Td>
                          <Td isNumeric fontSize="sm" fontWeight="black" color="red.500">{dayjs(lease.end_date).format('MMM D')}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm">No leases expiring in the next 30 days.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </MotionGridItem>
        </Grid>
      </MotionBox>
    </Box>
  );
}
