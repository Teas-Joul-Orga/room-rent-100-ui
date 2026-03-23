import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  useColorModeValue,
  IconButton,
  Tooltip,
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
} from "@chakra-ui/react";
import { FiEdit2, FiEye, FiPlus } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function Furniture() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [furniture, setFurniture] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ uid: null, name: "", condition: "Good" });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); 

  useEffect(() => {
    const calculatePerPage = () => {
      // 100vh - 350px approx for extra header + search + padding + pagination
      const availableHeight = window.innerHeight - 350;
      let calculated = Math.floor(availableHeight / 60);
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

  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const tableHeaderBg = useColorModeValue("sky.100", "#30363d");
  const hoverBg = useColorModeValue("sky.50", "#30363d");

  const fetchFurniture = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/admin/furniture?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFurniture(data.data || data);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("furniture.load_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFurniture();
  }, []);

  const handleToggleActive = async (f, newStatus) => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      if (newStatus === "disabled") {
        const res = await fetch(`http://localhost:8000/api/v1/admin/furniture/${f.uid}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) toast.success(t("furniture.disabled_success"));
        else toast.error(t("furniture.disabled_failed"));
      } else {
        const res = await fetch(`http://localhost:8000/api/v1/admin/furniture/${f.uid}/restore`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) toast.success(t("furniture.enabled_success"));
        else toast.error(t("furniture.enabled_failed"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("furniture.network_error"));
    } finally {
      fetchFurniture();
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setFormData({
        uid: item.uid,
        name: item.name,
        condition: item.condition
      });
    } else {
      setIsEdit(false);
      setFormData({ uid: null, name: "", condition: "Good" });
    }
    onOpen();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error(t("furniture.name_required"));
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("token");
    const url = isEdit
      ? `http://localhost:8000/api/v1/admin/furniture/${formData.uid}`
      : `http://localhost:8000/api/v1/admin/furniture`;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          condition: formData.condition
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(isEdit ? t("furniture.updated_success") : t("furniture.added_success"));
        onClose();
        fetchFurniture();
      } else {
        toast.error(data.message || t("furniture.save_failed"));
      }
    } catch (e) {
      toast.error(t("furniture.network_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = [...furniture]
    .filter((f) => (f?.name || "").toLowerCase().includes(search.trim().toLowerCase()));

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

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginated = sorted.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const conditionMap = {
    "New": t("furniture.condition_new"),
    "Good": t("furniture.condition_good"),
    "Fair": t("furniture.condition_fair"),
    "Broken": t("furniture.condition_broken"),
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "New": return "blue";
      case "Good": return "green";
      case "Broken": return "red";
      case "Fair": return "yellow";
      default: return "gray";
    }
  };

  return (
    <Box p={6} bg={bg} h={{ base: "auto", lg: "calc(100vh - 140px)" }} overflow="hidden" display="flex" flexDirection="column">
      <Toaster position="top-right" />
      <Flex direction={{ base: "column", sm: "row" }} align={{ sm: "center" }} justify="space-between" gap={4} mb={6} flexShrink={0}>
          <Heading size="lg" color={useColorModeValue("sky.900", "white")}>
            {t("furniture.title")}
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => handleOpenModal()}
            shadow="sm"
          >
            {t("furniture.add")}
          </Button>
        </Flex>

        {/* ===== SEARCH ===== */}
        <Box bg={cardBg} p={4} borderRadius="xl" shadow="sm" mb={6} flexShrink={0}>
          <Input
            placeholder={t("furniture.search_placeholder")}
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
        <TableContainer bg={cardBg} borderRadius="xl" shadow="sm" mb={4} display="flex" flexDirection="column" flex={1} minH={0} overflow="hidden">
          <Box overflow="hidden" flex={1}>
            <Table variant="simple">
              <Thead bg={tableHeaderBg} position="sticky" top={0} zIndex={2}>
                <Tr>
                  <Th cursor="pointer" onClick={() => handleSort('name')}>
                    <Flex align="center" gap={1}>{t("furniture.name")} <Text as="span" color={sortField === 'name' ? "inherit" : "gray.400"}>{sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
                  </Th>
                  <Th cursor="pointer" onClick={() => handleSort('condition')}>
                    <Flex align="center" gap={1}>{t("furniture.condition")} <Text as="span" color={sortField === 'condition' ? "inherit" : "gray.400"}>{sortField === 'condition' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
                  </Th>
                  <Th cursor="pointer" onClick={() => handleSort('rooms_count')}>
                    <Flex align="center" gap={1}>{t("furniture.in_rooms")} <Text as="span" color={sortField === 'rooms_count' ? "inherit" : "gray.400"}>{sortField === 'rooms_count' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
                  </Th>
                  <Th>{t("furniture.active")}</Th>
                  <Th textAlign="center">{t("furniture.action")}</Th>
                </Tr>
              </Thead>

              <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={10}>
                    <Spinner size="lg" color="blue.500" />
                  </Td>
                </Tr>
              ) : paginated.length > 0 ? (
                paginated.map((f) => (
                  <Tr key={f.uid} _hover={{ bg: hoverBg }} transition="all 0.2s">
                    {/* NAME */}
                    <Td fontWeight="medium" color={textColor}>
                      {f.name}
                    </Td>

                    {/* CONDITION */}
                    <Td>
                      <Badge
                        colorScheme={getConditionColor(f.condition)}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                        letterSpacing="wider"
                        boxShadow="sm"
                      >
                        {conditionMap[f.condition] || f.condition}
                      </Badge>
                    </Td>

                    {/* IN ROOMS */}
                    <Td color={mutedText} fontWeight="semibold">
                      {f.rooms_count > 0 ? t("furniture.rooms_count", { count: f.rooms_count }) : t("furniture.no_rooms")}
                    </Td>

                    {/* ACTIVE TOGGLE */}
                    <Td>
                      <Select
                        size="xs"
                        fontWeight="bold"
                        w="110px"
                        bg={f.deleted_at ? "red.50" : "green.50"}
                        color={f.deleted_at ? "red.700" : "green.700"}
                        borderColor={f.deleted_at ? "red.200" : "green.200"}
                        value={f.deleted_at ? "disabled" : "enabled"}
                        onChange={(e) => handleToggleActive(f, e.target.value)}
                        cursor="pointer"
                      >
                        <option value="enabled">{t("furniture.enabled")}</option>
                        <option value="disabled">{t("furniture.disabled")}</option>
                      </Select>
                    </Td>

                    {/* ACTION */}
                    <Td>
                      <Flex justify="center" gap={2}>
                        <Tooltip label={t("furniture.view")} hasArrow>
                          <IconButton
                            icon={<FiEye />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => navigate(`/dashboard/furniture/viewfurniture/${f.uid}`)}
                            aria-label={t("furniture.view")}
                          />
                        </Tooltip>
                        <Tooltip label={t("furniture.edit")} hasArrow>
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleOpenModal(f)}
                            aria-label={t("furniture.edit")}
                          />
                        </Tooltip>
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={10} color={mutedText}>
                    {t("furniture.no_found")}
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          </Box>
        </TableContainer>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4} flexShrink={0}>
            <Text fontSize="sm" color={mutedText}>
              {t("furniture.showing_entries", { first: firstIndex + 1, last: Math.min(lastIndex, filtered.length), total: filtered.length })}
            </Text>
            <Flex gap={2}>
              <Button
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)}
                isDisabled={currentPage === 1}
              >
                {t("furniture.prev")}
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  colorScheme={currentPage === i + 1 ? "blue" : "gray"}
                  variant={currentPage === i + 1 ? "solid" : "outline"}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                isDisabled={currentPage === totalPages}
              >
                {t("furniture.next")}
              </Button>
            </Flex>
          </Flex>
        )}

      {/* ===== ADD/EDIT MODAL ===== */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="scale">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" shadow="2xl">
          <form onSubmit={handleSave}>
            <ModalHeader color={textColor}>
              {isEdit ? t("furniture.edit_title") : t("furniture.add_title")}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl isRequired mb={4}>
                <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">{t("furniture.furniture_name")}</FormLabel>
                <Input
                  autoFocus
                  placeholder={t("furniture.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </FormControl>

              <FormControl mt={4} isRequired>
                <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">{t("furniture.condition")}</FormLabel>
                <Select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                >
                  <option value="New">{t("furniture.condition_new")}</option>
                  <option value="Good">{t("furniture.condition_good")}</option>
                  <option value="Fair">{t("furniture.condition_fair")}</option>
                  <option value="Broken">{t("furniture.condition_broken")}</option>
                </Select>
              </FormControl>
            </ModalBody>

            <ModalFooter bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderBottomRadius="xl">
              <Button onClick={onClose} variant="ghost" mr={3}>
                {t("furniture.cancel")}
              </Button>
              <Button colorScheme="blue" type="submit" isLoading={isSaving}>
                {isEdit ? t("furniture.update_furniture") : t("furniture.save_furniture")}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </Box>
  );
}
