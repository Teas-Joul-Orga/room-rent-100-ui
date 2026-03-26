import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Image,
  Grid,
  GridItem,
  Button,
  Spinner,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  IconButton, Tooltip, FormControl, FormLabel, Input, Select, Textarea, ModalHeader, ModalFooter, Divider, SimpleGrid, Tabs, TabList, TabPanels, Tab, TabPanel, Checkbox, VStack, HStack
} from "@chakra-ui/react";
import { FiEdit2, FiUser, FiPhone, FiCalendar, FiUsers, FiHome, FiDollarSign, FiClock, FiArrowLeft, FiZap, FiDroplet, FiImage, FiPlus, FiCreditCard } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import RecordPaymentModal from "../../components/RecordPaymentModal";

const API = "http://localhost:8000/api/v1/admin";

export default function ViewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activePhoto, setActivePhoto] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Pay Modal State
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const [payTarget, setPayTarget] = useState(null);

  // Add Utility Modal State
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const [addForm, setAddForm] = useState({
    type: "electricity", amount: "", due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: "unpaid", description: "", previous_reading: "", current_reading: "", cost_per_unit: "", payment_method: "cash",
    isReadingOnly: false
  });
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  const isMetered = ["electricity", "water"].includes(addForm.type);
  const usage = isMetered ? Math.max(0, Number(addForm.current_reading || 0) - Number(addForm.previous_reading || 0)) : 0;

  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  
  // Header Colors
  const headerTextColor = useColorModeValue("sky.900", "white");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const fetchRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/rooms/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await res.json();
      if (res.ok) {
        setData(result);
      }
    } catch (err) {
      console.error("Error fetching room", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const getDefaultRate = (type) => {
    const rawUSD = type === "electricity" ? localStorage.getItem("utility_rate_electricity") : type === "water" ? localStorage.getItem("utility_rate_water") : null;
    if (!rawUSD) return "";
    const c = localStorage.getItem("currency") || "$";
    if (c === "៛" || c === "KHR" || c === "Riel") {
      const rate = Number(localStorage.getItem("exchangeRate") || 4000);
      return (Number(rawUSD) * rate).toFixed(0);
    }
    return rawUSD;
  };

  const toUSD = (n) => {
    const c = localStorage.getItem("currency") || "$";
    const num = Number(n || 0);
    if (c === "៛" || c === "KHR" || c === "Riel") {
      const r = Number(localStorage.getItem("exchangeRate") || 4000);
      return (num / r).toFixed(2);
    }
    return num;
  };

  const formatCurrency = (amount) => {
    const c = localStorage.getItem("currency") || "$";
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    const num = Number(amount || 0);

    if (c === "៛" || c === "KHR" || c === "Riel") {
      return `៛${Math.round(num * r).toLocaleString()}`;
    }
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const fetchReading = async (roomId, type) => {
    if (!roomId || !["electricity", "water"].includes(type)) return;
    
    // First, use the data already in the room object (synced from DB)
    if (data?.room) {
      const baseValue = type === "electricity" ? data.room.electricity_reading : data.room.water_reading;
      setAddForm(prev => ({ ...prev, previous_reading: baseValue || 0 }));
    }

    // Then, optionally refresh from the dedicated API which now also pulls from the room
    try {
      const res = await fetch(`${API}/utility-bills/last-reading/${roomId}?type=${type}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const d = await res.json();
        setAddForm(prev => ({ ...prev, previous_reading: d.reading || 0 }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isAddOpen && data?.room) {
      fetchReading(data.room.id, addForm.type);
    }
  }, [isAddOpen, addForm.type, data]);

  useEffect(() => {
    if (isMetered && addForm.cost_per_unit) {
      const amt = (usage * Number(addForm.cost_per_unit)).toFixed(2);
      setAddForm(prev => ({ ...prev, amount: amt }));
    }
  }, [usage, addForm.cost_per_unit, addForm.type]);

  if (isLoading)
    return (
      <Flex justify="center" align="center" h="100vh" bg={bg}>
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );

  if (!data || !data.room)
    return (
      <Box p={6} textAlign="center" color="gray.500">
        Room not found
      </Box>
    );

  const { room, utilityStats } = data;
  const assignedFurniture = room.furniture || [];
  const roomImages = room.images || [];
  const lastLease = room.leases && room.leases.length > 0 ? room.leases[room.leases.length - 1] : null;
  const activeLease = lastLease && lastLease.status === 'active' ? lastLease : null;

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (isMetered && Number(addForm.current_reading) < Number(addForm.previous_reading)) {
      toast.error("Current reading cannot be lower than previous reading");
      return;
    }
    if (!addForm.type || (!addForm.isReadingOnly && !addForm.amount)) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSavingAdd(true);
    try {
      const res = await fetch(`${API}/utility-bills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          ...addForm,
          room_id: room.id,
          previous_reading: addForm.previous_reading === "" ? null : Number(addForm.previous_reading),
          current_reading: addForm.current_reading === "" ? null : Number(addForm.current_reading),
          amount: addForm.isReadingOnly ? 0 : Number(toUSD(addForm.amount)),
          cost_per_unit: addForm.isReadingOnly ? 0 : Number(toUSD(addForm.cost_per_unit)),
          due_date: addForm.isReadingOnly ? new Date().toISOString().split('T')[0] : addForm.due_date,
        }),
      });
      if (res.ok) {
        toast.success("Utility bill added successfully");
        onAddClose();
        fetchRoom(); // Refresh room data
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to add bill");
      }
    } catch (e) { toast.error("Network error"); }
    finally { setIsSavingAdd(false); }
  };

  const openAddUtility = () => {
    const isVacant = !activeLease;
    setAddForm(prev => ({ 
      ...prev, 
      cost_per_unit: getDefaultRate(prev.type), 
      amount: "",
      isReadingOnly: isVacant,
      status: isVacant ? "paid" : "unpaid"
    }));
    onAddOpen();
  };

  const handleOpenGallery = (path) => {
    setActivePhoto(`http://localhost:8000/storage/${path}`);
    onOpen();
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1));
  };

  const goToImage = (e, index) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">
        {/* HEADER */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ sm: "center" }}
          mb={8}
          gap={4}
        >
          <Flex align="center" gap={3}>
            <IconButton
              icon={<FiArrowLeft />}
              size="sm"
              variant="ghost"
              onClick={() => navigate("/dashboard/rooms")}
              aria-label="Back"
            />
            <Heading size="lg" color={headerTextColor}>
              Room Details: {room.name}
            </Heading>
          </Flex>
          <Button
            size="sm"
            colorScheme="blue"
            variant="solid"
            leftIcon={<FiEdit2 />}
            shadow="sm"
            onClick={() => navigate(`/dashboard/rooms/edit/${room.uid}`)}
          >
            Edit Room
          </Button>
        </Flex>

        {/* Top KPI Gradient Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={6} mb={8}>
          {/* Card 1: Room Details */}
          <Box bgGradient="linear(to-br, orange.400, orange.600)" color="white" p={6} borderRadius="2xl" shadow="md" position="relative" overflow="hidden">
            <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="whiteAlpha.200" borderRadius="full" />
            <Flex align="center" gap={2} mb={4} opacity={0.9}>
              <Icon as={FiHome} />
              <Text fontSize="sm" fontWeight="medium">Room Number</Text>
            </Flex>
            <Heading size="xl" mb={1} letterSpacing="tight">{room.name}</Heading>
            <Text fontSize="xs" opacity={0.9} mb={3}>{room.size || "Standard"}</Text>
            <Badge colorScheme={room.status === "available" ? "green" : room.status === "occupied" ? "blue" : "orange"} variant="solid" bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="xs" textTransform="capitalize">
              {room.status}
            </Badge>
          </Box>

          {/* Card 2: Rent */}
          <Box bgGradient="linear(to-br, purple.500, purple.700)" color="white" p={6} borderRadius="2xl" shadow="md" position="relative" overflow="hidden">
            <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="whiteAlpha.200" borderRadius="full" />
            <Flex align="center" gap={2} mb={4} opacity={0.9}>
              <Icon as={FiDollarSign} />
              <Text fontSize="sm" fontWeight="medium">Monthly Rent</Text>
            </Flex>
            <Heading size="xl" mb={1} letterSpacing="tight">{formatCurrency(room.base_rent_price)}</Heading>
            <Text fontSize="xs" opacity={0.9}>Lease rent per month</Text>
          </Box>

          {/* Card 3: Current Tenant */}
          <Box bgGradient="linear(to-br, blue.400, blue.600)" color="white" p={6} borderRadius="2xl" shadow="md" position="relative" overflow="hidden">
            <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="whiteAlpha.200" borderRadius="full" />
            <Flex align="center" gap={2} mb={4} opacity={0.9}>
              <Icon as={FiUsers} />
              <Text fontSize="sm" fontWeight="medium">Current Tenant</Text>
            </Flex>
            <Heading size="lg" mb={1} letterSpacing="tight" noOfLines={1}>{activeLease?.tenant?.name || "Vacant"}</Heading>
            {activeLease ? (
              <Text fontSize="xs" opacity={0.9} noOfLines={1}>{activeLease.tenant?.phone_number || activeLease.tenant?.email || "No contact info"}</Text>
            ) : (
              <Text fontSize="xs" opacity={0.9}>No active lease found.</Text>
            )}
          </Box>

          {/* Card 4: Occupancy */}
          <Box bgGradient="linear(to-br, pink.500, pink.600)" color="white" p={6} borderRadius="2xl" shadow="md" position="relative" overflow="hidden">
            <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="whiteAlpha.200" borderRadius="full" />
            <Flex align="center" gap={2} mb={4} opacity={0.9}>
              <Icon as={FiClock} />
              <Text fontSize="sm" fontWeight="medium">Occupancy Since</Text>
            </Flex>
            <Heading size="lg" mb={1} letterSpacing="tight">{activeLease ? new Date(activeLease.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</Heading>
            <Text fontSize="xs" opacity={0.9}>{activeLease ? "Move-in date" : "Room is waiting for a tenant"}</Text>
          </Box>
        </SimpleGrid>

        {/* Nav Tabs */}
        <Tabs variant="soft-rounded" colorScheme="gray" isLazy mb={8}>
          <Box bg={cardBg} p={2} borderRadius="xl" shadow="sm" border="1px" borderColor={borderColor} mb={6}>
            <TabList gap={2} overflowX="auto" overflowY="hidden" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
              <Tab fontSize="sm" fontWeight="bold" color={mutedText} _selected={{ color: textColor, bg: hoverBg }} px={6} py={3} borderRadius="lg">
                Information
              </Tab>
              <Tab fontSize="sm" fontWeight="bold" color={mutedText} _selected={{ color: textColor, bg: hoverBg }} px={6} py={3} borderRadius="lg">
                Contract
              </Tab>
              <Tab fontSize="sm" fontWeight="bold" color={mutedText} _selected={{ color: textColor, bg: hoverBg }} px={6} py={3} borderRadius="lg">
                Billing & Meters
              </Tab>
              <Tab fontSize="sm" fontWeight="bold" color={mutedText} _selected={{ color: textColor, bg: hoverBg }} px={6} py={3} borderRadius="lg">
                Services & Inventory
              </Tab>
            </TabList>
          </Box>

          <TabPanels>
            {/* ===== INFORMATION TAB ===== */}
            <TabPanel px={0} pt={0}>
              <Grid templateColumns={{ base: "1fr", xl: "7fr 3fr" }} gap={6}>
                {/* Left Column: Info & Photos */}
                <Flex direction="column" gap={6}>
                  {/* General Info */}
                  <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor}>
                    <Flex justify="space-between" align="center" mb={6}>
                       <Text fontSize="md" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight">General Information</Text>
                    </Flex>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <Box>
                         <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="wider" mb={1}>Room Number</Text>
                         <Text fontSize="md" fontWeight="bold" color={textColor}>{room.name}</Text>
                      </Box>
                      <Box>
                         <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="wider" mb={1}>Floor / Area</Text>
                         <Text fontSize="md" fontWeight="bold" color={textColor}>{room.size || "Unknown"}</Text>
                      </Box>
                      <Box>
                         <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="wider" mb={1}>Type</Text>
                         <Text fontSize="md" fontWeight="bold" color={textColor}>Standard</Text>
                      </Box>
                      <Box>
                         <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase" letterSpacing="wider" mb={1}>Status</Text>
                         <Badge colorScheme={room.status === "available" ? "green" : room.status === "occupied" ? "blue" : "orange"} borderRadius="full" px={3} py={1} textTransform="capitalize">
                           {room.status}
                         </Badge>
                      </Box>
                    </Grid>
                  </Box>

                  {/* Room Photos */}
                  <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor}>
                    <Text fontSize="md" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight" mb={6}>Room Photos</Text>
                    <Box>
                      {roomImages.length > 0 ? (
                        <Flex direction="column" gap={4}>
                          <Box position="relative" cursor="zoom-in" onClick={() => handleOpenGallery(roomImages[currentImageIndex].path)} overflow="hidden" borderRadius="xl" shadow="sm">
                            <Image src={`http://localhost:8000/storage/${roomImages[currentImageIndex].path}`} alt="Main" w="full" h={{ base: "250px", md: "400px" }} objectFit="cover" transition="all 0.3s" _hover={{ transform: "scale(1.02)" }} />
                          </Box>
                          {roomImages.length > 1 && (
                            <Grid templateColumns="repeat(4, 1fr)" gap={3}>
                              {roomImages.map((img, idx) => (
                                <GridItem key={img.id}>
                                  <Box cursor="pointer" onClick={(e) => goToImage(e, idx)} overflow="hidden" borderRadius="lg" border="2px solid" borderColor={currentImageIndex === idx ? "blue.500" : "transparent"} opacity={currentImageIndex === idx ? 1 : 0.6} transition="all 0.3s" _hover={{ opacity: 1 }}>
                                    <Image src={`http://localhost:8000/storage/${img.path}`} alt="Thumbnail" w="full" h="80px" objectFit="cover" />
                                  </Box>
                                </GridItem>
                              ))}
                            </Grid>
                          )}
                        </Flex>
                      ) : (
                        <Flex w="full" h="200px" bg="gray.50" borderRadius="xl" border="2px dashed" borderColor="gray.200" align="center" justify="center" direction="column" color="gray.400">
                          <Icon as={FiImage} boxSize={8} mb={2} color="gray.300" />
                          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">No images uploaded</Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>

                  {/* Description */}
                  <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor}>
                    <Text fontSize="md" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="tight" mb={4}>Description</Text>
                    <Text color={mutedText} fontStyle="italic" lineHeight="tall">
                      {room.description || "None listed"}
                    </Text>
                  </Box>
                </Flex>

                {/* Right Column: Profile Card */}
                <Flex direction="column" gap={6}>
                  <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor} textAlign="center">
                    {activeLease ? (
                      <>
                        <Box display="inline-block" p={1} borderRadius="full" border="2px dashed" borderColor="gray.300" mb={4}>
                          <Box position="relative" w="120px" h="120px" bg="gray.900" color="white" borderRadius="full" overflow="hidden" display="flex" alignItems="center" justifyContent="center" shadow="md">
                             {activeLease.tenant?.photo_path ? (
                               <Image src={`http://localhost:8000/storage/${activeLease.tenant.photo_path}`} w="full" h="full" objectFit="cover" />
                             ) : (
                               <Text fontSize="4xl" fontWeight="bold">{activeLease.tenant?.name ? activeLease.tenant.name.substring(0, 2).toUpperCase() : "U"}</Text>
                             )}
                          </Box>
                        </Box>
                        <Heading size="md" color={textColor} mb={2} letterSpacing="tight">{activeLease.tenant?.name || "Unknown"}</Heading>
                        <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full" mb={8}>Active Tenant</Badge>

                        <Flex direction="column" gap={4} textAlign="left" px={2}>
                          <Flex align="center" gap={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
                            <Icon as={FiPhone} color={mutedText} boxSize={4} />
                            <Text fontSize="sm" color={textColor} fontWeight="medium">{activeLease.tenant?.phone_number || "N/A"}</Text>
                          </Flex>
                          <Flex align="center" gap={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
                            <Icon as={FiUser} color={mutedText} boxSize={4} />
                            <Text fontSize="sm" color={textColor} fontWeight="medium">{activeLease.tenant?.email || "N/A"}</Text>
                          </Flex>
                          <Flex align="center" gap={4} py={3}>
                            <Icon as={FiCalendar} color={mutedText} boxSize={4} />
                            <Text fontSize="sm" color={textColor} fontWeight="medium">Since {new Date(activeLease.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
                          </Flex>
                        </Flex>
                      </>
                    ) : (
                      <Box py={10}>
                        <Icon as={FiUser} boxSize={12} color="gray.300" mb={4} />
                        <Text color={textColor} fontWeight="bold" mb={2}>Room is Vacant</Text>
                        <Text fontSize="sm" color="gray.400">No active tenant currently signed to this room.</Text>
                      </Box>
                    )}
                  </Box>

                  {/* Meter Readings Card */}
                  <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor}>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={6} textAlign="left">
                      Current Meter Snapshots
                    </Text>
                    <VStack align="stretch" spacing={4}>
                      <Flex justify="space-between" align="center">
                        <HStack spacing={3}>
                          <Box p={2} bg="yellow.50" color="yellow.600" borderRadius="lg" _dark={{ bg: "yellow.900/30", color: "yellow.200" }}>
                            <Icon as={FiZap} boxSize={4} />
                          </Box>
                          <Text fontSize="sm" fontWeight="bold">Electricity</Text>
                        </HStack>
                        <Text fontSize="md" fontWeight="black" color="yellow.600" _dark={{ color: "yellow.200" }}>{room.electricity_reading || 0} kWh</Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <HStack spacing={3}>
                          <Box p={2} bg="blue.50" color="blue.600" borderRadius="lg" _dark={{ bg: "blue.900/30", color: "blue.200" }}>
                            <Icon as={FiDroplet} boxSize={4} />
                          </Box>
                          <Text fontSize="sm" fontWeight="bold">Water</Text>
                        </HStack>
                        <Text fontSize="md" fontWeight="black" color="blue.600" _dark={{ color: "blue.200" }}>{room.water_reading || 0} m³</Text>
                      </Flex>
                      <Divider borderColor={borderColor} />
                      <Text fontSize="10px" color="gray.400" fontStyle="italic" textAlign="left" pt={1}>
                        Auto-updates after every billing cycle or manual meter scan.
                      </Text>
                    </VStack>
                  </Box>
                </Flex>
              </Grid>
            </TabPanel>

            {/* ===== CONTRACT TAB ===== */}
            <TabPanel px={0} pt={0}>
              <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor} h="full">
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={6}>Tenancy History</Text>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Tenant</Th>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Period</Th>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest" isNumeric>Rent</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {room.leases && room.leases.length > 0 ? (
                        room.leases.map((lease) => (
                          <Tr key={lease.id} _hover={{ bg: hoverBg }}>
                            <Td py={4}>
                              <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                                {lease.tenant?.name || "Unknown"}
                              </Text>
                              <Text fontSize="xs" fontWeight="bold" color={mutedText}>
                                {lease.tenant?.email}
                              </Text>
                            </Td>
                            <Td py={4}>
                              <Text fontSize="xs" fontWeight="medium" color={mutedText}>
                                {new Date(lease.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  -  {new Date(lease.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </Text>
                            </Td>
                            <Td py={4} isNumeric>
                              <Text fontSize="sm" fontWeight="black" color={textColor}>
                                {formatCurrency(lease.rent_amount)}
                              </Text>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={3} textAlign="center" py={10} fontStyle="italic" color={mutedText}>
                            No historical lease data available.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== BILLING TAB ===== */}
            <TabPanel px={0} pt={0}>
              <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor}>
                <Flex justify="space-between" align="center" mb={6}>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>Utility Consumption & Bills</Text>
                  <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={openAddUtility}>
                    Add Utility
                  </Button>
                </Flex>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={8}>
                  <Box bg={useColorModeValue("yellow.50", "yellow.900")} p={6} borderRadius="xl" border="1px" borderColor={useColorModeValue("yellow.100", "yellow.800")}>
                    <Flex align="center" justify="space-between" mb={2}>
                      <Text fontSize="xs" fontWeight="black" color={useColorModeValue("yellow.800", "yellow.200")} textTransform="uppercase" letterSpacing="widest">
                        Electricity
                      </Text>
                      <Icon as={FiZap} boxSize={5} color="yellow.500" />
                    </Flex>
                    <Flex align="baseline" gap={2}>
                      <Text fontSize="3xl" fontWeight="black" color={textColor} lineHeight="1">
                        {(utilityStats?.electricity?.total_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color={mutedText}>kWh Total</Text>
                    </Flex>
                    <Text mt={3} fontSize="xs" fontWeight="bold" color="yellow.500">
                      Avg: {(utilityStats?.electricity?.avg_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} kWh / Bill
                    </Text>
                  </Box>

                  <Box bg={useColorModeValue("blue.50", "blue.900")} p={6} borderRadius="xl" border="1px" borderColor={useColorModeValue("blue.100", "blue.800")}>
                    <Flex align="center" justify="space-between" mb={2}>
                      <Text fontSize="xs" fontWeight="black" color={useColorModeValue("blue.800", "blue.200")} textTransform="uppercase" letterSpacing="widest">
                        Water
                      </Text>
                      <Icon as={FiDroplet} boxSize={5} color="blue.500" />
                    </Flex>
                    <Flex align="baseline" gap={2}>
                      <Text fontSize="3xl" fontWeight="black" color={textColor} lineHeight="1">
                        {(utilityStats?.water?.total_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color={mutedText}>m³ Total</Text>
                    </Flex>
                    <Text mt={3} fontSize="xs" fontWeight="bold" color="blue.500">
                      Avg: {(utilityStats?.water?.avg_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} m³ / Bill
                    </Text>
                  </Box>
                </Grid>

                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Date</Th>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Type</Th>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Usage</Th>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest" isNumeric>Amount</Th>
                        <Th color="gray.400" fontSize="2xs" letterSpacing="widest" isNumeric>Status</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {room.utility_bills && room.utility_bills.length > 0 ? (
                        [...room.utility_bills]
                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                          .slice(0, 10)
                          .map((bill) => (
                            <Tr key={bill.id} _hover={{ bg: hoverBg }}>
                              <Td py={3}>
                                <Text fontSize="xs" fontWeight="bold" color={textColor}>
                                  {new Date(bill.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </Text>
                              </Td>
                              <Td py={3}>
                                <Badge fontSize="2xs" px={2} py={0.5} colorScheme={bill.type === "electricity" ? "yellow" : bill.type === "water" ? "blue" : "gray"}>
                                  {bill.type}
                                </Badge>
                              </Td>
                              <Td py={3}>
                                <Text fontSize="xs" fontWeight="medium" color={mutedText}>
                                  {bill.usage} {bill.type === "electricity" ? "kWh" : "m³"}
                                </Text>
                              </Td>
                              <Td py={3} isNumeric>
                                <Text fontSize="xs" fontWeight="black" color={textColor}>
                                  {formatCurrency(bill.amount)}
                                </Text>
                              </Td>
                              <Td py={3} isNumeric>
                                {bill.amount > 0 ? (
                                  <Badge fontSize="2xs" colorScheme={bill.status === "paid" ? "green" : "red"}>
                                    {bill.status}
                                  </Badge>
                                ) : (
                                  <Badge fontSize="2xs" colorScheme="gray" variant="subtle">Reading Only</Badge>
                                )}
                              </Td>
                              <Td py={3} isNumeric>
                                {bill.status === "unpaid" && (
                                  <Tooltip label="Pay Bill" hasArrow>
                                    <IconButton 
                                      icon={<FiCreditCard />} 
                                      size="md" colorScheme="green" variant="ghost" 
                                      onClick={() => {
                                        setPayTarget({
                                          lease_id: bill.lease_id || (activeLease ? activeLease.id : ""),
                                          bill_id: bill.id,
                                          amount: bill.amount,
                                          type: "utility",
                                          notes: `Payment for ${bill.type} bill`
                                        });
                                        onPayOpen();
                                      }} 
                                      aria-label="Pay" 
                                    />
                                  </Tooltip>
                                )}
                              </Td>
                            </Tr>
                          ))
                      ) : (
                        <Tr>
                          <Td colSpan={5} textAlign="center" py={6} fontStyle="italic" fontSize="xs" color={mutedText}>
                            No utility bills recorded.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== INVENTORY TAB ===== */}
            <TabPanel px={0} pt={0}>
              <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor} h="full">
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={6}>Inventory</Text>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                  {assignedFurniture.length > 0 ? (
                    assignedFurniture.map((item) => (
                      <Box key={item.id} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor} bg={bg}>
                        <Flex align="center" justify="space-between">
                          <Text fontSize="sm" fontWeight="bold" color={textColor}>
                            {item.name}
                          </Text>
                          <Badge fontSize="2xs" px={2} py={0.5} bg="gray.100" color="gray.600" borderRadius="md">
                            {item.condition || "Good"}
                          </Badge>
                        </Flex>
                      </Box>
                    ))
                  ) : (
                    <Text fontSize="sm" fontStyle="italic" color={mutedText} py={4}>
                      This room is currently unfurnished.
                    </Text>
                  )}
                </Grid>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <RecordPaymentModal 
        isOpen={isPayOpen} 
        onClose={onPayClose} 
        onSuccess={() => fetchRoom()} 
        initialData={payTarget} 
      />

      {/* ===== ADD UTILITY BILL MODAL ===== */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="2xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSaveBill}>
            <ModalHeader color={textColor} fontSize="lg" fontWeight="black" textTransform="uppercase" letterSpacing="tight">
              Add New Utility Bill for {room.name}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={{ base: 1, md: addForm.isReadingOnly ? 1 : 2 }} spacing={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>1. Bill Type & Pricing</Text>
                  <FormControl isRequired mb={4}>
                    <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Utility Type</FormLabel>
                    <Select size="md" value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value, cost_per_unit: getDefaultRate(e.target.value), amount: "" })}>
                      <option value="electricity">Electricity</option>
                      <option value="water">Water</option>
                      <option value="trash">Trash (Fixed)</option>
                      <option value="internet">Internet (Fixed)</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>

                  {isMetered && (
                    <Box bg={bg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor} mb={4}>
                      <SimpleGrid columns={2} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Previous</FormLabel>
                          <Input size="sm" bg="white" type="number" step="0.01" value={addForm.previous_reading} onChange={e => setAddForm({ ...addForm, previous_reading: e.target.value })} />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Current</FormLabel>
                          <Input size="sm" bg="white" type="number" step="0.01" value={addForm.current_reading} onChange={e => setAddForm({ ...addForm, current_reading: e.target.value })} />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Rate ({localStorage.getItem("currency") || "$"})</FormLabel>
                          <Input size="sm" bg="white" type="number" step="0.01" value={addForm.cost_per_unit} onChange={e => setAddForm({ ...addForm, cost_per_unit: e.target.value })} />
                        </FormControl>
                        <Box display="flex" flexDirection="column" justifyContent="center">
                          <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">Usage</Text>
                          <Text fontWeight="black" fontSize="sm" color="blue.600">{usage.toFixed(2)} units</Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  )}

                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Total Amount</FormLabel>
                      <Input 
                        size="sm" 
                        type="number" 
                        step="0.01" 
                        value={addForm.isReadingOnly ? 0 : addForm.amount} 
                        onChange={e => setAddForm({ ...addForm, amount: e.target.value })} 
                        bg={addForm.isReadingOnly ? "gray.100" : "yellow.50"} 
                        fontWeight="bold" 
                        isDisabled={addForm.isReadingOnly}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Due Date</FormLabel>
                      <Input size="sm" type="date" value={addForm.due_date} onChange={e => setAddForm({ ...addForm, due_date: e.target.value })} isDisabled={addForm.isReadingOnly} />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl display="flex" alignItems="center" mb={4}>
                    <Checkbox 
                      id="isReadingOnly" 
                      isChecked={addForm.isReadingOnly} 
                      onChange={e => setAddForm({ ...addForm, isReadingOnly: e.target.checked, status: e.target.checked ? "paid" : "unpaid" })}
                      colorScheme="blue"
                    />
                    <FormLabel htmlFor="isReadingOnly" mb="0" ml={2} fontSize="xs" fontWeight="bold" color="blue.600" cursor="pointer">
                      Record as Meter Reading Only (No Charge)
                    </FormLabel>
                  </FormControl>
                </Box>

                {!addForm.isReadingOnly && (
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>2. Status & Remarks</Text>
                    <FormControl mb={4}>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Initial Status</FormLabel>
                      <Select size="sm" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </Select>
                    </FormControl>
                    {addForm.status === "paid" && (
                      <FormControl mb={4}>
                        <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Payment Method</FormLabel>
                        <Select size="sm" value={addForm.payment_method} onChange={e => setAddForm({ ...addForm, payment_method: e.target.value })}>
                          <option value="cash">Cash</option>
                          <option value="bank">Bank / ABA</option>
                          <option value="bakong">Bakong</option>
                        </Select>
                      </FormControl>
                    )}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Description</FormLabel>
                      <Textarea size="sm" rows={4} placeholder="e.g. Utility for room" value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} />
                    </FormControl>
                  </Box>
                )}
              </SimpleGrid>
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor}>
              <Button onClick={onAddClose} variant="ghost" mr={3} size="sm" fontWeight="bold">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingAdd} fontWeight="bold" px={8}>Save Bill</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Lightbox Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered motionPreset="scale">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent bg="transparent" boxShadow="none" m={4}>
          <ModalCloseButton color="white" size="lg" top={-12} right={0} _hover={{ bg: "whiteAlpha.200" }} />
          <ModalBody p={0} display="flex" justifyContent="center">
            {activePhoto && (
              <Image
                src={activePhoto}
                alt="Enlarged gallery photo"
                maxH="85vh"
                objectFit="contain"
                borderRadius="2xl"
                shadow="2xl"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
