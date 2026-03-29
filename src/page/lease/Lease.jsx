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
  SimpleGrid,
  HStack,
  Divider,
  Avatar,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiArrowUp, FiArrowDown, FiPlus, FiEye, FiEdit2, FiTrash2, FiCalendar, FiLayout, FiBriefcase, FiStar, FiAward, FiUser, FiUserX, FiBellOff, FiDroplet } from "react-icons/fi";
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

  const getRoomIcon = (name = "") => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('10')) return FiBriefcase;
    if (lowerName.includes('3')) return FiStar;
    if (lowerName.includes('4')) return FiAward;
    return FiLayout;
  };

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
    <Box p={6} bg={bg} minH="calc(100vh - 142px)" display="flex" flexDirection="column" gap={6} overflow="auto">
      <Toaster position="top-right" />
        
        {/* Top Filter Bar */}
        <Flex 
          bg={cardBg} 
          px={6}
          py={4}
          borderRadius="2xl" 
          shadow="sm" 
          border="1px solid" 
          borderColor={borderColor}
          direction={{ base: "column", xl: "row" }}
          gap={4}
          align={{ base: "stretch", xl: "center" }}
          flexShrink={0}
          wrap="wrap"
        >
          <Flex flex="2" gap={4} wrap="wrap" align="center" justify={{ base: "space-between", xl: "flex-start" }}>
            <Input
              placeholder={t("lease.search_placeholder") || "Search Tenant or Room..."}
              value={search}
              size="md"
              borderRadius="full"
              onChange={(e) => setSearch(e.target.value)}
              minW="240px"
              maxW={{ base: "full", md: "320px" }}
              bg={useColorModeValue("gray.50", "whiteAlpha.100")}
              border="none"
              _focus={{ ring: 2, ringColor: "blue.400" }}
            />
            
            <Select 
              value={statusFilter} 
              size="md"
              borderRadius="full"
              onChange={(e) => setStatusFilter(e.target.value)}
              w="160px"
              bg={useColorModeValue("gray.50", "whiteAlpha.100")}
              border="none"
              cursor="pointer"
            >
              <option value="">{t("lease.all_status") || "All Status"}</option>
              <option value="active">{t("lease.active") || "Active"}</option>
              <option value="expired">{t("lease.expired") || "Expired"}</option>
              <option value="terminated">{t("lease.terminated") || "Terminated"}</option>
            </Select>

            <Flex align="center" gap={2} bg={useColorModeValue("gray.50", "whiteAlpha.100")} px={4} py={1} borderRadius="full">
              <Input
                type="date"
                value={startsAfter}
                size="sm"
                variant="unstyled"
                onChange={(e) => setStartsAfter(e.target.value)}
              />
              <Text fontSize="xs" color="gray.400">→</Text>
              <Input
                type="date"
                value={endsBefore}
                size="sm"
                variant="unstyled"
                onChange={(e) => setEndsBefore(e.target.value)}
              />
            </Flex>
          </Flex>

          <Flex gap={3} flexShrink={0} align="center" justify="flex-end" flex="1">
            {selectedIds.length > 0 && (
              <Button size="md" colorScheme="purple" borderRadius="full" onClick={handleRenew} px={6}>
                {t("lease.renew")} {selectedIds.length > 1 ? `(${selectedIds.length})` : ""}
              </Button>
            )}
            {selectedIds.length >= 2 && (
              <Button size="md" colorScheme="red" borderRadius="full" leftIcon={<FiTrash2 />} onClick={handleBulkDelete} px={6}>
                Delete ({selectedIds.length})
              </Button>
            )}
            <Button size="md" colorScheme="blue" borderRadius="full" leftIcon={<FiPlus />} onClick={() => navigate("/dashboard/lease/createnewlease")} px={8} shadow="sm">
              {t("lease.new")}
            </Button>
          </Flex>
        </Flex>

        {/* Horizontal Scrollable Grid / Horizontal List */}
        <Box flexShrink={0}>
          <Text fontSize="xs" fontWeight="black" color={textColor} mb={4} textTransform="uppercase" letterSpacing="widest" opacity={0.8}>
            {t("lease.active_grid") || "Active Grid Display"}
          </Text>
          {isLoading ? (
             <Spinner size="md" color="blue.500" />
          ) : paginated.length > 0 ? (
            <Flex 
              overflowX="auto" 
              pb={4} 
              gap={6} 
              className="hide-scroll"
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                'msOverflowStyle': 'none',
                'scrollbarWidth': 'none',
              }}
            >
              {processed.filter(l => l.status === 'active').slice(0, 10).map((l) => {
                const expiring = isExpiringSoon(l);
                const isChecked = selectedIds.includes(l.uid);
                
                // Room card theme matching mockup
                let theme = { 
                  bg: "teal.500", 
                  color: "white", 
                  priceColor: "white", 
                  badgeBg: "white", 
                  badgeColor: "teal.500", 
                  border: "none", 
                  borderColor: "transparent", 
                  watermarkColor: "whiteAlpha.200" 
                };
                
                const RoomIcon = getRoomIcon(l.room?.name);
                const start = l.start_date ? new Date(l.start_date) : null;
                const sinceDate = start ? `${String(start.getMonth() + 1).padStart(2,'0')}/${String(start.getDate()).padStart(2,'0')}` : '—';

                return (
                  <Box 
                    key={l.uid} 
                    minW="350px"
                    maxW="350px"
                    bg={isChecked ? "blue.600" : theme.bg} 
                    color={theme.color}
                    borderRadius="2xl" 
                    shadow="md" 
                    border={isChecked ? "2px solid" : theme.border} 
                    borderColor={isChecked ? "blue.200" : theme.borderColor}
                    position="relative"
                    overflow="hidden"
                    transition="all 0.2s"
                    _hover={{ shadow: "xl", transform: "translateY(-4px)" }}
                    cursor="pointer"
                    onClick={() => navigate(`/dashboard/lease/view/${l.uid}`)}
                    minH="180px"
                    p={6}
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                  >
                    {/* Watermark Background */}
                    <Icon 
                      as={FiUser} 
                      position="absolute" 
                      bottom="-10px" 
                      right="-10px" 
                      w={32} 
                      h={32} 
                      color={theme.watermarkColor} 
                      zIndex={0} 
                      transform="rotate(-15deg)" 
                    />
                    
                    {/* Content */}
                    <Box position="relative" zIndex={1} h="full" display="flex" flexDirection="column" justifyContent="space-between">
                      {/* Top Bar */}
                      <Flex justify="space-between" align="flex-start">
                        {/* Badge with Checkbox */}
                        <Flex 
                          bg={theme.badgeBg} 
                          color={theme.badgeColor} 
                          pl={1.5} pr={4} py={1.5} 
                          borderRadius="full" 
                          align="center" 
                          gap={2.5} 
                          fontWeight="bold" 
                          fontSize="xs" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox 
                            isChecked={isChecked} 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, l.uid]);
                              else setSelectedIds(selectedIds.filter((id) => id !== l.uid));
                            }} 
                            colorScheme="blue" 
                            borderColor={theme.badgeColor} 
                            size="md"
                            bg="white"
                            borderRadius="sm"
                          />
                          <Flex align="center" gap={2}>
                            <Icon as={RoomIcon} />
                            <Text fontWeight="bold" fontSize="sm">{l.room?.name || '?'}</Text>
                          </Flex>
                        </Flex>

                        {/* Price */}
                        <Flex align="center" gap={2}>
                          {expiring && (
                            <Badge bg="red.400" color="white" border="none" borderRadius="md" px={2} py={0.5} fontSize="9px">! EXP</Badge>
                          )}
                          <Text fontSize="xl" fontWeight="black" color={theme.priceColor}>{fmt(l.rent_amount)}</Text>
                        </Flex>
                      </Flex>

                      {/* Bottom Info */}
                      <Flex justify="space-between" align="flex-end" mt={10}>
                        {/* Left Icons (Mockup style) with Tooltips */}
                        <Flex gap={2}>
                          <Tooltip label={t("lease.rent_status") || "Rent Status: Up to Date"} hasArrow placement="top">
                            <Flex align="center" justify="center" bg="white" w={7} h={7} borderRadius="full" color={theme.badgeColor}>
                              <Icon as={FiBellOff} boxSize={3.5} />
                            </Flex>
                          </Tooltip>
                          
                          <Tooltip label={t("lease.utility_status") || "Utilities: Paid"} hasArrow placement="top">
                            <Flex align="center" justify="center" bg="white" w={7} h={7} borderRadius="full" color={theme.badgeColor}>
                              <Icon as={FiDroplet} boxSize={3.5} />
                            </Flex>
                          </Tooltip>

                          <Tooltip label={t("lease.pending_items") || "2 Items Pending"} hasArrow placement="top">
                            <Flex align="center" justify="center" bg="white" w={7} h={7} borderRadius="full" color={theme.badgeColor} fontSize="xs" fontWeight="bold">
                              2
                            </Flex>
                          </Tooltip>
                        </Flex>

                        {/* Right Info: Tenant */}
                        <Box textAlign="right">
                          <Text fontWeight="black" fontSize="md" noOfLines={1} textTransform="uppercase">{l.tenant?.name || 'Unknown'}</Text>
                          <Text fontSize="10px" opacity={0.8} textTransform="uppercase" letterSpacing="wider" mt={0.5}>SINCE {sinceDate}</Text>
                        </Box>
                      </Flex>
                    </Box>
                  </Box>
                );
              })}
            </Flex>
          ) : (
             <Text fontSize="xs" color={mutedText}>No leases match filters.</Text>
          )}
        </Box>

        <Divider borderColor={borderColor} />

        {/* Detailed Table View */}
        <Box flex="1" minH="400px" display="flex" flexDirection="column" gap={4}>
           <Flex justify="space-between" align="center">
             <Text fontSize="xs" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="widest" opacity={0.8}>
               {t("lease.detailed_list") || "Detailed Lease Ledger"}
             </Text>
           </Flex>

           <Box 
             bg={cardBg} 
             borderRadius="2xl" 
             shadow="sm" 
             border="1px solid" 
             borderColor={borderColor}
             overflow="auto"
             flex="1"
           >
             <Table variant="simple">
               <Thead bg={useColorModeValue("gray.50", "#1c2333")} position="sticky" top={0} zIndex={1}>
                 <Tr>
                   <Th w="60px" px={6}>
                     <Checkbox 
                       size="sm"
                       colorScheme="blue"
                       isChecked={allChecked} 
                       isIndeterminate={isIndeterminate}
                       onChange={(e) => {
                         if (e.target.checked) setSelectedIds(paginated.map(l => l.uid));
                         else setSelectedIds([]);
                       }}
                     />
                   </Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4}>ID</Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4}>{t("lease.tenant")}</Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4}>{t("lease.room")}</Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4} cursor="pointer" onClick={() => handleSort('rent')}>{t("lease.rent")} <SortIcon field="rent" /></Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4}>{t("lease.deposit") || "Deposit"}</Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4} cursor="pointer" onClick={() => handleSort('end_date')}>{t("lease.period")} <SortIcon field="end_date" /></Th>
                   <Th fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={4}>{t("lease.status")}</Th>
                   <Th textAlign="right" fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={mutedText} py={5} px={6}>{t("lease.actions")}</Th>
                 </Tr>
               </Thead>
               <Tbody>
                 {paginated.map((l) => {
                   const expiring = isExpiringSoon(l);
                   const isChecked = selectedIds.includes(l.uid);
                   const badge = getStatusBadge(l.status);
                   return (
                     <Tr key={l.uid} bg={expiring ? expiringBgRow : "transparent"} _hover={{ bg: trHoverBg }}>
                       <Td px={6}>
                          <Checkbox 
                            size="md" 
                            isChecked={isChecked} 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, l.uid]);
                              else setSelectedIds(selectedIds.filter(id => id !== l.uid));
                            }} 
                           />
                       </Td>
                       <Td py={5} px={4}>
                         <Text fontSize="xs" fontFamily="mono" color={mutedText} fontWeight="bold">#{String(l.uid).substring(0,8)}</Text>
                       </Td>
                       <Td py={5} px={4}>
                         <Text fontWeight="black" fontSize="md" color={textColor}>{l.tenant?.name || "Unknown"}</Text>
                       </Td>
                       <Td py={5} px={4}>
                         <Badge colorScheme="purple" variant="subtle" px={4} py={1} borderRadius="md" fontSize="xs" fontWeight="black">{l.room?.name || "?"}</Badge>
                       </Td>
                       <Td py={5} px={4} fontSize="md" fontWeight="black" color={textColor}>{fmt(l.rent_amount)}</Td>
                       <Td py={5} px={4} fontSize="md" fontWeight="bold" color={mutedText}>{fmt(l.security_deposit)}</Td>
                       <Td py={5} px={4}>
                         <VStack align="start" spacing={0}>
                           <Text fontSize="sm" fontWeight="black">{formatDate(l.start_date)}</Text>
                           <Text fontSize="xs" color={mutedText} fontWeight="bold">{formatDate(l.end_date)}</Text>
                         </VStack>
                       </Td>
                       <Td py={5} px={4}>
                          <Badge bg={badge.bg} color={badge.color} fontSize="xs" px={4} py={1} borderRadius="full" fontWeight="black" textTransform="uppercase">{badge.label}</Badge>
                       </Td>
                       <Td textAlign="right" py={5} px={6}>
                         <HStack justify="flex-end" spacing={2}>
                           <IconButton icon={<FiEye />} size="sm" variant="ghost" colorScheme="blue" onClick={() => navigate(`/dashboard/lease/view/${l.uid}`)} aria-label="View" />
                           <IconButton icon={<FiEdit2 />} size="sm" variant="ghost" colorScheme="purple" onClick={() => navigate(`/dashboard/lease/edit/${l.uid}`)} aria-label="Edit" />
                           <IconButton icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(l)} aria-label="Delete" />
                         </HStack>
                       </Td>
                     </Tr>
                   );
                 })}
               </Tbody>
             </Table>
           </Box>

           {/* PAGINATION */}
           {totalPages > 1 && (
             <Flex justify="space-between" align="center" pt={4}>
               <Text fontSize="xs" color={mutedText}>
                 {t("lease.showing_entries", { first: firstIndex + 1, last: Math.min(lastIndex, processed.length), total: processed.length })}
               </Text>
               <HStack spacing={2}>
                 <Button size="xs" borderRadius="full" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} isDisabled={currentPage === 1}>
                   {t("lease.prev")}
                 </Button>
                 <Text fontSize="xs" fontWeight="bold">{currentPage} / {totalPages}</Text>
                 <Button size="xs" borderRadius="full" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} isDisabled={currentPage === totalPages}>
                   {t("lease.next")}
                 </Button>
               </HStack>
             </Flex>
           )}
        </Box>
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