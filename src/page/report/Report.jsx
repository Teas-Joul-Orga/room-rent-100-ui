import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Box, Flex, Text, useColorModeValue, Spinner, Select, Button,
  Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, SimpleGrid,
  Input, Menu, MenuButton, MenuList, MenuItem
} from "@chakra-ui/react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { FiChevronDown } from "react-icons/fi";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from "recharts";

const API = "http://localhost:8000/api/v1";
const fmt = (n) => {
  const c = (localStorage.getItem("currency") || sessionStorage.getItem("currency")) || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rateItem = (localStorage.getItem("exchangeRate") || sessionStorage.getItem("exchangeRate"));
    const r = rateItem ? Number(rateItem) : 4000;
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const CHART_COLORS = {
  green: "#38A169", red: "#E53E3E", blue: "#3182CE", orange: "#DD6B20",
  teal: "#319795", purple: "#805AD5", cyan: "#00B5D8", pink: "#D53F8C",
};
const PIE_COLORS = ["#38A169", "#3182CE", "#DD6B20", "#E53E3E", "#805AD5", "#319795"];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="gray.800" px={3} py={2} borderRadius="lg" shadow="xl" border="1px solid" borderColor="gray.600">
      {label && <Text fontSize="xs" color="gray.300" fontWeight="bold" mb={1}>{label}</Text>}
      {payload.map((p, i) => (
        <Flex key={i} align="center" gap={2}>
          <Box w="8px" h="8px" borderRadius="full" bg={p.color} />
          <Text fontSize="xs" color="white" fontWeight="bold">{p.name}: {fmt(p.value)}</Text>
        </Flex>
      ))}
    </Box>
  );
};

