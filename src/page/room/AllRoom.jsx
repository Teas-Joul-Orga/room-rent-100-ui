import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
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
  Spinner,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";

export default function AllRoom() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const calculatePerPage = () => {
      // similar to AllUsers
      const availableHeight = window.innerHeight - 440;
      let calculated = Math.floor(availableHeight / 70);
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
  const [showModal, setShowModal] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRooms();
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [currentPage, rowsPerPage, search, sortField, sortDir]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      let url = `http://localhost:8000/api/v1/admin/rooms?page=${currentPage}&limit=${rowsPerPage}&search=${search}`;
      if (sortField) url += `&sort=${sortField}&direction=${sortDir}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setRooms(data.data || []);
        setTotalPages(data.last_page || 1);
      } else {
        toast.error("Failed to fetch rooms.");
      }
    } catch (err) {
      toast.error("Network error fetching rooms.");
    } finally {
      setIsLoading(false);
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

  const handleToggleActive = async (room, newStatus) => {
    setIsLoading(true);
    try {
      if (newStatus === "disabled") {
        const res = await fetch(`http://localhost:8000/api/v1/admin/rooms/${room.uid}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) toast.success("Room disabled successfully");
        else toast.error("Failed to disable room");
      } else {
        const res = await fetch(`http://localhost:8000/api/v1/admin/rooms/${room.uid}/restore`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) toast.success("Room enabled successfully");
        else toast.error("Failed to enable room");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error");
    } finally {
      fetchRooms();
    }
  };

  // Single disable
  const confirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/rooms/${selectedItem.uid}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success("Room disabled successfully");
        fetchRooms();
        setShowModal(false);
        setSelectedItem(null);
      } else {
        toast.error("Failed to disable room");
      }
    } catch(err) {
      toast.error("Network Error");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <Box p={6} bg={bg} h={{ base: "auto", lg: "calc(100vh - 140px)" }} overflow="hidden" display="flex" flexDirection="column">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <Flex direction={{ base: "column", sm: "row" }} align={{ sm: "center" }} justify="space-between" gap={4} mb={6} flexShrink={0}>
        <Heading size="lg" color={useColorModeValue("sky.900", "white")}>
          {t("sidebar.all_rooms")}
        </Heading>
        <HStack spacing={3}>
          <Button
            display={{ base: "none", sm: "flex" }}
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => navigate("/dashboard/rooms/add")}
            shadow="sm"
          >
            {t("room.add_new")}
          </Button>

          <Button
            display={{ base: "none", sm: "flex" }}
            leftIcon={<FiDownload />}
            colorScheme="green"
            variant="outline"
            onClick={() => {
              const dataToExport = rooms.map(r => ({
                "Name": r.name,
                "Price": r.base_rent_price,
                "Status": r.status,
                "Availability": r.deleted_at ? "Disabled" : "Enabled",
                "Size": r.size || "N/A",
                "Created At": new Date(r.created_at).toLocaleDateString()
              }));
              exportToExcel(dataToExport, "All_Rooms_" + new Date().toISOString().split('T')[0]);
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
          onClick={() => navigate("/dashboard/rooms/add")}
          isRound
          size="lg"
          position="fixed"
          bottom="85px"
          right="20px"
          zIndex={999}
          shadow="dark-lg"
          aria-label="Add Room"
        />
      </Flex>

      {/* ===== SEARCH ===== */}
      <Box bg={cardBg} p={4} borderRadius="xl" shadow="sm" mb={6} flexShrink={0}>
        <Input
          placeholder={t("room.search")}
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
               <Th w="50px">{t("room.check_box")}</Th>
               <Th>{t("room.photo")}</Th>
               <Th cursor="pointer" onClick={() => handleSort('name')}>
                 <Flex align="center" gap={1}>{t("room.name")} <Text as="span" color={sortField === 'name' ? "inherit" : "gray.400"}>{sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
               </Th>
               <Th cursor="pointer" onClick={() => handleSort('base_rent_price')}>
                 <Flex align="center" gap={1}>{t("room.base_rent")} <Text as="span" color={sortField === 'base_rent_price' ? "inherit" : "gray.400"}>{sortField === 'base_rent_price' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
               </Th>
               <Th cursor="pointer" onClick={() => handleSort('status')}>
                 <Flex align="center" gap={1}>{t("room.status")} <Text as="span" color={sortField === 'status' ? "inherit" : "gray.400"}>{sortField === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
               </Th>
               <Th>{t("room.active")}</Th>
               <Th textAlign="center">{t("room.action")}</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={10}>
                  <Spinner size="lg" color="blue.500" />
                </Td>
              </Tr>
            ) : rooms.length > 0 ? (
            rooms.map((r) => (
              <Tr key={r.uid} _hover={{ bg: hoverBg }} transition="all 0.2s">
                <Td>
                  <Checkbox
                    isChecked={selectedIds.includes(r.uid)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, r.uid]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== r.uid));
                      }
                    }}
                    colorScheme="blue"
                  />
                </Td>

                {/* PHOTO */}
                <Td>
                  <Image
                    src={r.images?.length > 0 ? `http://localhost:8000/storage/${r.images[0].path}` : "https://via.placeholder.com/80"}
                    alt="room"
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                  />
                </Td>

                {/* NAME */}
                <Td fontWeight="medium" color={textColor}>
                  {r.name}
                </Td>

                {/* RENT */}
                <Td color={useColorModeValue("gray.700", "gray.300")}>
                  ${r.base_rent_price}
                </Td>

                {/* STATUS */}
                <Td>
                  <Badge
                    colorScheme={r.status === "available" ? "green" : r.status === "occupied" ? "red" : "orange"}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    textTransform="uppercase"
                    fontSize="xs"
                    fontWeight="bold"
                    letterSpacing="wider"
                    boxShadow="sm"
                    display="inline-flex"
                    alignItems="center"
                  >
                     {t(`room.${r.status}`)}
                  </Badge>
                </Td>

                {/* ACTIVE TOGGLE */}
                <Td p={3}>
                  <Select
                    size="xs"
                    fontWeight="bold"
                    w="110px"
                    bg={r.deleted_at ? "red.50" : "green.50"}
                    color={r.deleted_at ? "red.700" : "green.700"}
                    borderColor={r.deleted_at ? "red.200" : "green.200"}
                    value={r.deleted_at ? "disabled" : "enabled"}
                    onChange={(e) => handleToggleActive(r, e.target.value)}
                    cursor="pointer"
                  >
                     <option value="enabled">{t("room.enabled")}</option>
                     <option value="disabled">{t("room.disabled")}</option>
                  </Select>
                </Td>

                {/* ACTION */}
                <Td>
                  <Flex justify="center" gap={2}>
                    <Tooltip label="View Room" hasArrow>
                      <IconButton
                        icon={<FiEye />}
                        size="sm"
                        colorScheme="green"
                        variant="ghost"
                        onClick={() => navigate(`/dashboard/rooms/viewroom/${r.uid}`)}
                        aria-label="View room"
                      />
                    </Tooltip>
                    <Tooltip label="Edit Room" hasArrow>
                      <IconButton
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => navigate(`/dashboard/rooms/edit/${r.uid}`)}
                        aria-label="Edit room"
                      />
                    </Tooltip>
                  </Flex>
                </Td>
              </Tr>
            ))
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center" py={10} color={mutedText}>
                   {t("room.no_found")}
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        </Box>

        {/* Bulk Disable */}
        {selectedIds.length > 0 && (
          <Box p={4} borderTop="1px solid" borderColor={borderColor} flexShrink={0}>
            <Button
              colorScheme="red"
              onClick={() => setShowBulkDelete(true)}
              leftIcon={<FiTrash2 />}
            >
              Disable Selected ({selectedIds.length})
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
             {t("common.back")}
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
             {t("common.next")}
          </Button>
        </Flex>
      </Flex>

      {/* SINGLE DISABLE MODAL */}
      {showModal && selectedItem && (
        <Flex
          position="fixed"
          top={0} left={0} right={0} bottom={0}
          bg="blackAlpha.600"
          zIndex={9999}
          align="center"
          justify="center"
          p={4}
        >
          <Box bg={cardBg} borderRadius="xl" shadow="2xl" maxW="md" w="full" p={6}>
            <Heading size="md" mb={4} color={textColor}>
              Disable Room
            </Heading>
            <Text mb={6} color={mutedText}>
              Are you sure you want to disable <strong>{selectedItem.name}</strong>?
            </Text>
            <Flex justify="flex-end" gap={3}>
              <Button onClick={() => setShowModal(false)} variant="ghost">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete}>
                Disable
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {/* BULK DISABLE MODAL */}
      {showBulkDelete && (
        <Flex
          position="fixed"
          top={0} left={0} right={0} bottom={0}
          bg="blackAlpha.600"
          zIndex={9999}
          align="center"
          justify="center"
          p={4}
        >
          <Box bg={cardBg} borderRadius="xl" shadow="2xl" maxW="md" w="full" p={6}>
            <Heading size="md" mb={4} color={textColor}>
              Disable Multiple Rooms
            </Heading>
            <Text mb={6} color={mutedText}>
              Are you sure you want to disable {selectedIds.length} rooms?
            </Text>
            <Flex justify="flex-end" gap={3}>
              <Button onClick={() => setShowBulkDelete(false)} variant="ghost">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={async () => {
                let successCount = 0;
                setIsLoading(true);
                for (let id of selectedIds) {
                  try {
                    await fetch(`http://localhost:8000/api/v1/admin/rooms/${id}`, {
                      method: "DELETE",
                      headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`
                      }
                    });
                    successCount++;
                  } catch(e) {
                    console.error(`Failed to disable room ${id}`, e);
                  }
                }
                toast.success(`${successCount} rooms disabled`);
                setSelectedIds([]);
                setShowBulkDelete(false);
                fetchRooms();
              }}>
                Disable All
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  );
}
