import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Checkbox,
  Link as ChakraLink,
  Image,
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
  useColorModeValue,
  Container,
  Icon,
} from "@chakra-ui/react";
import { toast } from "react-hot-toast";
import { FiEye, FiEyeOff, FiArrowLeft, FiLock, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useApi } from "./hooks/useApi";

import logoSvg from "./assets/Artboard 1.svg";

export default function LoginForm() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { request, loading } = useApi();
  const [appName, setAppName] = useState(localStorage.getItem("app_name") || "RoomRent 100");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  // Background and UI Colors
  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");

  useEffect(() => {
    // Try to get the latest app name from the public settings
    const fetchSettings = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/public/settings");
        const data = await response.json();
        if (data && data.app_name) {
          localStorage.setItem("app_name", data.app_name);
        }
      } catch (e) {
        // Silent fail, use default
      }
    };
    fetchSettings();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Username or Email is required";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const [data] = await request({
      url: "/login",
      method: "POST",
      data: {
        email: form.email,
        password: form.password,
      },
    }, { 
      showToast: false // We handle toast manually for specific welcome message
    });

    if (data && data.token) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.role);
      
      if (data.settings) {
        localStorage.setItem("currency", data.settings.currency || "$");
        localStorage.setItem("exchangeRate", data.settings.exchangeRate || "4000");
      }
      
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    }
  };

  return (
    <Flex minH="100vh" bg={bg} align="center" justify="center" position="relative" overflow="hidden">
      {/* Abstract Background Shapes */}
      <Box 
        position="absolute" top="-10%" right="-5%" w="400px" h="400px" 
        bg="blue.500" borderRadius="full" filter="blur(80px)" opacity={0.15} zIndex={0} 
      />
      <Box 
        position="absolute" bottom="-10%" left="-5%" w="400px" h="400px" 
        bg="purple.500" borderRadius="full" filter="blur(80px)" opacity={0.15} zIndex={0} 
      />

      <Container maxW="md" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Login Card */}
          <Box 
            bg={cardBg} p={{ base: 8, md: 10 }} borderRadius="3xl" 
            shadow="2xl" border="1px solid" borderColor={borderColor}
          >
            <VStack spacing={6} align="stretch">
              {/* Logo inside card */}
              <VStack spacing={2} align="center" mb={2}>
                <Image src={logoSvg} alt="Logo" boxSize="150px" objectFit="contain" />
              </VStack>

              <VStack align="flex-start" spacing={1} mb={2}>
                <Heading size="md" color={textColor} fontWeight="extrabold">
                  Sign In
                </Heading>
                <Text color={mutedText} fontSize="sm">
                  Enter your credentials to access your account
                </Text>
              </VStack>

              <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel fontSize="xs" fontWeight="black" textTransform="uppercase" color={mutedText} mb={2}>
                      Username or Email
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiUser} color="gray.400" />} />
                      <Input
                        type="text"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="user@example.com"
                        bg={useColorModeValue("gray.50", "#0d1117")}
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: useColorModeValue("white", "#0d1117"), boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel fontSize="xs" fontWeight="black" textTransform="uppercase" color={mutedText} mb={2}>
                      Password
                    </FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={show ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        bg={useColorModeValue("gray.50", "#0d1117")}
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: useColorModeValue("white", "#0d1117"), boxShadow: "0 0 0 2px #3182ce" }}
                      />
                      <InputRightElement h="full">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={show ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShow(!show)}
                          aria-label="Toggle password"
                          _hover={{ bg: "transparent", color: "blue.500" }}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <HStack w="full" justify="space-between">
                    <Checkbox colorScheme="blue" size="sm" defaultChecked>
                      <Text fontSize="xs" fontWeight="bold" color={mutedText}>Remember me</Text>
                    </Checkbox>
                    <ChakraLink fontSize="xs" fontWeight="bold" color="blue.500">
                      Forgot Password?
                    </ChakraLink>
                  </HStack>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    h="14"
                    isLoading={loading}
                    loadingText="AUTHENTICATING..."
                    borderRadius="xl"
                    shadow="lg"
                    fontSize="xs"
                    fontWeight="black"
                    textTransform="uppercase"
                    letterSpacing="widest"
                    mt={4}
                    _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                    _active={{ transform: "translateY(0)" }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>

          {/* Footer Links */}
          <HStack justify="center" spacing={4}>
            <Button 
              variant="ghost" 
              leftIcon={<FiArrowLeft />} 
              size="sm" 
              onClick={() => navigate("/")}
              color={mutedText}
              _hover={{ color: "blue.500", bg: "transparent" }}
              fontWeight="bold"
            >
              Back to Home
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Flex>
  );
}
