import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  Badge,
  Stack,
  Icon,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  VStack,
  HStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { FiSearch, FiMapPin, FiMaximize, FiPhone, FiLogIn, FiMail, FiArrowRight, FiArrowUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../assets/Arun_MuyKea.png";
import api from "../api/axios";

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({
    app_name: "Arun Muy Kea",
    company_name: "Arun Muy Kea",
    address: "Phnom Penh, Cambodia",
    phone: "+855 87 94 60 60",
    email: "support@roomrent100.com",
    currency: "$"
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");

  useEffect(() => {
    fetchRooms();
    fetchSettings();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/public/rooms");
      const data = response.data;
      // Handle Laravel pagination (data.data) or simple array (data)
      const roomList = data.data || data;
      setRooms(Array.isArray(roomList) ? roomList : []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get("/public/settings");
      const data = response.data;
      if (data && Object.keys(data).length > 0) {
        setSettings({
          app_name: data.app_name || "RoomRent 100",
          company_name: data.company_name || "RoomRent 100",
          address: data.contact_address || "Phnom Penh, Cambodia",
          phone: data.contact_phone || "+855 12 345 678",
          email: data.contact_email || "support@roomrent100.com",
          currency: data.finance_currency || "$"
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Toggle display logic
  const displayedRooms = showAll ? filteredRooms : filteredRooms.slice(0, 6);

  return (
    <Box bg={bg} minH="100vh">
      {/* Navbar */}
      <Box bg={cardBg} px={4} shadow="sm" position="sticky" top="0" zIndex="1000">
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={2} cursor="pointer" onClick={() => navigate("/")}>
              <Box p={1} borderRadius="md" display="flex" alignItems="center">
                <Image src={Logo} alt="Logo" boxSize="150px" objectFit="contain" />
              </Box>
            </HStack>
            <HStack spacing={4}>
              <Button leftIcon={<FiLogIn />} variant="ghost" onClick={() => navigate("/login")}>
                {t("common.login") || "Login"}
              </Button>
              <Button colorScheme="blue" onClick={() => navigate("/login")}>
                Get Started
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bg="blue.600" py={20} color="white">
        <Container maxW="container.xl">
          <Stack direction={{ base: "column", md: "row" }} spacing={10} align="center">
            <VStack align="flex-start" spacing={6} flex="1">
              <Heading as="h1" size="2xl" lineHeight="shorter">
                Find Your Perfect Room <br />
                With Zero Hassle
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Modern, affordable, and fully managed rooms available now at <b>{settings.company_name}</b>. 
                Browse our collection and find your next home today.
              </Text>
              <Box w="full" maxW="md">
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input 
                    bg="white" 
                    color="gray.800" 
                    placeholder="Search by room name or details..." 
                    _placeholder={{ color: "gray.400" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Box>
            </VStack>
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <Image 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                borderRadius="2xl" 
                shadow="2xl"
                alt="Room Hero"
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Available Rooms Section */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8} align="flex-start" mb={12}>
          <Heading size="lg" borderBottom="4px solid" borderColor="blue.500" pb={2}>
            Available Rooms
          </Heading>
          <Text color={textColor}>
            Browse our current vacancies and find a space that fits your lifestyle.
          </Text>
        </VStack>

        {loading ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </Flex>
        ) : displayedRooms.length > 0 ? (
          <>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10}>
              {displayedRooms.map((room) => (
                <Box 
                  key={room.uid} 
                  bg={cardBg} 
                  borderRadius="xl" 
                  overflow="hidden" 
                  shadow="md" 
                  transition="transform 0.2s"
                  _hover={{ transform: "translateY(-8px)", shadow: "xl" }}
                >
                  <Box position="relative" h="240px">
                    <Image
                      src={room.images && room.images.length > 0 
                        ? `http://localhost:8000/storage/${room.images[0].path}` 
                        : "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                      alt={room.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                    <Badge 
                      position="absolute" 
                      top={4} 
                      right={4} 
                      colorScheme="green" 
                      px={3} 
                      py={1} 
                      borderRadius="full"
                      fontSize="sm"
                    >
                      Available
                    </Badge>
                  </Box>
                  
                  <VStack p={6} align="flex-start" spacing={4}>
                    <Flex justify="space-between" w="full" align="center">
                      <Heading size="md" color="blue.600">{room.name}</Heading>
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">{settings.currency || "$"}{room.base_rent_price}</Text>
                    </Flex>
                    
                    <HStack spacing={4} color="gray.500" fontSize="sm">
                      <Flex align="center">
                        <Icon as={FiMapPin} mr={1} />
                        <Text>Floor {room.floor || 0}</Text>
                      </Flex>
                      <Flex align="center">
                        <Icon as={FiMaximize} mr={1} />
                        <Text>{room.size || "N/A"}</Text>
                      </Flex>
                    </HStack>

                    <Text color={textColor} noOfLines={2} fontSize="sm">
                      {room.description || "No description provided for this room. Contact us for more details."}
                    </Text>

                    <Divider />

                    <HStack w="full">
                      <Button flex="1" colorScheme="blue" variant="outline" onClick={() => setSelectedRoom(room)}>
                        View Details
                      </Button>
                      <Button 
                        as="a" 
                        href={`tel:${settings.phone}`} 
                        flex="1" 
                        colorScheme="blue" 
                        leftIcon={<FiPhone />}
                      >
                        Contact
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
            
            {/* Toggle All Rooms Button */}
            {filteredRooms.length > 6 && (
              <Flex justify="center" mt={12}>
                <Button 
                  size="lg" 
                  colorScheme="blue" 
                  variant="outline" 
                  onClick={() => setShowAll(!showAll)}
                  rightIcon={showAll ? <FiArrowUp /> : <FiArrowRight />}
                >
                  {showAll ? "Show Less" : `View All Rooms (${filteredRooms.length})`}
                </Button>
              </Flex>
            )}
          </>
        ) : (
          <Box py={20} textAlign="center" w="full">
            <Text fontSize="lg" color="gray.500">No rooms currently available that match your search.</Text>
            <Button mt={4} variant="link" colorScheme="blue" onClick={() => setSearch("")}>
              Clear Search
            </Button>
          </Box>
        )}
      </Container>

      {/* Map Section */}
      <Box bg={useColorModeValue("white", "gray.800")} py={16}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="flex-start" mb={8}>
            <Heading size="lg" borderBottom="4px solid" borderColor="blue.500" pb={2}>
              Our Location
            </Heading>
            <Text color={textColor}>
              Visit us or get in touch. We are conveniently located at <b>{settings.address}</b>.
            </Text>
          </VStack>
          <Box 
            w="full" 
            h={{ base: "300px", md: "450px" }} 
            borderRadius="xl" 
            overflow="hidden" 
            shadow="lg" 
            border="1px solid" 
            borderColor={useColorModeValue("gray.200", "gray.700")}
          >
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || "Phnom Penh, Cambodia")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              title="Location Map"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.800" color="gray.400" py={12}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            <VStack align="flex-start" spacing={4}>
              <Heading size="md" color="white">{settings.app_name}</Heading>
              <Text fontSize="sm">
                The most reliable room rental management system. Powered by <b>{settings.company_name}</b>.
              </Text>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">Quick Links</Heading>
              <Button variant="link" size="sm" onClick={() => navigate("/")}>Home</Button>
              <Button variant="link" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button variant="link" size="sm" onClick={() => setShowAll(true)}>Available Rooms</Button>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">Contact Details</Heading>
              <HStack>
                <Icon as={FiMapPin} />
                <Text fontSize="sm">{settings.address}</Text>
              </HStack>
              <HStack>
                <Icon as={FiPhone} />
                <Text fontSize="sm">{settings.phone}</Text>
              </HStack>
              <HStack>
                <Icon as={FiMail} />
                <Text fontSize="sm">{settings.email}</Text>
              </HStack>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">About</Heading>
              <Text fontSize="sm">Find your perfect home with our easy-to-use rental platform. We prioritize comfort and affordability.</Text>
            </VStack>
          </SimpleGrid>
          <Divider my={8} borderColor="gray.700" />
          <Text textAlign="center" fontSize="xs">
            © {new Date().getFullYear()} {settings.company_name}. All rights reserved.
          </Text>
        </Container>
      </Box>

      {/* Room Details Modal */}
      <Modal isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} size="xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader color="blue.600">{selectedRoom?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRoom && (
              <VStack spacing={6} align="stretch">
                <Box h="300px" borderRadius="md" overflow="hidden">
                  <Image
                    src={selectedRoom.images && selectedRoom.images.length > 0 
                      ? `http://localhost:8000/storage/${selectedRoom.images[0].path}` 
                      : "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                    alt={selectedRoom.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
                
                <Flex justify="space-between" align="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {settings.currency || "$"}{selectedRoom.base_rent_price} / month
                  </Text>
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">Available</Badge>
                </Flex>

                <HStack spacing={6} color="gray.500" divider={<Divider orientation="vertical" h="4" />}>
                  <Flex align="center"><Icon as={FiMapPin} mr={2} /><Text>Floor {selectedRoom.floor || 0}</Text></Flex>
                  <Flex align="center"><Icon as={FiMaximize} mr={2} /><Text>{selectedRoom.size || "Standard Size"}</Text></Flex>
                </HStack>

                <Box>
                  <Heading size="sm" mb={2}>Description</Heading>
                  <Text color={textColor}>
                    {selectedRoom.description || "No description provided. Please contact us for more details about this room."}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg={useColorModeValue("gray.50", "gray.700")} borderTop="1px solid" borderColor={useColorModeValue("gray.200", "gray.600")}>
            <Button 
              as="a" 
              href={`tel:${settings.phone}`} 
              colorScheme="blue" 
              leftIcon={<FiPhone />} 
              mr={3}
            >
              Contact to Book
            </Button>
            <Button onClick={() => setSelectedRoom(null)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default Landing;
