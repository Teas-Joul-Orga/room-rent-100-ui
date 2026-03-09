import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
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
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
  Avatar,
  Icon,
  useColorModeValue,
  Divider,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
  InputLeftAddon,
  useOutsideClick,
  FormErrorMessage,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiCheck,
  FiUser,
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiActivity,
} from "react-icons/fi";

const steps = [
  { title: "Tenant", description: "Select Tenant", icon: FiUser },
  { title: "Room", description: "Select Room", icon: FiHome },
  { title: "Details", description: "Lease Info", icon: FiCalendar },
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

export default function CreateNewLease() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isRenew = window.location.pathname.includes('/renew');
  const today = new Date().toISOString().split("T")[0];
  const isRiel = localStorage.getItem("currency") === "៛" || localStorage.getItem("currency") === "KHR" || localStorage.getItem("currency") === "Riel";

  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [tenantSearch, setTenantSearch] = useState("");
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const tenantDropdownRef = useRef();

  useOutsideClick({
    ref: tenantDropdownRef,
    handler: () => setShowTenantDropdown(false),
  });

  const [formData, setFormData] = useState({
    tenant_id: "",
    room_id: "",
    start_date: today,
    end_date: "",
    rent_amount: "",
    security_deposit: 0,
    status: "active",
  });

  // Theme
  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "#30363d");

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

      try {
        const fetches = [
          fetch(`http://localhost:8000/api/v1/admin/rooms?per_page=all`, { headers }),
          fetch(`http://localhost:8000/api/v1/admin/tenants?per_page=all`, { headers }),
        ];

        if (isEdit) {
          fetches.push(fetch(`http://localhost:8000/api/v1/admin/leases/${id}`, { headers }));
        }

        const responses = await Promise.all(fetches);
        const [roomRes, tenantRes, leaseRes] = responses;

        let roomsList = [];
        if (roomRes.ok) { const d = await roomRes.json(); roomsList = d.data || d; setRooms(roomsList); }
        if (tenantRes.ok) { const d = await tenantRes.json(); setTenants(d.data || d); }

        if (isEdit && leaseRes && leaseRes.ok) {
          const found = await leaseRes.json();
          const l = found.data || found;
          if (l) {
            let initialRoomId = l.room?.id || "";

            if (isRenew && initialRoomId) {
              const rObj = roomsList.find(r => String(r.id) === String(initialRoomId));
              // In renewal, if the room status is not available but it IS the same room as the old lease, 
              // and the old lease is not active (e.g. expired), then it's fine.
              if (rObj && rObj.status?.toLowerCase() !== "available" && l.status === "active") {
                 // If the room is currently active in THIS lease, we can renew it.
                 // If the room is occupied by someone ELSE, then maybe it's a conflict.
                 // But for simplicity of "copying setting", we trust the user.
              }
            }

            setFormData({
              tenant_id: l.tenant?.id || "",
              room_id: initialRoomId,
              start_date: isRenew ? today : (l.start_date ? l.start_date.split("T")[0] : today),
              end_date: isRenew ? "" : (l.end_date ? l.end_date.split("T")[0] : ""),
              rent_amount: l.rent_amount || "",
              security_deposit: l.security_deposit || 0,
              status: isRenew ? "active" : (l.status || "active"),
            });
            if (l.tenant) setTenantSearch(l.tenant.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Error loading data from server.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [isEdit, id]);

  useEffect(() => {
    if (formData.room_id) {
      const room = rooms.find((r) => String(r.id) === String(formData.room_id));
      if (room && !isEdit) {
        setFormData((prev) => ({ 
          ...prev, 
          rent_amount: room.base_rent_price || 0, 
          security_deposit: room.base_rent_price || 0 
        }));
      }
    }
  }, [formData.room_id, rooms, isEdit]);

  // Auto calculate rent based on duration
  useEffect(() => {
    if (formData.room_id && formData.start_date && formData.end_date && !isEdit) {
      const room = rooms.find((r) => String(r.id) === String(formData.room_id));
      if (room) {
        const start = dayjs(formData.start_date);
        const end = dayjs(formData.end_date);
        const days = end.diff(start, "day") + 1;
        
        if (days > 0) {
          const basePrice = Number(room.base_rent_price || 0);
          // Pro-rate if less than 28 days (roughly 1 month), otherwise cap at full base price
          let calculated = days >= 28 ? basePrice : (basePrice / 30) * days;
          
          setFormData(prev => ({ 
            ...prev, 
            rent_amount: Number(calculated.toFixed(2)) 
          }));
        }
      }
    }
  }, [formData.room_id, formData.start_date, formData.end_date, rooms, isEdit]);

  const handleNext = () => {
    const newErrors = {};
    if (activeStep === 0 && !formData.tenant_id) {
      newErrors.tenant_id = "Please select a tenant.";
    }
    if (activeStep === 1 && !formData.room_id) {
      newErrors.room_id = "Please select a room.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Optional: scroll to error
      return;
    }

    setErrors({});
    setActiveStep((prev) => prev + 1);
  };
  const handlePrev = () => {
    setErrors({});
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent accidental submission if not on the last step
    if (activeStep < steps.length - 1) return;

    const newErrors = {};
    if (!formData.tenant_id) newErrors.tenant_id = "Tenant is required";
    if (!formData.room_id) newErrors.room_id = "Room is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date) newErrors.end_date = "End date is required";
    if (formData.rent_amount === "" || formData.rent_amount === null) newErrors.rent_amount = "Rent amount is required";
    if (formData.security_deposit === "" || formData.security_deposit === null) newErrors.security_deposit = "Security deposit is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all required fields");
      return;
    }

    setErrors({});
    setIsSaving(true);
    const token = localStorage.getItem("token");
    const url = isEdit
      ? `http://localhost:8000/api/v1/admin/leases/${id}`
      : `http://localhost:8000/api/v1/admin/leases`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "Lease updated!" : "Lease created successfully!");
        navigate("/dashboard/lease");
      } else {
        toast.error(data.message || "Failed to save lease");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.email?.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const selectedTenant = tenants.find((t) => String(t.id) === String(formData.tenant_id));
  const selectedRoom = rooms.find((r) => String(r.id) === String(formData.room_id));

  if (isLoading) {
    return (
      <Center minH="100vh" bg={bg}>
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={mutedText} fontWeight="medium">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box h="100%" overflow="hidden" bg={bg} display="flex" flexDirection="column" mx={{ base: -4, md: -6, lg: -8 }} mt={{ base: -4, md: -6, lg: -8 }} mb={{ base: "-80px", md: -8 }} px={{ base: 4, md: 6 }} pt={4} pb={0}>
      <Toaster position="top-right" />

      <Flex direction="column" maxW="10xl" mx="auto" w="full" flex={1} minH={0}>
        {/* Header */}
        <Flex align="center" gap={3} mb={4}>
          <Button
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            color={mutedText}
            onClick={() => navigate("/dashboard/lease")}
            size="sm"
          >
            Back
          </Button>
          <Box>
            <Heading size="lg" color={textColor} fontWeight="black">
              {isEdit ? "Edit Lease Agreement" : "New Lease Agreement"}
            </Heading>
            <Text fontSize="sm" color={mutedText} mt={0.5}>
              {isEdit ? "Update the details below" : "Complete the 3 steps to create a lease"}
            </Text>
          </Box>
        </Flex>

        {/* Custom Stepper */}
        <Flex mb={5} align="center">
          {steps.map((step, index) => {
            const isDone = activeStep > index;
            const isActive = activeStep === index;
            return (
              <React.Fragment key={index}>
                <Flex align="center" gap={3}>
                  <Flex
                    w="42px" h="42px" borderRadius="full" align="center" justify="center"
                    fontWeight="black" fontSize="sm"
                    bg={isDone ? "green.500" : isActive ? "blue.600" : "gray.200"}
                    color={isDone || isActive ? "white" : "gray.500"}
                    transition="all 0.3s"
                    shadow={isActive ? "0 0 0 4px rgba(66,153,225,0.25)" : "none"}
                  >
                    {isDone ? <Icon as={FiCheck} /> : <Icon as={step.icon} />}
                  </Flex>
                  <Box display={{ base: "none", md: "block" }}>
                    <Text fontSize="xs" fontWeight="black" color={isActive ? "blue.600" : isDone ? "green.600" : mutedText} textTransform="uppercase" letterSpacing="wider">
                      Step {index + 1}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color={isActive ? textColor : mutedText}>
                      {step.title}
                    </Text>
                  </Box>
                </Flex>
                {index < steps.length - 1 && (
                  <Box flex={1} h="2px" mx={4} bg={activeStep > index ? "green.400" : "gray.200"} borderRadius="full" transition="background 0.4s" />
                )}
              </React.Fragment>
            );
          })}
        </Flex>

        {/* Main Card */}
        <Box bg={cardBg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden" display="flex" flexDirection="column" flex={1} minH={0}>
          <Box as="form" onSubmit={handleSubmit} display="flex" flexDirection="column" h="100%">
            <Box p={{ base: 6, md: 10 }} flex={1} overflowY="auto" minH={0}
              sx={{
                '&::-webkit-scrollbar': { width: '0px' },
              }}
            >

              {/* ===== STEP 1: TENANT ===== */}
              {activeStep === 0 && (
                <Box>
                  <Text fontSize="lg" fontWeight="black" color={textColor} mb={1}>Select Tenant</Text>
                  <Text fontSize="sm" color={mutedText} mb={6}>Search and select the tenant for this lease.</Text>

                  <Box maxW="xl" position="relative" ref={tenantDropdownRef}>
                    <FormControl isInvalid={errors.tenant_id}>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiSearch} color={mutedText} />
                        </InputLeftElement>
                        <Input
                          pl="44px"
                          placeholder="Search by name or email..."
                          value={tenantSearch}
                          bg={inputBg}
                          isDisabled={isRenew}
                          onFocus={() => !isRenew && setShowTenantDropdown(true)}
                          onChange={(e) => {
                            setTenantSearch(e.target.value);
                            setShowTenantDropdown(true);
                            if (formData.tenant_id) setFormData((prev) => ({ ...prev, tenant_id: "" }));
                          }}
                          borderColor={formData.tenant_id ? "green.400" : borderColor}
                          _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.tenant_id}</FormErrorMessage>
                    </FormControl>

                    {/* Dropdown */}
                    {showTenantDropdown && (
                      <Box
                        position="absolute" top="100%" left={0} right={0} zIndex={20} mt={2}
                        bg={cardBg} shadow="2xl" borderRadius="xl" border="1px solid" borderColor={borderColor}
                        maxH="300px" overflowY="auto"
                      >
                        {filteredTenants.length > 0 ? filteredTenants.map((t) => (
                          <Flex
                            key={t.id} px={4} py={3} cursor="pointer" align="center" gap={3}
                            borderBottom="1px solid" borderColor={borderColor}
                            _hover={{ bg: useColorModeValue("blue.50", "blue.900") }}
                            bg={String(formData.tenant_id) === String(t.id) ? useColorModeValue("blue.50", "blue.900") : "transparent"}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, tenant_id: t.id }));
                              setTenantSearch(t.name);
                              setShowTenantDropdown(false);
                            }}
                          >
                            <Avatar size="sm" name={t.name} />
                            <Box flex={1}>
                              <Flex align="center" gap={2}>
                                <Text fontWeight="bold" fontSize="sm" color={textColor}>{t.name}</Text>
                                {String(formData.tenant_id) === String(t.id) && (
                                  <Icon as={FiCheck} color="green.500" boxSize={3} />
                                )}
                              </Flex>
                              <Text fontSize="xs" color={mutedText}>{t.email || "No email"}</Text>
                            </Box>
                          </Flex>
                        )) : (
                          <Box px={5} py={6} textAlign="center">
                            <Icon as={FiUser} color={mutedText} boxSize={6} mb={2} />
                            <Text fontSize="sm" color={mutedText}>No tenants found.</Text>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Selected Tenant Card */}
                  {selectedTenant && !showTenantDropdown && (
                    <Box mt={6} maxW="xl" p={5} bg={useColorModeValue("green.50", "green.900")} border="1px solid" borderColor={useColorModeValue("green.200", "green.700")} borderRadius="xl">
                      <Flex align="center" gap={4}>
                        <Avatar name={selectedTenant.name} size="md" />
                        <Box flex={1}>
                          <Flex align="center" gap={2} mb={1}>
                            <Text fontWeight="black" fontSize="md" color={textColor}>{selectedTenant.name}</Text>
                            <Badge colorScheme="green" fontSize="9px" fontWeight="black">Selected</Badge>
                          </Flex>
                          <Text fontSize="sm" color={mutedText}>{selectedTenant.email || "No email"}</Text>
                          {selectedTenant.phone && <Text fontSize="sm" color={mutedText}>{selectedTenant.phone}</Text>}
                        </Box>
                        <Icon as={FiCheck} color="green.500" boxSize={6} />
                      </Flex>
                    </Box>
                  )}
                </Box>
              )}

              {/* ===== STEP 2: ROOM ===== */}
              {activeStep === 1 && (
                <Box>
                  <Text fontSize="lg" fontWeight="black" color={textColor} mb={1}>Select Room</Text>
                  <Text fontSize="sm" color={mutedText} mb={6}>Choose an available unit for this lease.</Text>

                  <FormControl isInvalid={errors.room_id}>
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
                      {rooms.map((r) => {
                      const isSelected = String(formData.room_id) === String(r.id);
                      const isAvailable = r.status?.toLowerCase() === "available" || isSelected;
                      return (
                        <Box
                          key={r.id}
                          as="button"
                          type="button"
                          textAlign="left"
                          p={5}
                          borderRadius="xl"
                          border="2px solid"
                          borderColor={isSelected ? "blue.500" : isAvailable ? borderColor : "red.200"}
                           bg={isSelected ? useColorModeValue("blue.50", "blue.900") : cardBg}
                          opacity={(!isAvailable && !isSelected) || (isRenew && !isSelected) ? 0.55 : 1}
                          cursor={(!isAvailable && !isSelected) || (isRenew && !isSelected) ? "not-allowed" : "pointer"}
                          _hover={(isAvailable || isSelected) && !isRenew ? {
                            borderColor: isSelected ? "blue.600" : "blue.300",
                            transform: "translateY(-2px)",
                            shadow: "md",
                          } : {}}
                          transition="all 0.2s"
                          onClick={() => { 
                            if (isRenew) return;
                            if (!isAvailable && !isSelected) return; 
                            setFormData({ ...formData, room_id: r.id }); 
                          }}
                          position="relative"
                        >
                          {isSelected && (
                            <Box position="absolute" top={3} right={3}>
                              <Flex w="22px" h="22px" bg="blue.500" borderRadius="full" align="center" justify="center">
                                <Icon as={FiCheck} color="white" boxSize={3} />
                              </Flex>
                            </Box>
                          )}
                          <Icon as={FiHome} color={isSelected ? "blue.500" : mutedText} boxSize={5} mb={3} />
                          <Text fontWeight="black" fontSize="md" color={textColor} mb={1}>{r.name}</Text>
                          <Text fontSize="xs" color={mutedText} mb={3}>{r.size || "Standard Unit"}</Text>
                          <Text fontSize="xl" fontWeight="black" color={isSelected ? "blue.600" : textColor}>
                            {fmt(r.base_rent_price || 0)}
                            <Text as="span" fontSize="xs" color={mutedText} fontWeight="normal"> /mo</Text>
                          </Text>
                          <Badge
                            mt={2} fontSize="9px" fontWeight="black" textTransform="uppercase"
                            colorScheme={r.status?.toLowerCase() === "available" ? "green" : isSelected ? "blue" : "red"}
                            borderRadius="full" px={2} py={1}
                          >
                            {isSelected ? "Selected" : r.status || "Available"}
                          </Badge>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                  <FormErrorMessage>{errors.room_id}</FormErrorMessage>
                </FormControl>
              </Box>
              )}

              {/* ===== STEP 3: DETAILS ===== */}
              {activeStep === 2 && (
                <Box>
                  <Text fontSize="lg" fontWeight="black" color={textColor} mb={1}>Lease Details</Text>
                  <Text fontSize="sm" color={mutedText} mb={6}>Set the financial terms and dates for this agreement.</Text>

                  {/* Selection Summary */}
                  {(selectedTenant || selectedRoom) && (
                    <Flex gap={4} mb={8} direction={{ base: "column", md: "row" }}>
                      {selectedTenant && (
                        <Flex flex={1} align="center" gap={3} p={4} bg={useColorModeValue("gray.50", "#1c2333")} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                          <Avatar size="sm" name={selectedTenant.name} />
                          <Box>
                            <Text fontSize="10px" fontWeight="black" color={mutedText} textTransform="uppercase">Tenant</Text>
                            <Text fontWeight="bold" fontSize="sm" color={textColor}>{selectedTenant.name}</Text>
                          </Box>
                        </Flex>
                      )}
                      {selectedRoom && (
                        <Flex flex={1} align="center" gap={3} p={4} bg={useColorModeValue("gray.50", "#1c2333")} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                          <Flex w="34px" h="34px" bg="blue.100" borderRadius="lg" align="center" justify="center">
                            <Icon as={FiHome} color="blue.600" />
                          </Flex>
                          <Box>
                            <Text fontSize="10px" fontWeight="black" color={mutedText} textTransform="uppercase">Room</Text>
                            <Text fontWeight="bold" fontSize="sm" color={textColor}>{selectedRoom.name}</Text>
                          </Box>
                        </Flex>
                      )}
                    </Flex>
                  )}

                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                    {/* LEFT: Financials */}
                    <Box p={6} bg={useColorModeValue("blue.50", "blue.900/30")} borderRadius="xl" border="1px solid" borderColor={useColorModeValue("blue.100", "blue.700")}>
                      <Flex align="center" gap={2} mb={5}>
                        <Icon as={FiActivity} color="blue.600" />
                        <Text fontWeight="black" fontSize="sm" color={useColorModeValue("blue.800", "blue.100")}>Financial Terms</Text>
                      </Flex>
                      <VStack spacing={4}>
                        <FormControl isInvalid={errors.rent_amount}>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Monthly Rent</FormLabel>
                          <InputGroup size="md">
                            <InputLeftAddon fontWeight="black" bg={useColorModeValue("gray.100", "gray.700")}>
                              {isRiel ? "៛" : "$"}
                            </InputLeftAddon>
                            <Input type="number" step={isRiel ? "100" : "0.01"} bg={inputBg} 
                              value={isRiel ? Math.round(Number(formData.rent_amount || 0) * (Number(localStorage.getItem("exchangeRate") || 4000))) : formData.rent_amount}
                              onChange={(e) => {
                                const val = e.target.value;
                                const rate = Number(localStorage.getItem("exchangeRate") || 4000);
                                setFormData({ ...formData, rent_amount: isRiel ? (Number(val) / rate).toFixed(2) : val });
                              }} 
                            />
                            {isRiel && (
                               <InputRightAddon fontSize="xs" fontWeight="black" bg={useColorModeValue("blue.50", "blue.900")} color="blue.600">
                                 USD: ${Number(formData.rent_amount || 0).toFixed(2)}
                               </InputRightAddon>
                            )}
                          </InputGroup>
                          <FormErrorMessage>{errors.rent_amount}</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={errors.security_deposit}>
                          <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Security Deposit</FormLabel>
                          <InputGroup size="md">
                            <InputLeftAddon fontWeight="black" bg={useColorModeValue("gray.100", "gray.700")}>
                              {isRiel ? "៛" : "$"}
                            </InputLeftAddon>
                            <Input type="number" step={isRiel ? "100" : "0.01"} bg={inputBg} 
                              value={isRiel ? Math.round(Number(formData.security_deposit || 0) * (Number(localStorage.getItem("exchangeRate") || 4000))) : formData.security_deposit}
                              onChange={(e) => {
                                const val = e.target.value;
                                const rate = Number(localStorage.getItem("exchangeRate") || 4000);
                                setFormData({ ...formData, security_deposit: isRiel ? (Number(val) / rate).toFixed(2) : val });
                              }} 
                            />
                            {isRiel && (
                               <InputRightAddon fontSize="xs" fontWeight="black" bg={useColorModeValue("blue.50", "blue.900")} color="blue.600">
                                 USD: ${Number(formData.security_deposit || 0).toFixed(2)}
                               </InputRightAddon>
                            )}
                          </InputGroup>
                          <FormErrorMessage>{errors.security_deposit}</FormErrorMessage>
                        </FormControl>
                      </VStack>
                    </Box>

                    {/* RIGHT: Dates + Status */}
                    <VStack spacing={5}>
                      <Box w="full" p={6} bg={useColorModeValue("gray.50", "#31363f/50")} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                        <Flex align="center" gap={2} mb={5}>
                          <Icon as={FiCalendar} color={mutedText} />
                          <Text fontWeight="black" fontSize="sm" color={textColor}>Lease Duration</Text>
                        </Flex>
                        <VStack spacing={4}>
                          <FormControl isInvalid={errors.start_date}>
                            <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Start Date</FormLabel>
                            <Input size="md" type="date" bg={inputBg} value={formData.start_date}
                              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                            <FormErrorMessage>{errors.start_date}</FormErrorMessage>
                          </FormControl>
                          <FormControl isInvalid={errors.end_date}>
                            <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>End Date</FormLabel>
                            <Input size="md" type="date" bg={inputBg} value={formData.end_date}
                              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                            <FormErrorMessage>{errors.end_date}</FormErrorMessage>
                          </FormControl>
                        </VStack>
                      </Box>

                      <Box w="full" p={6} bg={useColorModeValue("gray.50", "#31363f/50")} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                        <Flex align="center" gap={2} mb={5}>
                          <Icon as={FiShield} color={mutedText} />
                          <Text fontWeight="black" fontSize="sm" color={textColor}>Lease Status</Text>
                        </Flex>
                        <FormControl>
                          <SimpleGrid columns={3} spacing={2}>
                            {["active", "expired", "terminated"].map((s) => (
                              <Button
                                key={s}
                                type="button"
                                size="md"
                                variant={formData.status === s ? "solid" : "outline"}
                                colorScheme={formData.status === s ? (s === "active" ? "green" : s === "expired" ? "orange" : "gray") : "gray"}
                                onClick={() => setFormData({ ...formData, status: s })}
                                textTransform="uppercase"
                                fontWeight="black"
                                fontSize="10px"
                                letterSpacing="wider"
                                py={6}
                              >
                                {s}
                              </Button>
                            ))}
                          </SimpleGrid>
                        </FormControl>
                      </Box>
                    </VStack>
                  </SimpleGrid>
                </Box>
              )}
            </Box>

            {/* Footer Buttons */}
            <Box px={{ base: 6, md: 10 }} py={5} borderTop="1px solid" borderColor={borderColor} bg={useColorModeValue("gray.50", "gray.900/50")}>
              <Flex justify="space-between" align="center">
                {/* Left: Cancel / Back */}
                {activeStep === 0 ? (
                  <Button type="button" variant="ghost" color={mutedText} onClick={() => navigate("/dashboard/lease")} isDisabled={isSaving}>
                    Cancel
                  </Button>
                ) : (
                  <Button type="button" leftIcon={<FiArrowLeft />} variant="outline" onClick={handlePrev} isDisabled={isSaving}>
                    Back
                  </Button>
                )}

                {/* Right: Next / Save */}
                {activeStep < steps.length - 1 ? (
                  <Button
                    key="btn-next"
                    type="button"
                    colorScheme="blue"
                    rightIcon={<FiArrowRight />}
                    px={8}
                    onClick={handleNext}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    key="btn-save"
                    colorScheme="blue"
                    leftIcon={<FiCheck />}
                    px={10}
                    type="submit"
                    isLoading={isSaving}
                  >
                    {isEdit ? "Update Lease" : "Confirm & Save"}
                  </Button>
                )}
              </Flex>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}