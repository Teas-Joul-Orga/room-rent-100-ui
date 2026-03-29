import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Image,
  Badge,
  Button,
  Icon,
  Spinner,
  useColorModeValue,
  Center,
  VStack,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { FiHome, FiMaximize, FiArrowRight, FiInfo, FiLayers } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import roomPlaceholder from "../../assets/room-placeholder.png";

const API_URL = "http://localhost:8000/api/v1/public/rooms";

export default function AvailableRooms() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        // The public API returns paginated data (data.data)
        setRooms(data.data || []);
      } else {
        toast.error("Failed to load available rooms");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const currency = localStorage.getItem("currency") || "$";
    const exchangeRate = Number(localStorage.getItem("exchangeRate") || 4000);
    const num = Number(amount || 0);

    if (currency === "៛" || currency === "KHR" || currency === "Riel") {
      return `៛${Math.round(num * exchangeRate).toLocaleString()}`;
    }
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="calc(100vh - 80px)">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <VStack align="flex-start" spacing={2} mb={8}>
        <Heading size="xl" color="blue.600" letterSpacing="tight">
          {t("room.available_title")}
        </Heading>
        <Text color={mutedText} fontSize="lg">
          {t("room.available_subtitle")}
        </Text>
      </VStack>

      {isLoading ? (
        <Center h="400px">
          <Spinner size="xl" color="blue.500" thickness="4px" />
        </Center>
      ) : rooms.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
          {rooms.map((room) => (
            <Box
              key={room.id}
              bg={cardBg}
              borderRadius="2xl"
              overflow="hidden"
              border="1px solid"
              borderColor={borderColor}
              transition="all 0.3s"
              _hover={{ shadow: "2xl", transform: "translateY(-8px)" }}
              display="flex"
              flexDirection="column"
              role="group"
            >
              {/* Image Container */}
              <Box position="relative" overflow="hidden" h="220px">
                <Image
                  src={room.images?.[0] ? `http://localhost:8000/storage/${room.images[0].path}` : roomPlaceholder}
                  alt={room.name}
                  w="full"
                  h="full"
                  objectFit="cover"
                  transition="transform 0.5s"
                  _groupHover={{ transform: "scale(1.1)" }}
                />
                <Box
                  position="absolute"
                  top={4}
                  right={4}
                  bg="whiteAlpha.900"
                  px={3}
                  py={1}
                  borderRadius="full"
                  shadow="sm"
                  backdropFilter="blur(4px)"
                >
                  <Text fontSize="sm" fontWeight="black" color="blue.600">
                    {formatCurrency(room.base_rent_price)}
                  </Text>
                </Box>
                {room.size && (
                  <Badge
                    position="absolute"
                    bottom={4}
                    left={4}
                    colorScheme="blue"
                    variant="solid"
                    borderRadius="md"
                    px={2}
                    py={1}
                    fontSize="xs"
                  >
                    {room.size}
                  </Badge>
                )}
              </Box>

              {/* Content */}
              <Box p={5} flex="1">
                <VStack align="flex-start" spacing={3}>
                  <Flex justify="space-between" align="center" w="full">
                    <HStack spacing={2}>
                      <Icon as={FiHome} color="blue.500" />
                      <Heading size="md" color={textColor} letterSpacing="tight">
                        {room.name}
                      </Heading>
                    </HStack>
                    <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2}>
                      {t("room.available")}
                    </Badge>
                  </Flex>
                  
                  <Text fontSize="sm" color={mutedText} noOfLines={2} minH="40px">
                    {room.description || "No description provided for this room."}
                  </Text>

                  <Divider borderColor={borderColor} />

                  <SimpleGrid columns={2} w="full" spacing={2}>
                    <HStack color={mutedText} fontSize="xs">
                      <Icon as={FiLayers} />
                      <Text fontWeight="bold">Standard Type</Text>
                    </HStack>
                    <HStack color={mutedText} fontSize="xs">
                      <Icon as={FiMaximize} />
                      <Text fontWeight="bold">{room.size || "Unknown Size"}</Text>
                    </HStack>
                  </SimpleGrid>

                  <Button
                    mt={2}
                    w="full"
                    colorScheme="blue"
                    rightIcon={<FiArrowRight />}
                    onClick={() => navigate(`/dashboard/available-rooms/${room.id}`)}
                    variant="light"
                    bg="blue.50"
                    color="blue.600"
                    _hover={{ bg: "blue.500", color: "white" }}
                    _dark={{ bg: "blue.900", color: "blue.200", _hover: { bg: "blue.500", color: "white" } }}
                    borderRadius="xl"
                    fontWeight="black"
                    textTransform="uppercase"
                    fontSize="xs"
                    letterSpacing="wider"
                  >
                    {t("room.view_detail")}
                  </Button>
                </VStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Center h="400px" bg={cardBg} borderRadius="3xl" border="2px dashed" borderColor={borderColor}>
          <VStack spacing={4}>
            <Icon as={FiInfo} boxSize={12} color="gray.400" />
            <Text fontSize="xl" fontWeight="bold" color={mutedText}>
              No rooms currently available.
            </Text>
          </VStack>
        </Center>
      )}
    </Box>
  );
}
