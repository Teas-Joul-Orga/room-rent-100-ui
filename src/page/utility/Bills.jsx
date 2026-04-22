import React, { useState, useEffect, useMemo } from "react";
import { useSessionState } from "../../hooks/useSessionState";
import { Box, Flex, Text, Tabs, TabList, TabPanels, Tab, TabPanel, Badge, Button, useColorModeValue, Spinner, Select, Tooltip, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, TableContainer, Table, Thead, Tbody, Tr, Th, Td, Input } from "@chakra-ui/react";
import { FiBell, FiAlertCircle, FiDroplet, FiCalendar, FiSend, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const API = "http://localhost:8000/api/v1/admin";

const formatCurrency = (val) => {
  const c = (localStorage.getItem("currency") || sessionStorage.getItem("currency")) || "$";
  const r = parseFloat((localStorage.getItem("exchangeRate") || sessionStorage.getItem("exchangeRate")) || "4000");
  const isRiel = c === "៛" || c === "KHR" || c === "Riel";
  return isRiel ? `៛ ${(Number(val) * r).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : `$ ${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

const KHQR_LOGO = "https://nbc.gov.kh/images/khqr_logo.png";

export default function Bills() {
  const { t } = useTranslation();
  const [leases, setLeases] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isNotifying, setIsNotifying] = useState(false);
  const [isNotifyingAllRent, setIsNotifyingAllRent] = useState(false);
  const [isNotifyingAllUtil, setIsNotifyingAllUtil] = useState(false);
  const [selectedMonth, setSelectedMonth] = useSessionState("billsMonth", "all");

  const [searchRent, setSearchRent] = useSessionState("billsSearchRent", "");
  const [sortFieldRent, setSortFieldRent] = useSessionState("billsSortRent", null);
  const [sortOrderRent, setSortOrderRent] = useSessionState("billsDirRent", "asc");

  const [searchUtil, setSearchUtil] = useSessionState("billsSearchUtil", "");
  const [typeFilterUtil, setTypeFilterUtil] = useSessionState("billsTypeUtil", "");
  const [sortFieldUtil, setSortFieldUtil] = useSessionState("billsSortUtil", null);
  const [sortOrderUtil, setSortOrderUtil] = useSessionState("billsDirUtil", "asc");

  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const cancelRef = React.useRef();
  const [alertConfig, setAlertConfig] = useState(null);

  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
      
      const [leaseRes, utilRes] = await Promise.all([
        fetch(`${API}/leases?per_page=all&minimal=true&status=active`, { headers }),
        fetch(`${API}/utility-bills?status=unpaid`, { headers })
      ]);

      if (leaseRes.ok) {
        const leaseData = await leaseRes.json();
        setLeases(leaseData || []);
      }
      
      if (utilRes.ok) {
        const utilData = await utilRes.json();
        setUtilities(utilData.data || utilData || []);
      }
    } catch (e) {
      console.error("Failed to fetch bills", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNotifyRent = async (leaseId) => {
    setIsNotifying(leaseId);
    try {
      const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
      const res = await fetch(`${API}/leases/${leaseId}/notify-rent`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      if (res.ok) {
        toast.success("Rent notification sent successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send notification");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsNotifying(false);
    }
  };

  const handleNotifyUtility = async (billId) => {
    setIsNotifying(billId);
    try {
      const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
      const res = await fetch(`${API}/utility-bills/${billId}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      if (res.ok) {
        toast.success("Utility notification sent successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send notification");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsNotifying(false);
    }
  };

  const overdueRentLeases = leases.map(l => {
    const rentPaid = Number(l.payments_sum_amount_paid || 0);
    const rentTotal = Number(l.total_contract_value || 0);
    const rentDue = Math.max(0, rentTotal - rentPaid);
    return { ...l, rentDue };
  }).filter(l => l.rentDue > 0);

  const unpaidUtilities = utilities.filter(b => 
    Number(b.amount) > 0 && 
    (selectedMonth === "all" || b.due_date?.startsWith(selectedMonth))
  );

  const executeNotifyAllRent = async () => {
    setIsNotifyingAllRent(true);
    let successCount = 0;
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
    
    await Promise.all(overdueRentLeases.map(async (lease) => {
      try {
        const res = await fetch(`${API}/leases/${lease.uid}/notify-rent`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
        });
        if (res.ok) successCount++;
      } catch (e) { console.error(e) }
    }));
    
    setIsNotifyingAllRent(false);
    toast.success(`Sent ${successCount} out of ${overdueRentLeases.length} rent notifications.`);
  };

  const executeNotifyAllUtilities = async () => {
    setIsNotifyingAllUtil(true);
    let successCount = 0;
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
    
    await Promise.all(unpaidUtilities.map(async (bill) => {
      try {
        const res = await fetch(`${API}/utility-bills/${bill.uid}/notify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
        });
        if (res.ok) successCount++;
      } catch (e) { console.error(e) }
    }));
    
    setIsNotifyingAllUtil(false);
    toast.success(`Sent ${successCount} out of ${unpaidUtilities.length} utility notifications.`);
  };

  const confirmAlert = () => {
    onAlertClose();
    if (alertConfig?.type === 'rent') executeNotifyAllRent();
    if (alertConfig?.type === 'utility') executeNotifyAllUtilities();
  };

  const availableMonths = useMemo(() => {
    const months = new Set();
    utilities.forEach(b => {
      if (b.due_date) months.add(b.due_date.substring(0, 7)); // YYYY-MM
    });
    return Array.from(months).sort().reverse();
  }, [utilities]);

  const sortData = (data, field, order) => {
    if (!field) return data;
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'tenant_name') {
          aVal = a.tenant?.name || a.tenant_name || a.lease?.tenant?.name || "";
          bVal = b.tenant?.name || b.tenant_name || b.lease?.tenant?.name || "";
      }
      if (field === 'room_name') {
          aVal = a.room?.name || a.room_name || a.lease?.room?.name || "";
          bVal = b.room?.name || b.room_name || b.lease?.room?.name || "";
      }

      if (['rentDue', 'amount'].includes(field)) {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const processedRent = useMemo(() => {
    let filtered = overdueRentLeases;
    if (searchRent) {
      const s = searchRent.toLowerCase();
      filtered = filtered.filter(l => 
        (l.tenant?.name || l.tenant_name || "").toLowerCase().includes(s) ||
        (l.room?.name || l.room_name || "").toLowerCase().includes(s)
      );
    }
    return sortData(filtered, sortFieldRent, sortOrderRent);
  }, [overdueRentLeases, searchRent, sortFieldRent, sortOrderRent]);

  const processedUtil = useMemo(() => {
    let filtered = unpaidUtilities;
    if (searchUtil) {
      const s = searchUtil.toLowerCase();
      filtered = filtered.filter(b => 
        (b.lease?.tenant?.name || "").toLowerCase().includes(s) ||
        (b.room?.name || b.lease?.room?.name || "").toLowerCase().includes(s)
      );
    }
    if (typeFilterUtil) {
      filtered = filtered.filter(b => b.type === typeFilterUtil);
    }
    return sortData(filtered, sortFieldUtil, sortOrderUtil);
  }, [unpaidUtilities, searchUtil, typeFilterUtil, sortFieldUtil, sortOrderUtil]);

  const handleSortRent = (field) => {
    if (sortFieldRent === field) {
      setSortOrderRent(sortOrderRent === "asc" ? "desc" : "asc");
    } else {
      setSortFieldRent(field);
      setSortOrderRent("asc");
    }
  };

  const handleSortUtil = (field) => {
    if (sortFieldUtil === field) {
      setSortOrderUtil(sortOrderUtil === "asc" ? "desc" : "asc");
    } else {
      setSortFieldUtil(field);
      setSortOrderUtil("asc");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="full" mx="auto">
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" color={useColorModeValue("gray.800", "white")} textTransform="uppercase" letterSpacing="tight">
            Overdue Bills
          </Text>
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            Manage outstanding rent and unpaid utility bills
          </Text>
        </Box>

        <Flex align="center" gap={2}>
          <Box color="gray.500"><FiCalendar /></Box>
          <Select 
            size="sm" 
            borderRadius="lg" 
            w="160px" 
            bg="white" 
            _dark={{ bg: "gray.800" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {availableMonths.map(month => {
              const [year, m] = month.split('-');
              const date = new Date(year, parseInt(m) - 1);
              const label = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
              return <option key={month} value={month}>{label}</option>
            })}
          </Select>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={20}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : (
        <Box bg={bg} borderRadius="2xl" border="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
          <Tabs variant="enclosed-colored" size="md" isLazy>
            <TabList bg={useColorModeValue("gray.50", "gray.800")} px={4} pt={4} borderBottom="1px" borderColor={borderColor}>
              <Tab fontWeight="bold" fontSize="sm" _selected={{ color: "red.600", bg: bg, borderColor: borderColor, borderBottomColor: bg }} border="1px" borderColor="transparent" borderRadius="t-lg" mr={2} gap={2}>
                <FiAlertCircle /> 
                Rent ({overdueRentLeases.length})
              </Tab>
              <Tab fontWeight="bold" fontSize="sm" _selected={{ color: "orange.600", bg: bg, borderColor: borderColor, borderBottomColor: bg }} border="1px" borderColor="transparent" borderRadius="t-lg" gap={2}>
                <FiDroplet /> 
                Utilities ({unpaidUtilities.length})
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel p={6}>
                {overdueRentLeases.length === 0 ? (
                  <Flex align="center" justify="center" py={10} direction="column" color="gray.500">
                    <Text fontWeight="bold">No Overdue Rent</Text>
                    <Text fontSize="sm">All active tenants have paid their rent.</Text>
                  </Flex>
                ) : (
                  <>
                    <Flex justify="space-between" mb={4} flexWrap="wrap" gap={4} align="center">
                      <Flex gap={2}>
                        <Input 
                          placeholder="Search tenant or room..." 
                          size="md" w={{ base: "full", md: "250px" }} borderRadius="lg" bg="white" _dark={{ bg: "gray.800" }}
                          value={searchRent} 
                          onChange={e => setSearchRent(e.target.value)} 
                        />
                      </Flex>
                      <Tooltip label={`Send notifications to all ${overdueRentLeases.length} tenants`} hasArrow placement="top">
                        <Button 
                          size="md" 
                          colorScheme="red" 
                          leftIcon={<FiSend />} 
                          onClick={() => { setAlertConfig({ type: 'rent', count: overdueRentLeases.length }); onAlertOpen(); }} 
                          isLoading={isNotifyingAllRent}
                        >
                          Send All Notifications
                        </Button>
                      </Tooltip>
                    </Flex>
                    
                    <Box borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                      <TableContainer>
                        <Table variant="simple" size="md">
                          <Thead bg={useColorModeValue("gray.50", "gray.800")}>
                            <Tr>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortRent('tenant_name')}>
                                <Flex align="center" gap={1}>Tenant {sortFieldRent==='tenant_name' && (sortOrderRent==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortRent('room_name')}>
                                <Flex align="center" gap={1}>Room {sortFieldRent==='room_name' && (sortOrderRent==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortRent('rentDue')}>
                                <Flex align="center" gap={1}>Amount Due {sortFieldRent==='rentDue' && (sortOrderRent==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase">Status</Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" textAlign="right"></Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {processedRent.map(lease => (
                              <Tr key={lease.id} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <Td fontSize="sm" fontWeight="bold">{lease.tenant?.name || lease.tenant_name}</Td>
                                <Td fontSize="sm" color="gray.500">{lease.room?.name || lease.room_name}</Td>
                                <Td fontSize="sm" fontWeight="black" color="red.600">{formatCurrency(lease.rentDue)}</Td>
                                <Td>
                                  <Badge px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" colorScheme="red">Overdue</Badge>
                                </Td>
                                <Td textAlign="right">
                                  <Button 
                                    size="sm" colorScheme="red" variant="outline"
                                    isLoading={isNotifying === lease.uid}
                                    onClick={() => handleNotifyRent(lease.uid)} 
                                    leftIcon={<FiBell />}
                                  >
                                    Notify
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                            {processedRent.length === 0 && (
                                <Tr><Td colSpan={5} textAlign="center" py={6} color="gray.500">No matching overdue rent found.</Td></Tr>
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                )}
              </TabPanel>

              <TabPanel p={6}>
                {unpaidUtilities.length === 0 ? (
                  <Flex align="center" justify="center" py={10} direction="column" color="gray.500">
                    <Text fontWeight="bold">No Unpaid Utilities</Text>
                    <Text fontSize="sm">All utility bills have been settled.</Text>
                  </Flex>
                ) : (
                  <>
                    <Flex justify="space-between" mb={4} flexWrap="wrap" gap={4} align="center">
                      <Flex gap={2} flexWrap="wrap">
                        <Input 
                          placeholder="Search tenant or room..." 
                          size="md" w={{ base: "full", md: "250px" }} borderRadius="lg" bg="white" _dark={{ bg: "gray.800" }}
                          value={searchUtil} 
                          onChange={e => setSearchUtil(e.target.value)} 
                        />
                        <Select size="md" w="150px" borderRadius="lg" bg="white" _dark={{ bg: "gray.800" }} value={typeFilterUtil} onChange={e => setTypeFilterUtil(e.target.value)}>
                          <option value="">All Types</option>
                          <option value="electricity">Electricity</option>
                          <option value="water">Water</option>
                          <option value="trash">Trash</option>
                          <option value="internet">Internet</option>
                        </Select>
                      </Flex>
                      <Tooltip label={`Send notifications to all ${unpaidUtilities.length} tenants`} hasArrow placement="top">
                        <Button 
                          size="md" 
                          colorScheme="orange" 
                          leftIcon={<FiSend />} 
                          onClick={() => { setAlertConfig({ type: 'utility', count: unpaidUtilities.length }); onAlertOpen(); }} 
                          isLoading={isNotifyingAllUtil}
                        >
                          Send All Notifications
                        </Button>
                      </Tooltip>
                    </Flex>
                    
                    <Box borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                      <TableContainer>
                        <Table variant="simple" size="md">
                          <Thead bg={useColorModeValue("gray.50", "gray.800")}>
                            <Tr>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortUtil('tenant_name')}>
                                <Flex align="center" gap={1}>Tenant {sortFieldUtil==='tenant_name' && (sortOrderUtil==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortUtil('room_name')}>
                                <Flex align="center" gap={1}>Room {sortFieldUtil==='room_name' && (sortOrderUtil==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortUtil('type')}>
                                <Flex align="center" gap={1}>Type {sortFieldUtil==='type' && (sortOrderUtil==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortUtil('due_date')}>
                                <Flex align="center" gap={1}>Due Date {sortFieldUtil==='due_date' && (sortOrderUtil==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSortUtil('amount')}>
                                <Flex align="center" gap={1}>Amount {sortFieldUtil==='amount' && (sortOrderUtil==='asc'?<FiArrowUp/>:<FiArrowDown/>)}</Flex>
                              </Th>
                              <Th color="gray.500" fontSize="xs" fontWeight="black" textTransform="uppercase" textAlign="right"></Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {processedUtil.map(bill => (
                              <Tr key={bill.id} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <Td fontSize="sm" fontWeight="bold">{bill.lease?.tenant?.name || "Unknown Tenant"}</Td>
                                <Td fontSize="sm" color="gray.500">{bill.room?.name || bill.lease?.room?.name}</Td>
                                <Td>
                                  <Badge px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" colorScheme={bill.type === "electricity" ? "yellow" : bill.type === "water" ? "blue" : "gray"}>
                                    {bill.type}
                                  </Badge>
                                </Td>
                                <Td fontSize="sm" color="gray.500">{new Date(bill.due_date).toLocaleDateString()}</Td>
                                <Td fontSize="sm" fontWeight="black" color="orange.600">{formatCurrency(bill.amount)}</Td>
                                <Td textAlign="right">
                                  <Button 
                                    size="sm" colorScheme="orange" variant="outline"
                                    isLoading={isNotifying === bill.uid}
                                    onClick={() => handleNotifyUtility(bill.uid)} 
                                    leftIcon={<FiBell />}
                                  >
                                    Notify
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                            {processedUtil.length === 0 && (
                                <Tr><Td colSpan={6} textAlign="center" py={6} color="gray.500">No matching unpaid utilities found.</Td></Tr>
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}

      {/* Confirmation Alert Dialog for Notifications */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.500" backdropFilter="blur(5px)" />
        <AlertDialogContent borderRadius="2xl" border="1px" borderColor={borderColor} shadow="2xl">
          <AlertDialogHeader fontSize="lg" fontWeight="black" pb={2}>
            Confirm Notifications
          </AlertDialogHeader>

          <AlertDialogBody color="gray.600" _dark={{ color: "gray.300" }}>
            Are you sure you want to send alert notifications to all {alertConfig?.count} tenants? They will instantly receive a notification to pay their due balance.
          </AlertDialogBody>

          <AlertDialogFooter pt={6}>
            <Button ref={cancelRef} onClick={onAlertClose} borderRadius="xl" variant="ghost">
              Cancel
            </Button>
            <Button colorScheme={alertConfig?.type === 'rent' ? 'red' : 'orange'} onClick={confirmAlert} ml={3} borderRadius="xl">
              Send All
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Box>
  );
}
