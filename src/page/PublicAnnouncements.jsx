import React, { useState, useEffect, useMemo } from "react";
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
  HStack,
  Icon,
  Divider,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  useDisclosure,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiMapPin, FiPhone, FiLogIn, FiMail, FiInfo, FiGrid, FiHome, FiSpeaker, FiUsers } from "react-icons/fi";
import { LuCircleUser, LuLogOut, LuSettings } from "react-icons/lu";
import { IoKeyOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import Logo from "../assets/Arun_MuyKea.png";
import api from "../api/axios";
import LanguageSwitcher from "../components/LanguageSwitcher";

const MotionBox = motion(Box);

const PublicAnnouncements = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    app_name: "Arun Muy Kea",
    company_name: "Arun Muy Kea",
    address: "Phnom Penh, Cambodia",
    phone: "+855 87 94 60 60",
    email: "support@roomrent100.com",
  });
  
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    onImageOpen();
  };

  const isLoggedIn = useMemo(() => 
    localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true", 
  []);

  const userDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : { name: "User" };
    } catch { return { name: "User" }; }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const bg = "gray.50";
  const cardBg = "white";

  useEffect(() => {
    fetchSettings();
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get("/public/announcements");
      if (response.data && response.data.data) {
        setAnnouncements(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get("/public/settings");
      if (response.data && Object.keys(response.data).length > 0) {
        setSettings({
          app_name: response.data.app_name || "RoomRent 100",
          company_name: response.data.company_name || "RoomRent 100",
          address: response.data.contact_address || "Phnom Penh, Cambodia",
          phone: response.data.contact_phone || "+855 12 345 678",
          email: response.data.contact_email || "support@roomrent100.com"
        });
      }
    } catch (error) {}
  };

  return (
    <Box bg={bg} color="gray.800" minH="100vh" display="flex" flexDirection="column">
      <Toaster position="top-right" />
      
      {/* Navbar */}
      <Box bg={cardBg} px={4} shadow="sm" position="sticky" top="0" zIndex="1000">
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={4} align="center">
              <Box p={1} borderRadius="md" display="flex" alignItems="center" cursor="pointer" onClick={() => navigate("/")}>
                <Image src={Logo} alt="Logo" boxSize="150px" objectFit="contain" />
              </Box>
            </HStack>
            
            <HStack spacing={4}>
              <LanguageSwitcher />
              {isLoggedIn ? (
                <Menu placement="bottom-end">
                  <MenuButton
                    as={Flex}
                    alignItems="center"
                    gap={2}
                    px={3}
                    py={1.5}
                    borderRadius="xl"
                    cursor="pointer"
                    bg="transparent"
                    color="gray.600"
                    fontWeight="semibold"
                    fontSize="sm"
                    transition="all 0.2s"
                    _hover={{ bg: "gray.100", color: "gray.800" }}
                  >
                    <HStack spacing={2}>
                      <Text display={{ base: "none", sm: "block" }}>{userDetails.name}</Text>
                      <Avatar size="sm" name={userDetails.name} bg="blue.600" color="white" fontWeight="black" />
                    </HStack>
                  </MenuButton>
                  <MenuList borderRadius="xl" boxShadow="lg" borderColor="gray.200" p={1}>
                    <MenuItem icon={<FiGrid size={18} />} fontSize="sm" fontWeight="semibold" borderRadius="md" _hover={{ bg: "gray.100", color: "blue.500" }} onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </MenuItem>
                    <MenuItem icon={<LuCircleUser size={18} />} fontSize="sm" fontWeight="semibold" borderRadius="md" _hover={{ bg: "gray.100", color: "blue.500" }} onClick={() => navigate("/dashboard/profile")}>
                      Profile
                    </MenuItem>
                    <MenuItem icon={<LuSettings size={18} />} fontSize="sm" fontWeight="semibold" borderRadius="md" _hover={{ bg: "gray.100", color: "blue.500" }} onClick={() => navigate("/dashboard/settings")}>
                      Settings
                    </MenuItem>
                    <MenuDivider borderColor="gray.200" />
                    <MenuItem icon={<LuLogOut size={18} />} fontSize="sm" fontWeight="semibold" color="red.600" borderRadius="md" _hover={{ bg: "red.50" }} onClick={handleLogout}>
                      Log Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <>
                  <Button leftIcon={<FiLogIn />} variant="ghost" color="gray.800" _hover={{ bg: "gray.100" }} _active={{ bg: "gray.200" }} onClick={() => navigate("/login")} rounded="full" fontWeight="bold" fontSize="sm">
                    {t("common.login")}
                  </Button>
                </>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box 
        position="relative" 
        w="full" 
        minH="40vh" 
        display="flex" 
        alignItems="center"
        backgroundImage="url('https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=2000')"
        backgroundSize="cover"
        backgroundPosition="center"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          bgGradient: "linear(to-b, blackAlpha.300, transparent, blackAlpha.600)",
        }}
      >
        {/* Floating Pill Navbar */}
        <Flex position="fixed" top="85px" w="full" justify="center" zIndex={1100}>
          <Flex bg="whiteAlpha.900" backdropFilter="blur(10px)" borderRadius="full" shadow="xl" p={1.5} align="center" border="1px solid" borderColor="whiteAlpha.500">
            <Button leftIcon={<FiHome />} variant="ghost" color="gray.700" borderRadius="full" px={6} py={6} fontSize="15px" fontWeight="bold" _hover={{ bg: "blackAlpha.100" }} onClick={() => navigate('/')}>{t('nav.home')}</Button>
            <Button leftIcon={<FiSpeaker />} colorScheme="blue" bg="blue.500" color="white" borderRadius="full" px={6} py={6} fontSize="15px" fontWeight="bold" _hover={{ bg: "blue.600" }} onClick={() => navigate('/announcements')}>{t('nav.announcement')}</Button>
            <Button leftIcon={<FiUsers />} variant="ghost" color="gray.700" borderRadius="full" px={6} py={6} fontSize="15px" fontWeight="bold" _hover={{ bg: "blackAlpha.100" }} onClick={() => navigate('/about')}>{t('nav.about_us')}</Button>
          </Flex>
        </Flex>

        <Container maxW="container.xl" position="relative" zIndex={2} mt={16}>
          <VStack align="center" spacing={4} textAlign="center">
            <Heading as="h1" size="2xl" color="white" letterSpacing="tight">
              Latest Announcements
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="2xl">
              Stay up to date with the latest news, maintenance schedules, and important information from {settings.company_name}.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Announcements Content */}
      <Box flex="1" bg="gray.50">
        <Container maxW="container.lg" py={12}>
          {loading ? (
            <VStack spacing={8} w="full" align="stretch">
              {[1, 2].map((i) => (
                <Box key={i} bg="white" p={8} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.200">
                  <HStack spacing={3} mb={5}>
                    <SkeletonCircle size="12" />
                    <VStack align="start" spacing={2} w="150px">
                      <Skeleton height="16px" w="100%" />
                      <Skeleton height="12px" w="60%" />
                    </VStack>
                  </HStack>
                  <Skeleton height="28px" w="40%" mb={4} />
                  <SkeletonText mt="4" noOfLines={4} spacing="4" mb={6} />
                  {/* Simulate picture for the first skeleton */}
                  {i === 1 && <Skeleton height="300px" w="full" borderRadius="xl" />}
                </Box>
              ))}
            </VStack>
          ) : announcements.length > 0 ? (
            <VStack spacing={8} w="full" align="stretch">
              {announcements.map((announcement, index) => (
                <MotionBox 
                  key={announcement.uid} 
                  bg="white" 
                  p={8} 
                  borderRadius="2xl" 
                  shadow="sm" 
                  border="1px solid" 
                  borderColor="gray.200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {/* Author and Date */}
                  <HStack spacing={3} mb={5}>
                    <Avatar size="md" name="Admin" bg="blue.500" color="white" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color="gray.800">Admin</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(announcement.published_at).toLocaleDateString("en-US", { 
                          month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" 
                        })}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Title */}
                  <Heading as="h3" size="md" mb={4} color="gray.800">
                    <Text as="span" bg="yellow.300" px={2} py={1} borderRadius="md" display="inline-block" lineHeight="normal">
                      {announcement.title}
                    </Text>
                  </Heading>

                  {/* Content */}
                  <Text fontSize="md" color="gray.600" mb={6} whiteSpace="pre-line" lineHeight="tall">
                    {announcement.content}
                  </Text>

                  {/* Image */}
                  {announcement.photo_path && (
                    <Box w="full" borderRadius="xl" overflow="hidden">
                      <Image 
                        src={`http://localhost:8000/storage/${announcement.photo_path}`} 
                        w="full" 
                        maxH="500px"
                        objectFit="cover" 
                        cursor="zoom-in"
                        transition="transform 0.3s"
                        _hover={{ transform: 'scale(1.01)' }}
                        onClick={() => handleImageClick(`http://localhost:8000/storage/${announcement.photo_path}`)}
                      />
                    </Box>
                  )}
                </MotionBox>
              ))}
            </VStack>
          ) : (
            <VStack py={20} textAlign="center" spacing={4}>
              <Icon as={FiInfo} boxSize={12} color="gray.300" />
              <Heading size="md" color="gray.500">No Announcements</Heading>
              <Text color="gray.400">There are currently no active announcements to display.</Text>
            </VStack>
          )}
        </Container>
      </Box>

      {/* Image Modal for Fullscreen Preview */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="5xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
        <ModalContent bg="transparent" boxShadow="none" my={0}>
          <ModalCloseButton color="white" top="-12" right="0" size="lg" _hover={{ bg: "blackAlpha.400" }} />
          <ModalBody p={0} display="flex" justifyContent="center">
            {selectedImage && (
              <Image 
                src={selectedImage} 
                maxH="85vh" 
                maxW="100%"
                objectFit="contain" 
                borderRadius="xl" 
                boxShadow="2xl"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Footer */}
      <Box bg="gray.800" color="gray.400" py={12} mt="auto">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            <VStack align="flex-start" spacing={4}>
              <Heading size="md" color="white">{settings.app_name}</Heading>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">{t('footer.quick_links')}</Heading>
              <Button variant="link" size="sm" onClick={() => navigate("/")}>{t('nav.home')}</Button>
              <Button variant="link" size="sm" onClick={() => navigate("/announcements")}>Announcements</Button>
              <Button variant="link" size="sm" onClick={() => navigate("/login")}>Login</Button>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">{t('footer.contact_details')}</Heading>
              <HStack><Icon as={FiMapPin} /><Text fontSize="sm">{settings.address}</Text></HStack>
              <HStack><Icon as={FiPhone} /><Text fontSize="sm">{settings.phone}</Text></HStack>
              <HStack><Icon as={FiMail} /><Text fontSize="sm">{settings.email}</Text></HStack>
            </VStack>
          </SimpleGrid>
          <Divider my={8} borderColor="gray.700" />
          <Text textAlign="center" fontSize="xs">
            © {new Date().getFullYear()} {settings.company_name}. All rights reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicAnnouncements;
