import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Box, Flex, Button, Input, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Badge, Select, useColorModeValue, Spinner, Text,
  SimpleGrid, Checkbox, IconButton, Tooltip, Heading, Icon,
  Tabs, TabList, TabPanels, Tab, TabPanel, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, useDisclosure, FormControl, FormLabel, Textarea
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiArrowUp, FiArrowDown, FiTrash2, FiPrinter, FiBell, FiChevronLeft, FiChevronRight, FiPlus, FiCreditCard, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";
import RecordPaymentModal from "../../components/RecordPaymentModal";

const API = "http://localhost:8000/api/v1/admin";
const getDefaultRate = (type) => {
  const rawUSD = type === "electricity" ? localStorage.getItem("utility_rate_electricity")
                : type === "water"       ? localStorage.getItem("utility_rate_water")
                : null;
  if (!rawUSD) return "";
  const c = localStorage.getItem("currency") || "$";
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rate = Number(localStorage.getItem("exchangeRate") || 4000);
    return (Number(rawUSD) * rate).toFixed(0);
  }
  return rawUSD;
};

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

const toUSD = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return (num / r).toFixed(2);
  }
  return num;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function Utility() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Add Bill modal
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const [addForm, setAddForm] = useState({
    room_id: "", type: "electricity", amount: "", due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: "unpaid", description: "", previous_reading: "", current_reading: "", cost_per_unit: getDefaultRate("electricity"), payment_method: "cash"
  });
  const [rooms, setRooms] = useState([]);
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Pay Modal
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const [payTarget, setPayTarget] = useState(null);

  // Metering logic helpers
  const isMetered = ["electricity", "water"].includes(addForm.type);
  const usage = isMetered ? Math.max(0, Number(addForm.current_reading || 0) - Number(addForm.previous_reading || 0)) : 0;

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0 = Bills, 1 = Payments

  // Sorting
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  // Delete Modal
  const { isOpen: isDelOpen, onOpen: onDelOpen, onClose: onDelClose } = useDisclosure();
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    "Content-Type": "application/json",
  });

  const fetchBills = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const h = headers();
      const params = new URLSearchParams({ per_page: 15, page });
      if (search) params.append("search", search);
      
      if (activeTab === 0) {
        if (typeFilter) params.append("type", typeFilter);
        if (statusFilter) params.append("status", statusFilter);
        if (sortField) { params.append("sort", sortField); params.append("direction", sortOrder); }
        const res = await fetch(`${API}/utility-bills?${params}`, { headers: h });
        if (res.ok) {
          const data = await res.json();
          setBills(data.data || data);
          setPagination({ last_page: data.last_page || 1, total: data.total || 0, from: data.from, to: data.to });
        }
      } else {
        params.append("type", "utility"); // Only utility payments
        const res = await fetch(`${API}/payments?${params}`, { headers: h });
        if (res.ok) {
          const data = await res.json();
          setPayments(data.data || data);
          setPagination({ last_page: data.last_page || 1, total: data.total || 0, from: data.from, to: data.to });
        }
      }
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms?limit=all&minimal=true`, { headers: headers() });
      if (res.ok) {
        const d = await res.json();
        setRooms(d.data || d);
      }
    } catch (e) {}
  };

  const fetchReading = async (roomId, type) => {
    if (!roomId || !["electricity", "water"].includes(type)) return;
    try {
      const res = await fetch(`${API}/utility-bills/last-reading/${roomId}?type=${type}`, { headers: headers() });
      if (res.ok) {
        const d = await res.json();
        setAddForm(prev => ({ ...prev, previous_reading: d.reading || 0 }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isAddOpen) fetchRooms();
  }, [isAddOpen]);

  useEffect(() => {
    fetchReading(addForm.room_id, addForm.type);
  }, [addForm.room_id, addForm.type]);

  // Recalculate amount if readings/rate change
  useEffect(() => {
    if (isMetered && addForm.cost_per_unit) {
      const amt = (usage * Number(addForm.cost_per_unit)).toFixed(2);
      setAddForm(prev => ({ ...prev, amount: amt }));
    }
  }, [usage, addForm.cost_per_unit, addForm.type]);

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (isMetered && Number(addForm.current_reading) < Number(addForm.previous_reading)) {
      toast.error("Current reading cannot be lower than previous reading");
      return;
    }
    if (!addForm.room_id || !addForm.type || !addForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSavingAdd(true);
    try {
      const res = await fetch(`${API}/utility-bills`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          ...addForm,
          amount: toUSD(addForm.amount),
          cost_per_unit: toUSD(addForm.cost_per_unit),
        }),
      });
      if (res.ok) {
        toast.success("Utility bill added successfully");
        onAddClose();
        fetchBills(1);
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to add bill");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsSavingAdd(false); }
  };

  useEffect(() => { 
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }
    const handler = setTimeout(() => {
      fetchBills(); 
    }, 400);
    return () => clearTimeout(handler);
  }, [search, typeFilter, statusFilter, sortField, sortOrder, activeTab, currentPage]);

  const confirmDelete = async () => {
    if (!selectedBill) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/utility-bills/${selectedBill.id}`, { 
        method: "DELETE", 
        headers: headers() 
      });
      if (res.ok) { 
        toast.success("Bill deleted successfully"); 
        onDelClose();
        fetchBills(); 
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete bill");
      }
    } catch (e) { 
      toast.error("Network error"); 
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (selectedIds.length === 0) { toast.error("Select bills to print."); return; }
    try {
      const res = await fetch(`${API}/utility-bills/print-invoice`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ bill_ids: selectedIds }),
      });
      if (res.ok) {
        const blob = await res.blob();
        window.open(window.URL.createObjectURL(blob), "_blank");
      } else toast.error("Failed to generate invoice");
    } catch (e) { toast.error("Network error"); }
  };

  const handleSendNotification = async (billId) => {
    if (!window.confirm("Send a reminder notification for this bill?")) return;
    try {
      const res = await fetch(`${API}/utility-bills/${billId}/notify`, { method: "POST", headers: headers() });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "Notification sent");
      else toast.error(data.error || "Failed to send notification");
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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />;
  };

  const typeBadge = (type) => {
    switch (type) {
      case "electricity": return "yellow";
      case "water": return "blue";
      case "internet": return "purple";
      default: return "gray";
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "paid": return "green";
      case "unpaid": return "red";
      case "overdue": return "orange";
      default: return "gray";
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? bills.map(b => b.id) : []);
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
        {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
          const page = i + 1;
          return (
            <Button
              key={page} size="xs"
              variant={currentPage === page ? "solid" : "ghost"}
              colorScheme={currentPage === page ? "blue" : "gray"}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          );
        })}
        {pagination.last_page > 5 && <Text fontSize="sm" color={mutedText} px={1}>...</Text>}
        <IconButton
          icon={<FiChevronRight />} size="xs" variant="ghost"
          isDisabled={currentPage >= pagination.last_page}
          onClick={() => setCurrentPage(currentPage + 1)}
          aria-label="Next"
        />
      </Flex>
    </Flex>
  );

  // KPI stats
  const totalBills = activeTab === 0 ? (pagination.total || 0) : 0;
  const unpaidCount = bills.filter(b => b.status === "unpaid").length;
  const totalUnpaidAmount = bills.filter(b => b.status === "unpaid").reduce((s, b) => s + Number(b.amount), 0);

  if (isLoading && bills.length === 0 && payments.length === 0) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">

        {/* Header */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Box>
            <Heading size="md" color={textColor} textTransform="uppercase" letterSpacing="tight">
              {t("utility.title")}
            </Heading>
            <Text fontSize="sm" color={mutedText} mt={0.5}>
              {t("utility.subtitle")}
            </Text>
          </Box>
          <Flex gap={2}>
            {selectedIds.length > 0 && (
              <Button size="md" colorScheme="purple" variant="outline" leftIcon={<FiPrinter />} onClick={handlePrintInvoice}>
                {t("utility.print_invoice", { count: selectedIds.length })}
              </Button>
            )}
            <Button
              size="md"
              colorScheme="green"
              variant="outline"
              leftIcon={<FiDownload />}
              onClick={() => {
                if (activeTab === 0) {
                  const dataToExport = bills.map(b => ({
                    "Tenant": b.lease?.tenant?.name || "—",
                    "Room": b.lease?.room?.name || b.room?.name || "—",
                    "Type": b.type,
                    "Amount": Number(b.amount),
                    "Due Date": b.due_date,
                    "Status": b.status,
                    "Description": b.description || "—"
                  }));
                  exportToExcel(dataToExport, "Utility_Bills_" + new Date().toISOString().split('T')[0]);
                } else {
                  const dataToExport = payments.map(p => ({
                    "Tenant": p.lease?.tenant?.name || "—",
                    "Room": p.lease?.room?.name || "—",
                    "Date": p.payment_date,
                    "Amount Paid": Number(p.amount_paid),
                    "Method": p.payment_method,
                    "Notes": p.notes || "—"
                  }));
                  exportToExcel(dataToExport, "Utility_Payments_" + new Date().toISOString().split('T')[0]);
                }
              }}
            >
              Export Excel
            </Button>
            <Button size="md" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => navigate("/dashboard/utility/addbill")}>
              {t("utility.add_new")}
            </Button>
          </Flex>
        </Flex>

        <Tabs variant="line" colorScheme="blue" index={activeTab} onChange={(i) => setActiveTab(i)} isLazy>
          <TabList borderBottom="1px solid" borderColor={borderColor} mb={6}>
            <Tab fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
              {t("utility.statements")}
            </Tab>
            <Tab fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
              {t("utility.payments_ledger")}
            </Tab>
          </TabList>

          <TabPanels>
            {/* TAB 1: BILLS LIST */}
            <TabPanel p={0}>
              {/* KPI Cards */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("utility.total_unpaid")}</Text>
                  <Heading size="lg" fontWeight="black" color="red.500">{unpaidCount}</Heading>
                  <Text fontSize="sm" color={mutedText}>{fmt(totalUnpaidAmount)} outstanding</Text>
                </Box>
                <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("utility.total_recordings")}</Text>
                  <Heading size="lg" fontWeight="black" color={textColor}>{pagination.total || 0}</Heading>
                  <Text fontSize="sm" color={mutedText}>bills on record</Text>
                </Box>
                <Box bg={cardBg} p={5} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="sm" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("utility.selected_printing")}</Text>
                  <Heading size="lg" fontWeight="black" color="purple.500">{selectedIds.length}</Heading>
                  <Text fontSize="sm" color={mutedText}>bills selected</Text>
                </Box>
              </SimpleGrid>

              {/* Filters */}
              <Flex gap={3} mb={4} flexWrap="wrap" align="center">
                <Input
                  placeholder={t("utility.search_placeholder")}
                  size="md" bg={cardBg} borderColor={borderColor} maxW="300px"
                  value={search} onChange={e => setSearch(e.target.value)}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
                <Select size="md" bg={cardBg} borderColor={borderColor} maxW="160px" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">{t("utility.all_types")}</option>
                  <option value="electricity">{t("utility.electricity")}</option>
                  <option value="water">{t("utility.water")}</option>
                  <option value="trash">{t("utility.trash")}</option>
                  <option value="internet">{t("utility.internet")}</option>
                  <option value="other">{t("utility.other")}</option>
                </Select>
                <Select size="md" bg={cardBg} borderColor={borderColor} maxW="160px" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">{t("utility.all_status")}</option>
                  <option value="unpaid">{t("utility.unpaid")}</option>
                  <option value="paid">{t("utility.paid")}</option>
                </Select>
              </Flex>

              {/* Table */}
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <TableContainer>
                  <Table variant="simple" size="md">
                    <Thead>
                      <Tr bg={tableHBg}>
                        <Th w="40px" borderBottom="2px solid" borderColor={borderColor}>
                          <Checkbox onChange={(e) => toggleAll(e.target.checked)} isChecked={selectedIds.length === bills.length && bills.length > 0} />
                        </Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider">{t("utility.tenant_room")}</Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" cursor="pointer" onClick={() => handleSort("type")}>
                          <Flex align="center" gap={1}>{t("utility.type")} <SortIcon field="type" /></Flex>
                        </Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" cursor="pointer" onClick={() => handleSort("amount")}>
                          <Flex align="center" gap={1}>{t("utility.amount")} <SortIcon field="amount" /></Flex>
                        </Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" cursor="pointer" onClick={() => handleSort("due_date")}>
                          <Flex align="center" gap={1}>{t("utility.due_date")} <SortIcon field="due_date" /></Flex>
                        </Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" cursor="pointer" onClick={() => handleSort("status")}>
                          <Flex align="center" gap={1}>{t("utility.status")} <SortIcon field="status" /></Flex>
                        </Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider">{t("utility.description")}</Th>
                        <Th borderBottom="2px solid" borderColor={borderColor} textAlign="right" />
                      </Tr>
                    </Thead>
                    <Tbody>
                      {bills.length === 0 ? (
                        <Tr><Td colSpan={8} textAlign="center" py={12} color={mutedText}>No utility bills found.</Td></Tr>
                      ) : (
                        bills.map(bill => (
                          <Tr key={bill.id} _hover={{ bg: trHoverBg }} bg={selectedIds.includes(bill.id) ? "blue.50" : "transparent"}>
                            <Td>
                              <Checkbox isChecked={selectedIds.includes(bill.id)} onChange={() => toggleSelect(bill.id)} />
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                {bill.lease?.tenant?.name || "—"}
                              </Text>
                              <Text fontSize="sm" color={mutedText}>
                                {bill.lease?.room?.name || bill.room?.name || "—"}
                              </Text>
                            </Td>
                            <Td>
                              <Badge fontSize="sm" fontWeight="black" textTransform="uppercase" colorScheme={typeBadge(bill.type)}>
                                {t(`utility.${bill.type}`)}
                              </Badge>
                            </Td>
                            <Td fontWeight="black" color={textColor}>{fmt(bill.amount)}</Td>
                            <Td fontSize="sm" fontWeight="bold" color={mutedText}>{fmtDate(bill.due_date)}</Td>
                            <Td>
                              <Badge fontSize="sm" fontWeight="black" textTransform="uppercase" colorScheme={statusBadge(bill.status)}>
                                {t(`utility.${bill.status}`)}
                              </Badge>
                            </Td>
                            <Td fontSize="sm" color={mutedText} maxW="200px" isTruncated>{bill.description || "—"}</Td>
                            <Td textAlign="right">
                              <Flex gap={1} justify="flex-end">
                                {bill.status === "unpaid" && (
                                  <>
                                    <Tooltip label="Pay Bill" hasArrow>
                                      <IconButton 
                                        icon={<FiCreditCard />} 
                                        size="xs" colorScheme="green" variant="ghost" 
                                        onClick={() => {
                                          setPayTarget({
                                            lease_id: bill.lease_id,
                                            bill_id: bill.id,
                                            amount: bill.amount,
                                            type: "utility",
                                            notes: `Payment for ${bill.type} bill (Due: ${fmtDate(bill.due_date)})`
                                          });
                                          onPayOpen();
                                        }} 
                                        aria-label="Pay" 
                                      />
                                    </Tooltip>
                                    <Tooltip label="Send Reminder" hasArrow>
                                      <IconButton icon={<FiBell />} size="xs" colorScheme="orange" variant="ghost" onClick={() => handleSendNotification(bill.id)} aria-label="Notify" />
                                    </Tooltip>
                                  </>
                                )}
                                <Tooltip label="Delete" hasArrow>
                                  <IconButton 
                                    icon={<FiTrash2 />} 
                                    size="xs" colorScheme="red" variant="ghost" 
                                    onClick={() => {
                                      setSelectedBill(bill);
                                      onDelOpen();
                                    }} 
                                    aria-label="Delete" 
                                  />
                                </Tooltip>
                              </Flex>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
                {/* Pagination (Moved inside Box) */}
                {pagination.last_page > 1 && renderPagination()}
              </Box>
            </TabPanel>

            {/* TAB 2: PAYMENTS LEDGER */}
            <TabPanel p={0}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <TableContainer>
                  <Table variant="simple" size="md">
                    <Thead bg={tableHBg}>
                      <Tr>
                        <Th color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("utility.tenant_room")}</Th>
                        <Th color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("utility.date")}</Th>
                        <Th color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("utility.amount_paid")}</Th>
                        <Th color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("utility.method")}</Th>
                        <Th color={thColor} fontSize="sm" fontWeight="black" textTransform="uppercase">{t("utility.notes")}</Th>
                        <Th textAlign="right"></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {payments.length === 0 ? (
                        <Tr><Td colSpan={6} textAlign="center" py={12} color={mutedText}>No utility payments found.</Td></Tr>
                      ) : (
                        payments.map(p => (
                          <Tr key={p.id} _hover={{ bg: trHoverBg }}>
                            <Td>
                              <Text fontSize="sm" fontWeight="bold" color={textColor}>{p.lease?.tenant?.name}</Text>
                              <Text fontSize="sm" color={mutedText}>{p.lease?.room?.name}</Text>
                            </Td>
                            <Td fontSize="sm" fontWeight="black" color={mutedText}>{fmtDate(p.payment_date)}</Td>
                            <Td fontWeight="black" color={textColor}>{fmt(p.amount_paid)}</Td>
                            <Td fontSize="sm" fontWeight="bold" color={mutedText} textTransform="uppercase">{p.payment_method}</Td>
                            <Td fontSize="sm" color={mutedText}>{p.notes || "—"}</Td>
                            <Td textAlign="right">
                              <Tooltip label="View Print" hasArrow>
                                <IconButton icon={<FiPrinter />} size="xs" variant="ghost" colorScheme="blue" onClick={() => window.open(`${API}/payments/print-receipt?payment_ids[]=${p.id}`, '_blank')} aria-label="Print" />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
                {pagination.last_page > 1 && renderPagination()}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* ===== ADD UTILITY BILL MODAL ===== */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="5xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl" maxH="90vh">
          <form onSubmit={handleSaveBill}>
            <ModalHeader color={textColor} fontSize="lg" fontWeight="black" textTransform="uppercase" letterSpacing="tight">
              Add New Utility Bill
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>

              {/* 1. Room Selection */}
              <Box mb={6}>
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>1. Select Room</Text>
                  <Text fontSize="sm" color={mutedText}>Only active lease rooms show up here</Text>
                </Flex>
                <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} spacing={3}>
                  {rooms.map(room => {
                    const isOccupied = room.status === "occupied";
                    const isSelected = addForm.room_id === room.id;
                    return (
                      <Box
                        key={room.id}
                        border="2px solid"
                        borderColor={isSelected ? "blue.500" : borderColor}
                        borderRadius="lg"
                        p={3}
                        cursor="pointer"
                        bg={isSelected ? "blue.50" : cardBg}
                        _hover={{ borderColor: isSelected ? "blue.500" : "blue.300", shadow: "sm" }}
                        onClick={() => setAddForm({ ...addForm, room_id: room.id })}
                        textAlign="center"
                      >
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{room.name}</Text>
                        <Text fontSize="sm" fontWeight="bold" color={isOccupied ? "green.500" : "gray.400"} mt={1}>
                          {isOccupied ? "Occupied" : "Vacant"}
                        </Text>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>

              <Divider mb={6} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* 2. Bill Type & Details */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>2. Bill Type & Pricing</Text>
                  <FormControl isRequired mb={4}>
                    <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Utility Type</FormLabel>
                    <Select size="md" value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value, cost_per_unit: getDefaultRate(e.target.value), amount: "" })}>
                      <option value="electricity">Electricity</option>
                      <option value="water">Water</option>
                      <option value="trash">Trash (Fixed)</option>
                      <option value="internet">Internet (Fixed)</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>

                  {isMetered && (
                    <Box bg={bg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor} mb={4}>
                      <SimpleGrid columns={2} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Previous Reading</FormLabel>
                          <Input size="sm" bg="white" type="number" step="0.01" value={addForm.previous_reading} onChange={e => setAddForm({ ...addForm, previous_reading: e.target.value })} />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Current Reading</FormLabel>
                          <Input size="sm" bg="white" type="number" step="0.01" value={addForm.current_reading} onChange={e => setAddForm({ ...addForm, current_reading: e.target.value })} />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Rate per Unit ({localStorage.getItem("currency") || "$"})</FormLabel>
                          <Input size="sm" bg="white" type="number" step="0.01" value={addForm.cost_per_unit} onChange={e => setAddForm({ ...addForm, cost_per_unit: e.target.value })} placeholder="e.g. 0.25" />
                        </FormControl>
                        <Box display="flex" flexDirection="column" justifyContent="center">
                          <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Usage</Text>
                          <Text fontWeight="black" fontSize="sm" color="blue.600">{usage.toFixed(2)} units</Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  )}

                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Total Amount ({localStorage.getItem("currency") || "$"})</FormLabel>
                      <Input size="sm" type="number" step="0.01" value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })} bg="yellow.50" fontWeight="bold" />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Due Date</FormLabel>
                      <Input size="sm" type="date" value={addForm.due_date} onChange={e => setAddForm({ ...addForm, due_date: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* 3. Status & Description */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>3. Status & Remarks</Text>
                  <FormControl mb={4}>
                    <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Initial Status</FormLabel>
                    <Select size="sm" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid (Auto-record payment)</option>
                    </Select>
                  </FormControl>
                  {addForm.status === "paid" && (
                    <FormControl mb={4}>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Payment Method</FormLabel>
                      <Select size="sm" value={addForm.payment_method} onChange={e => setAddForm({ ...addForm, payment_method: e.target.value })}>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank / ABA</option>
                        <option value="bakong">Bakong</option>
                      </Select>
                    </FormControl>
                  )}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Description (Optional)</FormLabel>
                    <Textarea size="sm" rows={4} placeholder="e.g. September Usage for Room 101" value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} />
                  </FormControl>
                </Box>
              </SimpleGrid>

            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor}>
              <Button onClick={onAddClose} variant="ghost" mr={3} size="sm" fontWeight="bold">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingAdd} fontWeight="bold" px={8}>Save Bill</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <RecordPaymentModal 
        isOpen={isPayOpen} 
        onClose={onPayClose} 
        onSuccess={() => fetchBills()} 
        initialData={payTarget} 
      />

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal isOpen={isDelOpen} onClose={onDelClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="3xl" shadow="2xl" border="1px solid" borderColor={borderColor} overflow="hidden">
          <ModalBody pt={10} pb={8} px={8}>
            <Flex direction="column" align="center" mb={6}>
              <Flex 
                w="20" h="20" mb={4} align="center" justify="center" 
                borderRadius="full" bg="red.50" color="red.500"
                shadow="inner"
              >
                <Icon as={FiTrash2} boxSize={10} />
              </Flex>
              <Heading size="lg" color={textColor} mb={1} fontWeight="black" textTransform="uppercase" letterSpacing="tight">
                Confirm Deletion
              </Heading>
              <Text color={mutedText} fontSize="sm" fontWeight="medium">
                This action is permanent and cannot be reversed.
              </Text>
            </Flex>

            <Box 
              bg={useColorModeValue("gray.50", "whiteAlpha.50")} 
              p={6} 
              borderRadius="2xl" 
              border="1px solid" 
              borderColor={borderColor}
              position="relative"
            >
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Bill Type</Text>
                  <Badge colorScheme={typeBadge(selectedBill?.type)} variant="solid" px={2} borderRadius="md" mt={1}>
                    {selectedBill?.type}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Amount</Text>
                  <Text fontWeight="black" color="red.500" fontSize="lg">{fmt(selectedBill?.amount)}</Text>
                </Box>
                <Box colSpan={2} mt={2}>
                  <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Target Occupant</Text>
                  <Text fontWeight="bold" color={textColor}>{selectedBill?.lease?.tenant?.name || "No tenant"}</Text>
                  <Text fontSize="xs" color={mutedText} fontWeight="bold">ROOM: {selectedBill?.lease?.room?.name || selectedBill?.room?.name || "N/A"}</Text>
                </Box>
                <Box colSpan={2} mt={2}>
                  <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Scheduled Due Date</Text>
                  <Text fontWeight="bold" color={textColor} fontSize="sm">{fmtDate(selectedBill?.due_date)}</Text>
                </Box>
                {selectedBill?.description && (
                  <Box colSpan={2} mt={2}>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Remarks</Text>
                    <Text fontSize="xs" color={mutedText} fontStyle="italic">"{selectedBill.description}"</Text>
                  </Box>
                )}
              </SimpleGrid>
            </Box>

            <Text fontSize="xs" color="red.500" mt={6} textAlign="center" fontWeight="black" textTransform="uppercase" letterSpacing="widest">
              Please verify details before proceeding
            </Text>
          </ModalBody>
          <ModalFooter bg={tableHBg} py={5} px={8} gap={3} justify="center">
            <Button variant="ghost" size="md" onClick={onDelClose} fontWeight="bold" color={mutedText} borderRadius="xl" px={6}>
              Back
            </Button>
            <Button 
              colorScheme="red" size="md" px={10} fontWeight="black" 
              isLoading={isDeleting} onClick={confirmDelete}
              borderRadius="xl"
              shadow="0 8px 20px -5px rgba(229, 62, 62, 0.4)"
              _hover={{ transform: "translateY(-1px)", shadow: "0 10px 25px -5px rgba(229, 62, 62, 0.5)" }}
              _active={{ transform: "translateY(0)" }}
            >
              PERMANENTLY DELETE
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

