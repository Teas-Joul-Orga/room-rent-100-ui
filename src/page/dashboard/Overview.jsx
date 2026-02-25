import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Heading,
  Icon,
  Circle,
  useColorModeValue,
  useColorMode,
  VStack,
  HStack,
  Spinner,
  Button,
  useToast, // added useToast
} from "@chakra-ui/react";
import {
  LuWrench,
  LuReceipt,
  LuDoorOpen,
  LuUserPlus,
  LuRefreshCw,
  LuClipboardList,
  LuCalendarClock,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingRent, setGeneratingRent] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { colorMode } = useColorMode();
  const cardBg = (colorMode === 'light' ? "white" : "gray.800");
  const cardBorder = (colorMode === 'light' ? "gray.100" : "gray.700");
  const textColor = (colorMode === 'light' ? "gray.900" : "white");
  const mutedTextColor = (colorMode === 'light' ? "gray.500" : "gray.400");
  const itemBorderColor = (colorMode === 'light' ? "gray.50" : "gray.700");
  const headerBg = (colorMode === 'light' ? "gray.50" : "gray.700");

  const [token] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("API error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRent = async () => {
    if (!window.confirm("Generate rent bills for all active leases for this month?")) return;
    
    setGeneratingRent(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/leases/generate-monthly-rent", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      
      const json = await res.json();
      
      if (res.ok) {
        toast({
          title: "Success",
          description: json.message || "Monthly rent generated successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Refresh data to show any new overdue bills etc
        fetchDashboardData();
      } else {
        toast({
          title: "Error",
          description: json.message || "Failed to generate rent.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Could not connect to the server.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGeneratingRent(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!data) {
    return <Text color="red.500">Error loading dashboard data.</Text>;
  }

  const { stats, recentRequests, upcomingLeaseEnds } = data;

  const statCards = [
    {
      title: "Pending Maintenance",
      value: stats.pending_maintenance,
      actionText: "Needs Review",
      icon: LuClipboardList,
      colors: { base: "yellow.500", light: "yellow.100", dark: "yellow.600", text: "yellow.700" },
      link: "/dashboard/maintenance",
    },
    {
      title: "Urgent Repairs",
      value: stats.emergency_maintenance,
      actionText: "Action Required",
      icon: LuWrench,
      colors: { base: "red.600", light: "red.100", dark: "red.700", text: "red.700" },
      link: "/dashboard/maintenance",
    },
    {
      title: "Overdue Payments",
      value: stats.overdue_bills,
      actionText: "Follow Up",
      icon: LuReceipt,
      colors: { base: "orange.500", light: "orange.100", dark: "orange.600", text: "orange.700" },
      link: "/dashboard/utility",
    },
    {
      title: "Expiring Leases",
      value: stats.expiring_leases,
      actionText: "Renew Soon",
      icon: LuCalendarClock,
      colors: { base: "purple.500", light: "purple.100", dark: "purple.600", text: "purple.700" },
      link: "/dashboard/lease",
    },
    {
      title: "Vacant Units",
      value: stats.available_rooms,
      actionText: "Ready to Lease",
      icon: LuDoorOpen,
      colors: { base: "green.500", light: "green.100", dark: "green.600", text: "green.700" },
      link: "/dashboard/rooms",
    },
    {
      title: "Pending Onboarding",
      value: stats.pending_accounts,
      actionText: "Create Logins",
      icon: LuUserPlus,
      colors: { base: "blue.600", light: "blue.100", dark: "blue.700", text: "blue.700" },
      link: "/dashboard/tenants",
    },
  ];

  return (
    <VStack align="stretch" spacing={8} w="full">
      <Heading size="lg" color={textColor} fontWeight="bold">
        Management Command Center
      </Heading>

      {/* STAT CARDS */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
        {statCards.map((c, i) => (
          <Box
            key={i}
            as="button"
            onClick={() => navigate(c.link)}
            textAlign="left"
            bg={cardBg}
            borderRadius="2xl"
            p={6}
            boxShadow="sm"
            borderLeft="4px solid"
            borderLeftColor={c.colors.base}
            _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            transition="all 0.2s"
          >
            <Text fontSize="10px" fontWeight="black" color={mutedTextColor} textTransform="uppercase" letterSpacing="widest" mb={1}>
              {c.title}
            </Text>
            <Flex align="center" justify="space-between">
              <Heading size="xl" fontWeight="black" color={textColor}>
                {c.value}
              </Heading>
              
              <Text 
                fontSize="10px" 
                fontWeight="bold" 
                bg={(colorMode === 'light' ? c.colors.light : "gray.700")} 
                color={(colorMode === 'light' ? c.colors.text : c.colors.light)}
                px={2} 
                py={1} 
                borderRadius="md"
              >
                {c.actionText}
              </Text>
            </Flex>
          </Box>
        ))}
      </Grid>

      {/* RECENT ACTIVITY & UPCOMING */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={8}>
        
        {/* RECENT MAINTENANCE FEED */}
        <Box bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <Flex p={6} borderBottom="1px" borderColor={itemBorderColor} bg={headerBg} justify="space-between" align="center">
            <Text fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight">
              Recent Repair Requests
            </Text>
            <Text as="button" onClick={() => navigate("/dashboard/maintenance")} fontSize="10px" fontWeight="black" color="blue.600" textTransform="uppercase" _hover={{ textDecoration: "underline" }}>
              View All
            </Text>
          </Flex>
          <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px" borderColor={itemBorderColor} />}>
            {recentRequests?.length > 0 ? (
              recentRequests.map((req) => (
                <Flex key={req.id} p={4} align="center" justify="space-between" _hover={{ bg: (colorMode === 'light' ? "gray.50" : "gray.700") }} transition="all 0.2s">
                  <HStack spacing={4}>
                    <Circle size="10" bg={(colorMode === 'light' ? "gray.100" : "gray.600")} color={mutedTextColor} fontWeight="black" textTransform="uppercase">
                      {req.tenant?.name ? req.tenant.name.substring(0, 1) : "?"}
                    </Circle>
                    <Box>
                      <Text fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight">
                        {req.title}
                      </Text>
                      <Text fontSize="10px" color={mutedTextColor} fontWeight="bold" textTransform="uppercase">
                        {req.room?.name || "N/A"} • {dayjs(req.created_at).fromNow()}
                      </Text>
                    </Box>
                  </HStack>
                  <Text 
                    px={2} py={1} borderRadius="md" fontSize="9px" fontWeight="black" textTransform="uppercase"
                    bg={req.priority === 'emergency' ? (colorMode === 'light' ? 'red.100' : 'red.900') : (colorMode === 'light' ? 'blue.100' : 'blue.900')}
                    color={req.priority === 'emergency' ? (colorMode === 'light' ? 'red.700' : 'red.200') : (colorMode === 'light' ? 'blue.700' : 'blue.200')}
                  >
                    {req.priority}
                  </Text>
                </Flex>
              ))
            ) : (
              <Text p={8} textAlign="center" color={mutedTextColor} fontStyle="italic" fontSize="sm">
                No recent requests.
              </Text>
            )}
          </VStack>
        </Box>

        {/* UPCOMING VACANCIES */}
        <Box bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <Box p={6} borderBottom="1px" borderColor={itemBorderColor} bg={headerBg}>
            <Text fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight">
              Leases Expiring Soon
            </Text>
          </Box>
          <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px" borderColor={itemBorderColor} />}>
            {upcomingLeaseEnds?.length > 0 ? (
              upcomingLeaseEnds.map((lease) => (
                <Flex key={lease.id} p={4} align="center" justify="space-between" _hover={{ bg: (colorMode === 'light' ? "gray.50" : "gray.700") }} transition="all 0.2s">
                  <Box>
                    <Text fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight">
                      {lease.tenant?.name || "Unknown"}
                    </Text>
                    <Text fontSize="10px" color={mutedTextColor} fontWeight="bold" textTransform="uppercase">
                      {lease.room?.name || "Unknown"}
                    </Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="xs" fontWeight="black" color={textColor}>
                      {dayjs(lease.end_date).format("MMM D, YYYY")}
                    </Text>
                    <Text fontSize="9px" color={(colorMode === 'light' ? "orange.600" : "orange.400")} fontWeight="bold" textTransform="uppercase">
                      {dayjs(lease.end_date).diff(dayjs(), 'day')} Days Left
                    </Text>
                  </Box>
                </Flex>
              ))
            ) : (
              <Text p={8} textAlign="center" color={mutedTextColor} fontStyle="italic" fontSize="sm">
                No leases expiring soon.
              </Text>
            )}
          </VStack>
        </Box>

      </Grid>

      {/* QUICK TOOLS: AUTOMATED BILLING */}
      <Box 
        bg={(colorMode === 'light' ? "gray.900" : "gray.800")} 
        borderRadius="3xl" 
        p={8} 
        color="white" 
        boxShadow="2xl" 
        display="flex" 
        flexDirection={{ base: "column", md: "row" }} 
        alignItems={{ base: "flex-start", md: "center" }}
        justifyContent="space-between"
        border="1px"
        borderColor="gray.800"
      >
        {/* <Box mb={{ base: 6, md: 0 }}>
          <HStack spacing={3} mb={1}>
            <Text fontSize="2xl" fontWeight="black" textTransform="uppercase" letterSpacing="tight">
              Monthly Billing Cycle
            </Text>
            <Text bg="blue.600" color="blue.100" fontSize="10px" fontWeight="black" px={2} py={0.5} borderRadius="md" textTransform="uppercase" letterSpacing="widest" opacity={0.8}>
              Automation
            </Text>
          </HStack>
          <Text color="gray.400" fontSize="sm">
            Generate rent invoices for all active tenants for <Text as="strong" color="white">{dayjs().format('MMMM YYYY')}</Text>.
          </Text>
        </Box> */}
        <HStack spacing={4}>
          <Text 
            as="button" 
            onClick={() => navigate("/dashboard/utility")} 
            fontSize="xs" 
            fontWeight="black" 
            textTransform="uppercase" 
            color="gray.400" 
            _hover={{ color: "white" }} 
            transition="all 0.2s" 
            letterSpacing="widest"
          >
            View Billing History
          </Text>
          <Button
             bg="blue.600"
             color="white"
             _hover={{ bg: "blue.700", transform: "scale(0.98)" }}
             _active={{ transform: "scale(0.95)" }}
             fontWeight="black"
             textTransform="uppercase"
             fontSize="xs"
             letterSpacing="widest"
             px={8}
             py={6}
             borderRadius="xl"
             boxShadow="xl"
             isLoading={generatingRent}
             loadingText="RUNNING..."
             leftIcon={<LuRefreshCw />}
             onClick={handleGenerateRent}
             transition="all 0.2s"
          >
            Run Monthly Cycle
          </Button>
        </HStack>
      </Box>

    </VStack>
  );
}
