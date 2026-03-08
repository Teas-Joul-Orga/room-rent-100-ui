import React, { useState, useEffect } from "react";
import {
  Box, Flex, Text, SimpleGrid, useColorModeValue, Spinner, Select,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Badge,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Icon, Grid, GridItem
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiHome, FiTool } from "react-icons/fi";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

const API = "http://localhost:8000/api/v1";
const fmt = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const COLORS = ['#3182CE', '#38A169', '#E53E3E', '#D69E2E', '#805AD5'];

function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState(dayjs().format('YYYY'));
  
  // Data States
  const [financials, setFinancials] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [maintenance, setMaintenance] = useState(null);

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  
  // Custom colors that were used inline below
  const gray50_gray700 = useColorModeValue("gray.50", "#1c2333");
  const blue50_gray900 = useColorModeValue("blue.50", "#0e2135");
  const red50_gray900 = useColorModeValue("red.50", "#2d1215");
  const green50_gray900 = useColorModeValue("green.50", "#0c2d1b");
  const purple50_gray900 = useColorModeValue("purple.50", "#211340");
  const blue50_gray700 = useColorModeValue("blue.50", "#30363d");
  
  const headers = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ filter_type: 'yearly', year: yearFilter }).toString();
      
      const [resFin, resOcc, resTrend, resMaint] = await Promise.all([
        fetch(`${API}/admin/reports/financial?${qs}`, { headers: headers() }),
        fetch(`${API}/admin/reports/occupancy`, { headers: headers() }),
        fetch(`${API}/admin/reports/p_and_l?${qs}`, { headers: headers() }),
        fetch(`${API}/admin/reports/maintenance_analytics?${qs}`, { headers: headers() })
      ]);

      if (resFin.ok) setFinancials(await resFin.json());
      if (resOcc.ok) setOccupancy(await resOcc.json());
      if (resTrend.ok) {
        const t = await resTrend.json();
        // Map backend shape to Recharts shape
        const mappedTrend = t.trendLabels.map((label, i) => ({
          month: label,
          revenue: t.trendIncome[i] || 0,
          expenses: t.trendExpense[i] || 0,
          profit: (t.trendIncome[i] || 0) - (t.trendExpense[i] || 0)
        }));
        setTrendData(mappedTrend);
      }
      if (resMaint.ok) setMaintenance(await resMaint.json());
      
    } catch (e) {
      toast.error("Failed to fetch reporting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [yearFilter]);

  if (loading || !financials || !occupancy) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  // Formatting Occupancy Pie Data
  const pieData = [
    { name: 'Occupied', value: occupancy.occupiedRooms },
    { name: 'Available', value: occupancy.vacantRooms },
    { name: 'Maintenance', value: occupancy.maintenanceRooms }
  ];

  return (
    <Box p={{ base: 2, md: 6 }}>
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} mb={6} gap={{ base: 4, sm: 0 }}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" letterSpacing="tight" color={textColor}>
            {t("dashboard.overview")}
          </Text>
          <Text fontSize="sm" color={mutedText}>
            {t("dashboard.financial_oversight", { year: yearFilter })}
          </Text>
        </Box>
        <Select size="sm" w="120px" bg={bg} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
      </Flex>

      {/* KPI Row */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat bg={bg} p={5} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <Flex align="center" gap={3} mb={2}>
            <Flex w="40px" h="40px" bg={blue50_gray900} color="blue.600" borderRadius="full" justify="center" align="center">
              <Icon as={FiDollarSign} boxSize={5} />
            </Flex>
            <StatLabel fontSize="sm" fontWeight="bold" color={mutedText} textTransform="uppercase">{t("dashboard.gross_revenue")}</StatLabel>
          </Flex>
          <StatNumber fontSize="3xl" fontWeight="black" color={textColor}>{fmt(financials.revenueCollected)}</StatNumber>
          <StatHelpText m={0} mt={1} fontSize="sm" fontWeight="bold" color="green.500">
            {t("dashboard.collected_this_year")}
          </StatHelpText>
        </Stat>

        <Stat bg={bg} p={5} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <Flex align="center" gap={3} mb={2}>
            <Flex w="40px" h="40px" bg={red50_gray900} color="red.600" borderRadius="full" justify="center" align="center">
              <Icon as={FiTrendingDown} boxSize={5} />
            </Flex>
            <StatLabel fontSize="sm" fontWeight="bold" color={mutedText} textTransform="uppercase">{t("dashboard.total_expenses")}</StatLabel>
          </Flex>
          <StatNumber fontSize="3xl" fontWeight="black" color={textColor}>{fmt(financials.totalExpenses)}</StatNumber>
          <StatHelpText m={0} mt={1} fontSize="sm" fontWeight="bold" color="red.500">
            {financials.revenueCollected > 0 ? ((financials.totalExpenses / financials.revenueCollected) * 100).toFixed(1) : 0}{t("dashboard.of_revenue")}
          </StatHelpText>
        </Stat>

        <Stat bg={bg} p={5} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <Flex align="center" gap={3} mb={2}>
            <Flex w="40px" h="40px" bg={green50_gray900} color="green.600" borderRadius="full" justify="center" align="center">
              <Icon as={FiTrendingUp} boxSize={5} />
            </Flex>
            <StatLabel fontSize="sm" fontWeight="bold" color={mutedText} textTransform="uppercase">{t("dashboard.net_profit")}</StatLabel>
          </Flex>
          <StatNumber fontSize="3xl" fontWeight="black" color={textColor}>{fmt(financials.netProfit)}</StatNumber>
          <StatHelpText m={0} mt={1} fontSize="sm" fontWeight="bold" color="gray.500">
            {t("dashboard.profit_margin")}: {financials.revenueCollected > 0 ? ((financials.netProfit / financials.revenueCollected) * 100).toFixed(1) : 0}%
          </StatHelpText>
        </Stat>

        <Stat bg={bg} p={5} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <Flex align="center" gap={3} mb={2}>
            <Flex w="40px" h="40px" bg={purple50_gray900} color="purple.600" borderRadius="full" justify="center" align="center">
              <Icon as={FiHome} boxSize={5} />
            </Flex>
            <StatLabel fontSize="sm" fontWeight="bold" color={mutedText} textTransform="uppercase">{t("dashboard.occupancy_rate")}</StatLabel>
          </Flex>
          <StatNumber fontSize="3xl" fontWeight="black" color={textColor}>{occupancy.occupancyRate.toFixed(1)}%</StatNumber>
          <StatHelpText m={0} mt={1} fontSize="sm" fontWeight="bold" color="gray.500">
            {t("dashboard.units_occupied", { occupied: occupancy.occupiedRooms, total: occupancy.totalRooms })}
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Charts Row */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} mb={8}>
        <GridItem>
          {/* P&L Bar Chart */}
          <Box bg={bg} p={6} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" h="400px">
            <Text fontSize="md" fontWeight="bold" color={textColor} mb={6} textTransform="uppercase">{t("dashboard.revenue_vs_expenses", { year: yearFilter })}</Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: mutedText }} axisLine={false} tickLine={false} />
                <YAxis 
                  tickFormatter={(value) => {
                    const c = localStorage.getItem('currency') || '$';
                    if (c === '៛') {
                      const r = Number(localStorage.getItem('exchangeRate') || 4000);
                      const converted = value * r;
                      return '៛' + (converted >= 1000000 ? (converted/1000000).toFixed(1) + 'M' : (converted/1000).toFixed(0) + 'k');
                    }
                    return '$' + (value/1000).toFixed(0) + 'k';
                  }} 
                  tick={{ fontSize: 12, fill: mutedText }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(value, name) => [fmt(value), name.toUpperCase()]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#3182CE" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expenses" name="Expenses" fill="#E53E3E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </GridItem>
        
        <GridItem>
          {/* Occupancy Pie Chart */}
          <Box bg={bg} p={6} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" h="400px">
            <Text fontSize="md" fontWeight="bold" color={textColor} mb={2} textTransform="uppercase">{t("dashboard.current_occupancy")}</Text>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Units`, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </GridItem>
      </Grid>

      {/* Secondary Tables Row */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
        <GridItem>
          {/* Maintenance Focus */}
          <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
            <Flex p={4} bg={gray50_gray700} align="center" justify="space-between">
              <Flex align="center" gap={2}>
                <Icon as={FiTool} color="orange.500" />
                <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" color={textColor}>{t("dashboard.highest_maintenance")}</Text>
              </Flex>
              <Badge colorScheme="orange">{t("dashboard.requests_this_year", { count: maintenance?.totalRequests || 0 })}</Badge>
            </Flex>
            <TableContainer>
              <Table size="md" variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t("dashboard.unit_name")}</Th>
                    <Th isNumeric>{t("dashboard.total_cost")}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {maintenance?.mostExpensiveRooms && Object.entries(maintenance.mostExpensiveRooms).length > 0 ? (
                    Object.entries(maintenance.mostExpensiveRooms).map(([room, cost]) => (
                      <Tr key={room}>
                        <Td fontSize="sm" fontWeight="bold" color={textColor}>{room}</Td>
                        <Td isNumeric fontSize="sm" fontWeight="black" color="red.500">{fmt(cost)}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr><Td colSpan={2} textAlign="center" py={6} color={mutedText}>{t("dashboard.no_maintenance")}</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </GridItem>

        <GridItem>
           {/* Utility Efficiency or Lease Renewals Focus could go here. Doing Lease Renewals */}
           <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
            <Flex p={4} bg={blue50_gray700} align="center" justify="space-between">
              <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" color={textColor}>{t("dashboard.upcoming_expirations")}</Text>
              <Badge colorScheme="red">{t("dashboard.expiring_soon", { count: occupancy?.expiringSoon?.length || 0 })}</Badge>
            </Flex>
            <TableContainer>
              <Table size="md" variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t("dashboard.tenant")}</Th>
                    <Th>{t("dashboard.unit")}</Th>
                    <Th isNumeric>{t("dashboard.end_date")}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {occupancy?.expiringSoon && occupancy.expiringSoon.length > 0 ? (
                    occupancy.expiringSoon.map((lease) => (
                      <Tr key={lease.id}>
                        <Td fontSize="sm" fontWeight="bold" color={textColor}>{lease.tenant?.name}</Td>
                        <Td fontSize="sm" fontWeight="bold" color="blue.500">{lease.room?.name}</Td>
                        <Td isNumeric fontSize="sm" fontWeight="bold" color="red.500">{dayjs(lease.end_date).format('MMM D, YYYY')}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr><Td colSpan={3} textAlign="center" py={6} color={mutedText}>{t("dashboard.no_expirations")}</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default Dashboard;
