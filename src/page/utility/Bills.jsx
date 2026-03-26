import React, { useState, useEffect, useMemo } from "react";
import { Box, Flex, Text, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, Badge, Button, useColorModeValue, Spinner, SimpleGrid, Card, CardBody, Select, Tooltip, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure } from "@chakra-ui/react";
import { FiBell, FiAlertCircle, FiDroplet, FiCalendar, FiSend } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const API = "http://localhost:8000/api/v1/admin";

const formatCurrency = (val) => {
  const c = localStorage.getItem("currency") || "$";
  const r = parseFloat(localStorage.getItem("exchangeRate") || "4000");
  const isRiel = c === "៛" || c === "KHR" || c === "Riel";
  return isRiel ? `៛ ${(Number(val) * r).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : `$ ${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

export default function Bills() {
  const { t } = useTranslation();
  const [leases, setLeases] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isNotifying, setIsNotifying] = useState(false);
  const [isNotifyingAllRent, setIsNotifyingAllRent] = useState(false);
  const [isNotifyingAllUtil, setIsNotifyingAllUtil] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const cancelRef = React.useRef();
  const [alertConfig, setAlertConfig] = useState(null);

  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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
    const token = localStorage.getItem("token");
    
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
    const token = localStorage.getItem("token");
    
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
                    <Flex justify="flex-end" mb={4}>
                      <Tooltip label={`Send notifications to all ${overdueRentLeases.length} tenants`} hasArrow placement="top">
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          leftIcon={<FiSend />} 
                          onClick={() => { setAlertConfig({ type: 'rent', count: overdueRentLeases.length }); onAlertOpen(); }} 
                          isLoading={isNotifyingAllRent}
                        >
                          Send All Rent Notifications
                        </Button>
                      </Tooltip>
                    </Flex>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 }} spacing={6}>
                      {overdueRentLeases.map(lease => (
                      <Card key={lease.id} variant="outline" borderColor="red.100" bg="red.50" _dark={{ bg: "red.900/20", borderColor: "red.900" }}>
                        <CardBody>
                          <Flex justify="space-between" mb={4}>
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="red.500" textTransform="uppercase">Outstanding Rent</Text>
                              <Text fontSize="2xl" fontWeight="black" color="red.700" _dark={{ color: "red.300" }}>{formatCurrency(lease.rentDue)}</Text>
                            </Box>
                            <Badge colorScheme="red" variant="subtle" alignSelf="start">Overdue</Badge>
                          </Flex>
                          <Text fontSize="sm" fontWeight="bold" mb={1}>{lease.tenant?.name || lease.tenant_name}</Text>
                          <Text fontSize="xs" color="gray.600" mb={4}>{lease.room?.name || lease.room_name}</Text>
                          <Button 
                            w="full" size="sm" colorScheme="red" variant="solid" 
                            isLoading={isNotifying === lease.uid}
                            onClick={() => handleNotifyRent(lease.uid)} 
                            leftIcon={<FiBell />}
                          >
                            Send Notification
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
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
                    <Flex justify="flex-end" mb={4}>
                      <Tooltip label={`Send notifications to all ${unpaidUtilities.length} tenants`} hasArrow placement="top">
                        <Button 
                          size="sm" 
                          colorScheme="orange" 
                          leftIcon={<FiSend />} 
                          onClick={() => { setAlertConfig({ type: 'utility', count: unpaidUtilities.length }); onAlertOpen(); }} 
                          isLoading={isNotifyingAllUtil}
                        >
                          Send All Utility Notifications
                        </Button>
                      </Tooltip>
                    </Flex>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 }} spacing={6}>
                      {unpaidUtilities.map(bill => (
                      <Card key={bill.id} variant="outline" borderColor="orange.100" bg="orange.50" _dark={{ bg: "orange.900/20", borderColor: "orange.900" }}>
                        <CardBody>
                          <Flex justify="space-between" mb={4}>
                            <Box>
                              <Badge mb={2} colorScheme={bill.type === "electricity" ? "yellow" : bill.type === "water" ? "blue" : "gray"}>
                                {bill.type}
                              </Badge>
                              <Text fontSize="2xl" fontWeight="black" color="orange.700" _dark={{ color: "orange.300" }}>{formatCurrency(bill.amount)}</Text>
                            </Box>
                          </Flex>
                          <Text fontSize="sm" fontWeight="bold" mb={1}>{bill.lease?.tenant?.name || "Unknown Tenant"}</Text>
                          <Text fontSize="xs" color="gray.600" mb={4}>{bill.room?.name || bill.lease?.room?.name} • Due: {new Date(bill.due_date).toLocaleDateString()}</Text>
                          <Button 
                            w="full" size="sm" colorScheme="orange" variant="solid"
                            isLoading={isNotifying === bill.uid}
                            onClick={() => handleNotifyUtility(bill.uid)} 
                            leftIcon={<FiBell />}
                          >
                            Send Notification
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
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
