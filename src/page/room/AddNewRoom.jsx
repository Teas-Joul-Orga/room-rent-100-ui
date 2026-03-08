import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  Image,
  Checkbox,
  IconButton,
  Icon,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
import { FiX, FiPlus, FiImage } from "react-icons/fi";

export default function AddNewRoom() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(false);
  const [fetchingFurniture, setFetchingFurniture] = useState(true);

  const [photos, setPhotos] = useState([]); // [{ file, preview }]
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_rent_price: "",
    size: "",
    status: "available",
  });

  const [allFurniture, setAllFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState([]);

  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/admin/furniture?limit=all", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          // API might return { data: [...] } or just [...]
          const items = Array.isArray(data) ? data : data.data || [];
          setAllFurniture(items.filter(f => !f.deleted_at));
        }
      } catch (err) {
        console.error("Failed to fetch furniture", err);
      } finally {
        setFetchingFurniture(false);
      }
    };
    fetchFurniture();
  }, [token]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (photos.length < 5) { // Arbitrary limit
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos((prev) => {
            if (prev.length < 5) {
              return [...prev, { file, preview: reader.result }];
            }
            return prev;
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Maximum 5 photos allowed");
      }
    });
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(photos.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name || !form.base_rent_price) {
      toast.error("Room name and base rent are required");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("base_rent_price", form.base_rent_price);
    formData.append("status", form.status);
    if (form.description) formData.append("description", form.description);
    if (form.size) formData.append("size", form.size);

    // Append Furniture IDs
    selectedFurniture.forEach((id, index) => {
      formData.append(`furniture[${index}]`, id);
    });

    // Append Photos
    photos.forEach((p, index) => {
      formData.append(`photos[${index}]`, p.file);
    });

    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Room created successfully");
        setTimeout(() => navigate("/dashboard/rooms"), 800);
      } else {
        if (data.errors) {
          Object.values(data.errors).forEach(errArray => {
            errArray.forEach(err => toast.error(err));
          });
        } else {
          toast.error(data.error || "Failed to create room");
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("A network error occurred.");
      setIsLoading(false);
    }
  };

  // Colors
  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const headerTextColor = useColorModeValue("sky.900", "white");
  const furnitureBg = useColorModeValue("sky.50", "#30363d");
  const furnitureBorder = useColorModeValue("sky.100", "gray.600");

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      
      <Box maxW="10xl" mx="auto" bg={cardBg} borderRadius="2xl" shadow="xl" p={8}>
        {/* HEADER */}
        <Box mb={8}>
          <Heading size="lg" color={headerTextColor} mb={2}>
            Add New Room
          </Heading>
          <Text fontSize="sm" color={mutedText}>
            Fill in the room details, upload photos, and assign available furniture
          </Text>
        </Box>

        <form onSubmit={handleSave}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            
            {/* LEFT: PHOTOS */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>
                Room Photos (Max 5)
              </Text>
              
              <SimpleGrid columns={3} spacing={4}>
                {/* PREVIEWS */}
                {photos.map((p, idx) => (
                  <Box key={idx} position="relative" borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} role="group" h="100px">
                    <Image src={p.preview} alt="upload" w="full" h="full" objectFit="cover" />
                    <Flex
                      position="absolute" inset={0} bg="blackAlpha.600" opacity={0} _groupHover={{ opacity: 1 }} transition="all 0.2s" align="center" justify="center"
                    >
                      <IconButton
                        icon={<FiX />}
                        size="sm"
                        colorScheme="red"
                        isRound
                        onClick={() => removePhoto(idx)}
                        aria-label="Remove photo"
                      />
                    </Flex>
                  </Box>
                ))}

                {/* UPLOAD BUTTON */}
                {photos.length < 5 && (
                  <label>
                    <Flex
                      direction="column" align="center" justify="center" h="100px"
                      border="2px dashed" borderColor="gray.300" borderRadius="xl"
                      cursor="pointer" _hover={{ borderColor: "blue.400", bg: useColorModeValue("gray.50", "whiteAlpha.50") }} transition="all 0.2s"
                      color="gray.400"
                    >
                      <Icon as={FiImage} boxSize={6} mb={1} />
                      <Text fontSize="xs" fontWeight="medium">Add Photo</Text>
                    </Flex>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />
                  </label>
                )}
              </SimpleGrid>
            </Box>

            {/* RIGHT: DETAILS */}
            <Box>
              <Box mb={5}>
                <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Room Name *</Text>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Room A1"
                  size="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </Box>

              <SimpleGrid columns={2} spacing={4} mb={5}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Base Rent ($) *</Text>
                  <Input
                    type="number"
                    value={form.base_rent_price}
                    onChange={(e) => setForm({ ...form, base_rent_price: e.target.value })}
                    placeholder="120"
                    size="md"
                    borderColor={borderColor}
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Size (optional)</Text>
                  <Input
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    placeholder="e.g. 5m x 5m"
                    size="md"
                    borderColor={borderColor}
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                </Box>
              </SimpleGrid>

              <Box mb={5}>
                <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Status</Text>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  size="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                >
                  <option value="available">Available (Free)</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </Select>
              </Box>
            </Box>

            {/* BOTTOM: DESCRIPTION */}
            <Box gridColumn={{ md: "span 2" }}>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={1}>Description (optional)</Text>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details about the room..."
                borderColor={borderColor}
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                resize="none"
              />
            </Box>
          </SimpleGrid>

          {/* FURNITURE SECTION */}
          <Box bg={furnitureBg} border="1px solid" borderColor={furnitureBorder} borderRadius="2xl" p={6} mt={8}>
            <Heading size="sm" color={headerTextColor} mb={1}>Assign Furniture</Heading>
            <Text fontSize="sm" color={mutedText} mb={4}>Select items included in this room</Text>

            {fetchingFurniture ? (
              <Flex justify="center" py={4}>
                <Spinner color="blue.500" />
              </Flex>
            ) : allFurniture.length === 0 ? (
              <Text fontSize="sm" color={mutedText} fontStyle="italic">No furniture available in inventory.</Text>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                {allFurniture.map((f) => {
                  const checked = selectedFurniture.includes(f.id);
                  return (
                    <Flex
                      as="label"
                      key={f.id}
                      align="center"
                      gap={3}
                      p={3}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={checked ? "blue.400" : borderColor}
                      bg={checked ? useColorModeValue("white", "#161b22") : "transparent"}
                      shadow={checked ? "sm" : "none"}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: "blue.300", bg: useColorModeValue("white", "#161b22") }}
                    >
                      <Checkbox
                        isChecked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFurniture([...selectedFurniture, f.id]);
                          } else {
                            setSelectedFurniture(selectedFurniture.filter((id) => id !== f.id));
                          }
                        }}
                        colorScheme="blue"
                      />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>{f.name}</Text>
                        <Text fontSize="xs" color={mutedText}>{f.type}</Text>
                      </Box>
                    </Flex>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>

          {/* ACTIONS */}
          <Flex justify="flex-end" gap={4} mt={8} pt={6} borderTop="1px solid" borderColor={borderColor}>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/rooms")}
              color={textColor}
              borderColor={borderColor}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Saving..."
              px={8}
            >
              Save Room
            </Button>
          </Flex>

        </form>
      </Box>
    </Box>
  );
}
