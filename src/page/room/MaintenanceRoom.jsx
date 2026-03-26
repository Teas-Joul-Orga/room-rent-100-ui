import React, { useState, useEffect } from "react";
import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Badge, Button, useColorModeValue, Select, HStack, Input, InputGroup,
  InputLeftElement, SimpleGrid, Icon, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormLabel, FormControl, Textarea, Tooltip,
  VStack
} from "@chakra-ui/react";
import { FiSearch, FiCheckCircle, FiTool, FiXCircle, FiClock, FiImage, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import echo from "../../lib/echo";

dayjs.extend(relativeTime);
const API = "http://localhost:8000/api/v1";
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
const toUSD = (n, explicitCurrency) => {
  const c = explicitCurrency || localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return (num / r).toFixed(2);
  }
  return num;
};

function MaintenanceRoom() {
  const { t } = useTranslation();
  const [role] = useState(localStorage.getItem('role') || 'tenant');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortOption, setSortOption] = useState(""); // empty = smart/default
  
  // Admin Update Modal
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", expense_amount: "", expense_description: "", expense_currency: localStorage.getItem("currency") || "$" });
  
  // Tenant Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ title: "", description: "", priority: "normal", photo: null });

  // Admin Manual Create Modal
  const [isAdminCreateOpen, setIsAdminCreateOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [adminCreateForm, setAdminCreateForm] = useState({ 
    room_id: "", 
    tenant_id: "", 
    title: "", 
    description: "", 
    priority: "normal", 
    status: "pending", 
    photo: null 
  });

  // Refs for real-time fetch to avoid stale closure in socket listener
  const searchRef = React.useRef(search);
  const statusFilterRef = React.useRef(statusFilter);
  const priorityFilterRef = React.useRef(priorityFilter);
  const sortOptionRef = React.useRef(sortOption);

  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
  useEffect(() => { priorityFilterRef.current = priorityFilter; }, [priorityFilter]);
  useEffect(() => { sortOptionRef.current = sortOption; }, [sortOption]);

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const thBg = useColorModeValue("gray.50", "#1c2333");
  const trHoverBg = useColorModeValue("gray.50", "#1c2333");

  const headers = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRequests = async () => {
    try {
      const currentSearch = searchRef.current;
      const currentStatus = statusFilterRef.current;
      const currentPriority = priorityFilterRef.current;
      const currentSort = sortOptionRef.current;
      
      let endpoint = role === 'admin' 
        ? `${API}/admin/maintenance?search=${currentSearch}&status=${currentStatus}&priority=${currentPriority}`
        : `${API}/tenant/maintenance?search=${currentSearch}&status=${currentStatus}&priority=${currentPriority}`;
      
      if (currentSort) {
        const [field, dir] = currentSort.split('|');
        endpoint += `&sort=${field}&direction=${dir}`;
      } else if (role === 'admin') {
         // Fallback to default sort for admin if not provided
         endpoint += `&sort=created_at&direction=desc`;
      }
      
      const res = await fetch(endpoint, { headers: { ...headers(), Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        // Pagination wrapper for admin, flat array for tenant wrapper
        setRequests(data.data || data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    if (role !== 'admin') return;
    try {
      const res = await fetch(`${API}/admin/rooms?minimal=true&limit=all`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setRooms(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch rooms:", e);
    }
  };

  useEffect(() => {
    if (role === 'admin') fetchRooms();
  }, [role]);

  useEffect(() => {
    const delay = setTimeout(fetchRequests, 400); // 400ms debounce
    return () => clearTimeout(delay);
  }, [search, statusFilter, priorityFilter, sortOption]);

  useEffect(() => {
    const echoInstance = echo();
    if (!echoInstance) return;

    const channel = echoInstance.channel('maintenance')
      .listen('.App\\Events\\MaintenanceCountUpdated', () => {
        fetchRequests();
      });

    return () => {
      channel.stopListening('.App\\Events\\MaintenanceCountUpdated');
    };
  }, []); // Only subscribe once

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/maintenance/${selectedReq.uid}`, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...updateForm,
          expense_amount: toUSD(updateForm.expense_amount, updateForm.expense_currency)
        })
      });
      if (res.ok) {
        toast.success("Maintenance request updated");
        setIsUpdateOpen(false);
        fetchRequests();
        // Signal sidebar to refresh the pending count immediately
        window.dispatchEvent(new CustomEvent('maintenanceUpdated'));
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to update");
      }
    } catch (e) { toast.error("Network error"); }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", reportForm.title);
      formData.append("description", reportForm.description);
      formData.append("priority", reportForm.priority);
      if (reportForm.photo) formData.append("photo", reportForm.photo);

      const res = await fetch(`${API}/tenant/maintenance`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, Accept: "application/json" },
        body: formData
      });
      
      if (res.ok) {
        toast.success("Maintenance issue reported");
        setIsReportOpen(false);
        setReportForm({ title: "", description: "", priority: "normal", photo: null });
        fetchRequests();
      } else {
        const d = await res.json();
        toast.error(d.message || d.error || "Failed to submit");
      }
    } catch (e) { toast.error("Network error"); }
  };

  const handleAdminCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(adminCreateForm).forEach(key => {
        if (adminCreateForm[key] !== null) {
          formData.append(key, adminCreateForm[key]);
        }
      });

      const res = await fetch(`${API}/admin/maintenance`, {
        method: "POST",
        headers: { ...headers(), Accept: "application/json" },
        body: formData
      });

      if (res.ok) {
        toast.success("Maintenance record created manually");
        setIsAdminCreateOpen(false);
        setAdminCreateForm({ 
          room_id: "", tenant_id: "", title: "", description: "", 
          priority: "normal", status: "pending", photo: null 
        });
        fetchRequests();
        window.dispatchEvent(new CustomEvent('maintenanceUpdated'));
      } else {
        const d = await res.json();
        toast.error(d.message || d.error || "Failed to create");
      }
    } catch (e) { toast.error("Network error"); }
  };

  const statusColor = { pending: "yellow", in_progress: "blue", resolved: "green", cancelled: "red" };
  const priorityColor = { normal: "gray", urgent: "orange", emergency: "red" };

  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* Header Area */}
      <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "stretch", lg: "center" }} mb={6} gap={4}>
        <Box>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="black" letterSpacing="tight" color={textColor}>
            {t("maintenance.title")}
          </Text>
          <Text fontSize="sm" color={mutedText}>
            {role === 'admin' ? t("maintenance.subtitle_admin") : t("maintenance.subtitle_tenant")}
          </Text>
        </Box>
        
        <Flex direction={{ base: "column", md: "row" }} gap={3} w={{ base: "100%", lg: "auto" }}>
          <InputGroup size="sm" w={{ base: "100%", md: "250px" }}>
            <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
            <Input placeholder={t("maintenance.search")} value={search} onChange={e => setSearch(e.target.value)} bg={bg} borderRadius="md" />
          </InputGroup>
          <HStack w={{ base: "100%", md: "auto" }} spacing={2} overflowX="auto" pb={{ base: 1, md: 0 }}>
            <Select size="sm" w={{ base: "auto", md: "140px" }} bg={bg} borderRadius="md" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status: All</option>
              <option value="pending">{t("maintenance.pending")}</option>
              <option value="in_progress">{t("maintenance.in_progress")}</option>
              <option value="resolved">{t("maintenance.resolved")}</option>
              <option value="cancelled">{t("maintenance.cancelled")}</option>
            </Select>
            <Select size="sm" w={{ base: "auto", md: "130px" }} bg={bg} borderRadius="md" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">Priority: All</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </Select>
            <Select size="sm" w={{ base: "auto", md: "150px" }} bg={bg} borderRadius="md" value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="">Sort: Default</option>
              <option value="created_at|desc">Newest First</option>
              <option value="created_at|asc">Oldest First</option>
              <option value="status|asc">Status</option>
              <option value="priority|asc">Priority</option>
            </Select>
            {role === 'admin' && (
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<FiTool />}
                flexShrink={0}
                onClick={() => setIsAdminCreateOpen(true)}
              >
                Manual Entry
              </Button>
            )}
          </HStack>
          {role === 'tenant' && (
            <Button size="sm" colorScheme="blue" leftIcon={<FiTool />} onClick={() => setIsReportOpen(true)} mt={{ base: 2, md: 0 }} w={{ base: "full", md: "auto" }}>
              {t("maintenance.report_issue")}
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Main Datagrid */}
      <Box>
        {loading ? (
          <Flex justify="center" align="center" py={20} bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </Flex>
        ) : (
          <>
            {/* Desktop Table View */}
            <Box display={{ base: "none", md: "block" }} bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden">
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg={thBg}>
                    <Tr>
                      <Th w="60px"></Th>
                      {role === 'admin' && <Th>{t("maintenance.tenant_room")}</Th>}
                      <Th>{t("maintenance.issue")}</Th>
                      <Th>{t("maintenance.priority")}</Th>
                      <Th>{t("maintenance.status")}</Th>
                      {role === 'admin' && <Th>{t("maintenance.expense_costs")}</Th>}
                      <Th>{t("maintenance.reported")}</Th>
                      {role === 'admin' && <Th textAlign="right">{t("maintenance.actions")}</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {requests.length === 0 ? (
                      <Tr>
                        <Td colSpan={8} textAlign="center" py={12} color={mutedText}>{t("maintenance.no_data")}</Td>
                      </Tr>
                    ) : (
                      requests.map((r) => (
                        <Tr key={r.id} _hover={{ bg: trHoverBg }}>
                          <Td>
                            <Flex justify="center">
                              {r.photo_path ? (
                                <Tooltip label="View Photo" hasArrow>
                                  <Button size="xs" variant="ghost" as="a" href={`http://localhost:8000/storage/${r.photo_path}`} target="_blank">
                                    <Icon as={FiImage} boxSize={5} color="blue.500" />
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Icon as={FiTool} boxSize={4} color="gray.300" />
                              )}
                            </Flex>
                          </Td>
                          {role === 'admin' && (
                            <Td>
                              <Text fontSize="sm" fontWeight="bold" color={textColor}>{r.tenant?.name || t("maintenance.unknown")}</Text>
                              <Text fontSize="xs" color={mutedText}>{r.room?.name || t("maintenance.unknown_room")}</Text>
                            </Td>
                          )}
                          <Td maxW="250px">
                            <Text fontSize="sm" fontWeight="bold" color={textColor} isTruncated title={r.title}>{r.title}</Text>
                            <Text fontSize="xs" color={mutedText} isTruncated title={r.description}>{r.description}</Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={priorityColor[r.priority]} variant="subtle" fontSize="10px" px={2} borderRadius="full">
                              {r.priority.toUpperCase()}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={statusColor[r.status]} variant="solid" fontSize="10px" px={2} py={0.5} borderRadius="md" letterSpacing="wide">
                              {r.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </Td>
                          {role === 'admin' && (
                            <Td>
                              {r.status === 'resolved' && r.expenses?.length > 0 ? (
                                <Text fontSize="xs" fontWeight="black" color="red.500">
                                  {fmt(r.expenses[0].amount)}
                                </Text>
                              ) : (
                                <Text fontSize="xs" color={mutedText}>—</Text>
                              )}
                            </Td>
                          )}
                          <Td>
                            <Flex align="center" gap={1}>
                              <Icon as={FiClock} boxSize={3} color={mutedText} />
                              <Text fontSize="xs" color={mutedText}>{dayjs(r.created_at).fromNow()}</Text>
                            </Flex>
                          </Td>
                          {role === 'admin' && (
                            <Td textAlign="right">
                              {r.status !== 'resolved' && r.status !== 'cancelled' ? (
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReq(r);
                                    setUpdateForm({ status: r.status, expense_amount: "", expense_description: "", expense_currency: localStorage.getItem("currency") || "$" });
                                    setIsUpdateOpen(true);
                                  }}
                                >
                                  {t("maintenance.update")}
                                </Button>
                              ) : (
                                <Text fontSize="xs" fontWeight="bold" color="green.500">{t("maintenance.completed")}</Text>
                              )}
                            </Td>
                          )}
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {/* Mobile Card View */}
            <VStack display={{ base: "flex", md: "none" }} spacing={4} align="stretch">
              {requests.length === 0 ? (
                <Box bg={bg} p={8} textAlign="center" borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                  <Icon as={FiTool} boxSize={10} color="gray.300" mb={2} />
                  <Text color={mutedText}>{t("maintenance.no_data")}</Text>
                </Box>
              ) : (
                requests.map((r) => (
                  <Box
                    key={r.id}
                    bg={bg}
                    p={4}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor={borderColor}
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="flex-start" mb={3}>
                      <Flex gap={3} align="flex-start" flex={1}>
                        {r.photo_path ? (
                          <Button size="sm" variant="ghost" as="a" href={`http://localhost:8000/storage/${r.photo_path}`} target="_blank" p={0} h="auto" mt={1}>
                            <Icon as={FiImage} boxSize={5} color="blue.500" />
                          </Button>
                        ) : (
                          <Icon as={FiTool} boxSize={5} color="gray.300" mt={1} />
                        )}
                        <Box flex={1} overflow="hidden">
                          <Text fontSize="md" fontWeight="bold" color={textColor} noOfLines={2}>
                            {r.title}
                          </Text>
                          <Text fontSize="sm" color={mutedText} mt={1} noOfLines={2}>
                            {r.description}
                          </Text>
                          {role === 'admin' && (
                            <Text fontSize="xs" fontWeight="bold" color={textColor} mt={2}>
                              {r.tenant?.name || t("maintenance.unknown")} • {r.room?.name || t("maintenance.unknown_room")}
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Flex>

                    <Flex justify="space-between" align="center" mt={4} pt={3} borderTop="1px solid" borderColor={borderColor}>
                      <VStack align="flex-start" spacing={1}>
                        <Flex gap={2} align="center">
                          <Badge colorScheme={priorityColor[r.priority]} variant="subtle" fontSize="9px" px={2} borderRadius="full">
                            {r.priority.toUpperCase()}
                          </Badge>
                          <Badge colorScheme={statusColor[r.status]} variant="solid" fontSize="9px" px={2} py={0.5} borderRadius="md" letterSpacing="wide">
                            {r.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </Flex>
                        <Flex align="center" gap={1}>
                          <Icon as={FiClock} boxSize={3} color={mutedText} />
                          <Text fontSize="xs" color={mutedText}>{dayjs(r.created_at).fromNow()}</Text>
                        </Flex>
                      </VStack>

                      {role === 'admin' && (
                        <Box textAlign="right">
                          {r.status === 'resolved' && r.expenses?.length > 0 && (
                             <Text fontSize="sm" fontWeight="black" color="red.500" mb={1}>
                               {fmt(r.expenses[0].amount)}
                             </Text>
                          )}
                          {r.status !== 'resolved' && r.status !== 'cancelled' ? (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => {
                                setSelectedReq(r);
                                setUpdateForm({ status: r.status, expense_amount: "", expense_description: "", expense_currency: localStorage.getItem("currency") || "$" });
                                setIsUpdateOpen(true);
                              }}
                            >
                              {t("maintenance.update")}
                            </Button>
                          ) : (
                            <Text fontSize="xs" fontWeight="bold" color="green.500">{t("maintenance.completed")}</Text>
                          )}
                        </Box>
                      )}
                    </Flex>
                  </Box>
                ))
              )}
            </VStack>
          </>
        )}
      </Box>

      {/* Admin Update Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bg} mx={4}>
          <form onSubmit={handleUpdateSubmit}>
            <ModalHeader>{t("maintenance.update_request")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text fontSize="sm" fontWeight="bold" mb={4}>{t("maintenance.ticket")}: {selectedReq?.title}</Text>
              
              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("maintenance.set_status")}</FormLabel>
                <Select size="sm" value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                  <option value="pending">{t("maintenance.pending")}</option>
                  <option value="in_progress">{t("maintenance.in_progress")}</option>
                  <option value="resolved">{t("maintenance.resolved")}</option>
                  <option value="cancelled">{t("maintenance.cancelled")}</option>
                </Select>
              </FormControl>

              {updateForm.status === "resolved" && (
                <Box bg="red.50" p={4} borderRadius="md" border="1px dashed" borderColor="red.200">
                  <Text fontSize="xs" fontWeight="bold" color="red.600" mb={3}>{t("maintenance.attach_expense")}</Text>
                  <FormControl mb={3}>
                    <FormLabel fontSize="sm" color="gray.600">{t("maintenance.cost_amount")}</FormLabel>
                    <Flex gap={2}>
                      <Select w="80px" size="md" value={updateForm.expense_currency} onChange={e => setUpdateForm({ ...updateForm, expense_currency: e.target.value })}>
                        <option value="$">$</option>
                        <option value="៛">៛</option>
                      </Select>
                      <Input flex={1} size="md" type="number" step="0.01" min="0" bg="white" value={updateForm.expense_amount} onChange={e => setUpdateForm({ ...updateForm, expense_amount: e.target.value })} />
                    </Flex>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.600">{t("maintenance.expense_note")}</FormLabel>
                    <Input size="sm" bg="white" placeholder={t("maintenance.expense_placeholder")} value={updateForm.expense_description} onChange={e => setUpdateForm({ ...updateForm, expense_description: e.target.value })} />
                  </FormControl>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <Button size="sm" colorScheme="blue" type="submit" w={{ base: "full", md: "auto" }}>{t("maintenance.save_update")}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Tenant Report Modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bg} mx={4}>
          <form onSubmit={handleReportSubmit}>
            <ModalHeader>{t("maintenance.report_title")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("maintenance.issue_title")}</FormLabel>
                <Input size="sm" bg={bg} placeholder={t("maintenance.issue_placeholder")} value={reportForm.title} onChange={e => setReportForm({ ...reportForm, title: e.target.value })} />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("maintenance.priority")}</FormLabel>
                <Select size="sm" bg={bg} value={reportForm.priority} onChange={e => setReportForm({ ...reportForm, priority: e.target.value })}>
                  <option value="normal">{t("maintenance.normal")}</option>
                  <option value="urgent">{t("maintenance.urgent")}</option>
                  <option value="emergency">{t("maintenance.emergency")}</option>
                </Select>
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("maintenance.description")}</FormLabel>
                <Textarea size="sm" bg={bg} rows={3} placeholder={t("maintenance.desc_placeholder")} value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description: e.target.value })} />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("maintenance.attach_photo")}</FormLabel>
                <Input type="file" size="sm" accept="image/*" onChange={e => setReportForm({ ...reportForm, photo: e.target.files[0] })} sx={{ '::file-selector-button': { height: '8', padding: '0 4', background: 'gray.100', border: 'none', borderRadius: 'md', fontSize: 'sm', cursor: 'pointer' } }} />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button size="sm" colorScheme="blue" type="submit" w={{ base: "full", md: "auto" }}>{t("maintenance.submit")}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Admin Create Modal */}
      <Modal isOpen={isAdminCreateOpen} onClose={() => setIsAdminCreateOpen(false)} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bg} mx={4}>
          <form onSubmit={handleAdminCreateSubmit}>
            <ModalHeader>Manual Maintenance Entry</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>Select Room</FormLabel>
                  <Select 
                    size="sm" 
                    placeholder="Choose Room"
                    value={adminCreateForm.room_id} 
                    onChange={e => {
                      const roomId = e.target.value;
                      const selectedRoom = rooms.find(rm => rm.id === Number(roomId));
                      const lastLease = selectedRoom?.leases && selectedRoom.leases.length > 0 ? selectedRoom.leases[selectedRoom.leases.length - 1] : null;
                      const activeLease = lastLease && lastLease.status === 'active' ? lastLease : null;
                      setAdminCreateForm({ 
                        ...adminCreateForm, 
                        room_id: roomId, 
                        tenant_id: activeLease?.tenant?.id || "" 
                      });
                    }}
                  >
                    {rooms.map(rm => (
                      <option key={rm.id} value={rm.id}>{rm.name} - {rm.status}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>Tenant (Auto-linked)</FormLabel>
                  <Select 
                    size="sm" 
                    placeholder="No Tenant Linked"
                    value={adminCreateForm.tenant_id} 
                    onChange={e => setAdminCreateForm({ ...adminCreateForm, tenant_id: e.target.value })}
                  >
                    {/* Populated based on room selection above or all tenants if flexible */}
                    {[rooms.find(rm => rm.id === Number(adminCreateForm.room_id))?.leases?.slice(-1)[0]]
                      .filter(l => l && l.status === 'active')
                      .map(l => (
                        <option key={l.tenant.id} value={l.tenant.id}>{l.tenant.name}</option>
                      ))
                    }
                  </Select>
                  {adminCreateForm.room_id && !adminCreateForm.tenant_id && (
                    <Text fontSize="10px" color="red.400" mt={1}>This room has no active lease.</Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>Issue Title</FormLabel>
                <Input size="sm" bg={bg} placeholder="e.g. Broken AC, Leaking Pipe" value={adminCreateForm.title} onChange={e => setAdminCreateForm({ ...adminCreateForm, title: e.target.value })} />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>Priority</FormLabel>
                  <Select size="sm" value={adminCreateForm.priority} onChange={e => setAdminCreateForm({ ...adminCreateForm, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>Initial Status</FormLabel>
                  <Select size="sm" value={adminCreateForm.status} onChange={e => setAdminCreateForm({ ...adminCreateForm, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>Maintenance Description</FormLabel>
                <Textarea size="sm" bg={bg} rows={3} placeholder="Describe the issue or work done..." value={adminCreateForm.description} onChange={e => setAdminCreateForm({ ...adminCreateForm, description: e.target.value })} />
              </FormControl>

              <FormControl mb={2}>
                <FormLabel fontSize="sm" color={mutedText}>Attach Evidence (Optional)</FormLabel>
                <Input type="file" size="sm" accept="image/*" onChange={e => setAdminCreateForm({ ...adminCreateForm, photo: e.target.files[0] })} sx={{ '::file-selector-button': { height: '8', padding: '0 4', background: 'gray.100', border: 'none', borderRadius: 'md', fontSize: 'sm', cursor: 'pointer' } }} />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button size="sm" colorScheme="blue" type="submit" w={{ base: "full", md: "auto" }}>Add Record</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default MaintenanceRoom;