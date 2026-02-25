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

export default function Furniture() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [furniture, setFurniture] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ uid: null, name: "", condition: "Good" });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination (Frontend mock for now, API can supply limit=100)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); 

  const bg = useColorModeValue("sky.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("sky.100", "gray.700");
  const hoverBg = useColorModeValue("sky.50", "gray.700");

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
      toast.error("Failed to load furniture");
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
        if (res.ok) toast.success("Furniture disabled successfully");
        else toast.error("Failed to disable furniture");
      } else {
        const res = await fetch(`http://localhost:8000/api/v1/admin/furniture/${f.uid}/restore`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) toast.success("Furniture enabled successfully");
        else toast.error("Failed to enable furniture");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error");
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
      toast.error("Furniture name is required.");
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
        toast.success(isEdit ? "Furniture updated successfully" : "Furniture added successfully");
        onClose();
        fetchFurniture();
      } else {
        toast.error(data.message || "Failed to save furniture");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = [...furniture]
    .filter((f) => (f?.name || "").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginated = filtered.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

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
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">
        <Flex direction={{ base: "column", sm: "row" }} align={{ sm: "center" }} justify="space-between" gap={4} mb={6}>
          <Heading size="lg" color={useColorModeValue("sky.900", "white")}>
            Furniture Inventory
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => handleOpenModal()}
            shadow="sm"
          >
            Add Furniture
          </Button>
        </Flex>

        {/* ===== SEARCH ===== */}
        <Box bg={cardBg} p={4} borderRadius="xl" shadow="sm" mb={6}>
          <Input
            placeholder="Search furniture by name..."
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
        <TableContainer bg={cardBg} borderRadius="xl" shadow="sm" mb={4}>
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>Name</Th>
                <Th>Condition</Th>
                <Th>In Rooms</Th>
                <Th>Active</Th>
                <Th textAlign="center">Action</Th>
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
                        {f.condition}
                      </Badge>
                    </Td>

                    {/* IN ROOMS */}
                    <Td color={mutedText} fontWeight="semibold">
                      {f.rooms_count > 0 ? `${f.rooms_count} Room(s)` : "—"}
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
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </Select>
                    </Td>

                    {/* ACTION */}
                    <Td>
                      <Flex justify="center" gap={2}>
                        <Tooltip label="View Furniture" hasArrow>
                          <IconButton
                            icon={<FiEye />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => navigate(`/dashboard/furniture/viewfurniture/${f.uid}`)}
                            aria-label="View furniture"
                          />
                        </Tooltip>
                        <Tooltip label="Edit Furniture" hasArrow>
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleOpenModal(f)}
                            aria-label="Edit furniture"
                          />
                        </Tooltip>
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={10} color={mutedText}>
                    No furniture found matching your search.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4}>
            <Text fontSize="sm" color={mutedText}>
              Showing {firstIndex + 1} to {Math.min(lastIndex, filtered.length)} of {filtered.length} entries
            </Text>
            <Flex gap={2}>
              <Button
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)}
                isDisabled={currentPage === 1}
              >
                Prev
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
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>

      {/* ===== ADD/EDIT MODAL ===== */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="scale">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" shadow="2xl">
          <form onSubmit={handleSave}>
            <ModalHeader color={textColor}>
              {isEdit ? "Edit Furniture" : "Add New Furniture"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl isRequired mb={4}>
                <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Furniture Name</FormLabel>
                <Input
                  autoFocus
                  placeholder="e.g. Bed, Wardrobe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </FormControl>

              <FormControl mt={4} isRequired>
                <FormLabel color={mutedText} fontSize="sm" fontWeight="bold">Condition</FormLabel>
                <Select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Broken">Broken</option>
                </Select>
              </FormControl>
            </ModalBody>

            <ModalFooter bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderBottomRadius="xl">
              <Button onClick={onClose} variant="ghost" mr={3}>
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit" isLoading={isSaving}>
                {isEdit ? "Update" : "Save"} Furniture
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </Box>
  );
}
