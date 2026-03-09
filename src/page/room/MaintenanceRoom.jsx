import React, { useState, useEffect } from "react";
import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Badge, Button, useColorModeValue, Select, HStack, Input, InputGroup,
  InputLeftElement, SimpleGrid, Icon, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormLabel, FormControl, Textarea, Tooltip
} from "@chakra-ui/react";
import { FiSearch, FiCheckCircle, FiTool, FiXCircle, FiClock, FiImage, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

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

function MaintenanceRoom() {
  const { t } = useTranslation();
  const [role] = useState(localStorage.getItem('role') || 'tenant');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Admin Update Modal
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", expense_amount: "", expense_description: "" });
  
  // Tenant Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ title: "", description: "", priority: "normal", photo: null });

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
      const endpoint = role === 'admin' 
        ? `${API}/admin/maintenance?search=${search}&status=${statusFilter}&sort=created_at&direction=desc`
        : `${API}/tenant/maintenance`;
      
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

  useEffect(() => {
    const delay = setTimeout(fetchRequests, 400); // 400ms debounce
    return () => clearTimeout(delay);
  }, [search, statusFilter]);

  useEffect(() => {
    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'ia6m3xrvsph7zmudqiif',
      wsHost: 'localhost',
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });

    echo.channel('maintenance')
      .listen('.App\\Events\\MaintenanceCountUpdated', () => {
        // Trigger a fresh fetch of the list natively when any event is broadcasted
        fetchRequests();
      });

    return () => {
      echo.leaveChannel('maintenance');
    };
  }, [search, statusFilter]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/maintenance/${selectedReq.uid}`, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(updateForm)
      });
      if (res.ok) {
        toast.success("Maintenance request updated");
        setIsUpdateOpen(false);
        fetchRequests();
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

  const statusColor = { pending: "yellow", in_progress: "blue", resolved: "green", cancelled: "red" };
  const priorityColor = { normal: "gray", urgent: "orange", emergency: "red" };

  return (
    <Box p={6}>
      {/* Header Area */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" letterSpacing="tight" color={textColor}>
            {t("maintenance.title")}
          </Text>
          <Text fontSize="sm" color={mutedText}>
            {role === 'admin' ? t("maintenance.subtitle_admin") : t("maintenance.subtitle_tenant")}
          </Text>
        </Box>
        
        {role === 'admin' ? (
          <HStack spacing={3}>
            <InputGroup size="sm" w="250px">
              <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
              <Input placeholder={t("maintenance.search")} value={search} onChange={e => setSearch(e.target.value)} bg={bg} borderRadius="md" />
            </InputGroup>
            <Button
              size="sm"
              colorScheme="green"
              variant="outline"
              leftIcon={<FiDownload />}
              onClick={() => {
                const dataToExport = requests.map(r => ({
                  "Tenant": r.tenant?.name || "Unknown",
                  "Room": r.room?.name || "Unknown",
                  "Title": r.title,
                  "Priority": r.priority,
                  "Status": r.status,
                  "Cost": r.status === 'resolved' && r.expenses?.length > 0 ? Number(r.expenses[0].amount) : 0,
                  "Reported At": new Date(r.created_at).toLocaleString()
                }));
                exportToExcel(dataToExport, "Maintenance_Requests_" + new Date().toISOString().split('T')[0]);
              }}
            >
              Export Excel
            </Button>
            <Select size="sm" w="150px" bg={bg} borderRadius="md" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">{t("maintenance.all_statuses")}</option>
              <option value="pending">{t("maintenance.pending")}</option>
              <option value="in_progress">{t("maintenance.in_progress")}</option>
              <option value="resolved">{t("maintenance.resolved")}</option>
              <option value="cancelled">{t("maintenance.cancelled")}</option>
            </Select>
          </HStack>
        ) : (
          <Button size="sm" colorScheme="blue" leftIcon={<FiTool />} onClick={() => setIsReportOpen(true)}>
            {t("maintenance.report_issue")}
          </Button>
        )}
      </Flex>

      {/* Main Datagrid */}
      <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden">
        {loading ? (
          <Flex justify="center" align="center" py={20}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </Flex>
        ) : (
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
                                setUpdateForm({ status: r.status, expense_amount: "", expense_description: "" });
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
        )}
      </Box>

      {/* Admin Update Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bg}>
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
                    <FormLabel fontSize="sm" color="gray.600">{t("maintenance.cost_amount")} ({localStorage.getItem("currency") || "$"})</FormLabel>
                    <Input size="md" type="number" step="0.01" bg="white" value={updateForm.expense_amount} onChange={e => setUpdateForm({ ...updateForm, expense_amount: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.600">{t("maintenance.expense_note")}</FormLabel>
                    <Input size="sm" bg="white" placeholder={t("maintenance.expense_placeholder")} value={updateForm.expense_description} onChange={e => setUpdateForm({ ...updateForm, expense_description: e.target.value })} />
                  </FormControl>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <Button size="sm" colorScheme="blue" type="submit">{t("maintenance.save_update")}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Tenant Report Modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bg}>
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
              <Button size="sm" colorScheme="blue" type="submit">{t("maintenance.submit")}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default MaintenanceRoom;
