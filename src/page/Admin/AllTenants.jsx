import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Heading,
  Button,
  Input,
  Badge,
  Image,
  Text,
  HStack,
  useColorModeValue,
  IconButton,
  Tooltip,
  SimpleGrid,
  useDisclosure,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiUsers, FiClock, FiCheckCircle, FiSearch, FiDownload, FiUserPlus } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";
import { useApi } from "../../hooks/useApi";
import StatsCard from "../../components/common/StatsCard";
import DataTable from "../../components/common/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AllTenants() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { request, loading } = useApi();
  
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const deleteDisc = useDisclosure();
  const [tenantToDelete, setTenantTenantToDelete] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    const [data] = await request({ url: "/admin/tenants?limit=all", method: "GET" }, { showToast: false });
    if (data) setTenants(data);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) =>
      (t.name || "").toLowerCase().includes(search.trim().toLowerCase()) ||
      (t.email || "").toLowerCase().includes(search.trim().toLowerCase()) ||
      (t.phone || "").toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [tenants, search]);

  const sortedTenants = useMemo(() => {
    return [...filteredTenants].sort((a, b) => {
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
  }, [filteredTenants, sortField, sortDir]);

  const paginatedData = sortedTenants.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedTenants.length / rowsPerPage);

  const handleDelete = (tenant) => {
    setTenantTenantToDelete(tenant);
    deleteDisc.onOpen();
  };

  const confirmDelete = async () => {
    const [data] = await request({
      url: `/admin/tenants/${tenantToDelete.uid}`,
      method: "DELETE"
    }, { successMessage: "Tenant deleted successfully" });
    
    if (data) {
      fetchTenants();
      deleteDisc.onClose();
    }
  };

  const columns = [
    {
      key: "photo",
      label: t("tenant.photo"),
      render: (item) => (
        <Image
          src={item.photo_path ? `http://localhost:8000/storage/${item.photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&size=100`}
          alt="avatar"
          boxSize="32px"
          borderRadius="full"
          objectFit="cover"
        />
      )
    },
    { key: "name", label: t("tenant.name"), sortable: true },
    { key: "email", label: t("tenant.email"), sortable: true },
    { key: "phone", label: t("tenant.phone"), sortable: true },
    { 
      key: "job", 
      label: t("tenant.job"), 
      sortable: true,
      render: (item) => item.occupation || item.job || "N/A"
    },
    {
      key: "status",
      label: t("tenant.status"),
      sortable: true,
      render: (item) => (
        <Badge
          colorScheme={!item.user_id ? "yellow" : "green"}
          px={2}
          py={0.5}
          borderRadius="full"
          fontSize="9px"
          fontWeight="black"
          textTransform="uppercase"
        >
          {!item.user_id ? t("tenant.pending_badge") : t("tenant.linked_badge")}
        </Badge>
      )
    },
    {
      key: "actions",
      label: t("tenant.action"),
      render: (item) => (
        <HStack spacing={1}>
          <Tooltip label="View Details"><IconButton icon={<FiEye />} size="xs" variant="ghost" onClick={() => navigate(`/dashboard/tenants/view/${item.uid}`)} /></Tooltip>
          <Tooltip label="Edit"><IconButton icon={<FiEdit2 />} size="xs" variant="ghost" colorScheme="blue" onClick={() => navigate(`/dashboard/tenants/edit/${item.uid}`)} /></Tooltip>
          <Tooltip label="Delete"><IconButton icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(item)} /></Tooltip>
        </HStack>
      )
    }
  ];

  const bg = useColorModeValue("gray.50", "#0d1117");
  const textColor = useColorModeValue("gray.900", "white");

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="calc(100vh - 100px)">
      <Flex direction={{ base: "column", sm: "row" }} align={{ sm: "center" }} justify="space-between" mb={8} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="900" letterSpacing="tight" color={textColor}>
            {t("sidebar.tenant_mgmt")}
          </Heading>
          <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase" mt={1}>
            Directory of all registered residents
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => navigate("/dashboard/tenants/addtenant")}
            px={6}
            fontWeight="black"
            textTransform="uppercase"
            fontSize="xs"
            letterSpacing="widest"
            borderRadius="xl"
            shadow="lg"
          >
            {t("tenant.add_new")}
          </Button>
          <IconButton 
            icon={<FiDownload />} 
            variant="outline" 
            onClick={() => exportToExcel(tenants, "Tenants_List")}
            aria-label="Export"
            borderRadius="xl"
          />
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <StatsCard title={t("tenant.total")} value={tenants.length} icon={FiUsers} color="blue" isLoading={loading && tenants.length === 0} />
        <StatsCard title={t("tenant.pending")} value={tenants.filter(t => !t.user_id).length} icon={FiClock} color="yellow" isLoading={loading && tenants.length === 0} />
        <StatsCard title={t("tenant.linked")} value={tenants.filter(t => t.user_id).length} icon={FiCheckCircle} color="green" isLoading={loading && tenants.length === 0} />
      </SimpleGrid>

      <Box bg={useColorModeValue("white", "#161b22")} p={4} borderRadius="2xl" shadow="sm" mb={6} border="1px solid" borderColor={useColorModeValue("gray.100", "#30363d")}>
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder={t("tenant.search_name")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            variant="filled"
            bg={useColorModeValue("gray.50", "#0d1117")}
            borderRadius="xl"
            _focus={{ bg: useColorModeValue("white", "#0d1117"), borderColor: "blue.500" }}
          />
        </InputGroup>
      </Box>

      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={loading}
        onSort={handleSort}
        sortField={sortField}
        sortDir={sortDir}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage
        }}
        emptyStateProps={{
          title: "No tenants found",
          description: "Try adjusting your search or add a new tenant.",
          icon: FiUsers,
          actionText: "Add Tenant",
          onAction: () => navigate("/dashboard/tenants/addtenant")
        }}
      />

      <ConfirmDialog
        isOpen={deleteDisc.isOpen}
        onClose={deleteDisc.onClose}
        onConfirm={confirmDelete}
        title="Delete Tenant"
        message={`Are you sure you want to delete ${tenantToDelete?.name}? This will move them to the recycle bin and disable their login account.`}
        confirmText="Delete Tenant"
        isLoading={loading}
      />
    </Box>
  );
}
