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
  Container,
  Alert,
  AlertIcon,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { toast } from "react-hot-toast";
import { FiEye, FiEyeOff, FiArrowLeft, FiLock, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { useApi } from "./hooks/useApi";
import { auth, provider, signInWithPopup } from "./firebase";

import { resetEcho } from "./lib/echo";

import logoSvg from "./assets/Artboard 1.svg";
import topologyBg from "./assets/topology_bg.png";

export default function LoginForm() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { request, loading } = useApi();
  const [appName, setAppName] = useState(localStorage.getItem("app_name") || "RoomRent 100");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  
  const [rememberMe, setRememberMe] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // Background and UI Colors
  const bg = "gray.50";
  const cardBg = "white";
  const textColor = "gray.800";
  const mutedText = "gray.500";
  const borderColor = "gray.200";

  useEffect(() => {
    // Redirect if already logged in
    if (localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true") {
      navigate("/dashboard");
      return;
    }

    // Try to get the latest app name from the public settings
    const fetchSettings = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/public/settings");
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

  const storeSession = (data) => {
    // Admin tokens expire on browser close (always use sessionStorage)
    const isAdmin = data.role === "admin";
    const storage = (rememberMe && !isAdmin) ? localStorage : sessionStorage;
    const otherStorage = (rememberMe && !isAdmin) ? sessionStorage : localStorage;

    // Clear other storage just in case
    otherStorage.removeItem("token");
    otherStorage.removeItem("isLoggedIn");
    otherStorage.removeItem("user");
    otherStorage.removeItem("role");
    otherStorage.removeItem("token_expires_at");

    storage.setItem("isLoggedIn", "true");
    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(data.user));
    storage.setItem("role", data.role);

    // Store token expiration time for auto-logout
    if (data.token_expires_at) {
      storage.setItem("token_expires_at", data.token_expires_at);
    } else {
      storage.removeItem("token_expires_at");
    }

    if (data.settings) {
      storage.setItem("currency", data.settings.currency || "$");
      storage.setItem("exchangeRate", data.settings.exchangeRate || "4000");
      if (data.settings.utility_rate_electricity) storage.setItem("utility_rate_electricity", data.settings.utility_rate_electricity);
      if (data.settings.utility_rate_water) storage.setItem("utility_rate_water", data.settings.utility_rate_water);
      if (data.settings.utility_fixed_trash) storage.setItem("utility_fixed_trash", data.settings.utility_fixed_trash);
      if (data.settings.utility_fixed_internet) storage.setItem("utility_fixed_internet", data.settings.utility_fixed_internet);
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const [data, apiErr] = await request({
      url: "/login",
      method: "POST",
      data: {
        email: form.email,
        password: form.password,
        remember: rememberMe,
      },
    }, { 
      showToast: false // We handle toast manually for specific welcome message
    });

    if (apiErr) {
      setErrors({ general: apiErr.response?.data?.message || "Invalid email or password." });
      return;
    }

    if (data && data.token) {
      storeSession(data);
      resetEcho();
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrors({});
    
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const [data, apiErr] = await request({
        url: "/google-login",
        method: "POST",
        data: {
          id_token: idToken,
          remember: rememberMe
        },
      }, { showToast: false });

      if (apiErr) {
        setErrors({ general: apiErr.response?.data?.message || "Google sign-in failed on our server." });
        setGoogleLoading(false);
        return;
      }

      if (data && data.action === 'signup_required') {
        toast("Please complete your registration.", { duration: 4000, icon: 'ℹ️' });
        navigate("/signup", { state: { email: data.email, name: data.name, fromGoogle: true } });
        return;
      }

      if (data && data.token) {
        storeSession(data);
        resetEcho();
        toast.success(`Welcome, ${data.user.name}!`);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      setErrors({ general: "Google authentication failed or was cancelled." });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Flex 
      minH="100vh" 
      bg={bg} 
      backgroundImage={`url(${topologyBg})`}
      backgroundSize="cover"
      backgroundPosition="center"
      color="gray.800" 
      align="center" 
      justify="center" 
      position="relative" 
      overflow="hidden"
      py={10}
    >
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
                  {errors.general && (
                    <Alert status="error" borderRadius="md" fontSize="sm">
                      <AlertIcon />
                      {errors.general}
                    </Alert>
                  )}
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={2}>
                      Username or Email
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiUser} color="gray.400" />} />
                      <Input
                        type="text"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="user@example.com"
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={2}>
                      Password
                    </FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={show ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
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
                    <Checkbox 
                      colorScheme="blue" 
                      size="sm" 
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    >
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
                    letterSpacing="widest"
                    mt={2}
                    _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                    _active={{ transform: "translateY(0)" }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                  
                  <HStack w="full" align="center" my={2}>
                    <Divider borderColor="gray.300" />
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" px={2}>OR</Text>
                    <Divider borderColor="gray.300" />
                  </HStack>

                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    size="lg"
                    w="full"
                    h="14"
                    isLoading={googleLoading}
                    loadingText="SIGNING IN WITH GOOGLE..."
                    borderRadius="xl"
                    fontSize="xs"
                    fontWeight="black"
                    letterSpacing="widest"
                    leftIcon={<Icon as={FcGoogle} boxSize={5} />}
                    _hover={{ bg: "gray.50" }}
                  >
                    Sign in with Google
                  </Button>
                  
                </VStack>
              </form>
              <HStack justify="center" mt={2}>
                <Text fontSize="sm" color={mutedText}>
                  Don't have an account?
                </Text>
                <ChakraLink fontSize="sm" fontWeight="bold" color="blue.500" onClick={() => navigate("/signup")}>
                  Sign up
                </ChakraLink>
              </HStack>
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
