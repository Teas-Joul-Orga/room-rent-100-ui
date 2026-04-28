import React, { useState, useEffect } from "react";
import { useSessionState } from "../../hooks/useSessionState";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  Box,
  Flex,
  Heading,
  Button,
  Input,
  Select,
  Text,
  HStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Spinner,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { FiEye, FiDownload, FiLayout, FiBriefcase, FiStar, FiAward, FiUserPlus, FiMapPin, FiMaximize, FiDollarSign } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";

const getRoomIcon = (name = "") => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('10')) return FiBriefcase;
  if (lowerName.includes('3')) return FiStar;
  if (lowerName.includes('4')) return FiAward;
  return FiLayout;
};

export default function AvailableRoom() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useSessionState("availRoomsSearch", "");
  const [rooms, setRooms] = useSessionState("availRoomsCache", []);
  
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem("availRoomsCache");
  });
  
  const [sortField, setSortField] = useSessionState("availRoomsSortField", null);
  const [sortDir, setSortDir] = useSessionState("availRoomsSortDir", "desc");

  const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));

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
      let url = `http://localhost:8000/api/v1/admin/rooms?page=1&limit=1000&search=${search}&status=available`;
      if (sortField) url += `&sort=${sortField}&direction=${sortDir}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        const avail = (data.data || []).filter(r => r.status === 'available');
        setRooms(avail);
      } else {
        toast.error("Failed to fetch available rooms.");
      }
    } catch (err) {
      toast.error("Network error fetching available rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");

  return (
    <Box p={6} bg={bg} h={{ base: "auto", lg: "calc(100vh - 140px)" }} overflow="hidden" display="flex" flexDirection="column">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <Flex direction={{ base: "column", sm: "row" }} align={{ sm: "center" }} justify="space-between" gap={4} mb={6} flexShrink={0}>
        <Heading size="lg" color={useColorModeValue("sky.900", "white")}>
          Available Rooms
        </Heading>
        <HStack spacing={3}>
          <Button
            display={{ base: "none", sm: "flex" }}
            leftIcon={<FiDownload />}
            colorScheme="green"
            variant="outline"
            onClick={() => {
              const dataToExport = rooms.map(r => ({
                "Name": r.name,
                "Price": r.base_rent_price,
                "Floor": r.floor || "N/A",
                "Size": r.size || "N/A",
                "Created At": new Date(r.created_at).toLocaleDateString()
              }));
              exportToExcel(dataToExport, "Available_Rooms_" + new Date().toISOString().split('T')[0]);
            }}
            shadow="sm"
          >
            Export Excel
          </Button>
        </HStack>
      </Flex>

      {/* ===== SEARCH & FILTER ===== */}
      <Flex direction={{ base: "column", md: "row" }} gap={4} mb={6} flexShrink={0}>
        <Box bg={cardBg} p={2} borderRadius="xl" shadow="sm" flex={1}>
          <Input
            placeholder={t("room.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              const RoomIcon = getRoomIcon(r.name);
              
              return (
              <Box 
                key={r.uid} 
                bg={cardBg} 
                color={textColor}
                borderRadius="2xl" 
                shadow="sm" 
                border="1px solid" 
                borderColor={borderColor}
                position="relative"
                overflow="hidden"
                transition="all 0.2s"
                _hover={{ shadow: "lg", transform: "translateY(-4px)" }}
                minH="220px"
                display="flex"
                flexDirection="column"
              >
                {/* Header */}
                <Flex p={4} justify="space-between" align="center" borderBottom="1px solid" borderColor={borderColor} bg={useColorModeValue("purple.50", "purple.900")}>
                  <Flex align="center" gap={2}>
                    <Icon as={RoomIcon} color="purple.500" />
                    <Text fontWeight="bold" fontSize="lg" color={useColorModeValue("purple.700", "purple.200")}>{r.name}</Text>
                  </Flex>
                  <Badge colorScheme="purple" px={2} py={0.5} borderRadius="full" fontSize="xs">
                    Available
                  </Badge>
                </Flex>

                {/* Booking Fields / Details */}
                <VStack p={4} align="stretch" spacing={3} flex={1}>
                  <HStack justify="space-between">
                    <HStack color={mutedText}>
                      <Icon as={FiDollarSign} />
                      <Text fontSize="sm" fontWeight="bold">Base Rent</Text>
                    </HStack>
                    <Text fontWeight="black" color="green.500" fontSize="lg">${r.base_rent_price}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <HStack color={mutedText}>
                      <Icon as={FiMapPin} />
                      <Text fontSize="sm" fontWeight="bold">Floor</Text>
                    </HStack>
                    <Text fontWeight="bold" color={textColor}>{r.floor || "N/A"}</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <HStack color={mutedText}>
                      <Icon as={FiMaximize} />
                      <Text fontSize="sm" fontWeight="bold">Size</Text>
                    </HStack>
                    <Text fontWeight="bold" color={textColor}>{r.size || "N/A"}</Text>
                  </HStack>
                </VStack>

                {/* Action Buttons */}
                <Flex p={4} gap={2} borderTop="1px solid" borderColor={borderColor} bg={useColorModeValue("gray.50", "whiteAlpha.50")}>
                  <Button 
                    flex={1} 
                    leftIcon={<FiEye />} 
                    variant="outline" 
                    colorScheme="blue" 
                    size="sm"
                    borderRadius="lg"
                    onClick={() => navigate(`/dashboard/rooms/viewroom/${r.uid}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    flex={1} 
                    leftIcon={<FiUserPlus />} 
                    colorScheme="blue" 
                    size="sm"
                    borderRadius="lg"
                    onClick={() => navigate(`/dashboard/lease/new?room_id=${r.id}`)}
                  >
                    Book / Lease
                  </Button>
                </Flex>
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
              <Text fontWeight="bold" fontSize="lg">No Available Rooms Found</Text>
            </VStack>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
