import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Badge,
  Button,
  Icon,
  Spinner,
  useColorModeValue,
  Grid,
  GridItem,
  VStack,
  HStack,
  Divider,
  SimpleGrid,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  IconButton,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiHome,
  FiMaximize,
  FiLayers,
  FiCheckCircle,
  FiInfo,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import roomPlaceholder from "../../assets/room-placeholder.png";

const API_URL = "http://localhost:8000/api/v1/public/rooms";

export default function AvailableRoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetchRoomDetail();
  }, [id]);

  const fetchRoomDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
      } else {
        toast.error("Failed to load room details");
        navigate("/dashboard/available-rooms");
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

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg={bg}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  if (!room) return null;

  const images = room.images || [];

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="calc(100vh - 80px)">
      <Toaster position="top-right" />

      {/* Breadcrumb / Back button */}
      <Flex align="center" mb={6} justify="space-between">
        <HStack spacing={4}>
          <IconButton
            icon={<FiArrowLeft />}
            onClick={() => navigate("/dashboard/available-rooms")}
            variant="ghost"
            aria-label="Back"
          />
          <Breadcrumb fontSize="sm" color={mutedText} display={{ base: "none", md: "block" }}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/dashboard/available-rooms")}>
                {t("sidebar.available_rooms")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink color={textColor} fontWeight="bold">
                {room.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "1fr", lg: "7fr 5fr" }} gap={8}>
        {/* Left Column: Image Gallery & Description */}
        <VStack spacing={8} align="stretch">
          {/* Main Photo Gallery */}
          <Box bg={cardBg} borderRadius="3xl" p={4} shadow="sm" border="1px" borderColor={borderColor}>
            <Box position="relative" h={{ base: "300px", md: "500px" }} borderRadius="2xl" overflow="hidden" mb={4}>
              <Image
                src={images[activeImageIndex] ? `http://localhost:8000/storage/${images[activeImageIndex].path}` : roomPlaceholder}
                alt={room.name}
                w="full"
                h="full"
                objectFit="cover"
              />
              
              {/* Image Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <IconButton
                    icon={<FiChevronLeft />}
                    position="absolute"
                    left={4}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                    colorScheme="blackAlpha"
                    isRound
                    aria-label="Previous image"
                  />
                  <IconButton
                    icon={<FiChevronRight />}
                    position="absolute"
                    right={4}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={() => setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                    colorScheme="blackAlpha"
                    isRound
                    aria-label="Next image"
                  />
                </>
              )}
            </Box>

            {/* Thumbnails */}
            {images.length > 1 && (
              <HStack spacing={4} overflowX="auto" pb={2} px={1}>
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    cursor="pointer"
                    onClick={() => setActiveImageIndex(idx)}
                    borderRadius="lg"
                    overflow="hidden"
                    border="2px solid"
                    borderColor={activeImageIndex === idx ? "blue.500" : "transparent"}
                    minW="80px"
                    h="60px"
                    transition="all 0.2s"
                    _hover={{ opacity: 0.8 }}
                  >
                    <Image
                      src={`http://localhost:8000/storage/${img.path}`}
                      alt={`Thumbnail ${idx}`}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </HStack>
            )}
          </Box>

          {/* Description */}
          <Box bg={cardBg} borderRadius="3xl" p={8} shadow="sm" border="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} color={textColor} display="flex" align="center" gap={2}>
              <Icon as={FiInfo} color="blue.500" />
              {t("common.description")}
            </Heading>
            <Text color={mutedText} lineHeight="tall" whiteSpace="pre-wrap">
              {room.description || "No detailed description available for this room."}
            </Text>
          </Box>
        </VStack>

        {/* Right Column: Room Info & Action */}
        <VStack spacing={8} align="stretch" position={{ lg: "sticky" }} top="8">
          <Box bg={cardBg} borderRadius="3xl" p={8} shadow="lg" border="1px" borderColor={borderColor} position="relative" overflow="hidden">
            {/* Decoration */}
            <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="blue.50" borderRadius="full" zIndex={0} _dark={{ bg: "whiteAlpha.50" }} />
            
            <VStack align="flex-start" spacing={6} position="relative" zIndex={1}>
              <VStack align="flex-start" spacing={1}>
                <Badge colorScheme="green" variant="solid" borderRadius="full" px={3} py={0.5} fontSize="xs">
                  {t("room.available")}
                </Badge>
                <Heading size="xl" color={textColor} letterSpacing="tight">
                  {room.name}
                </Heading>
              </VStack>

              <Box w="full">
                <Text fontSize="xs" fontWeight="black" color="blue.500" textTransform="uppercase" letterSpacing="widest" mb={1}>
                  {t("room.price")}
                </Text>
                <Heading size="xl" color="blue.600">
                  {formatCurrency(room.base_rent_price)}
                  <Text as="span" fontSize="lg" fontWeight="bold" color={mutedText} ml={2}>
                    / month
                  </Text>
                </Heading>
              </Box>

              <SimpleGrid columns={2} spacing={4} w="full">
                <Box bg={bg} p={4} borderRadius="2xl" border="1px" borderColor={borderColor}>
                  <HStack spacing={3}>
                    <Icon as={FiMaximize} color="blue.500" boxSize={5} />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="2xs" color="gray.400" fontWeight="bold">{t("room.size")}</Text>
                      <Text fontWeight="bold" fontSize="sm">{room.size || "N/A"}</Text>
                    </VStack>
                  </HStack>
                </Box>
                <Box bg={bg} p={4} borderRadius="2xl" border="1px" borderColor={borderColor}>
                  <HStack spacing={3}>
                    <Icon as={FiLayers} color="blue.500" boxSize={5} />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="2xs" color="gray.400" fontWeight="bold">{t("room.floor")}</Text>
                      <Text fontWeight="bold" fontSize="sm">Floor 1</Text>
                    </VStack>
                  </HStack>
                </Box>
              </SimpleGrid>

              <Divider borderColor={borderColor} />

              <VStack align="flex-start" spacing={4} w="full">
                <Text fontSize="sm" fontWeight="black" color={textColor} textTransform="uppercase" letterSpacing="widest">
                  {t("room.amenities")}
                </Text>
                {room.furniture && room.furniture.length > 0 ? (
                  <SimpleGrid columns={2} spacing={3} w="full">
                    {room.furniture.map((item, idx) => (
                      <HStack key={idx} spacing={2}>
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text fontSize="sm" fontWeight="medium" color={mutedText}>{item.name}</Text>
                      </HStack>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text fontSize="sm" color={mutedText} fontStyle="italic">
                    No special furniture or amenities listed.
                  </Text>
                )}
              </VStack>

              <Button
                w="full"
                size="lg"
                colorScheme="blue"
                leftIcon={<FiMessageSquare />}
                h="60px"
                borderRadius="2xl"
                shadow="md"
                onClick={() => navigate("/dashboard/chat")}
                fontSize="md"
                fontWeight="black"
              >
                {t("room.inquire")}
              </Button>

              <Text fontSize="xs" color="gray.400" textAlign="center" w="full">
                Clicking the button will open a chat with our management team.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Grid>
    </Box>
  );
}
