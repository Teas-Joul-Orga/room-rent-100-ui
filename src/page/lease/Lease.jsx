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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  SimpleGrid,
  Checkbox,
  Icon,
  IconButton,
  Tooltip
} from "@chakra-ui/react";
import { FiArrowUp, FiArrowDown, FiPlus, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function Leases() {
  const navigate = useNavigate();

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

  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    uid: null,
    tenant_id: "",
    room_id: "",
    start_date: "",
    end_date: "",
    rent_amount: "",
    security_deposit: "",
    status: "active",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination bounds (mockup shows all in one scrollable page usually, but we keep basic pagination out of view or simplified)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const thColor = useColorModeValue("gray.500", "gray.400");
  const trHoverBg = useColorModeValue("gray.50", "gray.700");
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

  const handleDelete = async (l) => {
    if (!window.confirm(`Are you sure you want to delete the lease for ${l.tenant?.name}?`)) return;
    
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/leases/${l.uid}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) toast.success("Lease deleted successfully");
      else toast.error("Failed to delete lease");
    } catch (e) {
      console.error(e);
      toast.error("Network Error");
    } finally {
      fetchData();
    }
  };

  const handleRenew = () => {
    if (selectedIds.length !== 1) {
      toast.error("Please select exactly one lease to renew.");
      return;
    }
    const leaseToRenew = leases.find(l => l.uid === selectedIds[0]);
    if (leaseToRenew) {
      setIsEdit(false);
      setFormData({
        uid: null,
        tenant_id: leaseToRenew.tenant?.id || "",
        room_id: leaseToRenew.room?.id || "",
        start_date: leaseToRenew.end_date ? leaseToRenew.end_date.split("T")[0] : "",
        end_date: "",
        rent_amount: leaseToRenew.rent_amount || "",
        security_deposit: leaseToRenew.security_deposit || 0,
        status: "active",
      });
      onOpen();
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setFormData({
        uid: item.uid,
        tenant_id: item.tenant?.id || "",
        room_id: item.room?.id || "",
        start_date: item.start_date ? item.start_date.split("T")[0] : "",
        end_date: item.end_date ? item.end_date.split("T")[0] : "",
        rent_amount: item.rent_amount || "",
        security_deposit: item.security_deposit || 0,
        status: item.status || "active",
      });
    } else {
      setIsEdit(false);
      setFormData({
        uid: null,
        tenant_id: "",
        room_id: "",
        start_date: "",
        end_date: "",
        rent_amount: "",
        security_deposit:  0,
        status: "active",
      });
    }
    onOpen();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.tenant_id || !formData.room_id || !formData.start_date || !formData.end_date || formData.rent_amount === "") {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("token");
    const url = isEdit
      ? `http://localhost:8000/api/v1/admin/leases/${formData.uid}`
      : `http://localhost:8000/api/v1/admin/leases`;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(isEdit ? "Lease updated successfully" : "Lease added successfully");
        onClose();
        fetchData();
      } else {
        toast.error(data.message || "Failed to save lease");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const isExpiringSoon = (lease) => {
    if (lease.status !== 'active' || !lease.end_date) return false;
    const endDate = new Date(lease.end_date);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const today = new Date();
    return endDate >= today && endDate <= in30Days;
  };

  // Process data (Filter & Sort)
  let processed = [...leases].filter((l) => {
    // 1. Search Filter
    const s = search.toLowerCase();
    const tName = l.tenant?.name?.toLowerCase() || "";
    const rName = l.room?.name?.toLowerCase() || "";
    const statusText = l.status?.toLowerCase() || "";
    const matchesSearch = tName.includes(s) || rName.includes(s) || statusText.includes(s);

    // 2. Status Filter
    const matchesStatus = statusFilter === "" || l.status === statusFilter;

    // 3. Date Filters
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
      // Default sort for expiring soon at the top
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
        return { bg: "green.100", color: "green.700", label: "Active" };
      case "expired":
        return { bg: "red.100", color: "red.700", label: "Expired" };
      case "terminated":
        return { bg: "gray.200", color: "gray.700", label: "Terminated" };
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
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">
        
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
          wrap="wrap"
        >
          {/* Search */}
          <FormControl flex="2" minW="200px">
            <FormLabel fontSize="xs" fontWeight="semibold" color={thColor} mb={1}>Search</FormLabel>
            <Input
              placeholder="Search tenant, room, or status..."
              value={search}
              size="sm"
              borderRadius="md"
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormControl>

          {/* Status Filter */}
          <FormControl flex="1" minW="140px">
            <FormLabel fontSize="xs" fontWeight="semibold" color={thColor} mb={1}>Status</FormLabel>
            <Select 
              value={statusFilter} 
              size="sm"
              borderRadius="md"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </Select>
          </FormControl>

          {/* Date Range — grouped */}
          <FormControl flex="1.5" minW="240px">
            <FormLabel fontSize="xs" fontWeight="semibold" color={thColor} mb={1}>Date Range</FormLabel>
            <Flex align="center" gap={2}>
              <Input
                type="date"
                value={startsAfter}
                size="sm"
                borderRadius="md"
                onChange={(e) => setStartsAfter(e.target.value)}
              />
              <Text fontSize="xs" color="gray.400" flexShrink={0}>to</Text>
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
            {selectedIds.length === 1 && (
              <Button size="sm" colorScheme="purple" borderRadius="md" onClick={handleRenew}>
                Renew
              </Button>
            )}
            <Button size="sm" colorScheme="green" borderRadius="md" px={5} onClick={() => alert("Export functionality not implemented yet.")}>
              Export
            </Button>
            <Button size="sm" colorScheme="blue" borderRadius="md" leftIcon={<FiPlus />} onClick={() => handleOpenModal()}>
              New
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
        >
          <Table variant="simple" size="md">
            <Thead borderBottom="1px solid" borderColor={borderColor}>
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
                <Th fontSize="10px" color={thColor}>TENANT</Th>
                <Th fontSize="10px" color={thColor}>ROOM</Th>
                <Th fontSize="10px" color={thColor} cursor="pointer" onClick={() => handleSort('rent')}>
                  RENT <SortIcon field="rent" />
                </Th>
                <Th fontSize="10px" color={thColor} cursor="pointer" onClick={() => handleSort('end_date')}>
                  PERIOD (END DATE) <SortIcon field="end_date" />
                </Th>
                <Th fontSize="10px" color={thColor} cursor="pointer" onClick={() => handleSort('status')}>
                  STATUS <SortIcon field="status" />
                </Th>
                <Th fontSize="10px" color={thColor} textAlign="right">ACTIONS</Th>
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

                      {/* TENANT */}
                      <Td>
                        <Flex direction="column">
                          <Text fontWeight="bold" color={textColor} fontSize="sm">
                            {l.tenant?.name || "Unknown"}
                          </Text>
                          <Text fontSize="xs" color="gray.500 mt-0.5">
                            {l.tenant?.email || "No email"}
                          </Text>
                        </Flex>
                      </Td>

                      {/* ROOM */}
                      <Td>
                        <Text color="gray.600" fontSize="sm">
                          {l.room?.name || "Unknown"}
                        </Text>
                      </Td>

                      {/* RENT */}
                      <Td>
                        <Text color={textColor} fontSize="sm">
                          ${Number(l.rent_amount).toFixed(2)}
                        </Text>
                      </Td>

                      {/* PERIOD */}
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
                              EXPIRING SOON
                            </Badge>
                          )}
                        </Flex>
                      </Td>

                      {/* STATUS */}
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

                      {/* ACTIONS */}
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
                              onClick={() => handleOpenModal(l)}
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
                    No leases found matching your search.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4} px={2}>
            <Text fontSize="sm" color={mutedText}>
              Showing {firstIndex + 1} to {Math.min(lastIndex, processed.length)} of {processed.length} entries
            </Text>
            <Flex gap={2}>
              <Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} isDisabled={currentPage === 1}>
                Prev
              </Button>
              <Text fontSize="sm" alignSelf="center" mx={2}>Page {currentPage} of {totalPages}</Text>
              <Button size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} isDisabled={currentPage === totalPages}>
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>

      {/* ===== ADD/EDIT MODAL ===== */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="scale" size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" shadow="2xl">
          <form onSubmit={handleSave}>
            <ModalHeader color={textColor}>
              {isEdit ? "Edit Lease Agreement" : "Add New Lease Agreement"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Tenant</FormLabel>
                  <Select
                    placeholder="Select tenant"
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    borderColor={borderColor}
                  >
                    {tenants.filter(t => !t.deleted_at).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Room</FormLabel>
                   <Select
                    placeholder="Select room"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    borderColor={borderColor}
                  >
                    {rooms.filter(r => !r.deleted_at).map(r => (
                      <option key={r.id} value={r.id}>{r.name} - ${r.base_rent_price}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    borderColor={borderColor}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">End Date</FormLabel>
                   <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    borderColor={borderColor}
                  />
                </FormControl>
              </SimpleGrid>

               <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Monthly Rent ($)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    borderColor={borderColor}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Security Deposit ($)</FormLabel>
                   <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    borderColor={borderColor}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl mt={4} isRequired>
                <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Lease Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  borderColor={borderColor}
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </Select>
              </FormControl>
            </ModalBody>

            <ModalFooter bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderBottomRadius="xl">
              <Button onClick={onClose} variant="ghost" mr={3}>
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit" isLoading={isSaving}>
                {isEdit ? "Update" : "Save"} Lease
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </Box>
  );
}
