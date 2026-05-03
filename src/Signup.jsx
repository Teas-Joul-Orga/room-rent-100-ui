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
import { FiEye, FiEyeOff, FiArrowLeft, FiUser, FiMail, FiLock, FiPhone, FiBriefcase } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "./hooks/useApi";
import ReCAPTCHA from "react-google-recaptcha";
import { auth, provider, signInWithPopup } from "./firebase";

import logoSvg from "./assets/Artboard 1.svg";
import topologyBg from "./assets/topology_bg.png";

export default function SignupForm() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { request, loading } = useApi();

  const [form, setForm] = useState({
    name: location.state?.name || "",
    username: "",
    email: location.state?.email || "",
    phone: "",
    job: "",
    password: "",
    password_confirmation: "",
    from_google: !!location.state?.fromGoogle,
  });
  
  const [captchaValue, setCaptchaValue] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // Background and UI Colors
  const bg = "gray.50";
  const cardBg = "white";
  const textColor = "gray.800";
  const mutedText = "gray.500";
  const borderColor = "gray.200";

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t('signup.err_req_name');
    if (!form.username.trim()) newErrors.username = t('signup.err_req_username');
    if (!form.email.trim()) newErrors.email = t('signup.err_req_email');
    if (!form.phone.trim()) newErrors.phone = t('signup.err_req_phone');
    if (!form.job.trim()) newErrors.job = t('signup.err_req_job');
    if (!form.password) newErrors.password = t('signup.err_req_password');
    else if (form.password.length < 8) newErrors.password = t('signup.err_pass_length');
    
    if (form.password !== form.password_confirmation) {
        newErrors.password_confirmation = t('common.password_mismatch');
    }

    if (!captchaValue) {
        newErrors.captcha = t('signup.err_req_captcha');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const storeSession = (data) => {
    const isAdmin = data.role === "admin";
    const storage = isAdmin ? sessionStorage : localStorage;

    if (isAdmin) {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }

    storage.setItem("isLoggedIn", "true");
    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(data.user));
    storage.setItem("role", data.role);

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
      url: "/register",
      method: "POST",
      data: form,
    }, { 
      showToast: false 
    });

    if (apiErr) {
      if (apiErr.response?.data?.errors) {
         setErrors(apiErr.response.data.errors);
      } else {
         setErrors({ general: apiErr.response?.data?.message || t('signup.err_general_fail') });
      }
      return;
    }

    if (data && data.token) {
      storeSession(data);
      toast.success(t('signup.welcome_msg', { name: data.user.name }));
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!captchaValue) {
      setErrors({ ...errors, captcha: "Please complete the CAPTCHA first to sign in with Google" });
      return;
    }

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
          remember: true
        },
      }, { showToast: false });

      if (apiErr) {
        setErrors({ general: apiErr.response?.data?.message || t('signup.err_google_fail') });
        setGoogleLoading(false);
        return;
      }

      if (data && data.action === 'signup_required') {
        toast(t('signup.req_complete_reg'), { duration: 4000, icon: 'ℹ️' });
        setForm(prev => ({ ...prev, name: data.name, email: data.email, from_google: true }));
        setGoogleLoading(false);
        return;
      }

      if (data && data.token) {
        storeSession(data);
        toast.success(t('signup.welcome_back', { name: data.user.name }));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      setErrors({ general: t('signup.err_google_cancel') });
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
      <Box position="absolute" top={4} right={4} zIndex={2}>
        <LanguageSwitcher />
      </Box>

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
          {/* Signup Card */}
          <Box 
            bg={cardBg} p={{ base: 8, md: 10 }} borderRadius="3xl" 
            shadow="2xl" border="1px solid" borderColor={borderColor}
          >
            <VStack spacing={6} align="stretch">
              <VStack spacing={2} align="center" mb={2}>
                <Image src={logoSvg} alt="Logo" boxSize="120px" objectFit="contain" />
              </VStack>

              <VStack align="flex-start" spacing={1} mb={2}>
                <Heading size="md" color={textColor} fontWeight="extrabold">
                  {form.from_google ? t('signup.complete_registration') : t('signup.create_account')}
                </Heading>
                <Text color={mutedText} fontSize="sm">
                  {form.from_google 
                    ? t('signup.remaining_details') 
                    : t('signup.fill_details')}
                </Text>
              </VStack>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  {errors.general && (
                    <Alert status="error" borderRadius="md" fontSize="sm">
                      <AlertIcon />
                      {errors.general}
                    </Alert>
                  )}
                  
                  <FormControl isInvalid={!!errors.name}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      {t('signup.full_name')}
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiUser} color="gray.400" />} />
                      <Input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={t('signup.name_placeholder')}
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.name?.[0] || errors.name}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.username}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      {t('signup.username')}
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiUser} color="gray.400" />} />
                      <Input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder={t('signup.username_placeholder')}
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.username?.[0] || errors.username}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      {t('signup.email')}
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiMail} color="gray.400" />} />
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder={t('signup.email_placeholder')}
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        isReadOnly={form.from_google}
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.email?.[0] || errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.phone}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      Phone Number
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiPhone} color="gray.400" />} />
                      <Input
                        type="text"
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9+\s-]/g, '');
                          const digitsOnly = val.replace(/[^0-9]/g, '');
                          if (digitsOnly.length <= 10) {
                            setForm({ ...form, phone: val });
                          }
                        }}
                        placeholder="012345678"
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.phone?.[0] || errors.phone}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.job}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      {t('signup.job')}
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputRightElement pointerEvents="none" h="full" children={<Icon as={FiBriefcase} color="gray.400" />} />
                      <Input
                        type="text"
                        value={form.job}
                        onChange={(e) => setForm({ ...form, job: e.target.value })}
                        placeholder={t('signup.job_placeholder')}
                        bg="gray.50"
                        color="gray.800"
                        border="none"
                        borderRadius="xl"
                        fontSize="sm"
                        _focus={{ bg: "white", boxShadow: "0 0 0 2px #3182ce" }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.job?.[0] || errors.job}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      {t('common.password')}
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
                    <FormErrorMessage>{errors.password?.[0] || errors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password_confirmation}>
                    <FormLabel fontSize="xs" fontWeight="black" color={mutedText} mb={1}>
                      {t('common.confirm_password')}
                    </FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={form.password_confirmation}
                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
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
                          icon={showConfirm ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShowConfirm(!showConfirm)}
                          aria-label="Toggle confirm password"
                          _hover={{ bg: "transparent", color: "blue.500" }}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password_confirmation?.[0] || errors.password_confirmation}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.captcha} mt={2}>
                    <Flex justify="center" w="100%">
                      <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                        onChange={(val) => {
                          setCaptchaValue(val);
                          if (val && errors.captcha) {
                            setErrors({ ...errors, captcha: null });
                          }
                        }}
                      />
                    </Flex>
                    <FormErrorMessage justify="center">{errors.captcha}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    h="14"
                    isLoading={loading}
                    loadingText={t('signup.creating_account')}
                    borderRadius="xl"
                    shadow="lg"
                    fontSize="xs"
                    fontWeight="black"
                    letterSpacing="widest"
                    mt={4}
                    _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                    _active={{ transform: "translateY(0)" }}
                    transition="all 0.2s"
                  >
                    {t('signup.sign_up')}
                  </Button>
                  
                  
                  {!form.from_google && (
                    <>
                      <HStack w="full" align="center" my={2}>
                        <Divider borderColor="gray.300" />
                        <Text fontSize="xs" fontWeight="bold" color="gray.400" px={2}>{t('signup.or')}</Text>
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
                        loadingText={t('signup.signing_google')}
                        borderRadius="xl"
                        fontSize="xs"
                        fontWeight="black"
                        letterSpacing="widest"
                        leftIcon={<Icon as={FcGoogle} boxSize={5} />}
                        _hover={{ bg: "gray.50" }}
                      >
                        {t('signup.signup_google')}
                      </Button>
                    </>
                  )}
                  
                </VStack>
              </form>
              <HStack justify="center" mt={2}>
                <Text fontSize="sm" color={mutedText}>
                  {t('signup.already_have_account')}
                </Text>
                <ChakraLink fontSize="sm" fontWeight="bold" color="blue.500" onClick={() => navigate("/login")}>
                  {t('signup.sign_in')}
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
              {t('signup.back_to_home')}
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Flex>
  );
}