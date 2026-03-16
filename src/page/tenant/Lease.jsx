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
  useDisclosure,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiClock, FiFileText, FiDollarSign } from "react-icons/fi";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";

const API = "http://localhost:8000/api/v1/tenant";

const fmt = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  // Check for both symbol and code variations
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rateItem = localStorage.getItem("exchangeRate");
    const r = rateItem ? Number(rateItem) : 4000;
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d) => d ? dayjs(d).format("MMM D, YYYY") : "—";

export default function TenantLease() {
  const { t } = useTranslation();
  const [lease, setLease] = useState(null);
  const [pastLeases, setPastLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPastLease, setSelectedPastLease] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const tableHBg = useColorModeValue("gray.50", "#1c2333");

  const fetchLease = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLease(data.lease || null);
        setPastLeases(data.past_leases || []);
      } else {
        toast.error("Failed to load lease information");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLease();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  const rentPayments = lease ? (lease.payments || []).filter(p => p.type === "rent") : [];
  const totalRentPaid = rentPayments.reduce((s, p) => s + Number(p.amount_paid), 0);
  const totalContractMonths = lease ? Math.max(1, dayjs(lease.end_date).diff(dayjs(lease.start_date), 'month')) : 0;
  const totalContractValue = lease ? Number(lease.rent_amount) * totalContractMonths : 0;

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Toaster position="top-right" />
      
      {!lease ? (
        <Box p={8} textAlign="center" bg={bg} borderRadius="2xl" border="1px solid" borderColor={borderColor} mb={8}>
          <Icon as={FiFileText} boxSize={12} color="gray.300" mb={4} />
          <Heading size="md" color={mutedText}>No active lease found.</Heading>
          <Text color={mutedText} mt={2}>Please contact the management if you believe this is an error.</Text>
        </Box>
      ) : (
        <>
          <Flex justify="space-between" align="center" mb={8}>
            <Box>
              <Heading size="lg" letterSpacing="tight" color={textColor}>
                {t("sidebar.my_lease") || "My Lease Details"}
              </Heading>
              <Text fontSize="sm" color={mutedText} mt={1}>
                Overview of your current rental agreement
              </Text>
            </Box>
            <Badge
              colorScheme={lease.status === "active" ? "green" : "red"}
              fontSize="xs"
              px={3}
              py={1}
              borderRadius="full"
              textTransform="uppercase"
              fontWeight="black"
            >
              {lease.status}
            </Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={8}>
            {/* Core Stats */}
            <Box bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
              <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>
                Monthly Rent
              </Text>
              <Heading size="xl" color={textColor} fontWeight="black">
                {fmt(lease.rent_amount)}
              </Heading>
              <Text fontSize="xs" color={mutedText} mt={2}>
                Due on the 1st of every month
              </Text>
            </Box>

            <Box bg={bg} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
              <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>
                Security Deposit
              </Text>
              <Heading size="xl" color={textColor} fontWeight="black">
                {fmt(lease.security_deposit)}
              </Heading>
              <Badge mt={2} colorScheme={lease.deposit_status === 'held' ? "green" : "orange"} variant="subtle">
                {lease.deposit_status || 'unpaid'}
              </Badge>
            </Box>

            <Box bg="blue.600" p={6} borderRadius="2xl" shadow="xl" color="white">
              <Text fontSize="xs" fontWeight="black" color="blue.100" textTransform="uppercase" letterSpacing="wider" mb={2}>
                Rent Progress
              </Text>
              <Heading size="xl" fontWeight="black">
                {fmt(totalRentPaid)}
              </Heading>
              <Text fontSize="xs" color="blue.100" mt={2}>
                Paid of {fmt(totalContractValue)} total contract value
              </Text>
            </Box>
          </SimpleGrid>

          {/* Details Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
            <Box bg={bg} p={8} borderRadius="2xl" border="1px solid" borderColor={borderColor}>
              <Heading size="sm" mb={6} textTransform="uppercase" letterSpacing="wider" color={textColor}>
                Lease Information
              </Heading>
              <VStack align="stretch" spacing={4}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>Room Name</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{lease.room?.name || "N/A"}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>Start Date</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(lease.start_date)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>End Date</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(lease.end_date)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>Duration</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{totalContractMonths} Months</Text>
                </Flex>
              </VStack>
            </Box>

            <Box bg={bg} p={8} borderRadius="2xl" border="1px solid" borderColor={borderColor}>
              <Heading size="sm" mb={6} textTransform="uppercase" letterSpacing="wider" color={textColor}>
                Payment Overview
              </Heading>
              <VStack align="stretch" spacing={4}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>Total Rent Paid</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">{fmt(totalRentPaid)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>Security Deposit</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmt(lease.security_deposit)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedText}>Deposit Status</Text>
                  <Badge colorScheme={lease.deposit_status === 'held' ? "green" : "orange"}>{lease.deposit_status}</Badge>
                </Flex>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Recent Payments Table */}
          <Box mt={8} textAlign="center">
            <Button
              as={Link}
              to="/dashboard/lease/history"
              variant="outline"
              leftIcon={<FiClock />}
              size="lg"
              borderRadius="xl"
              fontWeight="bold"
            >
              View Full Lease History
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
