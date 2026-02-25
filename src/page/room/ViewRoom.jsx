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
} from "@chakra-ui/react";
import { FiEdit2, FiArrowLeft, FiZap, FiDroplet, FiImage } from "react-icons/fi";

export default function ViewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activePhoto, setActivePhoto] = useState("");

  const bg = useColorModeValue("sky.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/v1/admin/rooms/${id}`, {
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
    fetchRoom();
  }, [id]);

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

  const handleOpenGallery = (path) => {
    setActivePhoto(`http://localhost:8000/storage/${path}`);
    onOpen();
  };

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Box maxW="7xl" mx="auto">
        {/* HEADER */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ sm: "center" }}
          mb={6}
          gap={4}
        >
          <Heading size="lg" color={useColorModeValue("sky.900", "white")}>
            Room Details: {room.name}
          </Heading>
          <Button
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            color={mutedText}
            onClick={() => navigate("/dashboard/rooms")}
            _hover={{ color: textColor, bg: "transparent" }}
            size="sm"
            textTransform="uppercase"
            letterSpacing="wider"
            fontSize="xs"
          >
            Back to List
          </Button>
        </Flex>

        <Flex direction="column" gap={6}>
          {/* Main Card */}
          <Box bg={cardBg} borderRadius="2xl" shadow="sm" overflow="hidden" border="1px" borderColor={borderColor}>
            <Flex direction={{ base: "column", lg: "row" }} p={8} gap={10}>
              {/* Left: Images */}
              <Box flex="1">
                {roomImages.length > 0 ? (
                  <Flex direction="column" gap={4}>
                    <Box
                      position="relative"
                      cursor="zoom-in"
                      onClick={() => handleOpenGallery(roomImages[0].path)}
                      role="group"
                      overflow="hidden"
                      borderRadius="2xl"
                      shadow="lg"
                    >
                      <Image
                        src={`http://localhost:8000/storage/${roomImages[0].path}`}
                        alt="Main"
                        w="full"
                        h="320px"
                        objectFit="cover"
                        transition="all 0.3s"
                        _groupHover={{ opacity: 0.9, transform: "scale(1.02)" }}
                      />
                      <Badge
                        position="absolute"
                        bottom={4}
                        right={4}
                        bg="blackAlpha.600"
                        color="white"
                        px={3}
                        py={1}
                        borderRadius="full"
                        textTransform="uppercase"
                        letterSpacing="widest"
                        fontSize="2xs"
                        backdropFilter="blur(8px)"
                      >
                        Main Photo
                      </Badge>
                    </Box>

                    {roomImages.length > 1 && (
                      <Grid templateColumns="repeat(4, 1fr)" gap={3}>
                        {roomImages.slice(1).map((img) => (
                          <GridItem key={img.id}>
                            <Box
                              cursor="pointer"
                              onClick={() => handleOpenGallery(img.path)}
                              role="group"
                              overflow="hidden"
                              borderRadius="xl"
                              border="1px"
                              borderColor={borderColor}
                            >
                              <Image
                                src={`http://localhost:8000/storage/${img.path}`}
                                alt="Thumbnail"
                                w="full"
                                h="80px"
                                objectFit="cover"
                                transition="all 0.3s"
                                _groupHover={{ transform: "scale(1.05)" }}
                              />
                            </Box>
                          </GridItem>
                        ))}
                      </Grid>
                    )}
                  </Flex>
                ) : (
                  <Flex
                    w="full"
                    h="320px"
                    bg="gray.50"
                    borderRadius="2xl"
                    border="2px dashed"
                    borderColor="gray.200"
                    align="center"
                    justify="center"
                    direction="column"
                    color="gray.400"
                  >
                    <Icon as={FiImage} boxSize={12} mb={2} color="gray.300" />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      No images uploaded
                    </Text>
                  </Flex>
                )}
              </Box>

              {/* Right: Info */}
              <Flex flex="1" direction="column" justify="space-between">
                <Box>
                  <Flex align="center" gap={3} mb={6}>
                    <Heading size="xl" textTransform="uppercase" letterSpacing="tight">
                      {room.name}
                    </Heading>
                    {room.size && (
                      <Badge
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="2xs"
                        bg="gray.100"
                        color="gray.700"
                        border="1px"
                        borderColor="gray.200"
                      >
                        {room.size}
                      </Badge>
                    )}
                    <Badge
                      px={3}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                      fontSize="2xs"
                      colorScheme={
                        room.status === "available" || room.status === "Free"
                          ? "green"
                          : room.status === "occupied"
                          ? "red"
                          : "orange"
                      }
                    >
                      {room.status}
                    </Badge>
                  </Flex>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={8}>
                    <Box bg="blue.50" borderLeft="4px" borderColor="blue.500" p={5} borderRadius="md">
                      <Text fontSize="2xs" fontWeight="black" color="blue.600" textTransform="uppercase" letterSpacing="widest" mb={1}>
                        Base Monthly Rent
                      </Text>
                      <Text fontSize="3xl" fontWeight="black" color="gray.900" lineHeight="1">
                        ${parseFloat(room.base_rent_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Text>
                    </Box>

                    {room.size && (
                      <Box bg="gray.50" borderLeft="4px" borderColor="gray.400" p={5} borderRadius="md">
                        <Text fontSize="2xs" fontWeight="black" color="gray.500" textTransform="uppercase" letterSpacing="widest" mb={1}>
                          Room Size
                        </Text>
                        <Text fontSize="3xl" fontWeight="black" color="gray.900" lineHeight="1">
                          {room.size}
                        </Text>
                      </Box>
                    )}
                  </Grid>

                  <Text color={mutedText} fontStyle="italic" mb={6} lineHeight="tall">
                    {room.description || "No description provided for this room."}
                  </Text>
                </Box>

                <Button
                  w="full"
                  bg="gray.900"
                  color="white"
                  size="lg"
                  py={6}
                  textTransform="uppercase"
                  fontSize="xs"
                  fontWeight="black"
                  letterSpacing="widest"
                  _hover={{ bg: "gray.800", transform: "translateY(-2px)", shadow: "lg" }}
                  transition="all 0.2s"
                  onClick={() => navigate(`/dashboard/rooms/edit/${room.uid}`)}
                  leftIcon={<FiEdit2 />}
                >
                  Edit Room Configuration
                </Button>
              </Flex>
            </Flex>
          </Box>

          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            {/* Furniture */}
            <GridItem colSpan={1}>
              <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor} h="full">
                <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color="gray.400" mb={6} pb={3} borderBottom="1px" borderColor="gray.100">
                  Inventory
                </Text>
                <Flex direction="column" gap={4}>
                  {assignedFurniture.length > 0 ? (
                    assignedFurniture.map((item) => (
                      <Flex key={item.id} align="center" justify="space-between">
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                          {item.name}
                        </Text>
                        <Badge fontSize="2xs" px={2} py={0.5} bg="gray.50" color="gray.500" borderRadius="md">
                          {item.condition || "Good"}
                        </Badge>
                      </Flex>
                    ))
                  ) : (
                    <Text fontSize="sm" fontStyle="italic" color={mutedText} py={4}>
                      This room is currently unfurnished.
                    </Text>
                  )}
                </Flex>
              </Box>
            </GridItem>

            {/* Leases */}
            <GridItem colSpan={2}>
              <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor} h="full">
                <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color="gray.400" mb={6} pb={3} borderBottom="1px" borderColor="gray.100">
                  Tenancy History
                </Text>
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
                          <Tr key={lease.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.100") }}>
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
                                {new Date(lease.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} -{" "}
                                {new Date(lease.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </Text>
                            </Td>
                            <Td py={4} isNumeric>
                              <Text fontSize="sm" fontWeight="black" color={textColor}>
                                ${parseFloat(lease.rent_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
            </GridItem>
          </Grid>

          {/* Utility Consumption */}
          <Box bg={cardBg} p={8} borderRadius="2xl" shadow="sm" border="1px" borderColor={borderColor}>
            <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color="gray.400" mb={6} pb={3} borderBottom="1px" borderColor="gray.100">
              Utility Consumption (All Time)
            </Text>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={8}>
              <Box bg="yellow.50" p={6} borderRadius="xl" border="1px" borderColor="yellow.100">
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontSize="xs" fontWeight="black" color="yellow.800" textTransform="uppercase" letterSpacing="widest">
                    Electricity
                  </Text>
                  <Icon as={FiZap} boxSize={5} color="yellow.500" />
                </Flex>
                <Flex align="baseline" gap={2}>
                  <Text fontSize="3xl" fontWeight="black" color="gray.900" lineHeight="1">
                    {(utilityStats?.electricity?.total_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">
                    kWh Total
                  </Text>
                </Flex>
                <Text mt={3} fontSize="xs" fontWeight="bold" color="yellow.700">
                  Avg: {(utilityStats?.electricity?.avg_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} kWh / Bill
                </Text>
              </Box>

              <Box bg="blue.50" p={6} borderRadius="xl" border="1px" borderColor="blue.100">
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontSize="xs" fontWeight="black" color="blue.800" textTransform="uppercase" letterSpacing="widest">
                    Water
                  </Text>
                  <Icon as={FiDroplet} boxSize={5} color="blue.500" />
                </Flex>
                <Flex align="baseline" gap={2}>
                  <Text fontSize="3xl" fontWeight="black" color="gray.900" lineHeight="1">
                    {(utilityStats?.water?.total_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">
                    m³ Total
                  </Text>
                </Flex>
                <Text mt={3} fontSize="xs" fontWeight="bold" color="blue.700">
                  Avg: {(utilityStats?.water?.avg_usage || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} m³ / Bill
                </Text>
              </Box>
            </Grid>

            {/* Bills Table */}
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500" mb={4}>
              Recent Utility Bills
            </Text>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Date</Th>
                    <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Type</Th>
                    <Th color="gray.400" fontSize="2xs" letterSpacing="widest">Usage</Th>
                    <Th color="gray.400" fontSize="2xs" letterSpacing="widest" isNumeric>Amount</Th>
                    <Th color="gray.400" fontSize="2xs" letterSpacing="widest" isNumeric>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {room.utilityBills && room.utilityBills.length > 0 ? (
                    [...room.utilityBills]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 5)
                      .map((bill) => (
                        <Tr key={bill.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.100") }}>
                          <Td py={3}>
                            <Text fontSize="xs" fontWeight="bold" color={textColor}>
                              {new Date(bill.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </Text>
                          </Td>
                          <Td py={3}>
                            <Badge
                              fontSize="2xs"
                              px={2}
                              py={0.5}
                              colorScheme={bill.type === "electricity" ? "yellow" : bill.type === "water" ? "blue" : "gray"}
                            >
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
                              ${parseFloat(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </Text>
                          </Td>
                          <Td py={3} isNumeric>
                            <Badge fontSize="2xs" colorScheme={bill.status === "paid" ? "green" : "red"}>
                              {bill.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                  ) : (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={6} fontStyle="italic" fontSize="xs" color={mutedText}>
                        No utility bill history recorded.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </Flex>
      </Box>

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
