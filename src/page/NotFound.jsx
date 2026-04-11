import React from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
  Icon,
  Container,
  SimpleGrid,
  
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiArrowLeft, FiMapPin, FiSearch, } from "react-icons/fi";

const MotionBox = motion(Box);
const MotionIcon = motion(Icon);

export default function NotFound() {
  const navigate = useNavigate();
  
  // Theme colors
  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const accentColor = "blue.500";
  const glowColor = useColorModeValue("blue.100", "blue.900");
  const borderColor = useColorModeValue("gray.200", "#30363d");

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={bg}
      position="relative"
      overflow="hidden"
    >
      {/* Background Decorative Elements */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        w="400px"
        h="400px"
        bg="blue.500"
        filter="blur(150px)"
        opacity="0.05"
        borderRadius="full"
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-5%"
        w="400px"
        h="400px"
        bg="purple.500"
        filter="blur(150px)"
        opacity="0.05"
        borderRadius="full"
      />

      <Container maxW="container.md" position="relative">
        <VStack spacing={10} textAlign="center">
          
          {/* Main Visual Component */}
          <Box position="relative" py={10}>
            {/* Pulsing Glow Effect */}
            <MotionBox
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="180px"
              h="180px"
              bg={glowColor}
              borderRadius="full"
              filter="blur(30px)"
              zIndex={0}
            />

            {/* Icon Group */}
            <Box position="relative" zIndex={1}>
              <MotionBox
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Icon as={FiMapPin} fontSize="100px" color={accentColor} strokeWidth={1} />
                
                {/* Searching Magnifier Overlays */}
                <MotionBox
                  animate={{ 
                    x: [0, 30, 0, -30, 0],
                    y: [0, -20, 20, -10, 0]
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity,
                    ease: "linear" 
                  }}
                  position="absolute"
                  top="20px"
                  left="40px"
                >
                  <Icon as={FiSearch} fontSize="40px" color="orange.400" />
                </MotionBox>
              </MotionBox>
            </Box>
          </Box>

          {/* Text Content */}
          <VStack spacing={4}>
            <Heading
              fontSize={{ base: "7xl", md: "9xl" }}
              fontWeight="900"
              lineHeight="0.8"
              letterSpacing="tighter"
              bgGradient="linear(to-br, blue.400, blue.700)"
              bgClip="text"
              opacity="0.15"
              position="absolute"
              top="40%"
              left="50%"
              transform="translate(-50%, -50%)"
              zIndex={0}
              pointerEvents="none"
              userSelect="none"
            >
              404
            </Heading>
            
            <Box zIndex={1}>
              <Heading size="2xl" fontWeight="black" mb={3} color={textColor}>
                Lost Your Way?
              </Heading>
              <Text color={mutedText} fontSize="lg" maxW="lg" mx="auto" fontWeight="medium">
                We couldn't find the page or property you're looking for. It might have been unlisted or moved to a new address.
              </Text>
            </Box>
          </VStack>

          {/* Action Buttons */}
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full" maxW="400px" zIndex={1}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="outline"
              size="lg"
              h="60px"
              borderRadius="xl"
              fontWeight="bold"
              borderColor={borderColor}
              _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.100") }}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              leftIcon={<FiHome />}
              colorScheme="blue"
              size="lg"
              h="60px"
              borderRadius="xl"
              fontWeight="bold"
              shadow="xl"
              _hover={{ 
                transform: "translateY(-2px)",
                shadow: "2xl",
                bg: "blue.600"
              }}
              onClick={() => navigate("/dashboard")}
            >
              Return Home
            </Button>
          </SimpleGrid>

          {/* Helpful Links/Footer */}
          <Text fontSize="xs" color={mutedText} fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
            Property Management System v1.0
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
