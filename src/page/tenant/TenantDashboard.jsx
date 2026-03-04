import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Heading,
  Icon,
  useColorModeValue,
  useColorMode,
  VStack,
  HStack,
  Spinner,
  Button,
} from "@chakra-ui/react";
import {
  LuReceipt,
  LuWrench,
  LuMessageSquare,
  LuBellRing,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { colorMode } = useColorMode();
  const cardBg = colorMode === "light" ? "white" : "gray.800";
  const cardBorder = colorMode === "light" ? "gray.100" : "gray.700";
  const textColor = colorMode === "light" ? "gray.900" : "white";
  const mutedTextColor = colorMode === "light" ? "gray.500" : "gray.400";
  const itemBorderColor = colorMode === "light" ? "gray.50" : "gray.700";
  const headerBg = colorMode === "light" ? "gray.50" : "gray.700";

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/tenant/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Failed to fetch tenant dashboard data");
      }
    } catch (err) {
      console.error("API error", err);
    } finally {
      setLoading(false);
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

  const { lease, stats, recent_requests, recent_payments, tenant } = data;
  const userName = JSON.parse(localStorage.getItem("user"))?.name || "Resident";
  const totalDue = stats?.total_due || 0;
  const unpaidCount = stats?.unpaid_bills_count || 0;

  return (
    <VStack align="stretch" spacing={8} w="full">
      <Heading size="lg" color={textColor} fontWeight="bold">
        My Resident Portal
      </Heading>

      {/* WELCOME & STATUS SECTION */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6}>
        {/* Welcome Card */}
        <Box
          gridColumn={{ lg: "span 2" }}
          bgGradient="linear(to-br, blue.600, blue.800)"
          borderRadius="2xl"
          p={8}
          color="white"
          boxShadow="xl"
          position="relative"
          overflow="hidden"
        >
          <Box position="relative" zIndex={10}>
            <Heading size="xl" fontWeight="black" mb={2}>
              Welcome back, {userName}!
            </Heading>
            {lease ? (
              <>
                <Text color="blue.100" fontSize="sm" fontWeight="medium" opacity={0.9}>
                  Resident of <Text as="span" fontWeight="bold" color="white">{lease.room?.name}</Text>
                </Text>
                <Text color="blue.200" fontSize="xs" mt={4} textTransform="uppercase" letterSpacing="widest" fontWeight="bold">
                  Lease Period: {dayjs(lease.start_date).format('MMM D, YYYY')} — {dayjs(lease.end_date).format('MMM D, YYYY')}
                </Text>
              </>
            ) : (
              <Text color="blue.100">Your account is active, but no lease is currently assigned.</Text>
            )}
          </Box>
          {/* Decorative Circle */}
          <Box
            position="absolute"
            bottom="-10"
            right="-10"
            w="40"
            h="40"
            bg="white"
            opacity={0.1}
            borderRadius="full"
            filter="blur(24px)"
          />
        </Box>

        {/* Financial Snapshot */}
        <Flex
          direction="column"
          justify="space-between"
          bg={cardBg}
          p={8}
          borderRadius="2xl"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={cardBorder}
        >
          <Box>
            <Text fontSize="10px" fontWeight="black" color={mutedTextColor} textTransform="uppercase" letterSpacing="widest" mb={1}>
              Current Balance
            </Text>
            <Heading size="2xl" fontWeight="black" color={totalDue > 0 ? (colorMode === 'light' ? 'red.600' : 'red.400') : (colorMode === 'light' ? 'green.600' : 'green.400')}>
              ${totalDue.toFixed(2)}
            </Heading>
            <Text fontSize="xs" color={mutedTextColor} mt={2} fontWeight="medium">
              {unpaidCount} Unpaid Bill(s)
            </Text>
          </Box>
          {totalDue > 0 ? (
            <Button
              mt={4}
              w="full"
              bg={colorMode === 'light' ? "gray.900" : "gray.700"}
              color="white"
              _hover={{ bg: colorMode === 'light' ? "black" : "gray.600" }}
              fontSize="xs"
              fontWeight="black"
              textTransform="uppercase"
              letterSpacing="widest"
              onClick={() => navigate("/dashboard/utility")}
            >
              Pay Now
            </Button>
          ) : (
            <Box
              mt={4}
              w="full"
              textAlign="center"
              bg={colorMode === 'light' ? "green.50" : "rgba(39, 103, 73, 0.2)"}
              color={colorMode === 'light' ? "green.700" : "green.300"}
              py={2.5}
              borderRadius="lg"
              fontSize="xs"
              fontWeight="black"
              textTransform="uppercase"
              letterSpacing="widest"
              borderWidth="1px"
              borderColor={colorMode === 'light' ? "green.100" : "green.800"}
            >
              All Paid
            </Box>
          )}
        </Flex>
      </Grid>

      {/* QUICK ACTIONS GRID */}
      <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
        {[
          { label: "Billing History", icon: LuReceipt, link: "/dashboard/utility", colors: { base: "blue.50", dark: "rgba(43, 108, 176, 0.3)", icon: "blue.600", darkIcon: "blue.400", hoverBg: "blue.600" } },
          { label: "Report Issue", icon: LuWrench, link: "/dashboard/maintenance", colors: { base: "red.50", dark: "rgba(197, 48, 48, 0.3)", icon: "red.600", darkIcon: "red.400", hoverBg: "red.600" } },
          { label: "Community", icon: LuBellRing, link: "/dashboard/notifications", colors: { base: "yellow.50", dark: "rgba(183, 121, 31, 0.3)", icon: "yellow.600", darkIcon: "yellow.400", hoverBg: "yellow.500" } },
          { label: "Chat Support", icon: LuMessageSquare, link: "/dashboard/chat", colors: { base: "green.50", dark: "rgba(47, 133, 90, 0.3)", icon: "green.600", darkIcon: "green.400", hoverBg: "green.600" } },
        ].map((action, idx) => (
          <Box
            key={idx}
            as="button"
            onClick={() => navigate(action.link)}
            bg={cardBg}
            p={4}
            borderRadius="xl"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={cardBorder}
            _hover={{ boxShadow: "md", transform: "translateY(-2px)", "& .action-icon-container": { bg: action.colors.hoverBg, color: "white" } }}
            transition="all 0.2s"
            textAlign="center"
          >
            <Flex
              className="action-icon-container"
              h={10}
              w={10}
              bg={colorMode === 'light' ? action.colors.base : action.colors.dark}
              color={colorMode === 'light' ? action.colors.icon : action.colors.darkIcon}
              borderRadius="full"
              align="center"
              justify="center"
              mx="auto"
              mb={3}
              transition="all 0.2s"
            >
              <Icon as={action.icon} boxSize={5} />
            </Flex>
            <Text fontSize="xs" fontWeight="bold" color={textColor} textTransform="uppercase">
              {action.label}
            </Text>
          </Box>
        ))}
      </Grid>

      {/* RECENT ACTIVITY FEEDS */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={8}>
        
        {/* Recent Payments */}
        <Box bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <Flex p={6} borderBottom="1px" borderColor={itemBorderColor} bg={headerBg} justify="space-between" align="center">
            <Text fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight" fontSize="sm">
              Recent Payments
            </Text>
          </Flex>
          <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px" borderColor={itemBorderColor} />}>
            {recent_payments?.length > 0 ? (
              recent_payments.map((payment) => (
                <Flex key={payment.id} p={4} align="center" justify="space-between" _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.700" }} transition="all 0.2s">
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color={textColor} textTransform="uppercase">
                      {payment.type}
                    </Text>
                    <Text fontSize="10px" color={mutedTextColor} fontWeight="bold">
                      {dayjs(payment.payment_date).format('MMM D, YYYY')}
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="black" color={colorMode === 'light' ? "green.600" : "green.400"}>
                    +${parseFloat(payment.amount_paid).toFixed(2)}
                  </Text>
                </Flex>
              ))
            ) : (
              <Text p={6} textAlign="center" color={mutedTextColor} fontStyle="italic" fontSize="xs">
                No recent payments.
              </Text>
            )}
          </VStack>
        </Box>

        {/* Recent Maintenance */}
        <Box bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <Flex p={6} borderBottom="1px" borderColor={itemBorderColor} bg={headerBg} justify="space-between" align="center">
            <Text fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight" fontSize="sm">
              Repair Status
            </Text>
          </Flex>
          <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px" borderColor={itemBorderColor} />}>
            {recent_requests?.length > 0 ? (
              recent_requests.map((req) => (
                <Flex key={req.id} p={4} align="center" justify="space-between" _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.700" }} transition="all 0.2s">
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color={textColor} textTransform="uppercase">
                      {req.title}
                    </Text>
                    <Text fontSize="10px" color={mutedTextColor} fontWeight="bold">
                      {dayjs(req.created_at).format('MMM D')}
                    </Text>
                  </Box>
                  <Text 
                    px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="black" textTransform="uppercase"
                    bg={req.status === 'resolved' ? (colorMode === 'light' ? "green.100" : "rgba(198, 246, 213, 0.3)") : (colorMode === 'light' ? "yellow.100" : "rgba(254, 235, 200, 0.3)")}
                    color={req.status === 'resolved' ? (colorMode === 'light' ? "green.700" : "green.300") : (colorMode === 'light' ? "yellow.700" : "yellow.300")}
                  >
                    {req.status.replace('_', ' ')}
                  </Text>
                </Flex>
              ))
            ) : (
              <Text p={6} textAlign="center" color={mutedTextColor} fontStyle="italic" fontSize="xs">
                No recent requests.
              </Text>
            )}
          </VStack>
        </Box>

      </Grid>
    </VStack>
  );
}
