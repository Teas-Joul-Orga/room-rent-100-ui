import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Button,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiChevronRight, FiFileText, FiArrowLeft } from "react-icons/fi";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import { useParams, useNavigate, Link } from "react-router-dom";

const API = "http://localhost:8000/api/v1/tenant";

const fmt = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rateItem = localStorage.getItem("exchangeRate");
    const r = rateItem ? Number(rateItem) : 4000;
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d) => d ? dayjs(d).format("MMM D, YYYY") : "—";

export default function LeaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const tableHBg = useColorModeValue("gray.50", "#1c2333");

  const fetchLease = async () => {
    try {
      const res = await fetch(`${API}/leases/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLease(data);
      } else {
        toast.error("Failed to load lease details");
        navigate("/dashboard/lease/history");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLease();
  }, [id]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  if (!lease) return null;

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Toaster position="top-right" />
      
      <Breadcrumb spacing="8px" separator={<FiChevronRight color="gray.500" />} mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/dashboard/lease/history" fontSize="sm" color={mutedText}>
            History
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink fontSize="sm" fontWeight="bold" color={textColor}>
            Lease Detail
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={8}>
        <Flex align="center" gap={4} w={{ base: "100%", md: "auto" }}>
          <Button 
            leftIcon={<FiArrowLeft />} 
            variant="ghost" 
            onClick={() => navigate(-1)}
            size="sm"
            px={{ base: 2, md: 4 }}
          >
            Back
          </Button>
          <Box flex="1">
            <Heading size={{ base: "md", md: "lg" }} letterSpacing="tight" color={textColor} isTruncated>
              {lease.room?.name || "Lease Details"}
            </Heading>
            <Text fontSize="sm" color={mutedText}>
              {fmtDate(lease.start_date)} — {fmtDate(lease.end_date)}
            </Text>
          </Box>
          <Badge
            ml="auto"
            colorScheme={lease.status === "active" ? "green" : "gray"}
            fontSize="xs"
            px={3}
            py={1}
            borderRadius="full"
            textTransform="uppercase"
          >
            {lease.status}
          </Badge>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        <Box bg={bg} p={8} borderRadius="2xl" border="1px solid" borderColor={borderColor}>
          <Heading size="sm" mb={6} textTransform="uppercase" letterSpacing="wider" color={textColor}>
            Contract Overview
          </Heading>
          <VStack align="stretch" spacing={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={mutedText}>Monthly Rent</Text>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmt(lease.rent_amount)}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={mutedText}>Security Deposit</Text>
              <Box textAlign="right">
                <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmt(lease.security_deposit)}</Text>
                <Badge size="xs" mt={1} colorScheme={lease.deposit_status === 'held' || lease.deposit_status === 'refunded' ? 'green' : 'orange'}>
                  {lease.deposit_status}
                </Badge>
              </Box>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={mutedText}>Status</Text>
              <Text fontSize="sm" fontWeight="bold" color={textColor} textTransform="capitalize">{lease.status}</Text>
            </Flex>
          </VStack>
        </Box>

        <Box bg={bg} p={8} borderRadius="2xl" border="1px solid" borderColor={borderColor}>
          <Heading size="sm" mb={6} textTransform="uppercase" letterSpacing="wider" color={textColor}>
            Timeline Details
          </Heading>
          <VStack align="stretch" spacing={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={mutedText}>Move-in Date</Text>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(lease.start_date)}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={mutedText}>End Date</Text>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(lease.end_date)}</Text>
            </Flex>
            {lease.termination_date && (
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="red.500">Termination Date</Text>
                <Text fontSize="sm" fontWeight="bold" color="red.500">{fmtDate(lease.termination_date)}</Text>
              </Flex>
            )}
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Payment History */}
      <Box bg={bg} borderRadius="2xl" border="1px solid" borderColor={borderColor} overflow="hidden" mb={8}>
        <Box p={6} borderBottom="1px solid" borderColor={borderColor} bg={tableHBg}>
          <Heading size="sm" textTransform="uppercase" letterSpacing="wider" color={textColor}>
            Payment History
          </Heading>
        </Box>

        {/* Desktop Table View */}
        <TableContainer display={{ base: "none", md: "block" }}>
          <Table variant="simple" size="md">
            <Thead bg={tableHBg}>
              <Tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Method</Th>
                <Th isNumeric>Amount</Th>
              </Tr>
            </Thead>
            <Tbody>
              {!lease.payments || lease.payments.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={8} color={mutedText}>No payments found.</Td>
                </Tr>
              ) : (
                lease.payments.map((p) => (
                  <Tr key={p.id}>
                    <Td fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(p.payment_date)}</Td>
                    <Td>
                      <Badge colorScheme={p.type === 'rent' ? 'green' : 'blue'}>{p.type}</Badge>
                    </Td>
                    <Td fontSize="sm" textTransform="uppercase" color={mutedText}>{p.payment_method}</Td>
                    <Td isNumeric fontSize="sm" fontWeight="black" color="green.500">{fmt(p.amount_paid)}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* Mobile List View */}
        <VStack display={{ base: "flex", md: "none" }} spacing={0} divider={<Box borderBottom="1px solid" borderColor={borderColor} w="full" />} align="stretch">
          {!lease.payments || lease.payments.length === 0 ? (
            <Text p={6} textAlign="center" color={mutedText}>No payments found.</Text>
          ) : (
            lease.payments.map(p => (
              <Box key={p.id} p={5} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(p.payment_date)}</Text>
                  <Text fontSize="lg" fontWeight="black" color="green.500">{fmt(p.amount_paid)}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Badge colorScheme={p.type === 'rent' ? 'green' : 'blue'} px={2} py={0.5} borderRadius="full">{p.type}</Badge>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color={mutedText}>Method: {p.payment_method}</Text>
                </Flex>
              </Box>
            ))
          )}
        </VStack>
      </Box>

      {/* Utility Bills */}
      <Box bg={bg} borderRadius="2xl" border="1px solid" borderColor={borderColor} overflow="hidden">
        <Box p={6} borderBottom="1px solid" borderColor={borderColor} bg={tableHBg}>
          <Heading size="sm" textTransform="uppercase" letterSpacing="wider" color={textColor}>
            Billing History
          </Heading>
        </Box>

        {/* Desktop Table View */}
        <TableContainer display={{ base: "none", md: "block" }}>
          <Table variant="simple" size="md">
            <Thead bg={tableHBg}>
              <Tr>
                <Th>Bill Period</Th>
                <Th>Type</Th>
                <Th>Usage</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {!lease.utility_bills || lease.utility_bills.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8} color={mutedText}>No billing history found.</Td>
                </Tr>
              ) : (
                lease.utility_bills.map((b) => (
                  <Tr key={b.id}>
                    <Td fontSize="sm" fontWeight="bold" color={textColor}>
                      {dayjs(b.billing_date).format('MMM YYYY')}
                    </Td>
                    <Td fontSize="sm" textTransform="uppercase">{b.type}</Td>
                    <Td fontSize="xs" color={mutedText}>
                      {b.previous_reading} - {b.current_reading} ({b.current_reading - b.previous_reading} units)
                    </Td>
                    <Td fontSize="sm" fontWeight="bold">{fmt(b.amount)}</Td>
                    <Td>
                      <Badge colorScheme={b.status === 'paid' ? 'green' : 'red'}>{b.status}</Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* Mobile List View */}
        <VStack display={{ base: "flex", md: "none" }} spacing={0} divider={<Box borderBottom="1px solid" borderColor={borderColor} w="full" />} align="stretch">
          {!lease.utility_bills || lease.utility_bills.length === 0 ? (
            <Text p={6} textAlign="center" color={mutedText}>No billing history found.</Text>
          ) : (
            lease.utility_bills.map(b => (
              <Box key={b.id} p={5} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>{dayjs(b.billing_date).format('MMM YYYY')}</Text>
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color={mutedText} mt={1}>{b.type}</Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>{fmt(b.amount)}</Text>
                    <Badge colorScheme={b.status === 'paid' ? 'green' : 'red'} mt={1} px={2} py={0.5} borderRadius="full">{b.status}</Badge>
                  </Box>
                </Flex>
                <Box pt={3} borderTop="1px dashed" borderColor={useColorModeValue("gray.100", "gray.700")}>
                  <Text fontSize="xs" color={mutedText}>
                    <Text as="span" fontWeight="bold">Usage:</Text> {b.previous_reading} - {b.current_reading} ({b.current_reading - b.previous_reading} units)
                  </Text>
                </Box>
              </Box>
            ))
          )}
        </VStack>
      </Box>
    </Box>
  );
}