export default function Report() {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || 'financial';

  const [filterType, setFilterType] = useState('yearly');
  const [filterDate, setFilterDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [filterMonth, setFilterMonth] = useState(dayjs().format('YYYY-MM'));
  const [filterYear, setFilterYear] = useState(dayjs().format('YYYY'));
  const [roomId, setRoomId] = useState('');
  
  const [data, setData] = useState({});
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "#1c2333");
  const activeBg = useColorModeValue("blue.50", "blue.900");

  const loadingBg = useColorModeValue("whiteAlpha.700", "blackAlpha.600");

  const headers = () => {
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/admin/rooms?minimal=true`, { headers: headers() });
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter_type: filterType,
        room_id: roomId,
        date: filterDate,
        month: filterMonth,
        year: filterYear,
        detailed: 'true'
      });

      const res = await fetch(`${API}/admin/reports/${activeTab}?${params.toString()}`, { headers: headers() });
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error("Failed to load report data");
      }
    } catch (e) {
      toast.error("Network error fetching report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, filterType, filterDate, filterMonth, filterYear, roomId]);

  const handleExport = async (format = 'xlsx') => {
    const params = new URLSearchParams({
      tab: activeTab,
      filter_type: filterType,
      room_id: roomId || "",
      date: filterDate || "",
      month: filterMonth || "",
      year: filterYear || "",
      format: format
    });
    
    try {
      const toastId = toast.loading(`Exporting ${format.toUpperCase()}...`);
      const res = await fetch(`${API}/admin/reports/export?${params.toString()}`, {
        headers: headers()
      });
      
      if (!res.ok) {
        toast.error("Export failed. Please try again.", { id: toastId });
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${activeTab}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful", { id: toastId });
    } catch (e) {
      toast.error("Network error during export");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1700px" mx="auto">
      {/* Header & Filters */}
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" mb={8} gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" color={textColor}>{t("report.title")}</Text>
        </Box>
        <Flex gap={3} align="center">
          {['financial', 'unit_analysis', 'maintenance_analytics'].includes(activeTab) && (
            <>
              <Select size="sm" w="120px" bg={bg} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="daily">{t("report.daily")}</option>
                <option value="monthly">{t("report.monthly")}</option>
                <option value="yearly">{t("report.yearly")}</option>
              </Select>

              {filterType === 'daily' && (
                <Input size="sm" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} w="160px" bg={bg} />
              )}
              {filterType === 'monthly' && (
                <Input size="sm" type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} w="160px" bg={bg} />
              )}
              {filterType === 'yearly' && (
                <Select size="sm" w="120px" bg={bg} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              )}
            </>
          )}

          {['p_and_l', 'utility_trends'].includes(activeTab) && (
            <Select size="sm" w="120px" bg={bg} value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterType('yearly'); }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          )}

          <Menu>
            <MenuButton as={Button} size="sm" colorScheme="green" px={6} rightIcon={<FiChevronDown />}>
              {t("report.export")}
            </MenuButton>
            <MenuList bg={bg} borderColor={borderColor}>
              <MenuItem onClick={() => handleExport('xlsx')} _hover={{ bg: hoverBg }}>Excel (.xlsx)</MenuItem>
              <MenuItem onClick={() => handleExport('csv')} _hover={{ bg: hoverBg }}>CSV (.csv)</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Box minH="500px" pos="relative">
          {loading && (
            <Flex pos="absolute" zIndex={10} top={0} left={0} right={0} bottom={0} bg={loadingBg} backdropFilter="blur(5px)" align="center" justify="center" borderRadius="3xl">
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
          )}

          {/* 1. FINANCIAL SUMMARY */}
          {activeTab === 'financial' && (
            <Box>
               <Box bg={bg} p={8} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                  <Text fontSize="sm" fontWeight="black" letterSpacing="widest" color={mutedText} mb={1}>{t("report.net_cashflow")}</Text>
                  <Text fontSize="4xl" fontWeight="black" color={data.netProfit >= 0 ? textColor : "red.500"} letterSpacing="tighter">
                    {fmt(data.netProfit)}
                  </Text>
               </Box>

               {/* Financial Bar Chart */}
               <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                 <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>REVENUE vs EXPENSES</Text>
                 <Box h="280px">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                       { name: t("report.revenue_inflow"), value: Number(data.revenueCollected || 0), fill: CHART_COLORS.green },
                       { name: t("report.expense_outflow"), value: Number(data.totalExpenses || 0), fill: CHART_COLORS.red },
                       { name: t("report.net_cashflow"), value: Number(data.netProfit || 0), fill: data.netProfit >= 0 ? CHART_COLORS.blue : CHART_COLORS.red },
                     ]} layout="vertical" margin={{ left: 10, right: 30 }}>
                       <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                       <XAxis type="number" tickFormatter={(v) => fmt(v)} fontSize={11} />
                       <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                       <Tooltip content={<ChartTooltip />} />
                       <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                         {[
                           { fill: CHART_COLORS.green },
                           { fill: CHART_COLORS.red },
                           { fill: (data.netProfit || 0) >= 0 ? CHART_COLORS.blue : CHART_COLORS.red },
                         ].map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </Box>
               </Box>

               <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
                  {/* Revenue Inflow */}
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.revenue_inflow")}</Text>
                      <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="xs">{t("report.collected")}</Badge>
                    </Flex>
                    <TableContainer>
                      <Table size="md">
                        <Thead bg={hoverBg}><Tr><Th>{t("report.date")}</Th><Th>{t("report.tenant")}</Th><Th isNumeric>{t("report.amount")}</Th></Tr></Thead>
                        <Tbody>
                          {data.revenueItems?.map((item) => (
                            <Tr key={item.id} _hover={{ bg: hoverBg }}>
                              <Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(item.payment_date).format('MMM D')}</Td>
                              <Td>
                                <Text fontSize="sm" fontWeight="black" color={textColor} maxW="150px" isTruncated>{item.lease?.tenant?.name}</Text>
                                <Text fontSize="xs" fontWeight="bold" color={mutedText}>{item.lease?.room?.name || 'General'}</Text>
                              </Td>
                              <Td isNumeric fontSize="sm" fontWeight="black" color="green.500">+{fmt(item.amount_paid)}</Td>
                            </Tr>
                          ))}
                          {(!data.revenueItems || data.revenueItems.length === 0) && (
                            <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_records")}</Td></Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Flex p={3} bg="green.50" justify="space-between" _dark={{ bg: "green.900" }}>
                      <Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.total_in")}</Text>
                      <Text fontSize="sm" fontWeight="black" color="green.600">{fmt(data.revenueCollected)}</Text>
                    </Flex>
                  </Box>

                  {/* Expense Outflow */}
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.expense_outflow")}</Text>
                    </Flex>
                    <TableContainer>
                      <Table size="md">
                        <Thead bg={hoverBg}><Tr><Th>{t("report.date")}</Th><Th>{t("report.desc")}</Th><Th isNumeric>{t("report.amount")}</Th></Tr></Thead>
                        <Tbody>
                          {data.expenseItems?.map((item) => (
                            <Tr key={item.id} _hover={{ bg: hoverBg }}>
                              <Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(item.expense_date).format('MMM D')}</Td>
                              <Td>
                                <Text fontSize="sm" fontWeight="black" color={textColor} maxW="150px" isTruncated>{item.title}</Text>
                                <Text fontSize="xs" fontWeight="bold" color={mutedText}>{item.category}</Text>
                              </Td>
                              <Td isNumeric fontSize="sm" fontWeight="black" color="red.500">-{fmt(item.amount)}</Td>
                            </Tr>
                          ))}
                          {(!data.expenseItems || data.expenseItems.length === 0) && (
                            <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_records")}</Td></Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Flex p={3} bg="red.50" justify="space-between" _dark={{ bg: "red.900" }}>
                      <Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.total_out")}</Text>
                      <Text fontSize="sm" fontWeight="black" color="red.600">{fmt(data.totalExpenses)}</Text>
                    </Flex>
                  </Box>
               </SimpleGrid>
            </Box>
          )}

          {/* 2. ANNUAL TREND */}
          {activeTab === 'p_and_l' && (
            <Box>
               <Box bg={bg} p={8} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                  <Text fontSize="sm" fontWeight="black" letterSpacing="widest" color={mutedText} mb={1}>{t("report.annual")}</Text>
                  <Text fontSize="4xl" fontWeight="black" color={textColor} letterSpacing="tighter">{fmt(data.annualNet)}</Text>
               </Box>
               {/* P&L Area Chart */}
               <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                 <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>INCOME vs EXPENSE TREND</Text>
                 <Box h="300px">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={data.trendLabels?.map((label, idx) => ({
                       name: label, income: data.trendIncome?.[idx] || 0, expense: data.trendExpense?.[idx] || 0,
                     })) || []} margin={{ left: 10, right: 10 }}>
                       <defs>
                         <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                           <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                         </linearGradient>
                         <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.3} />
                           <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0} />
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                       <XAxis dataKey="name" fontSize={10} tickLine={false} />
                       <YAxis tickFormatter={(v) => fmt(v)} fontSize={10} />
                       <Tooltip content={<ChartTooltip />} />
                       <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                       <Area type="monotone" dataKey="income" name={t("report.income")} stroke={CHART_COLORS.green} fill="url(#greenGrad)" strokeWidth={2} />
                       <Area type="monotone" dataKey="expense" name={t("report.expense")} stroke={CHART_COLORS.red} fill="url(#redGrad)" strokeWidth={2} />
                     </AreaChart>
                   </ResponsiveContainer>
                 </Box>
               </Box>
               <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                  <TableContainer>
                    <Table size="md">
                      <Thead bg={hoverBg}><Tr><Th>{t("report.period")}</Th><Th isNumeric>{t("report.income")}</Th><Th isNumeric>{t("report.expense")}</Th><Th isNumeric>{t("report.net_profit")}</Th></Tr></Thead>
                      <Tbody>
                        {data.trendLabels?.map((label, idx) => (
                          <Tr key={idx} _hover={{ bg: hoverBg }}>
                            <Td fontSize="sm" fontWeight="black" color={textColor}>{label}</Td>
                            <Td fontSize="sm" fontWeight="bold" color="green.500" isNumeric>{fmt(data.trendIncome[idx])}</Td>
                            <Td fontSize="sm" fontWeight="bold" color="red.500" isNumeric>{fmt(data.trendExpense[idx])}</Td>
                            <Td fontSize="sm" fontWeight="black" color={(data.trendIncome[idx] - data.trendExpense[idx]) >= 0 ? textColor : 'red.600'} isNumeric>{fmt(data.trendIncome[idx] - data.trendExpense[idx])}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
               </Box>
            </Box>
          )}

          {/* 3. AGING (A/R) */}
          {activeTab === 'aging' && (
            <Box>
                <Box bg={bg} p={8} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} mb={8}>
                  <Text fontSize="xl" fontWeight="black" color={textColor}>{t("report.aging_title")}</Text>
                  <Text fontSize="sm" fontWeight="medium" color={mutedText}>{t("report.aging_desc")}</Text>
                </Box>
                {/* Aging Bar Chart */}
                <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                  <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>RECEIVABLES BY AGING BUCKET</Text>
                  <Box h="250px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={['current', '30_days', '60_days', '90_plus'].map((bucket, idx) => ({
                        name: bucket.replace('_', ' ').toUpperCase(),
                        value: data.aging?.[bucket]?.reduce((a, b) => a + Number(b.amount), 0) || 0,
                      }))} margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis tickFormatter={(v) => fmt(v)} fontSize={10} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Amount" radius={[8, 8, 0, 0]} barSize={48}>
                          {[CHART_COLORS.green, CHART_COLORS.orange, '#ED8936', CHART_COLORS.red].map((color, idx) => <Cell key={idx} fill={color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                   {['current', '30_days', '60_days', '90_plus'].map((bucket, idx) => {
                      const colors = ['green.500', 'orange.400', 'orange.500', 'red.600'];
                      const sum = data.aging?.[bucket]?.reduce((a, b) => a + Number(b.amount), 0) || 0;
                      return (
                        <Box key={bucket} bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm" pos="relative" overflow="hidden">
                           <Box pos="absolute" top={0} left={0} w="4px" h="100%" bg={colors[idx]} />
                           <Text fontSize="sm" fontWeight="black" letterSpacing="widest" color={mutedText} mb={1}>{bucket.replace('_', ' ')}</Text>
                           <Text fontSize="2xl" fontWeight="black" color={textColor}>{fmt(sum)}</Text>
                           <Text fontSize="sm" fontWeight="bold" color={mutedText} mt={1}>{data.aging?.[bucket]?.length || 0} {t("report.invoices")}</Text>
                        </Box>
                      )
                   })}
                </SimpleGrid>
                <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                  <TableContainer>
                    <Table size="md">
                      <Thead bg={hoverBg}><Tr><Th>{t("report.tenant_room")}</Th><Th>{t("report.due_date")}</Th><Th textAlign="center">{t("report.days_late")}</Th><Th isNumeric>{t("report.balance")}</Th></Tr></Thead>
                      <Tbody>
                        {['current', '30_days', '60_days', '90_plus'].flatMap(b => data.aging?.[b] || []).map(bill => (
                          <Tr key={bill.id} _hover={{ bg: hoverBg }}>
                            <Td>
                              <Text fontSize="sm" fontWeight="black" color={textColor}>{bill.lease?.tenant?.name}</Text>
                              <Text fontSize="sm" fontWeight="bold" color={mutedText}>{bill.lease?.room?.name}</Text>
                            </Td>
                            <Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(bill.due_date).format('MMM D, YYYY')}</Td>
                            <Td textAlign="center">
                              <Badge colorScheme={dayjs(bill.due_date).isBefore(dayjs()) ? 'red' : 'green'}>{dayjs(bill.due_date).isBefore(dayjs()) ? `${dayjs().diff(bill.due_date, 'day')} Days` : 'Current'}</Badge>
                            </Td>
                            <Td fontSize="sm" fontWeight="black" color={textColor} isNumeric>{fmt(bill.amount)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
            </Box>
          )}

          {/* 4. UNIT ANALYSIS */}
          {activeTab === 'unit_analysis' && (
            <Box>
               <Box bg={bg} p={8} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} mb={8}>
                  <Box maxW="md">
                    <Text fontSize="sm" fontWeight="black" color={mutedText} mb={1}>{t("report.unit_analyze")}</Text>
                    <Select bg={bg} borderRadius="xl" fontWeight="bold" fontSize="sm" value={roomId} onChange={e => setRoomId(e.target.value)}>
                      <option value="">{t("report.choose_unit")}</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                  </Box>
               </Box>

               {roomId ? (
                  <Box>
                     <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                        <Box bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
                          <Text fontSize="sm" fontWeight="black" color={mutedText} mb={1}>{t("report.unit_rev")}</Text>
                          <Text fontSize="3xl" fontWeight="black" color="green.500">{fmt(data.roomRevenue)}</Text>
                        </Box>
                        <Box bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
                          <Text fontSize="sm" fontWeight="black" color={mutedText} mb={1}>{t("report.unit_exp")}</Text>
                          <Text fontSize="3xl" fontWeight="black" color="red.500">{fmt(data.roomExpenses)}</Text>
                        </Box>
                        <Box bg="gray.900" p={6} borderRadius="2xl" shadow="xl" _dark={{ bg: "gray.700" }}>
                          <Text fontSize="sm" fontWeight="black" color="blue.400" mb={1}>{t("report.unit_net")}</Text>
                          <Text fontSize="3xl" fontWeight="black" color="white">{fmt(data.roomNet)}</Text>
                        </Box>
                     </SimpleGrid>

                     {/* Unit Analysis Donut Chart */}
                     <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                       <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>REVENUE vs EXPENSES SPLIT</Text>
                       <Box h="260px">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie data={[
                               { name: t('report.unit_rev'), value: Number(data.roomRevenue || 0) },
                               { name: t('report.unit_exp'), value: Number(data.roomExpenses || 0) },
                             ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                               <Cell fill={CHART_COLORS.green} />
                               <Cell fill={CHART_COLORS.red} />
                             </Pie>
                             <Tooltip content={<ChartTooltip />} />
                             <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                           </PieChart>
                         </ResponsiveContainer>
                       </Box>
                     </Box>

                     <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
                        {/* Unit Inflow Table */}
                        <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                          <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center"><Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.unit_inflow")}</Text></Flex>
                          <TableContainer>
                            <Table size="md">
                              <Tbody>
                                {data.roomRevenueItems?.map(i => <Tr key={i.id}><Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(i.payment_date).format('MMM D')}</Td><Td fontSize="sm" fontWeight="black" color={textColor}>{i.lease?.tenant?.name}</Td><Td isNumeric fontSize="sm" fontWeight="black" color="green.500">+{fmt(i.amount_paid)}</Td></Tr>)}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                        {/* Unit Outflow Table */}
                        <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                          <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center"><Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.unit_outflow")}</Text></Flex>
                          <TableContainer>
                            <Table size="md">
                              <Tbody>
                                {data.roomExpenseItems?.map(i => <Tr key={i.id}><Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(i.expense_date).format('MMM D')}</Td><Td fontSize="sm" fontWeight="black" color={textColor}>{i.title}</Td><Td isNumeric fontSize="sm" fontWeight="black" color="red.500">-{fmt(i.amount)}</Td></Tr>)}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                     </SimpleGrid>
                  </Box>
               ) : (
                 <Box textAlign="center" py={12} bg={bg} borderRadius="lg" border="2px dashed" borderColor={borderColor}>
                    <Text color={mutedText} fontStyle="italic">{t("report.req_select")}</Text>
                 </Box>
               )}
            </Box>
          )}

          {/* 5. OCCUPANCY */}
          {activeTab === 'occupancy' && (
            <Box>
               <Box bg={bg} p={8} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} mb={8}>
                  <Flex justify="space-between" align="flex-start" mb={8}>
                    <Box>
                      <Text fontSize="2xl" fontWeight="black" color={textColor} letterSpacing="tight">{t("report.status_overview")}</Text>
                      <Text fontSize="sm" fontWeight="bold" color={mutedText}>{t("report.units")}: {data.totalRooms}</Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontSize="4xl" fontWeight="black" color="blue.500">{data.occupancyRate?.toFixed(1)}%</Text>
                      <Text fontSize="sm" fontWeight="black" letterSpacing="widest" color={mutedText}>{t("report.occupancy")}</Text>
                    </Box>
                  </Flex>
                  <SimpleGrid columns={3} spacing={4}>
                    <Box bg="green.50" p={4} borderRadius="2xl" border="1px solid" borderColor="green.100" textAlign="center" _dark={{ bg: "green.900", borderColor: "green.800" }}><Text fontSize="2xl" fontWeight="black" color="green.600">{data.occupiedRooms}</Text><Text fontSize="sm" fontWeight="black" color="green.600">{t("report.occupied")}</Text></Box>
                    <Box bg="blue.50" p={4} borderRadius="2xl" border="1px solid" borderColor="blue.100" textAlign="center" _dark={{ bg: "blue.900", borderColor: "blue.800" }}><Text fontSize="2xl" fontWeight="black" color="blue.600">{data.vacantRooms}</Text><Text fontSize="sm" fontWeight="black" color="blue.600">{t("report.available")}</Text></Box>
                    <Box bg="orange.50" p={4} borderRadius="2xl" border="1px solid" borderColor="orange.100" textAlign="center" _dark={{ bg: "orange.900", borderColor: "orange.800" }}><Text fontSize="2xl" fontWeight="black" color="orange.600">{data.maintenanceRooms}</Text><Text fontSize="sm" fontWeight="black" color="orange.600">{t("report.repair")}</Text></Box>
                  </SimpleGrid>
               </Box>
               {/* Occupancy Pie Chart */}
               <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                 <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>ROOM STATUS DISTRIBUTION</Text>
                 <Box h="280px">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={[
                         { name: t('report.occupied'), value: Number(data.occupiedRooms || 0) },
                         { name: t('report.available'), value: Number(data.vacantRooms || 0) },
                         { name: t('report.repair'), value: Number(data.maintenanceRooms || 0) },
                       ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                         <Cell fill={CHART_COLORS.green} />
                         <Cell fill={CHART_COLORS.blue} />
                         <Cell fill={CHART_COLORS.orange} />
                       </Pie>
                       <Tooltip content={<ChartTooltip />} />
                       <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </Box>
               </Box>
               <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} align="center"><Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.avail_units")}</Text></Flex>
                    <TableContainer>
                      <Table size="md"><Thead bg={hoverBg}><Tr><Th>{t("report.room")}</Th><Th isNumeric>{t("report.price")}</Th></Tr></Thead>
                      <Tbody>
                        {data.availableRooms?.map(r => <Tr key={r.id}><Td><Text fontSize="sm" fontWeight="black" color={textColor}>{r.name}</Text><Text fontSize="xs" fontWeight="bold" color="green.500">{t("report.ready")}</Text></Td><Td isNumeric fontSize="sm" fontWeight="bold" color={mutedText}>{fmt(r.price || r.base_rent_price)}</Td></Tr>)}
                      </Tbody></Table>
                    </TableContainer>
                  </Box>
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} align="center"><Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.unavail_units")}</Text></Flex>
                    <TableContainer>
                      <Table size="md"><Thead bg={hoverBg}><Tr><Th>{t("report.room")}</Th><Th>{t("report.status")}</Th><Th>{t("report.details")}</Th></Tr></Thead>
                      <Tbody>
                        {data.unavailableRooms?.map(r => <Tr key={r.id}><Td fontSize="sm" fontWeight="black" color={textColor}>{r.name}</Td><Td><Badge colorScheme={r.status === 'maintenance' ? 'orange' : 'blue'}>{r.status}</Badge></Td><Td fontSize="sm" color={mutedText}>{r.status === 'occupied' && <Box><Text fontWeight="bold">{r.leases?.[0]?.tenant?.name}</Text><Text fontSize="xs">{t("report.ends")}: {dayjs(r.leases?.[0]?.end_date).format('MMM D, YY')}</Text></Box>}</Td></Tr>)}
                      </Tbody></Table>
                    </TableContainer>
                  </Box>
               </SimpleGrid>
            </Box>
          )}

          {/* 6. LEASE TRACKING */}
          {activeTab === 'lease_tracking' && (
            <Box>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.next_30")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color="orange.500">{data.expiringNext30 || 0}</Text>
                </Box>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.expired")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color="red.500">{data.expired || 0}</Text>
                </Box>
              </SimpleGrid>
              {/* Lease Status Chart */}
              <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>LEASE STATUS OVERVIEW</Text>
                <Box h="220px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: t('report.active'), value: (data.leases?.length || 0) - (data.expiringNext30 || 0), fill: CHART_COLORS.green },
                      { name: t('report.expiring'), value: data.expiringNext30 || 0, fill: CHART_COLORS.orange },
                      { name: t('report.expired'), value: data.expired || 0, fill: CHART_COLORS.red },
                    ]} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                        <Cell fill={CHART_COLORS.green} />
                        <Cell fill={CHART_COLORS.orange} />
                        <Cell fill={CHART_COLORS.red} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
              <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <TableContainer>
                  <Table size="md">
                    <Thead bg={hoverBg}>
                      <Tr>
                        <Th>{t("report.tenant")}</Th>
                        <Th>{t("report.room")}</Th>
                        <Th>{t("report.end_date")}</Th>
                        <Th>{t("report.status")}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.leases?.map(lease => (
                        <Tr key={lease.id} _hover={{ bg: hoverBg }}>
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{lease.tenant?.name}</Td>
                          <Td fontSize="xs" fontWeight="bold" color={mutedText}>{lease.room?.name}</Td>
                          <Td fontSize="xs" fontWeight="bold" color={textColor}>{dayjs(lease.end_date).format('MMM D, YYYY')}</Td>
                          <Td>
                             <Badge colorScheme={dayjs(lease.end_date).isBefore(dayjs().add(30, 'day')) ? 'orange' : 'green'}>
                               {dayjs(lease.end_date).isBefore(dayjs().add(30, 'day')) ? t("report.expiring") : t("report.active")}
                             </Badge>
                          </Td>
                        </Tr>
                      ))}
                      {(!data.leases || data.leases.length === 0) && (
                        <Tr><Td colSpan={4} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_leases")}</Td></Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* 7. MAINTENANCE ANALYTICS */}
          {activeTab === 'maintenance_analytics' && (
            <Box>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.total_req")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color={textColor}>{data.totalRequests || 0}</Text>
                </Box>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.pending")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color="orange.500">{data.pendingRequests || 0}</Text>
                </Box>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.total_cost")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color="red.500">{fmt(data.totalCost || 0)}</Text>
                </Box>
              </SimpleGrid>
              {/* Maintenance Status Chart */}
              <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>REQUEST STATUS BREAKDOWN</Text>
                <Box h="220px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: t('report.total_req'), count: data.totalRequests || 0 },
                      { name: t('report.pending'), count: data.pendingRequests || 0 },
                      { name: 'Completed', count: (data.totalRequests || 0) - (data.pendingRequests || 0) },
                    ]} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" name="Requests" radius={[8, 8, 0, 0]} barSize={48}>
                        <Cell fill={CHART_COLORS.blue} />
                        <Cell fill={CHART_COLORS.orange} />
                        <Cell fill={CHART_COLORS.green} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
              <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg}>
                  <Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.recent_req")}</Text>
                </Flex>
                <TableContainer>
                  <Table size="md">
                    <Thead bg={hoverBg}>
                      <Tr>
                        <Th>{t("report.date")}</Th>
                        <Th>{t("report.issue")}</Th>
                        <Th isNumeric>{t("report.total_cost")}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.requests?.slice(0, 10).map(req => (
                        <Tr key={req.id} _hover={{ bg: hoverBg }}>
                          <Td fontSize="xs" fontWeight="bold" color={mutedText}>{dayjs(req.created_at).format('MMM D, YYYY')}</Td>
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{req.title}</Td>
                          <Td isNumeric fontSize="sm" fontWeight="black" color="red.500">
                            {fmt(req.expenses?.reduce((a, b) => a + Number(b.amount), 0) || 0)}
                          </Td>
                        </Tr>
                      ))}
                      {(!data.requests || data.requests.length === 0) && (
                        <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_maint")}</Td></Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* 8. TENANT PERFORMANCE */}
          {activeTab === 'tenant_performance' && (
            <Box>
              {/* Tenant Performance Chart */}
              {data.tenants?.length > 0 && (
                <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                  <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>TOP TENANTS BY PAYMENT</Text>
                  <Box h="280px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.tenants?.slice(0, 8).map(t => ({
                        name: t.name?.length > 12 ? t.name.substring(0, 12) + '...' : t.name,
                        paid: Number(t.total_paid || 0),
                        late: Number(t.late_incidents || 0),
                      })) || []} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis type="number" tickFormatter={(v) => fmt(v)} fontSize={10} />
                        <YAxis type="category" dataKey="name" width={100} fontSize={10} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="paid" name="Total Paid" fill={CHART_COLORS.green} radius={[0, 8, 8, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
              <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
              <TableContainer>
                <Table size="md">
                  <Thead bg={hoverBg}>
                    <Tr>
                      <Th>{t("report.tenant")}</Th>
                      <Th isNumeric>{t("report.total_paid")}</Th>
                      <Th textAlign="center">{t("report.late")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.tenants?.map(tenantItem => (
                      <Tr key={tenantItem.id} _hover={{ bg: hoverBg }}>
                        <Td fontSize="sm" fontWeight="black" color={textColor}>{tenantItem.name}</Td>
                        <Td isNumeric fontSize="sm" fontWeight="black" color="green.500">{fmt(tenantItem.total_paid || 0)}</Td>
                        <Td textAlign="center">
                          <Badge colorScheme={tenantItem.late_incidents > 0 ? 'red' : 'gray'} borderRadius="full" px={3} py={1}>
                            {tenantItem.late_incidents || 0}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                    {(!data.tenants || data.tenants.length === 0) && (
                      <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_tenant")}</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
              </Box>
            </Box>
          )}

          {/* 9. UTILITY TRENDS */}
          {activeTab === 'utility_trends' && (
            <Box>
              {/* Utility Line Chart */}
              <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>MONTHLY CONSUMPTION ({data.year})</Text>
                <Box h="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyStats ? Object.entries(data.monthlyStats).map(([month, stats]) => ({
                      name: dayjs().month(month - 1).format('MMM'),
                      electricity: Math.round(stats.electricity || 0),
                      water: Math.round(stats.water || 0),
                    })) : []} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="electricity" name={t('report.elec')} stroke={CHART_COLORS.orange} strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="water" name={t('report.water')} stroke={CHART_COLORS.blue} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
              <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
              <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg}>
                <Text fontSize="sm" fontWeight="black" color={textColor}>{t("report.utility_consume")} ({data.year})</Text>
              </Flex>
              <TableContainer>
                <Table size="md">
                  <Thead bg={hoverBg}>
                    <Tr>
                      <Th>{t("report.date")}</Th>
                      <Th isNumeric>{t("report.elec")}</Th>
                      <Th isNumeric>{t("report.water")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.monthlyStats && Object.entries(data.monthlyStats).map(([month, stats]) => (
                      <Tr key={month} _hover={{ bg: hoverBg }}>
                        <Td fontSize="sm" fontWeight="bold" color={textColor}>{dayjs().month(month - 1).format('MMMM')}</Td>
                        <Td isNumeric fontSize="sm" fontWeight="bold" color="blue.500">{Math.round(stats.electricity)}</Td>
                        <Td isNumeric fontSize="sm" fontWeight="bold" color="blue.300">{Math.round(stats.water)}</Td>
                      </Tr>
                    ))}
                    {(!data.monthlyStats || Object.keys(data.monthlyStats).length === 0) && (
                      <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_util")}</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
              </Box>
            </Box>
          )}

          {/* 10. DEPOSIT LEDGER */}
          {activeTab === 'deposit_ledger' && (
            <Box>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.total_held")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color="blue.500">{fmt(data.totalHeld || 0)}</Text>
                </Box>
                <Box bg={bg} p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="xs" fontWeight="black" color={mutedText} mb={1}>{t("report.total_refund")}</Text>
                  <Text fontSize="3xl" fontWeight="black" color={mutedText}>{fmt(data.totalRefunded || 0)}</Text>
                </Box>
              </SimpleGrid>
              {/* Deposit Donut Chart */}
              {(Number(data.totalHeld || 0) > 0 || Number(data.totalRefunded || 0) > 0) && (
                <Box bg={bg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                  <Text fontSize="sm" fontWeight="black" color={mutedText} mb={4}>DEPOSIT DISTRIBUTION</Text>
                  <Box h="260px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: t('report.total_held'), value: Number(data.totalHeld || 0) },
                          { name: t('report.total_refund'), value: Number(data.totalRefunded || 0) },
                        ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                          <Cell fill={CHART_COLORS.blue} />
                          <Cell fill={CHART_COLORS.teal} />
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
              <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <TableContainer>
                  <Table size="md">
                    <Thead bg={hoverBg}>
                      <Tr>
                        <Th>{t("report.tenant")}</Th>
                        <Th>{t("report.room")}</Th>
                        <Th isNumeric>{t("report.deposit")}</Th>
                        <Th textAlign="center">{t("report.status")}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.leases?.map(lease => (
                        <Tr key={lease.id} _hover={{ bg: hoverBg }}>
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{lease.tenant?.name}</Td>
                          <Td fontSize="xs" fontWeight="bold" color={mutedText}>{lease.room?.name}</Td>
                          <Td isNumeric fontSize="sm" fontWeight="black" color={textColor}>{fmt(lease.security_deposit || 0)}</Td>
                          <Td textAlign="center">
                            <Badge colorScheme={lease.deposit_status === 'paid' ? 'green' : 'gray'} borderRadius="full" px={3} py={1}>
                              {lease.deposit_status || 'Unpaid'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                      {(!data.leases || data.leases.length === 0) && (
                        <Tr><Td colSpan={4} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">{t("report.no_deposit")}</Td></Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
          
      </Box>
    </Box>
  );
}

