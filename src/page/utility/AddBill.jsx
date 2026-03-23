import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Textarea,
  Text,
  VStack,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
  Icon,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  useOutsideClick,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiCheck,
  FiArrowLeft,
  FiZap,
  FiDroplet,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiSave,
  FiHome,
} from "react-icons/fi";

const API = "http://localhost:8000/api/v1/admin";

// Get the saved utility rate from localStorage (set by Settings page)
const getDefaultRate = (type) => {
  const rawUSD = type === "electricity" ? localStorage.getItem("utility_rate_electricity")
                : type === "water"       ? localStorage.getItem("utility_rate_water")
                : null;
  if (!rawUSD) return "";
  const c = localStorage.getItem("currency") || "$";
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rate = Number(localStorage.getItem("exchangeRate") || 4000);
    return (Number(rawUSD) * rate).toFixed(0); // e.g. 0.25 * 4000 = 1000
  }
  return rawUSD; // already in USD
};

const BILL_TYPES = [
  { value: "electricity", label: "Electricity", icon: FiZap, color: "yellow" },
  { value: "water", label: "Water", icon: FiDroplet, color: "blue" },
  { value: "trash", label: "Trash (Fixed)", icon: FiFileText, color: "gray" },
  { value: "internet", label: "Internet (Fixed)", icon: FiFileText, color: "purple" },
  { value: "other", label: "Other", icon: FiFileText, color: "gray" },
];

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

const toUSD = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return (num / r).toFixed(2);
  }
  return num;
};

