import React from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  Stack,
  Icon,
  VStack,
  HStack,
  Divider,
  Avatar,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiArrowRight, FiCheckCircle, FiHeart, FiMapPin, FiPhone, FiMail, FiUsers, FiHome, FiTarget, FiStar, FiSpeaker } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../assets/Arun_MuyKea.png";
import LanguageSwitcher from "../components/LanguageSwitcher";

const MotionBox = motion(Box);

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const team = [
    {
      name: "Sievthai Pheak",
      role: "Lead Developer"
    },
    {
      name: "Thourn Meyly",
      role: "Front end Developer"
    },
    {
      name: "Moeurn Sovimean",
      role: "UX/UI Designer"
    },
    {
      name: "Rath Reaksa",
      role: "Head of Marketing"
    },
    {
      name: "Chhay Kimhong",
      role: "Backend Developer"
    },
  ];

  return (
    <Box bg="gray.50" color="gray.800" minH="100vh">
      {/* Navbar (Same as Landing) */}
      <Box bg="white" px={4} shadow="sm" position="sticky" top="0" zIndex="1000">
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={4} align="center">
              <Box p={1} borderRadius="md" display="flex" alignItems="center" cursor="pointer" onClick={() => navigate("/")}>
                <Image src={Logo} alt="Logo" boxSize="150px" objectFit="contain" />
              </Box>
            </HStack>
            <HStack spacing={4}>
              <LanguageSwitcher />
              <Button 
                variant="ghost" 
                color="gray.800" 
                onClick={() => navigate("/")} 
                rounded="full" 
                fontWeight="bold" 
                fontSize="sm"
              >
                {t('nav.back_to_home')}
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box 
        position="relative" 
        w="full" 
        minH="60vh"
        display="flex"
        alignItems="center"
        bgGradient="linear(to-br, blue.600, blue.800)"
        color="white"
        textAlign="center"
      >
        {/* Floating Pill Navbar */}
        <Flex position="fixed" top="85px" w="full" justify="center" zIndex={1100}>
          <Flex bg="whiteAlpha.900" backdropFilter="blur(10px)" borderRadius="full" shadow="xl" p={1.5} align="center" border="1px solid" borderColor="whiteAlpha.500">
            <Button leftIcon={<FiHome />} variant="ghost" color="gray.700" borderRadius="full" px={6} py={6} fontSize="15px" fontWeight="bold" _hover={{ bg: "blackAlpha.100" }} onClick={() => navigate('/')}>{t('nav.home')}</Button>
            <Button leftIcon={<FiSpeaker />} variant="ghost" color="gray.700" borderRadius="full" px={6} py={6} fontSize="15px" fontWeight="bold" _hover={{ bg: "blackAlpha.100" }} onClick={() => navigate('/announcements')}>{t('nav.announcement')}</Button>
            <Button leftIcon={<FiUsers />} colorScheme="blue" bg="blue.500" color="white" borderRadius="full" px={6} py={6} fontSize="15px" fontWeight="bold" _hover={{ bg: "blue.600" }} onClick={() => navigate('/about')}>{t('nav.about_us')}</Button>
          </Flex>
        </Flex>

        <Container maxW="container.xl" pt={{ base: 40, md: 32 }}>
          <VStack spacing={6}>
            <Heading as="h1" size="2xl" fontWeight="black">
              {t('about.title')}
            </Heading>
            <Text fontSize="xl" maxW="2xl" color="whiteAlpha.900">
              {t('about.subtitle')}
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Our Mission & Vision */}
      <Container maxW="container.3xl" py={20}>
        <VStack maxW="3xl" mx="auto" align="center" spacing={10} textAlign="center">
          <VStack align="center" spacing={6}>
            <HStack color="blue.500">
              <Icon as={FiTarget} boxSize={8} />
              <Heading size="lg">{t('about.mission_title')}</Heading>
            </HStack>
            <Text fontSize="lg" color="gray.600" lineHeight="tall">
              {t('about.mission_desc')}
            </Text>
          </VStack>
          
          <Divider borderColor="gray.300" />
          
          <VStack align="center" spacing={6}>
            <HStack color="blue.500">
              <Icon as={FiStar} boxSize={8} />
              <Heading size="lg">{t('about.vision_title')}</Heading>
            </HStack>
            <Text fontSize="lg" color="gray.600" lineHeight="tall">
              {t('about.vision_desc')}
            </Text>
          </VStack>
        </VStack>
      </Container>

      {/* Core Values */}
      <Box bg="white" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={4} mb={16} textAlign="center">
            <Heading size="xl">Our Core Values</Heading>
            <Text color="gray.500" maxW="2xl">The principles that guide everything we do.</Text>
          </VStack>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={10}>
            {[
              { icon: FiHeart, title: "Community First", desc: "We build more than walls; we build neighborhoods." },
              { icon: FiCheckCircle, title: "Trust & Integrity", desc: "Honesty and transparency in every transaction." },
              { icon: FiHome, title: "Quality Living", desc: "Well-maintained spaces that you're proud to call home." },
              { icon: FiUsers, title: "Customer Focused", desc: "Your comfort and satisfaction are our top priorities." },
            ].map((value, i) => (
              <VStack key={i} p={8} bg="gray.50" borderRadius="2xl" align="flex-start" spacing={4} border="1px solid" borderColor="gray.100" _hover={{ transform: "translateY(-5px)", shadow: "md" }} transition="all 0.3s">
                <Box p={3} bg="blue.500" color="white" borderRadius="lg">
                  <Icon as={value.icon} boxSize={6} />
                </Box>
                <Heading size="sm">{value.title}</Heading>
                <Text fontSize="sm" color="gray.600">{value.desc}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Our Community Section */}
      <Box bg="white" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={4} mb={16} textAlign="center">
            <Heading size="xl">{t('about.community_title')}</Heading>
            <Text color="gray.500" maxW="2xl">{t('about.community_desc')}</Text>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <VStack bg="gray.50" borderRadius="2xl" overflow="hidden" shadow="sm" align="stretch" spacing={0}>
              <Box h="200px">
                <Image src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800" w="full" h="full" objectFit="cover" />
              </Box>
              <VStack p={6} align="flex-start" spacing={3}>
                <Heading size="md">{t('about.shared_spaces')}</Heading>
                <Text fontSize="sm" color="gray.600">{t('about.shared_desc')}</Text>
              </VStack>
            </VStack>
            <VStack bg="gray.50" borderRadius="2xl" overflow="hidden" shadow="sm" align="stretch" spacing={0}>
              <Box h="200px">
                <Image src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800" w="full" h="full" objectFit="cover" />
              </Box>
              <VStack p={6} align="flex-start" spacing={3}>
                <Heading size="md">{t('about.events_title')}</Heading>
                <Text fontSize="sm" color="gray.600">{t('about.events_desc')}</Text>
              </VStack>
            </VStack>
            <VStack bg="gray.50" borderRadius="2xl" overflow="hidden" shadow="sm" align="stretch" spacing={0}>
              <Box h="200px">
                <Image src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" w="full" h="full" objectFit="cover" />
              </Box>
              <VStack p={6} align="flex-start" spacing={3}>
                <Heading size="md">{t('about.safe_title')}</Heading>
                <Text fontSize="sm" color="gray.600">{t('about.safe_desc')}</Text>
              </VStack>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Our Team */}
      <Container maxW="container.xl" py={20}>
        <VStack spacing={4} mb={16} textAlign="center">
          <Heading size="xl">{t('about.team_title')}</Heading>
          <Text color="gray.500" maxW="2xl">{t('about.team_desc')}</Text>
        </VStack>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={6}>
          {team.map((member, i) => (
            <VStack 
              key={i} 
              bg="white" 
              p={6} 
              borderRadius="xl" 
              shadow="md" 
              align="flex-start" 
              spacing={3} 
              borderTop="4px solid" 
              borderColor="blue.500"
              transition="all 0.3s"
              _hover={{ transform: "translateY(-5px)", shadow: "lg" }}
            >
              <Box bg="blue.50" p={3} borderRadius="md" w="full">
                <Heading size="sm" color="gray.800">{member.name}</Heading>
                <Text color="blue.600" fontSize="xs" fontWeight="bold" mt={1}>{member.role}</Text>
              </Box>
              <Text fontSize="sm" color="gray.600" lineHeight="tall">
                {t('about.team_msg')}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>
      </Container>

      {/* Footer (Same as Landing) */}
      <Box bg="gray.800" color="gray.400" py={12}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            <VStack align="flex-start" spacing={4}>
              <Heading size="md" color="white">Arun Muy Kea</Heading>
              <Text fontSize="sm">
                {t('footer.desc')} <b>Arun Muy Kea</b>.
              </Text>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">{t('footer.quick_links')}</Heading>
              <Button variant="link" size="sm" onClick={() => navigate("/")}>{t('nav.home')}</Button>
              <Button variant="link" size="sm" onClick={() => navigate("/about")}>{t('nav.about_us')}</Button>
              <Button variant="link" size="sm" onClick={() => navigate("/announcements")}>{t('nav.announcement')}</Button>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">{t('footer.contact_details')}</Heading>
              <HStack><Icon as={FiMapPin} /><Text fontSize="sm">Phnom Penh, Cambodia</Text></HStack>
              <HStack><Icon as={FiPhone} /><Text fontSize="sm">+855 87 94 60 60</Text></HStack>
              <HStack><Icon as={FiMail} /><Text fontSize="sm">support@roomrent100.com</Text></HStack>
            </VStack>
            <VStack align="flex-start" spacing={4}>
              <Heading size="sm" color="white">{t('footer.about_title')}</Heading>
              <Text fontSize="sm">{t('footer.about_desc')}</Text>
            </VStack>
          </SimpleGrid>
          <Divider my={8} borderColor="gray.700" />
          <Text textAlign="center" fontSize="xs">
            © {new Date().getFullYear()} Arun Muy Kea. {t('footer.rights')}
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default About;
