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
  SimpleGrid,
  Icon,
  useColorModeValue,
  IconButton,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiDownload, FiLayout, FiBriefcase, FiStar, FiAward, FiUser, FiUserX, FiBellOff, FiDroplet } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";

const getRoomIcon = (name = "") => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('10')) return FiBriefcase;
  if (lowerName.includes('3')) return FiStar;
  if (lowerName.includes('4')) return FiAward;
  return FiLayout;
};

export default function AllRoom() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // No pagination state
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
  }, [search, sortField, sortDir]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      let url = `http://localhost:8000/api/v1/admin/rooms?page=1&limit=1000&search=${search}`;
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

      {/* ===== SEARCH & FILTER ===== */}
      <Flex direction={{ base: "column", md: "row" }} gap={4} mb={6} flexShrink={0}>
        <Box bg={cardBg} p={2} borderRadius="xl" shadow="sm" flex={1}>
          <Input
            placeholder={t("room.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            variant="unstyled"
            px={4} py={2}
          />
        </Box>
        <HStack bg={cardBg} p={2} borderRadius="xl" shadow="sm" spacing={4} flexShrink={0}>
          <Text fontSize="sm" fontWeight="bold" color={mutedText} pl={2} whiteSpace="nowrap">Sort by:</Text>
          <Select 
            variant="unstyled" 
            fontWeight="bold" 
            w="160px"
            cursor="pointer"
            value={`${sortField || 'name'}_${sortDir}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [field, dir] = val.split('_');
                setSortField(field);
                setSortDir(dir);
              }
            }}
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="base_rent_price_asc">Price (Low-High)</option>
            <option value="base_rent_price_desc">Price (High-Low)</option>
            <option value="status_asc">Status</option>
          </Select>
        </HStack>
      </Flex>

      {/* ===== GRID ===== */}
      <Box flex={1} overflowY="auto" pb={4} minH={0} className="hide-scroll">
        {isLoading ? (
          <Flex justify="center" align="center" h="full" minH="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : rooms.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4, "2xl": 5 }} spacing={6} pb={6}>
            {rooms.map((r) => {
              const activeLease = r.leases?.find(l => l.status === 'active');
              const tenantName = activeLease?.tenant?.name;
              let sinceDate = '';
              if (activeLease && activeLease.start_date) {
                const start = new Date(activeLease.start_date);
                sinceDate = `${String(start.getMonth() + 1).padStart(2,'0')}/${String(start.getDate()).padStart(2,'0')}`;
              }

              // Card theme based on mockup
              let theme = { bg: "white", color: "gray.800", priceColor: "gray.800", badgeBg: "gray.100", badgeColor: "gray.600", border: "1px solid", borderColor: "gray.200", watermarkColor: "gray.100" };
              
              if (r.status === 'occupied') {
                theme = { bg: "teal.500", color: "white", priceColor: "white", badgeBg: "white", badgeColor: "teal.500", border: "none", borderColor: "transparent", watermarkColor: "whiteAlpha.200" };
              } else if (r.status === 'available') {
                theme = { bg: "white", color: "gray.800", priceColor: "purple.600", badgeBg: "purple.50", badgeColor: "purple.600", border: "1px dashed", borderColor: "purple.200", watermarkColor: "purple.50" };
              } else if (r.status === 'maintenance') {
                theme = { bg: "white", color: "gray.800", priceColor: "gray.800", badgeBg: "orange.50", badgeColor: "orange.500", border: "1px solid", borderColor: "orange.200", watermarkColor: "orange.50" };
              }

              const RoomIcon = getRoomIcon(r.name);
              const WatermarkIcon = (r.status === 'occupied' && tenantName) ? FiUser : RoomIcon;

              return (
              <Box 
                key={r.uid} 
                bg={theme.bg} 
                color={theme.color}
                borderRadius="2xl" 
                shadow="sm" 
                border={theme.border} 
                borderColor={selectedIds.includes(r.uid) ? "blue.500" : theme.borderColor}
                position="relative"
                overflow="hidden"
                transition="all 0.2s"
                _hover={{ shadow: "md", transform: "translateY(-4px)" }}
                cursor="pointer"
                onClick={() => navigate(`/dashboard/rooms/viewroom/${r.uid}`)}
                minH="150px"
                p={4}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                {/* Watermark Background */}
                <Icon 
                  as={WatermarkIcon} 
                  position="absolute" 
                  bottom="-10px" 
                  right="-10px" 
                  w={32} 
                  h={32} 
                  color={theme.watermarkColor} 
                  zIndex={0} 
                  transform="rotate(-15deg)" 
                />
                
                {/* Content */}
                <Box position="relative" zIndex={1} h="full" display="flex" flexDirection="column" justifyContent="space-between">
                  {/* Top Bar */}
                  <Flex justify="space-between" align="flex-start">
                    {/* Badge */}
                    <Flex 
                      bg={theme.badgeBg} 
                      color={theme.badgeColor} 
                      pl={1.5} pr={3} py={1.5} 
                      borderRadius="full" 
                      align="center" 
                      gap={2} 
                      fontWeight="bold" 
                      fontSize="sm" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox 
                        isChecked={selectedIds.includes(r.uid)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, r.uid]);
                          else setSelectedIds(selectedIds.filter((id) => id !== r.uid));
                        }} 
                        colorScheme="blue" 
                        borderColor={theme.badgeColor} 
                        size="md"
                        bg="white"
                        borderRadius="sm"
                      />
                      <Flex align="center" gap={1}>
                        <Icon as={RoomIcon} />
                        <Text>{r.name}</Text>
                      </Flex>
                    </Flex>

                    {/* Price */}
                    <Flex align="center" gap={2}>
                      {r.status === 'occupied' && (
                        <Badge bg="green.400" color="white" border="none" borderRadius="md" px={2} py={0.5} fontSize="xs">-10%</Badge>
                      )}
                      <Text fontSize="xl" fontWeight="black" color={theme.priceColor}>${r.base_rent_price}</Text>
                    </Flex>
                  </Flex>

                  {/* Middle/Bottom */}
                  <Flex justify="space-between" align="flex-end" mt={8}>
                    {/* Left Icons */}
                    <Flex gap={2}>
                      {r.status === 'occupied' ? (
                        <>
                          <Flex align="center" justify="center" bg="white" w={7} h={7} borderRadius="full" color="teal.500">
                            <Icon as={FiBellOff} boxSize={3.5} />
                          </Flex>
                          <Flex align="center" justify="center" bg="white" w={7} h={7} borderRadius="full" color="teal.500">
                            <Icon as={FiDroplet} boxSize={3.5} />
                          </Flex>
                          <Flex align="center" justify="center" bg="white" w={7} h={7} borderRadius="full" color="teal.500" fontSize="xs" fontWeight="bold">
                            2
                          </Flex>
                        </>
                      ) : (
                        <Box />
                      )}
                    </Flex>

                    {/* Right Info */}
                    <Box textAlign="right">
                      {tenantName ? (
                        <>
                          <Text fontWeight="bold" fontSize="md" noOfLines={1} align="right">{tenantName}</Text>
                          <Text fontSize="10px" opacity={0.9} textTransform="uppercase" letterSpacing="wide" align="right" mt={0.5}>SINCE {sinceDate}</Text>
                        </>
                      ) : (
                        <Flex align="center" justify="center" bg={theme.badgeBg} w={8} h={8} borderRadius="full" color={theme.badgeColor} display="inline-flex">
                          <Icon as={FiUserX} boxSize={4} />
                        </Flex>
                      )}
                    </Box>
                  </Flex>

                  {/* Absolute Edit Button */}
                  <Box position="absolute" bottom={0} left="120px" onClick={(e) => e.stopPropagation()}>
                     <Tooltip label="Edit Room" hasArrow>
                        <IconButton
                          icon={<FiEdit2 />}
                          size="sm"
                          colorScheme="blue"
                          css={{
                            background: "transparent",
                            color: theme.color,
                            opacity: 0.3,
                            _hover: { opacity: 1, background: "rgba(0,0,0,0.1)" }
                          }}
                          onClick={() => navigate(`/dashboard/rooms/edit/${r.uid}`)}
                          aria-label="Edit room"
                          borderRadius="full"
                        />
                      </Tooltip>
                  </Box>
                </Box>
              </Box>
              );
            })}
          </SimpleGrid>
        ) : (
          <Flex justify="center" align="center" h="full" minH="300px" color={mutedText} bg={cardBg} borderRadius="2xl" border="2px dashed" borderColor={borderColor}>
            <VStack spacing={4}>
              <Box p={4} bg={bg} borderRadius="full">
                <FiEye size={40} color="gray.400" />
              </Box>
              <Text fontWeight="bold" fontSize="lg">{t("room.no_found")}</Text>
            </VStack>
          </Flex>
        )}
      </Box>

      {/* Bulk Disable */}
      {selectedIds.length > 0 && (
        <Box p={4} mt={4} mb={4} bg={cardBg} borderRadius="2xl" shadow="md" border="1px solid" borderColor="red.200" flexShrink={0}>
          <Flex justify="space-between" align="center">
            <Text fontWeight="bold" color="red.500">{selectedIds.length} rooms selected</Text>
            <Button
              colorScheme="red"
              onClick={() => setShowBulkDelete(true)}
              leftIcon={<FiTrash2 />}
              borderRadius="xl"
            >
              Disable Selected
            </Button>
          </Flex>
        </Box>
      )}


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
