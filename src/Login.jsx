import React, { useState } from "react";
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
  useToast,
  FormErrorMessage,
} from "@chakra-ui/react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import loginPic from "./assets/login.jpg";
import { useNavigate } from "react-router-dom";

export default function LoginForm1() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ================= VALIDATION =================
  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Username or Email is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;
    
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", data.role);
        
        if (data.settings) {
          localStorage.setItem("currency", data.settings.currency || "$");
          localStorage.setItem("exchangeRate", data.settings.exchangeRate || "4000");
        }
        
        toast({
          title: "Login Successful",
          description: "Welcome back!",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });

        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password.",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top-right",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: "column", lg: "row" }} bg="gray.50">
      {/* Left side: Graphic/Image */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        flex={1}
        bg="blue.600"
        align="center"
        justify="center"
        position="relative"
        overflow="hidden"
      >
        <Image
          src={loginPic}
          alt="Login illustration"
          w="full"
          h="full"
          objectFit="cover"
          opacity={0.8}
          zIndex={1}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(to-br, blue.800, transparent)"
          opacity={0.7}
          zIndex={2}
        />
        <VStack
          position="absolute"
          zIndex={3}
          align="flex-start"
          bottom={16}
          left={16}
          color="white"
          spacing={4}
        >
          <Heading size="2xl" fontWeight="bold">
            RoomRent 100
          </Heading>
          <Text fontSize="xl" maxW="md">
            Manage your tenants, leases, and utility bills seamlessly.
          </Text>
        </VStack>
      </Flex>

      {/* Right side: Login Form */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        bg="white"
        p={{ base: 8, md: 10, lg: 16 }}
        boxShadow={{ base: "none", lg: "-10px 0 30px rgba(0,0,0,0.05)" }}
        zIndex={10}
      >
        <Box w="full" maxW="md">
          <VStack spacing={8} align="stretch">
            <Box textAlign="left">
              <Heading size="xl" color="gray.800" mb={3} fontWeight="extrabold">
                Welcome Back
              </Heading>
              <Text color="gray.500" fontSize="md">
                Please enter your credentials to access your dashboard.
              </Text>
            </Box>

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <VStack spacing={6} align="stretch">
                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">
                    Username
                  </FormLabel>
                  <Input
                    type="text"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your username or email"
                    size="lg"
                    borderRadius="md"
                    focusBorderColor="blue.500"
                    bg="white"
                    _hover={{ borderColor: "blue.300" }}
                  />
                  {errors.email && (
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.password} isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">
                    Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type={show ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="••••••••"
                      borderRadius="md"
                      focusBorderColor="blue.500"
                      bg="white"
                      _hover={{ borderColor: "blue.300" }}
                    />
                    <InputRightElement h="full" px={2}>
                      <IconButton
                        variant="ghost"
                        size="md"
                        color="gray.400"
                        _hover={{ color: "blue.500", bg: "transparent" }}
                        aria-label={show ? "Hide password" : "Show password"}
                        icon={show ? <FaEyeSlash /> : <FaEye />}
                        onClick={() => setShow(!show)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {errors.password && (
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  )}
                </FormControl>

                <HStack w="full" justify="space-between" pt={1}>
                  <Checkbox 
                    colorScheme="blue" 
                    color="gray.600"
                    size="md"
                  >
                    Remember me
                  </Checkbox>
                  <ChakraLink color="blue.500" fontWeight="bold" fontSize="sm" _hover={{ textDecoration: "none", color: "blue.600" }}>
                    Forgot password?
                  </ChakraLink>
                </HStack>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  mt={4}
                  borderRadius="md"
                  boxShadow="0 4px 14px 0 rgba(0,118,255,0.39)"
                  _hover={{ boxShadow: "0 6px 20px rgba(0,118,255,0.23)", transform: "translateY(-1px)" }}
                  _active={{ transform: "translateY(1px)" }}
                  transition="all 0.2s"
                >
                  Sign in
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Flex>
    </Flex>
  );
}
