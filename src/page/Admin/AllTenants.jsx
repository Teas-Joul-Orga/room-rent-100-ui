import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import {
  Box,
  Flex,
  Heading,
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
  Image,
  Checkbox,
  Select,
  Text,
  HStack,
  useColorModeValue,
  IconButton,
  Tooltip,
  SimpleGrid,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import toast from "react-hot-toast";
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiUsers, FiClock, FiCheckCircle, FiLink, FiAlertTriangle, FiUserPlus, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";

export default function AllTenants() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/admin/tenants?limit=all", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      } else {
        toast.error("Failed to fetch tenants");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const calculatePerPage = () => {
      // 100vh - 560px approx for extra summary cards row + toolbar + pagination
      const availableHeight = window.innerHeight - 580;
      let calculated = Math.floor(availableHeight / 72);
      if (calculated < 5) calculated = 5;
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

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredTenants = tenants.filter((t) =>
    (t.name || "").toLowerCase().includes(search.trim().toLowerCase()),
  );

  const sortedTenants = [...filteredTenants].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";

    if (sortField === "status") {
       aVal = a.user_id ? "linked" : "pending";
       bVal = b.user_id ? "linked" : "pending";
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginatedTenants = sortedTenants.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredTenants.length / rowsPerPage);

  const confirmDelete = async () => {
    if (!selectedTenant) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tenants/${selectedTenant.uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        toast.success("Tenant deleted successfully");
        fetchTenants(); // Refresh data
        setSelectedIds((prev) => prev.filter((id) => id !== selectedTenant.uid));
        setShowModal(false);
        setSelectedTenant(null);
      } else {
        const errorData = await res.json();
        // Display the specific error message from the backend if available
        toast.error(errorData.error || errorData.message || "Failed to delete tenant. They might have active dependencies.");
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting. Please check your network connection.");
    }
  };

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    job: "",
    photo: "",
    idFront: "",
    idBack: "",
    createAccount: false,
    password: "",
    confirmPassword: "",
  });

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    // Note: Laravel backend doesn't have a bulk delete route by default in this controller,
    // so we'll delete them one by one for now, or you can implement a bulk delete route later.
    try {
      const results = await Promise.all(
        selectedIds.map(async (uid) => {
          const res = await fetch(`http://localhost:8000/api/v1/admin/tenants/${uid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (!res.ok) {
            const data = await res.json();
            return { uid, success: false, error: data.error || data.message };
          }
          return { uid, success: true };
        })
      );

      const failed = results.filter(r => !r.success);
      const succeeded = results.filter(r => r.success);

      if (succeeded.length > 0) {
        toast.success(`${succeeded.length} tenant(s) deleted`);
      }

      if (failed.length > 0) {
        failed.forEach(f => {
          toast.error(`Failed to delete tenant: ${f.error}`, { duration: 5000 });
        });
      }

      fetchTenants();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during bulk deletion");
    }
  };

  const handleSaveTenant = async () => {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("dob", form.dob);
    formData.append("job", form.job);
    
    // Status is only required for updating, but API expects it for update
    if (isEdit) {
      formData.append("status", selectedTenant?.status || "active");
      formData.append("_method", "PUT");
    }

    if (form.photo && form.photo.file) formData.append("photo", form.photo.file);
    if (form.idFront && form.idFront.file) formData.append("id_photo", form.idFront.file);
    if (form.idBack && form.idBack.file) formData.append("id_card_back", form.idBack.file);

    // Optional login account creation
    if (!isEdit && form.createAccount) {
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      formData.append("create_account", "1");
      formData.append("password", form.password);
      formData.append("password_confirmation", form.confirmPassword);
    }

    const url = isEdit 
      ? `http://localhost:8000/api/v1/admin/tenants/${selectedTenant.uid}` 
      : `http://localhost:8000/api/v1/admin/tenants`;

    try {
      const res = await fetch(url, {
        method: "POST", // using POST for both, Laravel handles PUT via _method
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Tenant saved successfully");
        fetchTenants();
        setShowFormModal(false);
      } else {
        // Handle validation errors
        if (data.errors) {
          Object.values(data.errors).forEach(errArray => {
            errArray.forEach(err => toast.error(err));
          });
        } else {
          toast.error(data.error || "Failed to save tenant");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    }
  };

  const handleLinkAccount = async () => {
    if (!selectedTenant) return;
    if (accountPassword !== accountConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tenants/${selectedTenant.uid}/create-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: accountPassword,
          password_confirmation: accountConfirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account linked successfully!");
        fetchTenants();
        setShowAccountModal(false);
      } else {
        if (data.errors) {
          Object.values(data.errors).forEach(errArray => {
            errArray.forEach(err => toast.error(err));
          });
        } else {
          toast.error(data.error || "Failed to link account");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while linking account");
    }
  };
  // Colors
  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const tableHeaderBg = useColorModeValue("sky.100", "#30363d");
  const hoverBg = useColorModeValue("sky.50", "#30363d");

  const statBlue = useColorModeValue("sky.700", "blue.300");
  const statYellow = useColorModeValue("yellow.600", "yellow.400");
  const statGreen = useColorModeValue("green.600", "green.400");

  return (
    <Box p={6} bg={bg} h={{ base: "auto", lg: "calc(100vh - 140px)" }} overflow="hidden" display="flex" flexDirection="column">
      {/* ===== HEADER ===== */}
      <Flex direction={{ base: "column", sm: "row" }} align={{ sm: "center" }} justify="space-between" gap={4} mb={6} flexShrink={0}>
        <Heading size="lg" color={useColorModeValue("sky.900", "white")}>
          {t("sidebar.tenant_mgmt")}
        </Heading>

        <HStack spacing={3}>
          <Button
            display={{ base: "none", sm: "flex" }}
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => navigate("/dashboard/tenants/addtenant")}
            shadow="sm"
          >
            {t("tenant.add_new")}
          </Button>

          <Button
            display={{ base: "none", sm: "flex" }}
            leftIcon={<FiDownload />}
            colorScheme="green"
            variant="outline"
            onClick={() => {
              const dataToExport = tenants.map(t => ({
                "Name": t.name,
                "Email": t.email,
                "Phone": t.phone,
                "Occupation": t.occupation || t.job,
                "DOB": t.dob || "N/A",
                "Status": !t.user_id ? "Pending" : "Linked",
                "Created At": new Date(t.created_at).toLocaleDateString()
              }));
              exportToExcel(dataToExport, "All_Tenants_" + new Date().toISOString().split('T')[0]);
            }}
            shadow="sm"
          >
            Export Excel
          </Button>
        </HStack>

        {/* Mobile FAB */}
        <IconButton
          display={{ base: "flex", sm: "none" }}
          icon={<FiPlus size={24} />}
          colorScheme="blue"
          onClick={() => navigate("/dashboard/tenants/addtenant")}
          isRound
          size="lg"
          position="fixed"
          bottom="85px"
          right="20px"
          zIndex={999}
          shadow="dark-lg"
          aria-label="Add Tenant"
        />
      </Flex>

      {/* ===== SUMMARY CARDS ===== */}
      {isLoading ? (
        <Flex justify="center" p={10}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : (
      <>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={6} flexShrink={0}>
        <Flex bg={cardBg} borderRadius="xl" shadow="sm" p={5} align="center" justify="space-between">
          <Box>
            <Text fontSize="sm" color={mutedText}>{t("tenant.total")}</Text>
            <Heading size="lg" color={statBlue}>
              {tenants.length}
            </Heading>
          </Box>
          <Icon as={FiUsers} boxSize={8} color="blue.500" />
        </Flex>

        <Flex bg={cardBg} borderRadius="xl" shadow="sm" p={5} align="center" justify="space-between">
          <Box>
            <Text fontSize="sm" color={mutedText}>{t("tenant.pending")}</Text>
            <Heading size="lg" color={statYellow}>
              {tenants.filter((tenantObj) => !tenantObj.user_id).length}
            </Heading>
          </Box>
          <Icon as={FiClock} boxSize={8} color="yellow.500" />
        </Flex>

        <Flex bg={cardBg} borderRadius="xl" shadow="sm" p={5} align="center" justify="space-between">
          <Box>
            <Text fontSize="sm" color={mutedText}>{t("tenant.linked")}</Text>
            <Heading size="lg" color={statGreen}>
              {tenants.filter((tenantObj) => tenantObj.user_id).length}
            </Heading>
          </Box>
          <Icon as={FiCheckCircle} boxSize={8} color="green.500" />
        </Flex>
      </SimpleGrid>

      {/* ===== SEARCH ===== */}
      <Box bg={cardBg} p={4} borderRadius="xl" shadow="sm" mb={6} flexShrink={0}>
        <Input
          placeholder={t("tenant.search_name")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          borderColor={borderColor}
          _hover={{ borderColor: "blue.400" }}
          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
        />
      </Box>

      {/* ===== TABLE ===== */}
      <TableContainer bg={cardBg} borderRadius="xl" shadow="sm" mb={4} display="flex" flexDirection="column" flex={1} minH={0} overflowY="auto">
        <Box overflowX="auto" flex={1}>
          <Table variant="simple">
            <Thead bg={tableHeaderBg} position="sticky" top={0} zIndex={2}>
              <Tr>
              <Th w="50px">
                <Checkbox
                  isChecked={
                    paginatedTenants.length > 0 &&
                    paginatedTenants.every((tenantItem) => selectedIds.includes(tenantItem.uid))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(paginatedTenants.map((tenantItem) => tenantItem.uid));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  colorScheme="blue"
                />
              </Th>

              <Th>{t("tenant.photo")}</Th>
              <Th cursor="pointer" onClick={() => handleSort('name')}>
                <Flex align="center" gap={1}>{t("tenant.name")} <Text as="span" color={sortField === 'name' ? "inherit" : "gray.400"}>{sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('email')}>
                <Flex align="center" gap={1}>{t("tenant.email")} <Text as="span" color={sortField === 'email' ? "inherit" : "gray.400"}>{sortField === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('phone')}>
                <Flex align="center" gap={1}>{t("tenant.phone")} <Text as="span" color={sortField === 'phone' ? "inherit" : "gray.400"}>{sortField === 'phone' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('job')}>
                <Flex align="center" gap={1}>{t("tenant.job")} <Text as="span" color={sortField === 'job' ? "inherit" : "gray.400"}>{sortField === 'job' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('dob')}>
                <Flex align="center" gap={1}>{t("tenant.dob")} <Text as="span" color={sortField === 'dob' ? "inherit" : "gray.400"}>{sortField === 'dob' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('status')}>
                <Flex align="center" gap={1}>{t("tenant.status")} <Text as="span" color={sortField === 'status' ? "inherit" : "gray.400"}>{sortField === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
              </Th>
              <Th textAlign="center">{t("tenant.action")}</Th>
            </Tr>
          </Thead>

          <Tbody>
            {paginatedTenants.map((tenantItem) => (
              <Tr key={tenantItem.uid} _hover={{ bg: hoverBg }} transition="all 0.2s">
                <Td>
                  <Checkbox
                    isChecked={selectedIds.includes(tenantItem.uid)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds((prev) => [...prev, tenantItem.uid]);
                      } else {
                        setSelectedIds((prev) =>
                          prev.filter((id) => id !== tenantItem.uid),
                        );
                      }
                    }}
                    colorScheme="blue"
                  />
                </Td>

                <Td>
                  <Image
                    src={tenantItem.photo_path ? `http://localhost:8000/storage/${tenantItem.photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(tenantItem.name)}&background=random&size=100`}
                    alt="avatar"
                    boxSize="40px"
                    borderRadius="full"
                    objectFit="cover"
                    border="1px solid"
                    borderColor={borderColor}
                  />
                </Td>

                <Td fontWeight="medium" color={textColor}>{tenantItem.name}</Td>
                <Td color={mutedText}>{tenantItem.email}</Td>
                <Td color={mutedText}>{tenantItem.phone}</Td>
                <Td color={mutedText}>{tenantItem.occupation || tenantItem.job}</Td>
                <Td color={mutedText}>{tenantItem.dob || "N/A"}</Td>

                <Td>
                  <Badge
                    colorScheme={!tenantItem.user_id ? "yellow" : "green"}
                    px={2}
                    py={1}
                    borderRadius="full"
                    textTransform="capitalize"
                  >
                    {!tenantItem.user_id ? t("tenant.pending_badge") : t("tenant.linked_badge")}
                  </Badge>
                </Td>

                <Td>
                  <Flex justify="center" gap={2}>
                    <Tooltip label="View Tenant" hasArrow>
                      <IconButton
                        icon={<FiEye />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/dashboard/tenants/view/${tenantItem.uid}`)
                        }
                        aria-label="View Tenant"
                      />
                    </Tooltip>

                    <Tooltip label="Edit Tenant" hasArrow>
                      <IconButton
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => {
                          setIsEdit(true);
                          setSelectedTenant(tenantItem);
                          setForm({
                            name: tenantItem.name || "",
                            email: tenantItem.email || "",
                            phone: tenantItem.phone || "",
                            dob: tenantItem.dob || "",
                            job: tenantItem.occupation || tenantItem.job || "",
                            photo: tenantItem.photo || "",
                            idFront: { preview: tenantItem.id_photo_path ? `http://localhost:8000/storage/${tenantItem.id_photo_path}` : null, file: null },
                            idBack: { preview: tenantItem.id_card_back_path ? `http://localhost:8000/storage/${tenantItem.id_card_back_path}` : null, file: null },
                          });
                          setShowFormModal(true);
                        }}
                        aria-label="Edit Tenant"
                      />
                    </Tooltip>

                    <Tooltip label={!tenantItem.user_id ? "Link Account" : "Account Linked"} hasArrow>
                      <IconButton
                        icon={<FiUserPlus />}
                        size="sm"
                        colorScheme="green"
                        variant="ghost"
                        isDisabled={!!tenantItem.user_id}
                        onClick={() => {
                          if (!tenantItem.user_id) {
                            setSelectedTenant(tenantItem);
                            setAccountPassword("");
                            setAccountConfirmPassword("");
                            setShowAccountModal(true);
                          }
                        }}
                        aria-label="Link Account"
                      />
                    </Tooltip>

                    <Tooltip label="Delete Tenant" hasArrow>
                      <IconButton
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="gray"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(tenantItem);
                          setShowModal(true);
                        }}
                        aria-label="Delete Tenant"
                      />
                    </Tooltip>
                  </Flex>
                </Td>
              </Tr>
            ))}

            {filteredTenants.length === 0 && (
              <Tr>
                <Td colSpan={9} textAlign="center" py={10} color={mutedText}>
                  {t("tenant.no_found")}
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        </Box>

        {/* Bulk Delete */}
        {selectedIds.length > 0 && (
          <Box p={4} borderTop="1px solid" borderColor={borderColor} flexShrink={0}>
            <Button
              colorScheme="red"
              onClick={deleteSelected}
              leftIcon={<FiTrash2 />}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          </Box>
        )}
      </TableContainer>
      {/* ===== PAGINATION ===== */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align="center" gap={4} flexShrink={0}>
        <Flex align="center" gap={2} fontSize="sm" color={textColor}>
          <Text>{t("common.total_pages", { count: totalPages })}</Text>
        </Flex>

        <Flex align="center" gap={2}>
          <Button
            size="sm"
            variant="outline"
            isDisabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            {t("lease.prev")}
          </Button>

          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={currentPage === i + 1 ? "solid" : "outline"}
              colorScheme={currentPage === i + 1 ? "blue" : "gray"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            size="sm"
            variant="outline"
            isDisabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            {t("lease.next")}
          </Button>
        </Flex>
      </Flex>

      {/* ===== DELETE MODAL ===== */}
      {showModal && selectedTenant && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" backdropFilter="blur(4px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} px={4}>
          <Box bg={cardBg} borderRadius="2xl" shadow="xl" w="full" maxW="md" p={8} textAlign="center">
            <Flex w="14" h="14" mx="auto" mb={3} align="center" justify="center" borderRadius="full" bg="red.100" color="red.600">
              <Icon as={FiAlertTriangle} boxSize={6} />
            </Flex>

            <Heading size="md" color={textColor} mb={2}>
              Delete Tenant
            </Heading>

            <Image
              src={selectedTenant.photo_path ? `http://localhost:8000/storage/${selectedTenant.photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTenant.name)}&background=random&size=100`}
              fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTenant.name)}&background=random&size=100`}
              alt="avatar"
              boxSize="80px"
              mx="auto"
              borderRadius="full"
              objectFit="cover"
              border="1px solid"
              borderColor={borderColor}
              mb={3}
            />

            <Text color={mutedText}>Are you sure you want to delete</Text>
            <Text fontWeight="bold" color={textColor} mb={2}>
              {selectedTenant.name}
            </Text>

            <Text fontSize="sm" color="red.500" mb={6}>
              This action cannot be undone.
            </Text>

            <Flex justify="center" gap={4}>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete}>
                Yes, Delete
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* ===== FORM MODAL ===== */}
      {showFormModal && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" backdropFilter="blur(4px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} px={4}>
          <Box bg={cardBg} borderRadius="xl" shadow="2xl" w="full" maxW="5xl" position="relative" overflowY="auto" maxH="90vh">

            {/* Close X button */}
            <IconButton
              icon={<Box fontSize="lg" fontWeight="bold">×</Box>}
              size="sm"
              variant="ghost"
              position="absolute"
              top={4}
              right={4}
              onClick={() => setShowFormModal(false)}
              aria-label="Close"
              color="gray.400"
              _hover={{ color: "gray.700", bg: "gray.100" }}
              borderRadius="full"
              zIndex={1}
            />

            <Box px={8} pt={8} pb={6}>
              {/* Title */}
              <Heading size="md" color={textColor} mb={6} fontWeight="black" textTransform="uppercase" letterSpacing="tight">
                {isEdit ? "Edit Tenant" : "Add New Tenant"}
              </Heading>

              {/* TOP: Photo left + Fields right */}
              <Flex gap={8} mb={6} direction={{ base: "column", md: "row" }}>
                {/* Photo Upload — dashed container */}
                <Box
                  as="label"
                  cursor="pointer"
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="xl"
                  p={6}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  w="200px"
                  _hover={{ borderColor: "blue.400", bg: "gray.50" }}
                  transition="all 0.2s"
                >
                  <input type="file" accept="image/*" hidden onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => setForm({ ...form, photo: { file, preview: reader.result } });
                    reader.readAsDataURL(file);
                  }} />
                  {form.photo?.preview ? (
                    <Box
                      w="120px" h="120px" borderRadius="full" overflow="hidden"
                      border="2px solid" borderColor="gray.200" shadow="sm" bg="gray.50"
                    >
                      <img src={form.photo.preview} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  ) : (
                    <Flex
                      w="120px" h="120px" borderRadius="full" align="center" justify="center"
                      bg="gray.100" color="gray.300"
                    >
                      <Icon as={FiUserPlus} boxSize={12} strokeWidth={1} />
                    </Flex>
                  )}
                  <Button
                    size="xs" variant="outline" mt={4}
                    pointerEvents="none"
                    fontWeight="bold" textTransform="uppercase" fontSize="10px" letterSpacing="wider"
                    borderColor="gray.400" color="gray.600"
                    px={4}
                  >
                    Select Photo
                  </Button>
                </Box>

                {/* Form Fields */}
                <Box flex={1}>
                  {/* Name */}
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Name</Text>
                    <Input
                      placeholder="Full Legal Name"
                      size="md"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      borderColor={borderColor}
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                  </Box>

                  {/* Email */}
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Email (Unique)</Text>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      size="md"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      borderColor={borderColor}
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                  </Box>

                  {/* Phone + Job */}
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Phone</Text>
                      <Input
                        placeholder="+1 234 567 8900"
                        size="md"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        borderColor={borderColor}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Job / Occupation</Text>
                      <Input
                        placeholder="Software Engineer"
                        size="md"
                        value={form.job}
                        onChange={(e) => setForm({ ...form, job: e.target.value })}
                        borderColor={borderColor}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                    </Box>
                  </SimpleGrid>

                  {/* Date of Birth */}
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Date of Birth</Text>
                    <Input
                      type="date"
                      size="md"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      borderColor={borderColor}
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                  </Box>
                </Box>
              </Flex>

              {/* ID Card Uploads */}
              <SimpleGrid columns={2} spacing={4} mb={5}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>ID Card Photo (Front)</Text>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ fontSize: "14px" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setForm({ ...form, idFront: { file, preview: reader.result } });
                      reader.readAsDataURL(file);
                    }}
                  />
                  {form.idFront?.preview && (
                    <Image src={form.idFront.preview} mt={2} w="50px" h="50px" objectFit="cover" borderRadius="md" border="1px solid" borderColor="gray.200" />
                  )}
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>ID Card Photo (Back)</Text>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ fontSize: "14px" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setForm({ ...form, idBack: { file, preview: reader.result } });
                      reader.readAsDataURL(file);
                    }}
                  />
                  {form.idBack?.preview && (
                    <Image src={form.idBack.preview} mt={2} w="50px" h="50px" objectFit="cover" borderRadius="md" border="1px solid" borderColor="gray.200" />
                  )}
                </Box>
              </SimpleGrid>

              {/* Create Login Account Toggle */}
              {!isEdit && (
                <Box mb={5}>
                  <Checkbox
                    isChecked={form.createAccount}
                    onChange={(e) => setForm({ ...form, createAccount: e.target.checked })}
                    colorScheme="blue"
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    Create Login Account
                  </Checkbox>

                  {form.createAccount && (
                    <Box mt={3} p={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="lg">
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Password</Text>
                          <Input
                            type="password"
                            size="md"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            borderColor={borderColor}
                            _hover={{ borderColor: "blue.400" }}
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Confirm</Text>
                          <Input
                            type="password"
                            size="md"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            borderColor={borderColor}
                            _hover={{ borderColor: "blue.400" }}
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          />
                        </Box>
                      </SimpleGrid>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* BUTTONS — bottom bar */}
            <Flex px={8} py={4} justify="flex-end" gap={3} borderTop="1px solid" borderColor={borderColor}>
              <Button variant="ghost" onClick={() => setShowFormModal(false)} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSaveTenant} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" px={6}>
                {isEdit ? "Update Tenant" : "Save Tenant"}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* ===== LINK ACCOUNT MODAL ===== */}
      {showAccountModal && selectedTenant && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" backdropFilter="blur(4px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} px={4}>
          <Box bg={cardBg} borderRadius="2xl" shadow="xl" w="full" maxW="md" p={8} textAlign="center">
            <Flex w="14" h="14" mx="auto" mb={3} align="center" justify="center" borderRadius="full" bg="green.100" color="green.600">
              <Icon as={FiLink} boxSize={6} />
            </Flex>

            <Heading size="md" color={textColor} mb={2}>
              Link Account
            </Heading>

            <Text color={mutedText} mb={4}>
              Create login account for <Text as="b" color={textColor}>{selectedTenant.name}</Text>
            </Text>

            <Input
              placeholder="Email"
              mb={4}
              value={selectedTenant.email}
              isReadOnly
              borderColor={borderColor}
            />
            <Input
              placeholder="Password"
              type="password"
              mb={4}
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              borderColor={borderColor}
              _hover={{ borderColor: "green.400" }}
              _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px #38a169" }}
            />
            <Input
              placeholder="Confirm Password"
              type="password"
              mb={4}
              value={accountConfirmPassword}
              onChange={(e) => setAccountConfirmPassword(e.target.value)}
              borderColor={borderColor}
              _hover={{ borderColor: "green.400" }}
              _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px #38a169" }}
            />
            
            <Flex justify="center" gap={4}>
              <Button variant="outline" onClick={() => setShowAccountModal(false)}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleLinkAccount}>
                Link Account
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
      </>)}
    </Box>
  );
}

function ModalInput({ label, type = "text", ...props }) {
  const textColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  return (
    <Flex direction="column" gap={1}>
      <Text fontSize="sm" color={textColor}>{label}</Text>
      <Input
        type={type}
        {...props}
        borderColor={borderColor}
        _hover={{ borderColor: "blue.400" }}
        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
      />
    </Flex>
  );
}

function ImageInput({ label, value, onChange }) {
  const textColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ file, preview: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const previewSrc = value?.preview || (typeof value === 'string' ? value : null);

  return (
    <Box border="1px solid" borderColor={borderColor} borderRadius="xl" p={3} textAlign="center" _hover={{ shadow: "md" }} transition="all 0.2s">
      <Text fontSize="sm" color={textColor} mb={2}>{label}</Text>

      <Box as="label" cursor="pointer" display="block">
        <input type="file" accept="image/*" onChange={handleFile} hidden />

        {previewSrc ? (
          <Image
            src={previewSrc}
            w="full"
            h="28"
            objectFit="cover"
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          />
        ) : (
          <Flex w="full" h="28" align="center" justify="center" color="gray.400" border="1px solid" borderColor={borderColor} borderRadius="lg" fontSize="sm">
            Click to upload
          </Flex>
        )}
      </Box>
    </Box>
  );
}
