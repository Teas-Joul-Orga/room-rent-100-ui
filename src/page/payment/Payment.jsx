import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Box, Flex, Button, Input, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Badge, Select, useColorModeValue, Spinner, Text,
  SimpleGrid, IconButton, Tooltip, Heading, useDisclosure,
  Tabs, TabList, Tab, TabPanels, TabPanel, Checkbox
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiArrowUp, FiArrowDown, FiTrash2, FiPrinter, FiChevronLeft, FiChevronRight, FiPlus, FiSearch, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";
import RecordPaymentModal from "../../components/RecordPaymentModal";

const API = "http://localhost:8000/api/v1/admin";
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
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function Payment() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [paymentGroup, setPaymentGroup] = useState("admin");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sorting
  const [sortField, setSortField] = useState("payment_date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ last_page: 1, total: 0 });

  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const thColor = useColorModeValue("gray.500", "gray.400");
  const trHoverBg = useColorModeValue("gray.50", "#1c2333");
  const tableHBg = useColorModeValue("gray.50", "#1c2333");

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
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter) params.append("type", typeFilter);
      if (methodFilter) params.append("payment_method", methodFilter);
      if (paymentGroup) params.append("payment_group", paymentGroup);

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
    fetchPayments(); 
  }, [debouncedSearch, typeFilter, methodFilter, sortField, sortOrder, currentPage, paymentGroup]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? payments.map(p => p.id) : []);
  };

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

  const handlePrintReceipt = (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    if (list.length === 0) { toast.error("Select payments to print."); return; }
    
    const queryParams = new URLSearchParams();
    list.forEach(id => queryParams.append('payment_ids[]', id));
    queryParams.append('token', localStorage.getItem("token"));
    
    const printUrl = `http://localhost:8000/api/v1/admin/print/receipt?${queryParams.toString()}`;
    window.open(printUrl, "_blank");
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
              {t("payment.title")}
            </Heading>
            <Text fontSize="sm" color={mutedText} mt={0.5}>
              {t("payment.subtitle")}
            </Text>
          </Box>
          <Flex gap={2}>
            {selectedIds.length > 0 && (
              <Button size="md" colorScheme="purple" variant="outline" leftIcon={<FiPrinter />} onClick={() => handlePrintReceipt(selectedIds)}>
                {t("payment.print_receipts", `Print Receipts (${selectedIds.length})`)}
              </Button>
            )}
            <Button
              size="md"
              colorScheme="green"
              variant="outline"
              leftIcon={<FiDownload />}
              onClick={() => {
                const dataToExport = payments.map(p => ({
                  "Tenant": p.lease?.tenant?.name || "—",
                  "Room": p.lease?.room?.name || "No Room",
                  "Date": p.payment_date,
                  "Type": p.type,
                  "Amount": Number(p.amount_paid),
                  "Method": p.payment_method,
                  "Notes": p.notes || "—"
                }));
                exportToExcel(dataToExport, "All_Payments_" + new Date().toISOString().split('T')[0]);
              }}
            >
              Export Excel
            </Button>
            <Button size="md" colorScheme="blue" leftIcon={<FiPlus />} onClick={onOpen}>
              {t("payment.record_new")}
            </Button>
          </Flex>
        </Flex>

        {/* Stats Summary */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
          <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
            <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("payment.total_transactions")}</Text>
            <Heading size="lg" fontWeight="black" color={textColor}>{pagination.total || 0}</Heading>
            <Text fontSize="sm" color={mutedText}>{t("payment.on_record")}</Text>
          </Box>
          <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
            <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("payment.current_view_volume")}</Text>
            <Heading size="lg" fontWeight="black" color="green.500">{fmt(payments.reduce((s, p) => s + Number(p.amount_paid), 0))}</Heading>
            <Text fontSize="sm" color={mutedText}>{t("payment.total_shown")}</Text>
          </Box>
        </SimpleGrid>

        <Tabs variant="enclosed" colorScheme="blue" onChange={(index) => {
          setPaymentGroup(index === 0 ? "admin" : "bakong");
          setCurrentPage(1);
          setMethodFilter("");
        }} mb={4}>
          <TabList>
            <Tab fontWeight="bold">{t("payment.admin_payments", "Admin Payments")}</Tab>
            <Tab fontWeight="bold">{t("payment.bakong_payments", "Bakong Payments")}</Tab>
          </TabList>
        </Tabs>

        {/* Filters */}
        <Flex gap={3} mb={4} flexWrap="wrap" align="center">
          <Box position="relative" maxW="300px" flex="1">
             <Input
                placeholder={t("payment.search_placeholder")}
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
            <option value="">{t("payment.all_types")}</option>
            <option value="rent">{t("payment.rent")}</option>
            <option value="utility">{t("payment.utility")}</option>
            <option value="deposit">{t("payment.deposit")}</option>
            <option value="other">{t("payment.other")}</option>
          </Select>
          {paymentGroup === "admin" && (
            <Select size="md" bg={cardBg} borderColor={borderColor} maxW="160px" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
              <option value="">{t("payment.all_methods")}</option>
              <option value="cash">{t("payment.cash")}</option>
              <option value="bank">{t("payment.bank")}</option>
            </Select>
          )}
        </Flex>

        {/* Table */}
        <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg={tableHBg}>
                <Tr>
                  <Th w="40px" borderBottom="2px solid" borderColor={borderColor}>
                    <Checkbox onChange={(e) => toggleAll(e.target.checked)} isChecked={selectedIds.length === payments.length && payments.length > 0} />
                  </Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("payment.tenant_room")}</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" cursor="pointer" onClick={() => handleSort("payment_date")}>{t("payment.date")}</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("payment.type")}</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("payment.amount")}</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("payment.method")}</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("payment.notes")}</Th>
                  <Th borderBottom="2px solid" borderColor={borderColor} textAlign="right" />
                </Tr>
              </Thead>
              <Tbody>
                {isLoading && payments.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign="center" py={12}><Spinner size="md" mr={2} /> {t("payment.loading")}</Td></Tr>
                ) : payments.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign="center" py={12} color={mutedText}>{t("payment.no_records")}</Td></Tr>
                ) : (
                  payments.map(p => (
                    <Tr key={p.id} _hover={{ bg: trHoverBg }} bg={selectedIds.includes(p.id) ? "blue.50" : "transparent"}>
                      <Td>
                        <Checkbox isChecked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>{p.lease?.tenant?.name || "—"}</Text>
                        <Text fontSize="sm" color={mutedText}>{p.lease?.room?.name || "No Room"}</Text>
                      </Td>
                      <Td fontSize="sm" fontWeight="bold" color={mutedText}>{fmtDate(p.payment_date)}</Td>
                      <Td>
                        <Badge fontSize="sm" fontWeight="black" colorScheme={typeBadge(p.type)} textTransform="uppercase">
                          {t(`payment.${p.type}`)}
                        </Badge>
                      </Td>
                      <Td fontSize="sm" fontWeight="black" color={textColor}>{fmt(p.amount_paid)}</Td>
                      <Td fontSize="sm" color={mutedText} textTransform="uppercase">{t(`payment.${p.payment_method}`)}</Td>
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
