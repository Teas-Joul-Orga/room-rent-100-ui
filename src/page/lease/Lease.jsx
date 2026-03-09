import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Box,
  Flex,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Select,
  useColorModeValue,
  Spinner,
  Text,
  FormControl,
  FormLabel,
  Checkbox,
  Icon,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiArrowUp, FiArrowDown, FiPlus, FiEye, FiEdit2, FiTrash2, FiCalendar } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";

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

export default function Leases() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Data
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startsAfter, setStartsAfter] = useState("");
  const [endsBefore, setEndsBefore] = useState("");

  // Sorting
  const [sortField, setSortField] = useState(null); // 'rent', 'end_date', 'status'
  const [sortOrder, setSortOrder] = useState('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination bounds
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  
  // Bulk Renew Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bulkDates, setBulkDates] = useState({});
  const [isBulkRenewing, setIsBulkRenewing] = useState(false);

  // Delete Modal
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [leaseToDelete, setLeaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const calculatePerPage = () => {
      // 100vh - 430px approx for extra header + search filters + padding + pagination
      const availableHeight = window.innerHeight - 430;
      let calculated = Math.floor(availableHeight / 72);
      if (calculated < 3) calculated = 3;
      setRowsPerPage(calculated);
    };
    calculatePerPage();

    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePerPage, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const thColor = useColorModeValue("gray.500", "gray.400");
  const trHoverBg = useColorModeValue("gray.50", "#1c2333");
  const expiringBgRow = useColorModeValue("orange.50", "orange.900");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [leaseRes, roomRes, tenantRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/admin/leases?per_page=all`, { headers }),
        fetch(`http://localhost:8000/api/v1/admin/rooms?per_page=all`, { headers }),
        fetch(`http://localhost:8000/api/v1/admin/tenants?per_page=all`, { headers }),
      ]);

      if (leaseRes.ok) {
        const leaseData = await leaseRes.json();
        setLeases(leaseData.data || leaseData);
      }
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        setRooms(roomData.data || roomData);
      }
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenants(tenantData.data || tenantData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (l) => {
    setLeaseToDelete(l);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!leaseToDelete) return;

    const token = localStorage.getItem("token");
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/leases/${leaseToDelete.uid}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Lease deleted successfully");
        setSelectedIds(prev => prev.filter(id => id !== leaseToDelete.uid));
        onDeleteClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to delete lease");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error");
    } finally {
      setIsDeleting(false);
      fetchData();
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} leases?`)) return;

    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      // Typically there should be a bulk discard endpoint in API, or we execute individual queries
      // Here we will do sequential requests or single request if backend supports it.
      // Assuming sequential deletes based on typical patterns in this codebase:
      const results = await Promise.all(
        selectedIds.map(async (id) => {
          const r = await fetch(`http://localhost:8000/api/v1/admin/leases/${id}`, {
            method: "DELETE",
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          });
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.error || "Failed");
          }
          return r;
        })
      );
      toast.success(`${selectedIds.length} leases deleted successfully`);
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Partial Network Error updating leases");
    } finally {
      fetchData();
    }
  };

  // --- NAVIGATION HANDLERS ---
  const handleRenew = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one lease to renew.");
      return;
    }
    
    // Check for active leases in selection
    const hasActive = selectedIds.some((id) => {
      const l = leases.find((lease) => String(lease.uid) === String(id));
      return l && l.status === 'active';
    });

    if (hasActive) {
      toast.error("Active leases cannot be renewed. Please select only expired leases.");
      return;
    }

    if (selectedIds.length === 1) {
      // Proceed with normal single lease edit renew layout
      navigate(`/dashboard/lease/renew/${selectedIds[0]}`);
    } else {
      // Open bulk renew modal directly
      const initialDates = {};
      selectedIds.forEach((id) => {
        initialDates[id] = { startDate: "", endDate: "" };
      });
      setBulkDates(initialDates);
      onOpen();
    }
  };

  const submitBulkRenew = async () => {
    const missingDates = selectedIds.some((id) => !bulkDates[id]?.startDate || !bulkDates[id]?.endDate);
    if (missingDates) {
      toast.error("Both Start Date and End Date are required for all leases.");
      return;
    }

    const invalidDates = selectedIds.some((id) => new Date(bulkDates[id]?.startDate) > new Date(bulkDates[id]?.endDate));
    if (invalidDates) {
      toast.error("Start Date cannot be after End Date inside your selection.");
      return;
    }

    setIsBulkRenewing(true);
    const token = localStorage.getItem("token");

    try {
      // Map requests
      const promises = selectedIds.map(async (id) => {
        const l = leases.find((lease) => String(lease.uid) === String(id));
        if (!l) return null;

        return fetch(`http://localhost:8000/api/v1/admin/leases/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            tenant_id: l.tenant?.id || l.tenant_id,
            room_id: l.room?.id || l.room_id,
            rent_amount: l.rent_amount,
            security_deposit: l.security_deposit || 0,
            start_date: bulkDates[id].startDate,
            end_date: bulkDates[id].endDate,
            status: "active"
          }),
        });
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every((res) => res && res.ok);

      if (allSuccess) {
        toast.success(`Successfully renewed ${selectedIds.length} leases.`);
        setSelectedIds([]);
        onClose();
        fetchData();
      } else {
        toast.error("Some lease renewals failed. Please verify them individually.");
        fetchData();
      }
    } catch (e) {
      toast.error("Network Error occurred processing renewals.");
    } finally {
      setIsBulkRenewing(false);
    }
  };

  const isExpiringSoon = (lease) => {
    if ((lease.status !== 'active' && lease.status !== 'expired') || !lease.end_date) return false;
    const endDate = new Date(lease.end_date);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const today = new Date();
    return endDate >= today && endDate <= in30Days;
  };

  // Process data (Filter & Sort)
  let processed = [...leases].filter((l) => {
    const s = search.toLowerCase();
    const tName = l.tenant?.name?.toLowerCase() || "";
    const rName = l.room?.name?.toLowerCase() || "";
    const statusText = l.status?.toLowerCase() || "";
    const matchesSearch = tName.includes(s) || rName.includes(s) || statusText.includes(s);

    const matchesStatus = statusFilter === "" || l.status === statusFilter;

    let matchesStartsAfter = true;
    let matchesEndsBefore = true;
    if (startsAfter) {
      matchesStartsAfter = new Date(l.start_date) >= new Date(startsAfter);
    }
    if (endsBefore) {
      matchesEndsBefore = new Date(l.end_date) <= new Date(endsBefore);
    }

    return matchesSearch && matchesStatus && matchesStartsAfter && matchesEndsBefore;
  });

  // Sorting
  processed.sort((a, b) => {
    let valA, valB;
    if (sortField === 'rent') {
      valA = Number(a.rent_amount);
      valB = Number(b.rent_amount);
    } else if (sortField === 'end_date') {
      valA = new Date(a.end_date).getTime();
      valB = new Date(b.end_date).getTime();
    } else if (sortField === 'status') {
      valA = a.status;
      valB = b.status;
    } else {
      const aExpiring = isExpiringSoon(a) ? 1 : 0;
      const bExpiring = isExpiringSoon(b) ? 1 : 0;
      if (aExpiring !== bExpiring) return bExpiring - aExpiring;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return { bg: "green.100", color: "green.700", label: t("lease.active") };
      case "expired":
        return { bg: "red.100", color: "red.700", label: t("lease.expired") };
      case "terminated":
        return { bg: "gray.200", color: "gray.700", label: t("lease.terminated") };
      default:
        return { bg: "gray.100", color: "gray.600", label: status };
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <Icon as={FiArrowUp} opacity={0.3} ml={1} />;
    return <Icon as={sortOrder === 'asc' ? FiArrowUp : FiArrowDown} ml={1} color="blue.500" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Pagination
  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginated = processed.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(processed.length / rowsPerPage);

  // Checkbox Logic
  const allChecked = paginated.length > 0 && paginated.every(l => selectedIds.includes(l.uid));
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < paginated.length;

  return (
    <>
    <Box p={6} bg={bg} h={{ base: "auto", lg: "calc(100vh - 140px)" }} overflow="hidden" display="flex" flexDirection="column">
      <Toaster position="top-right" />
        
        {/* Top Filter Bar */}
        <Flex 
          bg={cardBg} 
          px={5}
          py={4}
          borderRadius="lg" 
          shadow="sm" 
          mb={6} 
          border="1px solid" 
          borderColor={borderColor}
          direction={{ base: "column", md: "row" }}
          gap={3}
          align="flex-end"
          flexShrink={0}
          wrap="wrap"
        >
          <FormControl flex="2" minW="200px">
            <FormLabel fontSize="xs" fontWeight="semibold" color={thColor} mb={1}>{t("lease.tenant")} / {t("lease.room")}</FormLabel>
            <Input
              placeholder={t("lease.search_placeholder")}
              value={search}
              size="sm"
              borderRadius="md"
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormControl>

          <FormControl flex="1" minW="140px">
            <FormLabel fontSize="xs" fontWeight="semibold" color={thColor} mb={1}>{t("lease.status")}</FormLabel>
            <Select 
              value={statusFilter} 
              size="sm"
              borderRadius="md"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("lease.all_status")}</option>
              <option value="active">{t("lease.active")}</option>
              <option value="expired">{t("lease.expired")}</option>
              <option value="terminated">{t("lease.terminated")}</option>
            </Select>
          </FormControl>

          <FormControl flex="1.5" minW="240px">
            <FormLabel fontSize="xs" fontWeight="semibold" color={thColor} mb={1}>{t("lease.date_range")}</FormLabel>
            <Flex align="center" gap={2}>
              <Input
                type="date"
                value={startsAfter}
                size="sm"
                borderRadius="md"
                onChange={(e) => setStartsAfter(e.target.value)}
              />
              <Text fontSize="xs" color="gray.400" flexShrink={0}>{t("lease.to")}</Text>
              <Input
                type="date"
                value={endsBefore}
                size="sm"
                borderRadius="md"
                onChange={(e) => setEndsBefore(e.target.value)}
              />
            </Flex>
          </FormControl>

          {/* Action Buttons */}
          <Flex gap={2} flexShrink={0} align="flex-end" pb="1px">
            {selectedIds.length > 0 && (
              <Button size="sm" colorScheme="purple" borderRadius="md" onClick={handleRenew}>
                {t("lease.renew")} {selectedIds.length > 1 ? `(${selectedIds.length})` : ""}
              </Button>
            )}
            {selectedIds.length >= 2 && (
              <Button size="sm" colorScheme="red" borderRadius="md" leftIcon={<FiTrash2 />} onClick={handleBulkDelete}>
                {t("lease.delete")}
              </Button>
            )}
            <Button
              size="sm"
              colorScheme="green"
              borderRadius="md"
              px={5}
              onClick={() => {
                const dataToExport = processed.map(l => ({
                  "Tenant": l.tenant?.name || "Unknown",
                  "Room": l.room?.name || "Unknown",
                  "Rent": Number(l.rent_amount),
                  "Security Deposit": Number(l.security_deposit || 0),
                  "Start Date": l.start_date,
                  "End Date": l.end_date,
                  "Status": l.status,
                  "Created At": new Date(l.created_at).toLocaleDateString()
                }));
                exportToExcel(dataToExport, "All_Leases_" + new Date().toISOString().split('T')[0]);
              }}
            >
              {t("lease.export")}
            </Button>
            <Button size="sm" colorScheme="blue" borderRadius="md" leftIcon={<FiPlus />} onClick={() => navigate("/dashboard/lease/createnewlease")}>
              {t("lease.new")}
            </Button>
          </Flex>
        </Flex>

        {/* Table Container */}
        <TableContainer 
          bg={cardBg} 
          borderRadius="lg" 
          shadow="sm" 
          border="1px solid" 
          borderColor={borderColor}
          display="flex"
          flexDirection="column"
          flex={1}
          minH={0}
          overflow="hidden"
        >
          <Box overflow="hidden" flex={1}>
          <Table variant="simple" size="md">
            <Thead borderBottom="1px solid" borderColor={borderColor} position="sticky" top={0} zIndex={2} bg={cardBg}>
              <Tr>
                <Th w="40px" textAlign="center">
                  <Checkbox 
                    isChecked={allChecked} 
                    isIndeterminate={isIndeterminate}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(paginated.map(l => l.uid));
                      else setSelectedIds([]);
                    }}
                  />
                </Th>
                <Th fontSize="10px" color={thColor}>{t("lease.tenant")}</Th>
                <Th fontSize="10px" color={thColor}>{t("lease.room")}</Th>
                <Th fontSize="10px" color={thColor} cursor="pointer" onClick={() => handleSort('rent')}>
                  {t("lease.rent")} <SortIcon field="rent" />
                </Th>
                <Th fontSize="10px" color={thColor} cursor="pointer" onClick={() => handleSort('end_date')}>
                  {t("lease.period")} <SortIcon field="end_date" />
                </Th>
                <Th fontSize="10px" color={thColor} cursor="pointer" onClick={() => handleSort('status')}>
                  {t("lease.status")} <SortIcon field="status" />
                </Th>
                <Th fontSize="10px" color={thColor} textAlign="right">{t("lease.actions")}</Th>
              </Tr>
            </Thead>

            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={12}>
                    <Spinner size="lg" color="green.500" />
                  </Td>
                </Tr>
              ) : paginated.length > 0 ? (
                paginated.map((l) => {
                  const expiring = isExpiringSoon(l);
                  return (
                    <Tr 
                      key={l.uid} 
                      bg={expiring ? expiringBgRow : "transparent"} 
                      _hover={{ bg: expiring ? useColorModeValue("orange.100", "orange.800") : trHoverBg }}
                      transition="background 0.2s"
                    >
                      <Td textAlign="center">
                        <Checkbox 
                          isChecked={selectedIds.includes(l.uid)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, l.uid]);
                            else setSelectedIds(selectedIds.filter(id => id !== l.uid));
                          }}
                        />
                      </Td>

                      <Td>
                        <Flex direction="column">
                          <Text fontWeight="bold" color={textColor} fontSize="sm">
                            {l.tenant?.name || "Unknown"}
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt="0.5">
                            {l.tenant?.email || "No email"}
                          </Text>
                        </Flex>
                      </Td>

                      <Td>
                        <Text color="gray.600" fontSize="sm">
                          {l.room?.name || "Unknown"}
                        </Text>
                      </Td>

                      <Td>
                        <Text color={textColor} fontSize="sm">
                          {fmt(l.rent_amount)}
                        </Text>
                      </Td>

                      <Td>
                        <Flex align="center" fontSize="sm">
                          <Text color={textColor}>{formatDate(l.start_date)}</Text>
                          <Text mx={2} color="gray.400">→</Text>
                          <Text 
                            fontWeight={expiring ? "bold" : "normal"} 
                            color={expiring ? "orange.600" : textColor}
                          >
                            {formatDate(l.end_date)}
                          </Text>
                          
                          {expiring && (
                            <Badge 
                              ml={3} 
                              bg="orange.100" 
                              color="orange.700" 
                              fontSize="9px" 
                              px={2} 
                              py={0.5} 
                              borderRadius="md"
                            >
                              {t("lease.expiring_soon")}
                            </Badge>
                          )}
                        </Flex>
                      </Td>

                      <Td>
                        {(() => {
                          const badge = getStatusBadge(l.status);
                          return (
                            <Badge
                              bg={badge.bg}
                              color={badge.color}
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="10px"
                              fontWeight="bold"
                              textTransform="capitalize"
                            >
                              {badge.label}
                            </Badge>
                          );
                        })()}
                      </Td>

                      <Td textAlign="right">
                        <Flex justify="flex-end" gap={2}>
                          <Tooltip label="View Lease" hasArrow placement="top">
                            <IconButton
                              icon={<FiEye />}
                              size="xs"
                              bg="blue.50"
                              color="blue.600"
                              border="1px solid"
                              borderColor="blue.100"
                              borderRadius="lg"
                              _hover={{ bg: "blue.100", transform: "scale(1.1)" }}
                              transition="all 0.15s"
                              onClick={() => navigate(`/dashboard/lease/view/${l.uid}`)}
                              aria-label="View lease"
                            />
                          </Tooltip>
                          <Tooltip label="Edit Lease" hasArrow placement="top">
                            <IconButton
                              icon={<FiEdit2 />}
                              size="xs"
                              bg="purple.50"
                              color="purple.600"
                              border="1px solid"
                              borderColor="purple.100"
                              borderRadius="lg"
                              _hover={{ bg: "purple.100", transform: "scale(1.1)" }}
                              transition="all 0.15s"
                              onClick={() => navigate(`/dashboard/lease/edit/${l.uid}`)}
                              aria-label="Edit lease"
                            />
                          </Tooltip>
                          <Tooltip label="Delete Lease" hasArrow placement="top">
                            <IconButton
                              icon={<FiTrash2 />}
                              size="xs"
                              bg="red.50"
                              color="red.600"
                              border="1px solid"
                              borderColor="red.100"
                              borderRadius="lg"
                              _hover={{ bg: "red.100", transform: "scale(1.1)" }}
                              transition="all 0.15s"
                              onClick={() => handleDelete(l)}
                              aria-label="Delete lease"
                            />
                          </Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                   <Td colSpan={7} textAlign="center" py={12} color={mutedText}>
                    {t("lease.no_leases")}
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          </Box>
        </TableContainer>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4} px={2} flexShrink={0}>
            <Text fontSize="sm" color={mutedText}>
              {t("lease.showing_entries", { first: firstIndex + 1, last: Math.min(lastIndex, processed.length), total: processed.length })}
            </Text>
            <Flex gap={2}>
              <Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} isDisabled={currentPage === 1}>
                {t("lease.prev")}
              </Button>
              <Text fontSize="sm" alignSelf="center" mx={2}>{t("lease.page_info", { current: currentPage, total: totalPages })}</Text>
              <Button size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} isDisabled={currentPage === totalPages}>
                {t("lease.next")}
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>

      {/* Bulk Renew Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered motionPreset="scale">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" shadow="2xl">
          <ModalHeader color={textColor}>Bulk Renew Leases</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontSize="sm" color={mutedText} mb={4}>
              You are about to renew <strong>{selectedIds.length}</strong> leases simultaneously. Please choose the new lease period for each selection. Rents and room allocations will remain unchanged from their prior values.
            </Text>

            <Flex align="center" gap={2} mb={3}>
              <Icon as={FiCalendar} color={mutedText} />
              <Text fontWeight="black" fontSize="sm" color={textColor}>Set Durations</Text>
            </Flex>

            <VStack spacing={4} maxH="400px" overflowY="auto" w="full" pr={2}>
              {selectedIds.map((id) => {
                const l = leases.find((lease) => String(lease.uid) === String(id));
                if (!l) return null;
                return (
                  <Box key={id} p={4} border="1px solid" borderColor={borderColor} borderRadius="lg" w="full" bg={useColorModeValue("white", "whiteAlpha.50")}>
                    <Text fontWeight="bold" fontSize="sm">{l.tenant?.name || "Unknown Tenant"} - Room {l.room?.name || "?"}</Text>
                    <Flex gap={4} mt={3}>
                      <FormControl colSpan={1} isRequired>
                        <FormLabel fontSize="xs" color={textColor}>Start Date</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={bulkDates[id]?.startDate || ''}
                          borderColor={borderColor}
                          onChange={(e) => setBulkDates({ ...bulkDates, [id]: { ...bulkDates[id], startDate: e.target.value } })}
                        />
                      </FormControl>
                      <FormControl colSpan={1} isRequired>
                        <FormLabel fontSize="xs" color={textColor}>End Date</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={bulkDates[id]?.endDate || ''}
                          borderColor={borderColor}
                          onChange={(e) => setBulkDates({ ...bulkDates, [id]: { ...bulkDates[id], endDate: e.target.value } })}
                        />
                      </FormControl>
                    </Flex>
                  </Box>
                )
              })}
            </VStack>
          </ModalBody>
          <ModalFooter bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderBottomRadius="xl">
            <Button onClick={onClose} variant="ghost" mr={3} isDisabled={isBulkRenewing}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={submitBulkRenew} isLoading={isBulkRenewing}>
              Confirm Renew
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" shadow="2xl">
          <ModalHeader color={textColor}>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text color={mutedText}>
              Are you sure you want to delete the lease for <strong>{leaseToDelete?.tenant?.name}</strong>? 
              This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderBottomRadius="xl">
            <Button onClick={onDeleteClose} variant="ghost" mr={3} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete} isLoading={isDeleting} leftIcon={<FiTrash2 />}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}