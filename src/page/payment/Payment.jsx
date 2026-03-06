import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Box, Flex, Button, Input, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Badge, Select, useColorModeValue, Spinner, Text,
  SimpleGrid, IconButton, Tooltip, Heading, useDisclosure
} from "@chakra-ui/react";
import { FiArrowUp, FiArrowDown, FiTrash2, FiPrinter, FiChevronLeft, FiChevronRight, FiPlus, FiSearch } from "react-icons/fi";
import RecordPaymentModal from "../../components/RecordPaymentModal";

const API = "http://localhost:8000/api/v1/admin";
const fmt = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("payment_date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ last_page: 1, total: 0 });

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const thColor = useColorModeValue("gray.500", "gray.400");
  const trHoverBg = useColorModeValue("gray.50", "gray.700");
  const tableHBg = useColorModeValue("gray.50", "gray.700");

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    Accept: "application/json",
  });

  const fetchPayments = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const h = headers();
      const params = new URLSearchParams({ 
        per_page: 15, 
        page,
        sort: sortField,
        direction: sortOrder
      });
      if (search) params.append("search", search);
      if (typeFilter) params.append("type", typeFilter);
      if (methodFilter) params.append("payment_method", methodFilter);

      const res = await fetch(`${API}/payments?${params}`, { headers: h });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || data);
        setPagination({ 
          last_page: data.last_page || 1, 
          total: data.total || 0, 
          from: data.from, 
          to: data.to 
        });
      }
    } catch (e) {
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }
    const handler = setTimeout(() => {
      fetchPayments(); 
    }, 400);
    return () => clearTimeout(handler);
  }, [search, typeFilter, methodFilter, sortField, sortOrder, currentPage]);

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete this ${p.type} payment of ${fmt(p.amount_paid)}?`)) return;
    try {
      const res = await fetch(`${API}/payments/${p.id}`, { 
        method: "DELETE", 
        headers: headers() 
      });
      if (res.ok) { 
        toast.success("Payment record deleted"); 
        fetchPayments(); 
      } else {
        toast.error("Failed to delete record");
      }
    } catch (e) { toast.error("Network error"); }
  };

  const handlePrintReceipt = async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    if (list.length === 0) { toast.error("Select payments to print."); return; }
    try {
      const res = await fetch(`${API}/payments/print-receipt`, {
        method: "POST",
        headers: {
          ...headers(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ payment_ids: list }),
      });
      if (res.ok) {
        const blob = await res.blob();
        window.open(window.URL.createObjectURL(blob), "_blank");
      } else toast.error("Failed to generate receipt");
    } catch (e) { toast.error("Network error"); }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const typeBadge = (type) => {
    switch (type) {
      case "rent": return "blue";
      case "utility": return "green";
      case "deposit": return "orange";
      default: return "gray";
    }
  };

  const renderPagination = () => (
    <Flex align="center" justify="space-between" px={6} py={3} borderTop="1px solid" borderColor={borderColor}>
      <Text fontSize="sm" color={mutedText}>
        Showing {pagination.from || 0}–{pagination.to || 0} of {pagination.total || 0}
      </Text>
      <Flex gap={1}>
        <IconButton
          icon={<FiChevronLeft />} size="xs" variant="ghost"
          isDisabled={currentPage <= 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          aria-label="Previous"
        />
        <IconButton
          icon={<FiChevronRight />} size="xs" variant="ghost"
          isDisabled={currentPage >= pagination.last_page}
          onClick={() => setCurrentPage(currentPage + 1)}
          aria-label="Next"
        />
      </Flex>
    </Flex>
  );

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">

        {/* Header */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Box>
            <Heading size="md" color={textColor} textTransform="uppercase" letterSpacing="tight">
              Payment Transactions
            </Heading>
            <Text fontSize="sm" color={mutedText} mt={0.5}>
              History of all rent, utility, and other financial records
            </Text>
          </Box>
          <Button size="md" colorScheme="blue" leftIcon={<FiPlus />} onClick={onOpen}>
            Record New Payment
          </Button>
        </Flex>

        {/* Stats Summary */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
          <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
            <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Total Transactions</Text>
            <Heading size="lg" fontWeight="black" color={textColor}>{pagination.total || 0}</Heading>
            <Text fontSize="sm" color={mutedText}>on record</Text>
          </Box>
          <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
            <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Current View Volume</Text>
            <Heading size="lg" fontWeight="black" color="green.500">{fmt(payments.reduce((s, p) => s + Number(p.amount_paid), 0))}</Heading>
            <Text fontSize="sm" color={mutedText}>total shown in this page</Text>
          </Box>
        </SimpleGrid>

        {/* Filters */}
        <Flex gap={3} mb={4} flexWrap="wrap" align="center">
          <Box position="relative" maxW="300px" flex="1">
             <Input
                placeholder="Search tenant, room, notes..."
                size="md" bg={cardBg} borderColor={borderColor}
                value={search} onChange={e => setSearch(e.target.value)}
                pl={8}
                _hover={{ borderColor: "blue.400" }}
              />
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color={mutedText}>
                <FiSearch size={12} />
              </Box>
          </Box>
          <Select size="md" bg={cardBg} borderColor={borderColor} maxW="160px" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="rent">Rent</option>
            <option value="utility">Utility</option>
            <option value="deposit">Deposit</option>
            <option value="other">Other</option>
          </Select>
          <Select size="md" bg={cardBg} borderColor={borderColor} maxW="160px" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </Select>
        </Flex>

        {/* Table */}
        <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg={tableHBg}>
                <Tr>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">Tenant / Room</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSort("payment_date")}>Date</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">Type</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">Amount</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">Method</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">Notes</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} textAlign="right" />
                </Tr>
              </Thead>
              <Tbody>
                {isLoading && payments.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign="center" py={12}><Spinner size="md" mr={2} /> Loading payments...</Td></Tr>
                ) : payments.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign="center" py={12} color={mutedText}>No payment records found.</Td></Tr>
                ) : (
                  payments.map(p => (
                    <Tr key={p.id} _hover={{ bg: trHoverBg }}>
                      <Td>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>{p.lease?.tenant?.name || "—"}</Text>
                        <Text fontSize="sm" color={mutedText}>{p.lease?.room?.name || "No Room"}</Text>
                      </Td>
                      <Td fontSize="sm" fontWeight="bold" color={mutedText}>{fmtDate(p.payment_date)}</Td>
                      <Td>
                        <Badge fontSize="sm" fontWeight="black" colorScheme={typeBadge(p.type)} textTransform="uppercase">
                          {p.type}
                        </Badge>
                      </Td>
                      <Td fontSize="sm" fontWeight="black" color={textColor}>{fmt(p.amount_paid)}</Td>
                      <Td fontSize="sm" color={mutedText} textTransform="uppercase">{p.payment_method}</Td>
                      <Td fontSize="sm" color={mutedText} maxW="200px" isTruncated title={p.notes}>{p.notes || "—"}</Td>
                      <Td textAlign="right">
                        <Flex gap={1} justify="flex-end">
                          <Tooltip label="Print Receipt" hasArrow>
                            <IconButton icon={<FiPrinter />} size="xs" colorScheme="blue" variant="ghost" onClick={() => handlePrintReceipt(p.id)} aria-label="Print" />
                          </Tooltip>
                          <Tooltip label="Delete" hasArrow>
                            <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDelete(p)} aria-label="Delete" />
                          </Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
          {pagination.last_page > 1 && renderPagination()}
        </Box>
      </Box>

      {/* Record Payment Modal */}
      <RecordPaymentModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onSuccess={() => fetchPayments(1)} 
      />
    </Box>
  );
}