export default function AddBill() {
  const navigate = useNavigate();
  const curr = localStorage.getItem("currency") || "$";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Rooms + leases data
  const [rooms, setRooms] = useState([]);
  const [leases, setLeases] = useState([]);
  const [roomSearch, setRoomSearch] = useState("");

  const [formData, setFormData] = useState({
    room_id: "",
    type: "electricity",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    status: "unpaid",
    description: "",
    previous_reading: "",
    current_reading: "",
    cost_per_unit: getDefaultRate("electricity"),
    payment_method: "cash",
  });

  // Theme
  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "#30363d");
  const hoverBg = useColorModeValue("blue.50", "blue.900");

  // Fetch rooms on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { setIsLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

      try {
        const [roomRes, leaseRes] = await Promise.all([
          fetch(`${API}/rooms?per_page=all&minimal=true`, { headers }),
          fetch(`${API}/leases?per_page=all&minimal=true&status=active`, { headers }),
        ]);
        if (roomRes.ok) { const d = await roomRes.json(); setRooms(d.data || d); }
        if (leaseRes.ok) { const d = await leaseRes.json(); setLeases(d.data || d); }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load rooms");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch last reading when room or type changes
  useEffect(() => {
    const fetchLastReading = async () => {
      if (!formData.room_id || !["electricity", "water"].includes(formData.type)) return;
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API}/utility-bills/last-reading/${formData.room_id}?type=${formData.type}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) {
          const d = await res.json();
          setFormData(prev => ({ ...prev, previous_reading: d.reading || 0 }));
        }
      } catch (e) {
        // silently fail
      }
    };
    fetchLastReading();
  }, [formData.room_id, formData.type]);

  // Auto-calculate amount for metered types
  const isMetered = formData.type === "electricity" || formData.type === "water";
  const usage = isMetered
    ? Math.max(0, (parseFloat(formData.current_reading) || 0) - (parseFloat(formData.previous_reading) || 0))
    : 0;

  useEffect(() => {
    if (isMetered && formData.current_reading && formData.cost_per_unit) {
      const calculated = usage * parseFloat(formData.cost_per_unit);
      setFormData(prev => ({ ...prev, amount: calculated.toFixed(2) }));
    }
  }, [formData.current_reading, formData.cost_per_unit, formData.previous_reading, isMetered]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isMetered && Number(formData.current_reading) < Number(formData.previous_reading)) {
      return toast.error("Current reading cannot be lower than previous reading");
    }
    if (!formData.room_id || !formData.amount || !formData.due_date) {
      return toast.error("Please fill all required fields");
    }
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/utility-bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          amount: toUSD(formData.amount),
          cost_per_unit: toUSD(formData.cost_per_unit),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bill created successfully!");
        navigate(-1);
      } else {
        toast.error(data.message || "Failed to create bill");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter rooms by search
  const filteredRooms = rooms.filter((r) => {
    const q = roomSearch.toLowerCase();
    return !q || (r.name || "").toLowerCase().includes(q);
  });

  const selectedRoom = rooms.find((r) => String(r.id) === String(formData.room_id));
  const selectedBillType = BILL_TYPES.find((b) => b.value === formData.type);

  // Build room → tenant lookup from active leases
  const roomTenantMap = {};
  leases.forEach((l) => {
    if (l.room?.id) roomTenantMap[l.room.id] = l.tenant?.name || "Unknown tenant";
  });
  const getTenantForRoom = (roomId) => roomTenantMap[roomId] || null;

  if (isLoading) {
    return (
      <Center h="100%" bg={bg}>
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={mutedText} fontWeight="medium">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box h="100%" overflow="hidden" bg={bg} display="flex" flexDirection="column"
      mx={{ base: -4, md: -6, lg: -8 }} mt={{ base: -4, md: -6, lg: -8 }} mb={{ base: "-80px", md: -8 }}
      px={{ base: 4, md: 6 }} pt={4} pb={0}
    >
      <Toaster position="top-right" />

      <Flex direction="column" maxW="10xl" mx="auto" w="full" flex={1} minH={0}>
        {/* Header */}
        <Flex align="center" gap={3} mb={4}>
          <Button leftIcon={<FiArrowLeft />} variant="ghost" color={mutedText} onClick={() => navigate(-1)} size="sm">
            Back
          </Button>
          <Box>
            <Heading size="lg" color={textColor} fontWeight="black">Add Utility Bill</Heading>
            <Text fontSize="sm" color={mutedText} mt={0.5}>Select a room and record the meter reading</Text>
          </Box>
        </Flex>

        {/* Main Card */}
        <Box bg={cardBg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden" display="flex" flexDirection="column" flex={1} minH={0}>
          <Box as="form" onSubmit={handleSubmit} display="flex" flexDirection="column" h="100%">
            <Box p={{ base: 6, md: 10 }} flex={1} overflowY="auto" minH={0}
              sx={{ '&::-webkit-scrollbar': { width: '0px' } }}
            >

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                {/* LEFT COLUMN */}
                <VStack spacing={6} align="stretch">
                  {/* Select Room */}
                  <Box>
                    <Text fontSize="sm" fontWeight="black" color={textColor} mb={2}>Select Room</Text>
                    <Text fontSize="xs" color={mutedText} mb={4}>Choose the room to record a utility bill for.</Text>

                    {/* Room Search */}
                    <InputGroup size="md" mb={4}>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiSearch} color={mutedText} />
                      </InputLeftElement>
                      <Input
                        pl="40px"
                        placeholder="Search rooms..."
                        value={roomSearch}
                        bg={inputBg}
                        onChange={(e) => setRoomSearch(e.target.value)}
                        borderColor={borderColor}
                        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                      />
                    </InputGroup>

                    {/* Room Grid */}
                    <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3}>
                      {filteredRooms.map((room) => {
                        const isSelected = String(formData.room_id) === String(room.id);
                        const isOccupied = room.status === "occupied";
                        return (
                          <Box
                            key={room.id}
                            as="button"
                            type="button"
                            textAlign="center"
                            p={4}
                            borderRadius="xl"
                            border="2px solid"
                            borderColor={isSelected ? "blue.500" : borderColor}
                            bg={isSelected ? hoverBg : cardBg}
                            _hover={{ borderColor: "blue.400", transform: "translateY(-1px)", shadow: "sm" }}
                            transition="all 0.2s"
                            onClick={() => setFormData(prev => ({ ...prev, room_id: room.id, previous_reading: "", current_reading: "" }))}
                            position="relative"
                          >
                            {isSelected && (
                              <Box position="absolute" top={2} right={2}>
                                <Flex w="18px" h="18px" bg="blue.500" borderRadius="full" align="center" justify="center">
                                  <Icon as={FiCheck} color="white" boxSize={2.5} />
                                </Flex>
                              </Box>
                            )}
                            <Icon as={FiHome} color={isSelected ? "blue.500" : mutedText} boxSize={5} mb={2} />
                            <Text fontWeight="black" fontSize="sm" color={textColor}>{room.name}</Text>
                            <Text fontSize="9px" fontWeight="bold" color={isOccupied ? "green.500" : "gray.400"} mt={1} textTransform="uppercase">
                              {isOccupied ? "Occupied" : room.status || "Available"}
                            </Text>
                            {getTenantForRoom(room.id) ? (
                              <Text fontSize="10px" color={mutedText} mt={1} noOfLines={1}>{getTenantForRoom(room.id)}</Text>
                            ) : (
                              <Text fontSize="10px" color="orange.400" mt={1}>No tenant</Text>
                            )}
                          </Box>
                        );
                      })}
                    </SimpleGrid>

                    {filteredRooms.length === 0 && (
                      <Box py={8} textAlign="center">
                        <Text fontSize="sm" color={mutedText}>No rooms found.</Text>
                      </Box>
                    )}
                  </Box>

                  {/* Bill Type Selection */}
                  <Box>
                    <Text fontSize="sm" fontWeight="black" color={textColor} mb={3}>Bill Type</Text>
                    <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3}>
                      {BILL_TYPES.map((bt) => {
                        const isActive = formData.type === bt.value;
                        return (
                          <Box
                            key={bt.value}
                            as="button"
                            type="button"
                            textAlign="center"
                            p={4}
                            borderRadius="xl"
                            border="2px solid"
                            borderColor={isActive ? `${bt.color}.500` : borderColor}
                            bg={isActive ? useColorModeValue(`${bt.color}.50`, `${bt.color}.900`) : cardBg}
                            _hover={{ borderColor: `${bt.color}.400`, transform: "translateY(-1px)", shadow: "sm" }}
                            transition="all 0.2s"
                            onClick={() => setFormData({ ...formData, type: bt.value, amount: "", previous_reading: "", current_reading: "", cost_per_unit: getDefaultRate(bt.value) })}
                            position="relative"
                          >
                            {isActive && (
                              <Box position="absolute" top={2} right={2}>
                                <Flex w="18px" h="18px" bg={`${bt.color}.500`} borderRadius="full" align="center" justify="center">
                                  <Icon as={FiCheck} color="white" boxSize={2.5} />
                                </Flex>
                              </Box>
                            )}
                            <Icon as={bt.icon} color={isActive ? `${bt.color}.500` : mutedText} boxSize={5} mb={2} />
                            <Text fontWeight="bold" fontSize="xs" color={textColor}>{bt.label}</Text>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  </Box>

                  {/* Other Description */}
                  {formData.type === "other" && (
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Description</FormLabel>
                      <Textarea size="md" bg={inputBg} rows={3} value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe this bill..." />
                    </FormControl>
                  )}
                </VStack>

                {/* RIGHT COLUMN */}
                <VStack spacing={6} align="stretch">
                  {/* Selected Room Summary */}
                  {selectedRoom && (
                    <Box p={5} bg={useColorModeValue("green.50", "green.900")} border="1px solid" borderColor={useColorModeValue("green.200", "green.700")} borderRadius="xl">
                      <Flex align="center" gap={3}>
                        <Flex w="40px" h="40px" bg="green.100" _dark={{ bg: "green.800" }} borderRadius="lg" align="center" justify="center">
                          <Icon as={FiHome} color="green.600" boxSize={5} />
                        </Flex>
                        <Box flex={1}>
                          <Flex align="center" gap={2} mb={0.5}>
                            <Text fontWeight="black" fontSize="md" color={textColor}>{selectedRoom.name}</Text>
                            <Badge colorScheme="green" fontSize="9px" fontWeight="black">Selected</Badge>
                          </Flex>
                          <Text fontSize="xs" color={mutedText}>{selectedRoom.size || "Standard Unit"} • {selectedRoom.status || "Available"}</Text>
                          {getTenantForRoom(selectedRoom.id) ? (
                            <Flex align="center" gap={1} mt={1}>
                              <Text fontSize="xs" fontWeight="bold" color="green.600">Occupied by: {getTenantForRoom(selectedRoom.id)}</Text>
                            </Flex>
                          ) : (
                            <Text fontSize="xs" fontWeight="bold" color="orange.500" mt={1}>⚠ Vacant — No active tenant</Text>
                          )}
                        </Box>
                        <Icon as={FiCheck} color="green.500" boxSize={5} />
                      </Flex>
                    </Box>
                  )}

                  {/* Meter Readings - only for electricity/water */}
                  {isMetered && (
                    <Box p={6} bg={useColorModeValue("orange.50", "orange.900/30")} borderRadius="xl" border="1px solid" borderColor={useColorModeValue("orange.100", "orange.700")}>
                      <Flex align="center" gap={2} mb={4}>
                        <Icon as={selectedBillType?.icon} color="orange.500" />
                        <Text fontWeight="black" fontSize="sm" color={useColorModeValue("orange.800", "orange.100")}>Meter Reading</Text>
                        {!formData.room_id && <Text fontSize="xs" color="orange.400" ml={2}>(Select a room first)</Text>}
                      </Flex>
                      <SimpleGrid columns={3} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Previous</FormLabel>
                          <Input size="md" type="number" step="0.01" bg={inputBg} value={formData.previous_reading}
                            onChange={(e) => setFormData({ ...formData, previous_reading: e.target.value })}
                            placeholder="0" />
                          <Text fontSize="10px" color={mutedText} mt={1}>Auto-fetched, but editable</Text>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Current</FormLabel>
                          <Input size="md" type="number" step="0.01" bg={inputBg} value={formData.current_reading}
                            onChange={(e) => setFormData({ ...formData, current_reading: e.target.value })}
                            placeholder="0" />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Rate/Unit ({curr})</FormLabel>
                          <Input size="md" type="number" step="0.01" bg={inputBg} value={formData.cost_per_unit}
                            onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                            placeholder="0.00" />
                        </FormControl>
                      </SimpleGrid>
                      <Flex justify="flex-end" mt={3}>
                        <Text fontSize="sm" fontWeight="bold" color={useColorModeValue("orange.700", "orange.200")}>
                          Usage: <Text as="span" fontWeight="black">{usage.toFixed(2)}</Text> units
                        </Text>
                      </Flex>
                    </Box>
                  )}

                  {/* Amount & Due Date */}
                  <Box p={6} bg={useColorModeValue("blue.50", "blue.900/30")} borderRadius="xl" border="1px solid" borderColor={useColorModeValue("blue.100", "blue.700")}>
                    <Flex align="center" gap={2} mb={4}>
                      <Icon as={FiDollarSign} color="blue.600" />
                      <Text fontWeight="black" fontSize="sm" color={useColorModeValue("blue.800", "blue.100")}>Bill Details</Text>
                    </Flex>
                    <SimpleGrid columns={2} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Total Amount ({curr})</FormLabel>
                        <Input size="md" type="number" step="0.01" bg={inputBg}
                          fontWeight="bold"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00" />
                        {isMetered && <Text fontSize="xs" color={mutedText} mt={1}>Auto-calculated from readings</Text>}
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Due Date</FormLabel>
                        <Input size="md" type="date" bg={inputBg} value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  {/* Status */}
                  <Box p={6} bg={useColorModeValue("gray.50", "#31363f/50")} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                    <Flex align="center" gap={2} mb={4}>
                      <Icon as={FiCalendar} color={mutedText} />
                      <Text fontWeight="black" fontSize="sm" color={textColor}>Payment Status</Text>
                    </Flex>
                    <SimpleGrid columns={2} spacing={3}>
                      {["unpaid", "paid"].map((s) => (
                        <Button
                          key={s} size="md"
                          variant={formData.status === s ? "solid" : "outline"}
                          colorScheme={formData.status === s ? (s === "paid" ? "green" : "red") : "gray"}
                          onClick={() => setFormData({ ...formData, status: s })}
                          textTransform="uppercase" fontWeight="black" fontSize="11px" letterSpacing="wider"
                          py={6}
                        >
                          {s}
                        </Button>
                      ))}
                    </SimpleGrid>
                    {formData.status === "paid" && (
                      <Box mt={4}>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Payment Method</FormLabel>
                        <Select size="md" bg={inputBg} value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                          <option value="cash">Cash</option>
                          <option value="bank">Bank / ABA</option>
                          <option value="bakong">Bakong</option>
                        </Select>
                      </Box>
                    )}
                  </Box>

                  {/* Notes */}
                  {formData.type !== "other" && (
                    <Box p={6} bg={useColorModeValue("gray.50", "#31363f/50")} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                      <Flex align="center" gap={2} mb={4}>
                        <Icon as={FiFileText} color={mutedText} />
                        <Text fontWeight="black" fontSize="sm" color={textColor}>Notes (Optional)</Text>
                      </Flex>
                      <Textarea size="md" bg={inputBg} rows={3} value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g., September 2025 usage..." />
                    </Box>
                  )}
                </VStack>
              </SimpleGrid>
            </Box>

            {/* Footer Buttons */}
            <Box px={{ base: 6, md: 10 }} py={5} borderTop="1px solid" borderColor={borderColor} bg={useColorModeValue("gray.50", "gray.900/50")}>
              <Flex justify="space-between" align="center">
                <Button variant="ghost" color={mutedText} onClick={() => navigate(-1)} isDisabled={isSaving}>
                  Cancel
                </Button>
                <Button colorScheme="blue" leftIcon={<FiSave />} px={10} type="submit" isLoading={isSaving}>
                  Save Bill
                </Button>
              </Flex>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
