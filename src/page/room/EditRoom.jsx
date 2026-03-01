import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  
  // existing photos that already exist on the server
  const [existingPhotos, setExistingPhotos] = useState([]); // [{ id, path }]
  
  // new photos the user wants to upload this session
  const [newPhotos, setNewPhotos] = useState([]); // [{ file, preview }]
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_rent_price: "",
    size: "",
    status: "available",
  });

  const [allFurniture, setAllFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState([]);

  // Fetch Existing Room & Global Furniture list
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Fetch Room Data
        const roomRes = await fetch(`http://localhost:8000/api/v1/admin/rooms/${id}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
        });
        
        if (!roomRes.ok) {
          toast.error("Failed to load room data");
          setIsFetchingInitial(false);
          return;
        }

        const roomData = await roomRes.json();
        const r = roomData.room;

        setForm({
          name: r.name || "",
          description: r.description || "",
          base_rent_price: r.base_rent_price || "",
          size: r.size || "",
          status: r.status || "available",
        });

        if (r.images) {
           setExistingPhotos(r.images);
        }

        if (r.furniture) {
           setSelectedFurniture(r.furniture.map(f => f.id));
        }

        // 2. Fetch Global Furniture List
        const furnRes = await fetch("http://localhost:8000/api/v1/admin/furniture?limit=all", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
        });

        if (furnRes.ok) {
           const fData = await furnRes.json();
           const items = Array.isArray(fData) ? fData : fData.data || [];
           setAllFurniture(items.filter(f => !f.deleted_at));
        }

      } catch (err) {
        console.error(err);
        toast.error("Network error fetching data");
      } finally {
        setIsFetchingInitial(false);
      }
    };

    fetchInitialData();
  }, [id, token]);

  // Handlers for New Photo Uploads
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // total photos = existing + new
    files.forEach((file) => {
      if (existingPhotos.length + newPhotos.length < 5) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewPhotos((prev) => {
            if (existingPhotos.length + prev.length < 5) {
              return [...prev, { file, preview: reader.result }];
            }
            return prev;
          });
        };
        reader.readAsDataURL(file);
      } else {
         toast.error("Maximum 5 photos allowed total");
      }
    });
  };

  const removeNewPhoto = (indexToRemove) => {
    setNewPhotos(newPhotos.filter((_, idx) => idx !== indexToRemove));
  };


  // Server Update
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!form.name || !form.base_rent_price) {
      toast.error("Room name and base rent are required");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("_method", "PUT"); // Laravel trick to send via POST
    
    formData.append("name", form.name);
    formData.append("base_rent_price", form.base_rent_price);
    formData.append("status", form.status);
    formData.append("description", form.description || "");
    formData.append("size", form.size || "");

    selectedFurniture.forEach((fId, index) => {
      formData.append(`furniture[${index}]`, fId);
    });

    newPhotos.forEach((p, index) => {
      formData.append(`photos[${index}]`, p.file);
    });

    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/rooms/${id}`, {
        method: "POST", // sending as POST because of multipart/form-data with _method=PUT
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Room updated successfully");
        setTimeout(() => navigate("/dashboard/rooms"), 800);
      } else {
        if (data.errors) {
          Object.values(data.errors).forEach(errArray => {
            errArray.forEach(err => toast.error(err));
          });
        } else {
          toast.error(data.error || "Failed to update room");
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("A network error occurred.");
      setIsLoading(false);
    }
  };


  // UI Colors
  const bg = useColorModeValue("sky.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerTextColor = useColorModeValue("sky.900", "white");
  const furnitureBg = useColorModeValue("sky.50", "gray.700");
  const furnitureBorder = useColorModeValue("sky.100", "gray.600");

  if (isFetchingInitial) {
    return (
      <Flex justify="center" align="center" h="100vh" bg={bg}>
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      
      <Box maxW="10xl" mx="auto" bg={cardBg} borderRadius="2xl" shadow="xl" p={8}>
        {/* HEADER */}
        <Box mb={8}>
          <Heading size="lg" color={headerTextColor} mb={2}>
            Edit Room Information
          </Heading>
          <Text fontSize="sm" color={mutedText}>
            Update details, attach additional photos, and modify furniture assignments
          </Text>
        </Box>

        <form onSubmit={handleUpdate}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            
            {/* LEFT: PHOTOS */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>
                Room Photos (Max 5 Total)
              </Text>
              
              <SimpleGrid columns={3} spacing={4}>
                
                {/* EXISTING SERVER PHOTOS (read-only in this simple update context unless backend supports targeted delete) */}
                {existingPhotos.map((img) => (
                  <Box key={img.id} position="relative" borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} h="100px">
                    <Image src={`http://localhost:8000/storage/${img.path}`} alt="existing" w="full" h="full" objectFit="cover" />
                    <Flex position="absolute" top={1} right={1}>
                       {/* Note: In a full production app you would hook this to a DELETE /images endpoint */}
                       <Text fontSize="10px" fontWeight="black" bg="blackAlpha.700" color="white" px={2} py={0.5} borderRadius="md">EXISTING</Text>
                    </Flex>
                  </Box>
                ))}

                {/* NEW PREVIEWS IN SESSION */}
                {newPhotos.map((p, idx) => (
                  <Box key={`new-${idx}`} position="relative" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="blue.400" shadow="sm" role="group" h="100px">
                    <Image src={p.preview} alt="upload" w="full" h="full" objectFit="cover" />
                    <Flex position="absolute" inset={0} bg="blackAlpha.600" opacity={0} _groupHover={{ opacity: 1 }} transition="all 0.2s" align="center" justify="center">
                      <IconButton icon={<FiX />} size="sm" colorScheme="red" isRound onClick={() => removeNewPhoto(idx)} aria-label="Remove photo" />
                    </Flex>
                  </Box>
                ))}

                {/* UPLOAD BUTTON */}
                {(existingPhotos.length + newPhotos.length) < 5 && (
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

             {allFurniture.length === 0 ? (
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
                      bg={checked ? useColorModeValue("white", "gray.800") : "transparent"}
                      shadow={checked ? "sm" : "none"}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: "blue.300", bg: useColorModeValue("white", "gray.800") }}
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
              loadingText="Updating..."
              px={8}
            >
              Update Room
            </Button>
          </Flex>

        </form>
      </Box>
    </Box>
  );
}
