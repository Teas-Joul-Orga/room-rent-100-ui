import React, { useState, useEffect } from "react";
import { useSessionState } from "../../hooks/useSessionState";
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
  Grid,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { FiEdit2, FiEye, FiPlus, FiMinus, FiLayers } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function Furniture() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useSessionState("furnitureSearch", "");
  const [furniture, setFurniture] = useSessionState("allFurniture", []);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ uid: null, name: "", condition: "Good" });
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Add Modal State
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const [pendingFurniture, setPendingFurniture] = useState([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // View Modal State
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const [viewData, setViewData] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useSessionState("furniturePage", 1);
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
      const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
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
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
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
        const data = await res.json();
        if (res.ok) {
          toast.success(t("furniture.disabled_success"));
        } else {
          toast.error(data.error || data.message || t("furniture.disabled_failed"));
        }
      } else {
        const res = await fetch(`http://localhost:8000/api/v1/admin/furniture/${f.uid}/restore`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(t("furniture.enabled_success"));
        } else {
          toast.error(data.error || data.message || t("furniture.enabled_failed"));
        }
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
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
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

  // ── Bulk Add Handlers ──
  const handleOpenBulkModal = () => {
    setPendingFurniture([
      { _id: Date.now(), name: "", condition: "Good" },
    ]);
    onBulkOpen();
  };

  const handleBulkRowChange = (_id, field, value) => {
    setPendingFurniture(prev => prev.map(f => f._id === _id ? { ...f, [field]: value } : f));
  };

  const handleAddBulkRow = () => {
    setPendingFurniture(prev => [...prev, { _id: Date.now(), name: "", condition: "Good" }]);
  };

  const handleRemoveBulkRow = (_id) => {
    setPendingFurniture(prev => prev.filter(f => f._id !== _id));
  };

  const handleSaveBulk = async (e) => {
    e.preventDefault();
    if (pendingFurniture.length === 0) return toast.error(t("furniture.bulk_empty", "Please add at least one furniture item."));
    for (const f of pendingFurniture) {
      if (!f.name.trim()) return toast.error(t("furniture.name_required"));
    }
    setIsSavingBulk(true);
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
    try {
      const requests = pendingFurniture.map(f =>
        fetch("http://localhost:8000/api/v1/admin/furniture", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: f.name.trim(), condition: f.condition })
        })
      );
      const results = await Promise.all(requests);
      const failed = results.filter(r => !r.ok);
      if (failed.length === 0) {
        toast.success(t("furniture.bulk_success", `${pendingFurniture.length} furniture items added successfully!`));
        onBulkClose();
        fetchFurniture();
      } else {
        const errors = await Promise.all(failed.map(r => r.json()));
        const msgs = errors.map(e => e.errors?.name?.[0] || e.message || "Unknown error").join(", ");
        toast.error(msgs || t("furniture.save_failed"));
        fetchFurniture();
      }
    } catch (err) {
      toast.error(t("furniture.network_error"));
    } finally {
      setIsSavingBulk(false);
    }
  };

  const filtered = [...furniture]
    .filter((f) => (f?.name || "").toLowerCase().includes(search.trim().toLowerCase()));

  const [sortField, setSortField] = useSessionState("furnitureSortField", null);
  const [sortDir, setSortDir] = useSessionState("furnitureSortDir", "asc");

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
          <Heading size="xl" color={useColorModeValue("sky.900", "white")}>
            {t("furniture.title")}
          </Heading>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiLayers />}
              colorScheme="teal"
              variant="outline"
              onClick={handleOpenBulkModal}
              shadow="md"
              size="md"
              fontSize="md"
            >
              {t("furniture.bulk_add", "Bulk Add")}
            </Button>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={() => handleOpenModal()}
              shadow="md"
              size="md"
              fontSize="md"
            >
              {t("furniture.add")}
            </Button>
          </HStack>
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
            size="lg"
            fontSize="md"
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
                  <Th py={5} fontSize="sm" cursor="pointer" onClick={() => handleSort('name')}>
                    <Flex align="center" gap={1}>{t("furniture.name")} <Text as="span" color={sortField === 'name' ? "inherit" : "gray.400"}>{sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
                  </Th>
                  <Th py={5} fontSize="sm" cursor="pointer" onClick={() => handleSort('condition')}>
                    <Flex align="center" gap={1}>{t("furniture.condition")} <Text as="span" color={sortField === 'condition' ? "inherit" : "gray.400"}>{sortField === 'condition' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
                  </Th>
                  <Th py={5} fontSize="sm" cursor="pointer" onClick={() => handleSort('rooms_count')}>
                    <Flex align="center" gap={1}>{t("furniture.in_rooms")} <Text as="span" color={sortField === 'rooms_count' ? "inherit" : "gray.400"}>{sortField === 'rooms_count' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</Text></Flex>
                  </Th>
                  <Th py={5} fontSize="sm">{t("furniture.active")}</Th>
                  <Th py={5} fontSize="sm" textAlign="center">{t("furniture.action")}</Th>
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
                    <Td py={5} fontWeight="bold" fontSize="md" color={textColor}>
                      {f.name}
                    </Td>

                    {/* CONDITION */}
                    <Td>
                      <Badge
                        colorScheme={getConditionColor(f.condition)}
                        px={4}
                        py={2}
                        borderRadius="full"
                        fontSize="sm"
                        fontWeight="black"
                        letterSpacing="wider"
                        boxShadow="md"
                      >
                        {conditionMap[f.condition] || f.condition}
                      </Badge>
                    </Td>

                    {/* IN ROOMS */}
                    <Td py={5} color={mutedText} fontWeight="bold" fontSize="md">
                      {f.rooms_count > 0 ? t("furniture.rooms_count", { count: f.rooms_count }) : t("furniture.no_rooms")}
                    </Td>

                    {/* ACTIVE TOGGLE */}
                    <Td>
                      <Select
                        size="sm"
                        fontSize="xs"
                        fontWeight="black"
                        w="130px"
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
                            onClick={() => {
                              setViewData(f);
                              onViewOpen();
                            }}
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
            <ModalHeader color={textColor} fontSize="2xl" fontWeight="black" py={6}>
              {isEdit ? t("furniture.edit_title") : t("furniture.add_title")}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl isRequired mb={6}>
                <FormLabel color={mutedText} fontSize="md" fontWeight="black" mb={2}>{t("furniture.furniture_name")}</FormLabel>
                <Input
                  autoFocus
                  placeholder={t("furniture.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  size="lg"
                  fontSize="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </FormControl>

              <FormControl mt={6} isRequired>
                <FormLabel color={mutedText} fontSize="md" fontWeight="black" mb={2}>{t("furniture.condition")}</FormLabel>
                <Select
                  size="lg"
                  fontSize="md"
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
              <Button onClick={onClose} variant="ghost" mr={3} size="lg">
                {t("furniture.cancel")}
              </Button>
              <Button colorScheme="blue" type="submit" isLoading={isSaving} size="lg" fontSize="md" px={8}>
                {isEdit ? t("furniture.update_furniture") : t("furniture.save_furniture")}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} isCentered motionPreset="scale" size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" shadow="2xl">
          <ModalHeader color={textColor} textAlign="center" fontSize="2xl" fontWeight="black" py={6}>
            {t("furniture.details", "Furniture Details")}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            {viewData && (
              <Flex direction="column" gap={6}>
                {/* NAME */}
                <Box>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold" mb={1}>
                    {t("furniture.name", "Furniture Name")}
                  </FormLabel>
                  <Input
                    value={viewData.name}
                    isReadOnly
                    bg={useColorModeValue("gray.100", "whiteAlpha.50")}
                    color={textColor}
                    borderColor={borderColor}
                  />
                </Box>

                {/* STATUS / CONDITION */}
                <Box>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold" mb={1}>
                    {t("furniture.condition", "Condition")}
                  </FormLabel>
                  <Flex
                    px={4}
                    py={2.5}
                    borderRadius="lg"
                    border="1px solid"
                    fontWeight="medium"
                    bg={
                      viewData.condition === "New" || viewData.condition === "Good"
                        ? "green.50"
                        : viewData.condition === "Broken"
                        ? "red.50"
                        : "yellow.50"
                    }
                    borderColor={
                      viewData.condition === "New" || viewData.condition === "Good"
                        ? "green.300"
                        : viewData.condition === "Broken"
                        ? "red.300"
                        : "yellow.300"
                    }
                    color={
                      viewData.condition === "New" || viewData.condition === "Good"
                        ? "green.700"
                        : viewData.condition === "Broken"
                        ? "red.700"
                        : "yellow.700"
                    }
                  >
                    {conditionMap[viewData.condition] || viewData.condition}
                  </Flex>
                </Box>

                {/* ROOMS */}
                <Box>
                  <FormLabel color={mutedText} fontSize="sm" fontWeight="bold" mb={1}>
                    {t("furniture.in_rooms", "Assigned Rooms")}
                  </FormLabel>
                  <Box
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={useColorModeValue("gray.50", "whiteAlpha.50")}
                  >
                    {viewData.rooms && viewData.rooms.length > 0 ? (
                      <Flex wrap="wrap" gap={2}>
                        {viewData.rooms.map((r) => (
                          <Badge key={r.id} colorScheme="blue" px={2} py={1} borderRadius="md">
                            {r.name}
                          </Badge>
                        ))}
                      </Flex>
                    ) : (
                      <Text color={mutedText} fontSize="sm" fontStyle="italic">
                        {t("furniture.no_rooms", "No rooms assigned")}
                      </Text>
                    )}
                  </Box>
                </Box>
              </Flex>
            )}
          </ModalBody>

          <ModalFooter bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderBottomRadius="xl">
            <Button onClick={onViewClose} variant="ghost" mr={3}>
              {t("common.back", "Back")}
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                onViewClose();
                handleOpenModal(viewData);
              }}
            >
              {t("furniture.edit", "Edit Furniture")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== BULK ADD MODAL ===== */}
      <Modal isOpen={isBulkOpen} onClose={onBulkClose} isCentered size="4xl">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="2xl" maxH="95vh" display="flex" flexDirection="column" shadow="2xl">
          <ModalHeader color={textColor} borderBottom="1px solid" borderColor={borderColor} fontSize="2xl" fontWeight="black" py={6}>
            <Flex align="center" gap={3}>
              <Icon as={FiLayers} color="teal.500" />
              <Text>{t("furniture.bulk_add_title", "Add Multiple Furniture")}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={8} pt={6} overflowY="auto" flex="1">
            <Text fontSize="md" fontWeight="bold" color={mutedText} mb={6}>
              {t("furniture.bulk_add_desc", "Add furniture items to the list, then save them all at once.")}
            </Text>

            {pendingFurniture.length === 0 && (
              <Button size="lg" fontSize="md" py={8} onClick={handleAddBulkRow} colorScheme="blue" mb={8} variant="outline" borderStyle="dashed" w="full">
                + {t("furniture.add", "Add Furniture")}
              </Button>
            )}

            {pendingFurniture.map((item, index) => (
              <Box key={item._id} bg={useColorModeValue("gray.50", "#1c2128")} p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} mb={5} shadow="sm">
                <Grid templateColumns={{ base: "1fr", md: "2.5fr 1.5fr auto" }} gap={6} alignItems="end">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="black" color={mutedText} mb={2}>{t("furniture.furniture_name")}</FormLabel>
                    <Input
                      size="lg"
                      fontSize="md"
                      value={item.name}
                      onChange={e => handleBulkRowChange(item._id, "name", e.target.value)}
                      borderColor={borderColor}
                      bg={useColorModeValue("white", "#0d1117")}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="black" color={mutedText} mb={2}>{t("furniture.condition")}</FormLabel>
                    <Select
                      size="lg"
                      fontSize="md"
                      value={item.condition}
                      onChange={e => handleBulkRowChange(item._id, "condition", e.target.value)}
                      borderColor={borderColor}
                      bg={useColorModeValue("white", "#0d1117")}
                    >
                      <option value="New">{t("furniture.condition_new")}</option>
                      <option value="Good">{t("furniture.condition_good")}</option>
                      <option value="Fair">{t("furniture.condition_fair")}</option>
                      <option value="Broken">{t("furniture.condition_broken")}</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" visibility="hidden">Actions</FormLabel>
                    <Flex gap={2}>
                      {index === 0 && (
                        <Tooltip label={t("furniture.bulk_add_row", "Add Another Item")} hasArrow>
                          <Button size="lg" colorScheme="blue" onClick={handleAddBulkRow} px={6}>
                            <FiPlus />
                          </Button>
                        </Tooltip>
                      )}
                      {index > 0 && (
                        <Tooltip label={t("furniture.bulk_remove_row", "Remove this Item")} hasArrow>
                          <Button size="lg" colorScheme="red" variant="ghost" onClick={() => handleRemoveBulkRow(item._id)} px={6}>
                            <FiMinus />
                          </Button>
                        </Tooltip>
                      )}
                    </Flex>
                  </FormControl>
                </Grid>
              </Box>
            ))}
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor={borderColor} py={6} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderBottomRadius="2xl">
            <Flex w="100%" justify="space-between" align="center">
              <Text fontSize="md" fontWeight="black" color={textColor}>
                {pendingFurniture.length} {t("furniture.bulk_items", "item(s)")}
              </Text>
              <Flex gap={4}>
                <Button onClick={onBulkClose} variant="ghost" size="lg" fontSize="md">{t("furniture.cancel")}</Button>
                <Button
                  colorScheme="teal"
                  size="lg"
                  fontSize="md"
                  px={10}
                  onClick={handleSaveBulk}
                  isLoading={isSavingBulk}
                  isDisabled={pendingFurniture.length === 0}
                  leftIcon={<FiLayers />}
                  shadow="lg"
                >
                  {t("furniture.bulk_save", "Save All")}
                </Button>
              </Flex>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}
