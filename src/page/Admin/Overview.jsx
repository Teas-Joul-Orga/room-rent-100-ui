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
  useToast,
  useDisclosure,
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
import { useApi } from "../../hooks/useApi";
import StatsCard from "../../components/common/StatsCard";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";

dayjs.extend(relativeTime);

export default function Overview() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { request, loading } = useApi();
  const [generatingRent, setGeneratingRent] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { colorMode } = useColorMode();
  const cardBg = useColorModeValue("white", "#161b22");
  const cardBorder = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const itemBorderColor = useColorModeValue("gray.50", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const [json] = await request({ url: "/admin/dashboard", method: "GET" }, { showToast: false });
    if (json) {
      setData(json);
    }
  };

  const handleGenerateRent = async () => {
    setGeneratingRent(true);
    const [json] = await request({ 
      url: "/admin/leases/generate-rent",
      method: "POST" 
    }, {
      successMessage: "Monthly rent generated successfully.",
      errorMessage: "Failed to generate rent."
    });
    
    if (json) {
      fetchDashboardData();
    }
    setGeneratingRent(false);
    onClose();
  };

  if (loading && !data) {
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
      subValue: "Needs Review",
      icon: LuClipboardList,
      color: "yellow",
      link: "/dashboard/maintenance",
    },
    {
      title: "Urgent Repairs",
      value: stats.emergency_maintenance,
      subValue: "Action Required",
      icon: LuWrench,
      color: "red",
      link: "/dashboard/maintenance",
    },
    {
      title: "Overdue Payments",
      value: stats.overdue_bills,
      subValue: "Follow Up",
      icon: LuReceipt,
      color: "orange",
      link: "/dashboard/utility",
    },
    {
      title: "Expiring Leases",
      value: stats.expiring_leases,
      subValue: "Renew Soon",
      icon: LuCalendarClock,
      color: "purple",
      link: "/dashboard/lease",
    },
    {
      title: "Vacant Units",
      value: stats.available_rooms,
      subValue: "Ready to Lease",
      icon: LuDoorOpen,
      color: "green",
      link: "/dashboard/rooms",
    },
    {
      title: "Pending Onboarding",
      value: stats.pending_accounts,
      subValue: "Create Logins",
      icon: LuUserPlus,
      color: "blue",
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
          <StatsCard
            key={i}
            title={c.title}
            value={c.value}
            subValue={c.subValue}
            icon={c.icon}
            color={c.color}
            onClick={() => navigate(c.link)}
          />
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
              <EmptyState 
                title="All clear" 
                description="No recent maintenance requests to show." 
                icon={LuWrench}
              />
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
              <EmptyState 
                title="Stable Occupancy" 
                description="No leases are expiring in the next 30 days." 
                icon={LuCalendarClock}
              />
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
        <Box mb={{ base: 6, md: 0 }}>
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
        </Box>
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
             onClick={onOpen}
             transition="all 0.2s"
          >
            Run Monthly Cycle
          </Button>
        </HStack>
      </Box>

      <ConfirmDialog 
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleGenerateRent}
        title="Generate Monthly Rent"
        message={`Are you sure you want to generate rent bills for all active leases for ${dayjs().format('MMMM YYYY')}? This will create new utility bills and notify tenants.`}
        confirmText="Generate Now"
        type="info"
        isLoading={generatingRent}
      />

    </VStack>
  );
}
