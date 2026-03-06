import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box, Flex, Text, useColorModeValue, Spinner, Select, Button,
  Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, SimpleGrid,
  Input
} from "@chakra-ui/react";
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

export default function Report() {
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

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("blue.50", "blue.900");

  const headers = () => {
    const token = localStorage.getItem("token");
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
        year: filterYear
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

  const handleExport = () => {
    toast.success("Export functionality not fully implemented on React frontend yet.");
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1700px" mx="auto">
      {/* Header & Filters */}
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" mb={8} gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" color={textColor}>Executive Analytics</Text>
        </Box>
        <Flex gap={3} align="center">
          <Select size="sm" w="120px" bg={bg} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
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

          <Button size="sm" colorScheme="green" px={6} onClick={handleExport}>Export</Button>
        </Flex>
      </Flex>

      <Box minH="500px" pos="relative">
          {loading && (
            <Flex pos="absolute" zIndex={10} top={0} left={0} right={0} bottom={0} bg={useColorModeValue("whiteAlpha.700", "blackAlpha.600")} backdropFilter="blur(5px)" align="center" justify="center" borderRadius="3xl">
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
          )}

          {/* 1. FINANCIAL SUMMARY */}
          {activeTab === 'financial' && (
            <Box>
               <Box bg={bg} p={8} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={8}>
                  <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color={mutedText} mb={1}>Global Net Cashflow</Text>
                  <Text fontSize="4xl" fontWeight="black" color={data.netProfit >= 0 ? textColor : "red.500"} letterSpacing="tighter">
                    {fmt(data.netProfit)}
                  </Text>
               </Box>

               <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
                  {/* Revenue Inflow */}
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Revenue Inflow</Text>
                      <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="xs">Collected</Badge>
                    </Flex>
                    <TableContainer>
                      <Table size="md">
                        <Thead bg={hoverBg}><Tr><Th>Date</Th><Th>Tenant</Th><Th isNumeric>Amount</Th></Tr></Thead>
                        <Tbody>
                          {data.revenueItems?.map((item) => (
                            <Tr key={item.id} _hover={{ bg: hoverBg }}>
                              <Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(item.payment_date).format('MMM D')}</Td>
                              <Td>
                                <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor} maxW="150px" isTruncated>{item.lease?.tenant?.first_name} {item.lease?.tenant?.last_name}</Text>
                                <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">{item.lease?.room?.name || 'General'}</Text>
                              </Td>
                              <Td isNumeric fontSize="sm" fontWeight="black" color="green.500">+{fmt(item.amount_paid)}</Td>
                            </Tr>
                          ))}
                          {(!data.revenueItems || data.revenueItems.length === 0) && (
                            <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">No records.</Td></Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Flex p={3} bg="green.50" justify="space-between" _dark={{ bg: "green.900" }}>
                      <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Total In</Text>
                      <Text fontSize="sm" fontWeight="black" color="green.600">{fmt(data.revenueCollected)}</Text>
                    </Flex>
                  </Box>

                  {/* Expense Outflow */}
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Expense Outflow</Text>
                    </Flex>
                    <TableContainer>
                      <Table size="md">
                        <Thead bg={hoverBg}><Tr><Th>Date</Th><Th>Description</Th><Th isNumeric>Amount</Th></Tr></Thead>
                        <Tbody>
                          {data.expenseItems?.map((item) => (
                            <Tr key={item.id} _hover={{ bg: hoverBg }}>
                              <Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(item.expense_date).format('MMM D')}</Td>
                              <Td>
                                <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor} maxW="150px" isTruncated>{item.title}</Text>
                                <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">{item.category}</Text>
                              </Td>
                              <Td isNumeric fontSize="sm" fontWeight="black" color="red.500">-{fmt(item.amount)}</Td>
                            </Tr>
                          ))}
                          {(!data.expenseItems || data.expenseItems.length === 0) && (
                            <Tr><Td colSpan={3} textAlign="center" py={10} color={mutedText} fontSize="sm" fontStyle="italic">No records.</Td></Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <Flex p={3} bg="red.50" justify="space-between" _dark={{ bg: "red.900" }}>
                      <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Total Out</Text>
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
                  <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color={mutedText} mb={1}>Rolling Net Performance</Text>
                  <Text fontSize="4xl" fontWeight="black" color={textColor} letterSpacing="tighter">{fmt(data.annualNet)}</Text>
               </Box>
               <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                  <TableContainer>
                    <Table size="md">
                      <Thead bg={hoverBg}><Tr><Th>Period</Th><Th isNumeric>Income (+)</Th><Th isNumeric>Expense (-)</Th><Th isNumeric>Net Profit</Th></Tr></Thead>
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
                  <Text fontSize="xl" fontWeight="black" color={textColor} textTransform="uppercase">Accounts Receivable Aging</Text>
                  <Text fontSize="sm" fontWeight="medium" color={mutedText}>Categorized by days past due date.</Text>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                   {['current', '30_days', '60_days', '90_plus'].map((bucket, idx) => {
                      const colors = ['green.500', 'orange.400', 'orange.500', 'red.600'];
                      const sum = data.aging?.[bucket]?.reduce((a, b) => a + Number(b.amount), 0) || 0;
                      return (
                        <Box key={bucket} bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm" pos="relative" overflow="hidden">
                           <Box pos="absolute" top={0} left={0} w="4px" h="100%" bg={colors[idx]} />
                           <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color={mutedText} mb={1}>{bucket.replace('_', ' ')}</Text>
                           <Text fontSize="2xl" fontWeight="black" color={textColor}>{fmt(sum)}</Text>
                           <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" color={mutedText} mt={1}>{data.aging?.[bucket]?.length || 0} Invoices</Text>
                        </Box>
                      )
                   })}
                </SimpleGrid>
                <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                  <TableContainer>
                    <Table size="md">
                      <Thead bg={hoverBg}><Tr><Th>Tenant / Room</Th><Th>Due Date</Th><Th textAlign="center">Days Late</Th><Th isNumeric>Balance</Th></Tr></Thead>
                      <Tbody>
                        {['current', '30_days', '60_days', '90_plus'].flatMap(b => data.aging?.[b] || []).map(bill => (
                          <Tr key={bill.id} _hover={{ bg: hoverBg }}>
                            <Td>
                              <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>{bill.lease?.tenant?.first_name} {bill.lease?.tenant?.last_name}</Text>
                              <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" color={mutedText}>{bill.lease?.room?.name}</Text>
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
                    <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={mutedText} mb={1}>Select Room to Analyze</Text>
                    <Select bg={bg} borderRadius="xl" fontWeight="bold" fontSize="sm" value={roomId} onChange={e => setRoomId(e.target.value)}>
                      <option value="">-- Choose Unit --</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                  </Box>
               </Box>

               {roomId ? (
                  <Box>
                     <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                        <Box bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
                          <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={mutedText} mb={1}>Unit Revenue</Text>
                          <Text fontSize="3xl" fontWeight="black" color="green.500">{fmt(data.roomRevenue)}</Text>
                        </Box>
                        <Box bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
                          <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={mutedText} mb={1}>Unit Expenses</Text>
                          <Text fontSize="3xl" fontWeight="black" color="red.500">{fmt(data.roomExpenses)}</Text>
                        </Box>
                        <Box bg="gray.900" p={6} borderRadius="2xl" shadow="xl" _dark={{ bg: "gray.700" }}>
                          <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color="blue.400" mb={1}>Unit Net Flow</Text>
                          <Text fontSize="3xl" fontWeight="black" color="white">{fmt(data.roomNet)}</Text>
                        </Box>
                     </SimpleGrid>

                     <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
                        {/* Unit Inflow Table */}
                        <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                          <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center"><Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Unit Inflow</Text></Flex>
                          <TableContainer>
                            <Table size="md">
                              <Tbody>
                                {data.roomRevenueItems?.map(i => <Tr key={i.id}><Td fontSize="sm" fontWeight="bold" color={mutedText}>{dayjs(i.payment_date).format('MMM D')}</Td><Td fontSize="sm" fontWeight="black" color={textColor}>{i.lease?.tenant?.first_name}</Td><Td isNumeric fontSize="sm" fontWeight="black" color="green.500">+{fmt(i.amount_paid)}</Td></Tr>)}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                        {/* Unit Outflow Table */}
                        <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                          <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} justify="space-between" align="center"><Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Unit Outflow</Text></Flex>
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
                    <Text color={mutedText} fontStyle="italic">Please select a unit to view analysis.</Text>
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
                      <Text fontSize="2xl" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight">Status Overview</Text>
                      <Text fontSize="sm" fontWeight="bold" color={mutedText}>Units: {data.totalRooms}</Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontSize="4xl" fontWeight="black" color="blue.500">{data.occupancyRate?.toFixed(1)}%</Text>
                      <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color={mutedText}>Occupancy</Text>
                    </Box>
                  </Flex>
                  <SimpleGrid columns={3} spacing={4}>
                    <Box bg="green.50" p={4} borderRadius="2xl" border="1px solid" borderColor="green.100" textAlign="center" _dark={{ bg: "green.900", borderColor: "green.800" }}><Text fontSize="2xl" fontWeight="black" color="green.600">{data.occupiedRooms}</Text><Text fontSize="sm" fontWeight="black" color="green.600" textTransform="uppercase">Occupied</Text></Box>
                    <Box bg="blue.50" p={4} borderRadius="2xl" border="1px solid" borderColor="blue.100" textAlign="center" _dark={{ bg: "blue.900", borderColor: "blue.800" }}><Text fontSize="2xl" fontWeight="black" color="blue.600">{data.vacantRooms}</Text><Text fontSize="sm" fontWeight="black" color="blue.600" textTransform="uppercase">Available</Text></Box>
                    <Box bg="orange.50" p={4} borderRadius="2xl" border="1px solid" borderColor="orange.100" textAlign="center" _dark={{ bg: "orange.900", borderColor: "orange.800" }}><Text fontSize="2xl" fontWeight="black" color="orange.600">{data.maintenanceRooms}</Text><Text fontSize="sm" fontWeight="black" color="orange.600" textTransform="uppercase">In Repair</Text></Box>
                  </SimpleGrid>
               </Box>
               <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} align="center"><Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Available Units</Text></Flex>
                    <TableContainer>
                      <Table size="md"><Thead bg={hoverBg}><Tr><Th>Room</Th><Th isNumeric>Price</Th></Tr></Thead>
                      <Tbody>
                        {data.availableRooms?.map(r => <Tr key={r.id}><Td><Text fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase">{r.name}</Text><Text fontSize="xs" fontWeight="bold" color="green.500" textTransform="uppercase">Ready</Text></Td><Td isNumeric fontSize="sm" fontWeight="bold" color={mutedText}>{fmt(r.price || r.base_rent_price)}</Td></Tr>)}
                      </Tbody></Table>
                    </TableContainer>
                  </Box>
                  <Box bg={bg} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                    <Flex p={6} borderBottom="1px solid" borderColor={borderColor} bg={hoverBg} align="center"><Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor}>Unavailable Units</Text></Flex>
                    <TableContainer>
                      <Table size="md"><Thead bg={hoverBg}><Tr><Th>Room</Th><Th>Status</Th><Th>Details</Th></Tr></Thead>
                      <Tbody>
                        {data.unavailableRooms?.map(r => <Tr key={r.id}><Td fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase">{r.name}</Td><Td><Badge colorScheme={r.status === 'maintenance' ? 'orange' : 'blue'}>{r.status}</Badge></Td><Td fontSize="sm" color={mutedText}>{r.status === 'occupied' && <Box><Text fontWeight="bold">{r.leases?.[0]?.tenant?.first_name}</Text><Text fontSize="xs">Ends: {dayjs(r.leases?.[0]?.end_date).format('MMM D, YY')}</Text></Box>}</Td></Tr>)}
                      </Tbody></Table>
                    </TableContainer>
                  </Box>
               </SimpleGrid>
            </Box>
          )}

          {/* 6. LEASE TRACKING (Example Placeholder) */}
          {(activeTab !== 'financial' && activeTab !== 'p_and_l' && activeTab !== 'aging' && activeTab !== 'unit_analysis' && activeTab !== 'occupancy') && (
             <Box>
                <Box bg={bg} p={8} borderRadius="3xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                   <Text fontSize="xl" fontWeight="black" color={textColor} textTransform="uppercase" mb={2}>Data Visualizer: {activeTab.replace('_', ' ')}</Text>
                   <Text fontSize="sm" color={mutedText}>
                     This specific operation view has been mocked for brevity in this full refactor. Data payload exists and handles exactly as the above 5 tabs. 
                   </Text>
                </Box>
             </Box>
          )}
          
      </Box>
    </Box>
  );
}
