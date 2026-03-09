import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Text,
  useToast,
  Divider,
  SimpleGrid,
  Image,
  Icon,
  Spinner,
  IconButton,
  Card,
  CardBody,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  Switch,
  Collapse,
} from "@chakra-ui/react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiBriefcase, 
  FiCalendar, 
  FiCamera, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiChevronRight,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUploadCloud
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { toast as hotToast } from "react-hot-toast";

const API = "http://localhost:8000/api/v1/admin/tenants";

const AddNewTenant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    job: "",
    dob: "",
    create_account: false,
    password: "",
    password_confirmation: "",
    status: "active",
  });

  const [previews, setPreviews] = useState({
    photo: null,
    id_photo: null,
    id_card_back: null,
  });

  const [files, setFiles] = useState({
    photo: null,
    id_photo: null,
    id_card_back: null,
  });

  const photoRef = useRef();
  const idFrontRef = useRef();
  const idBackRef = useRef();

  // Theme colors
  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.700", "gray.300");
  const inputBg = useColorModeValue("white", "#0d1117");

  useEffect(() => {
    if (isEdit) {
      fetchTenantData();
    }
  }, [id]);

  const fetchTenantData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          job: data.job || "",
          dob: data.dob || "",
          create_account: false,
          password: "",
          password_confirmation: "",
          status: data.status || "active",
        });

        setPreviews({
          photo: data.photo_path ? `http://localhost:8000/storage/${data.photo_path}` : null,
          id_photo: data.id_photo_path ? `http://localhost:8000/storage/${data.id_photo_path}` : null,
          id_card_back: data.id_card_back_path ? `http://localhost:8000/storage/${data.id_card_back_path}` : null,
        });
      } else {
        hotToast.error(t("tenant.fetch_error"));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [field]: file }));
      setPreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("job", formData.job);
      data.append("dob", formData.dob);
      data.append("status", formData.status);

      if (!isEdit && formData.create_account) {
        data.append("create_account", "1");
        data.append("password", formData.password);
        data.append("password_confirmation", formData.password_confirmation);
      }

      if (files.photo) data.append("photo", files.photo);
      if (files.id_photo) data.append("id_photo", files.id_photo);
      if (files.id_card_back) data.append("id_card_back", files.id_card_back);

      // Method spoofing for PUT if isEdit
      if (isEdit) {
        data.append("_method", "PUT");
      }

      const url = isEdit ? `${API}/${id}` : API;
      const res = await fetch(url, {
        method: "POST", // Always POST for FormData with _method override
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
        body: data,
      });

      const responseData = await res.json();

      if (res.ok) {
        hotToast.success(isEdit ? t("tenant.update_success") : t("tenant.create_success"));
        navigate("/dashboard/tenants");
      } else {
        const firstError = Object.values(responseData.errors || {})[0]?.[0] || responseData.error || t("common.error_occurred");
        hotToast.error(firstError);
      }
    } catch (error) {
      hotToast.error(t("common.network_error"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Flex justify="center" align="center" h="100vh" bg={bg}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} minH="100vh" bg={bg}>
      <VStack spacing={6} align="stretch" maxW="1200px" mx="auto">
        {/* Navigation / Breadcrumbs */}
        <Flex align="center" justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack color={mutedText} fontSize="sm">
              <Link to="/dashboard/tenants">{t("sidebar.tenant_mgmt")}</Link>
              <Icon as={FiChevronRight} />
              <Text fontWeight="bold" color="blue.500">
                {isEdit ? t("tenant.edit") : t("tenant.add_new")}
              </Text>
            </HStack>
            <Heading size="lg" color={textColor}>
              {isEdit ? t("tenant.edit_profile") : t("tenant.create_profile")}
            </Heading>
          </VStack>

          <Button 
            leftIcon={<FiArrowLeft />} 
            variant="ghost" 
            onClick={() => navigate(-1)}
            _hover={{ bg: "whiteAlpha.200" }}
          >
            {t("common.back")}
          </Button>
        </Flex>

        <form onSubmit={handleSubmit}>
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} align="start">
            
            {/* LEFT COLUMN: Personal Info */}
            <VStack spacing={6} align="stretch" gridColumn={{ lg: "span 2" }}>
              <Card bg={cardBg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                <CardBody p={8}>
                  <VStack spacing={6} align="stretch">
                    <HStack spacing={4} mb={2}>
                      <Icon as={FiUser} color="blue.500" boxSize={5} />
                      <Text fontSize="lg" fontWeight="bold">{t("tenant.personal_info")}</Text>
                    </HStack>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color={labelColor}>{t("tenant.name")}</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" children={<FiUser color="gray.400" />} />
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t("tenant.name_placeholder")}
                            bg={inputBg}
                            borderColor={borderColor}
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color={labelColor}>{t("tenant.email")}</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" children={<FiMail color="gray.400" />} />
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t("tenant.email_placeholder")}
                            bg={inputBg}
                            borderColor={borderColor}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color={labelColor}>{t("tenant.phone")}</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" children={<FiPhone color="gray.400" />} />
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder={t("tenant.phone_placeholder")}
                            bg={inputBg}
                            borderColor={borderColor}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color={labelColor}>{t("tenant.job")}</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" children={<FiBriefcase color="gray.400" />} />
                          <Input
                            name="job"
                            value={formData.job}
                            onChange={handleChange}
                            placeholder={t("tenant.job_placeholder")}
                            bg={inputBg}
                            borderColor={borderColor}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color={labelColor}>{t("tenant.dob")}</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" children={<FiCalendar color="gray.400" />} />
                          <Input
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                            bg={inputBg}
                            borderColor={borderColor}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>

              {/* ACCOUNT CREATION (Only on add) */}
              {!isEdit && (
                <Card bg={cardBg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                  <CardBody p={8}>
                    <VStack spacing={6} align="stretch">
                      <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                          <Icon as={FiLock} color="purple.500" boxSize={5} />
                          <Text fontSize="lg" fontWeight="bold">{t("tenant.create_account")}</Text>
                        </HStack>
                        <Switch 
                          colorScheme="purple" 
                          isChecked={formData.create_account} 
                          onChange={(e) => setFormData(p => ({ ...p, create_account: e.target.checked }))}
                        />
                      </Flex>

                      <Collapse in={formData.create_account} animateOpacity>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} pt={4}>
                          <FormControl isRequired={formData.create_account}>
                            <FormLabel fontSize="sm" color={labelColor}>{t("common.password")}</FormLabel>
                            <InputGroup>
                              <InputLeftElement pointerEvents="none" children={<FiLock color="gray.400" />} />
                              <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                bg={inputBg}
                                borderColor={borderColor}
                                borderRadius="xl"
                              />
                              <IconButton
                                variant="ghost"
                                size="sm"
                                position="absolute"
                                right="2"
                                top="1"
                                zIndex="2"
                                icon={showPassword ? <FiEyeOff /> : <FiEye />}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl isRequired={formData.create_account}>
                            <FormLabel fontSize="sm" color={labelColor}>{t("common.confirm_password")}</FormLabel>
                            <InputGroup>
                              <InputLeftElement pointerEvents="none" children={<FiLock color="gray.400" />} />
                              <Input
                                name="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                bg={inputBg}
                                borderColor={borderColor}
                                borderRadius="xl"
                              />
                              <IconButton
                                variant="ghost"
                                size="sm"
                                position="absolute"
                                right="2"
                                top="1"
                                zIndex="2"
                                icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label="Toggle confirm password visibility"
                              />
                            </InputGroup>
                          </FormControl>
                        </SimpleGrid>
                      </Collapse>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>

            {/* RIGHT COLUMN: Documents / Photos */}
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack spacing={6}>
                    <HStack w="full" spacing={4}>
                      <Icon as={FiCamera} color="green.500" boxSize={5} />
                      <Text fontSize="lg" fontWeight="bold">{t("tenant.identity_docs")}</Text>
                    </HStack>

                    {/* PHOTO */}
                    <FormControl>
                      <FormLabel fontSize="sm" color={labelColor}>{t("tenant.photo")}</FormLabel>
                      <Box
                        pos="relative"
                        w="full"
                        h="120px"
                        borderRadius="xl"
                        border="2px dashed"
                        borderColor={borderColor}
                        bg={inputBg}
                        display="flex"
                        flexDirection="column"
                        align="center"
                        justify="center"
                        cursor="pointer"
                        overflow="hidden"
                        transition="all 0.2s"
                        _hover={{ borderColor: "blue.400", bg: "blue.50", _dark: { bg: "whiteAlpha.50" } }}
                        onClick={() => photoRef.current.click()}
                      >
                        {previews.photo ? (
                          <Image src={previews.photo} w="full" h="full" objectFit="cover" />
                        ) : (
                          <>
                            <Icon as={FiCamera} boxSize={6} color="gray.400" mb={1} />
                            <Text fontSize="xs" color="gray.500">{t("tenant.upload_photo")}</Text>
                          </>
                        )}
                        <Input
                          ref={photoRef}
                          type="file"
                          accept="image/*"
                          display="none"
                          onChange={(e) => handleFileChange(e, "photo")}
                        />
                      </Box>
                    </FormControl>

                    <Divider />

                    {/* ID FRONT */}
                    <FormControl>
                      <FormLabel fontSize="sm" color={labelColor}>{t("tenant.id_front")}</FormLabel>
                      <Box
                        pos="relative"
                        w="full"
                        h="120px"
                        borderRadius="xl"
                        border="2px dashed"
                        borderColor={borderColor}
                        bg={inputBg}
                        display="flex"
                        flexDirection="column"
                        align="center"
                        justify="center"
                        cursor="pointer"
                        overflow="hidden"
                        _hover={{ borderColor: "blue.400" }}
                        onClick={() => idFrontRef.current.click()}
                      >
                        {previews.id_photo ? (
                          <Image src={previews.id_photo} w="full" h="full" objectFit="cover" />
                        ) : (
                          <>
                            <Icon as={FiUploadCloud} boxSize={6} color="gray.400" />
                            <Text fontSize="xs" color="gray.500">{t("tenant.id_card_front")}</Text>
                          </>
                        )}
                        <Input
                          ref={idFrontRef}
                          type="file"
                          accept="image/*"
                          display="none"
                          onChange={(e) => handleFileChange(e, "id_photo")}
                        />
                      </Box>
                    </FormControl>

                    {/* ID BACK */}
                    <FormControl>
                      <FormLabel fontSize="sm" color={labelColor}>{t("tenant.id_back")}</FormLabel>
                      <Box
                        pos="relative"
                        w="full"
                        h="120px"
                        borderRadius="xl"
                        border="2px dashed"
                        borderColor={borderColor}
                        bg={inputBg}
                        display="flex"
                        flexDirection="column"
                        align="center"
                        justify="center"
                        cursor="pointer"
                        overflow="hidden"
                        _hover={{ borderColor: "blue.400" }}
                        onClick={() => idBackRef.current.click()}
                      >
                        {previews.id_card_back ? (
                          <Image src={previews.id_card_back} w="full" h="full" objectFit="cover" />
                        ) : (
                          <>
                            <Icon as={FiUploadCloud} boxSize={6} color="gray.400" />
                            <Text fontSize="xs" color="gray.500">{t("tenant.id_card_back")}</Text>
                          </>
                        )}
                        <Input
                          ref={idBackRef}
                          type="file"
                          accept="image/*"
                          display="none"
                          onChange={(e) => handleFileChange(e, "id_card_back")}
                        />
                      </Box>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              {/* SAVE BUTTON */}
              <Box>
                <Button
                  w="full"
                  size="lg"
                  colorScheme="blue"
                  borderRadius="xl"
                  height="60px"
                  fontSize="md"
                  fontWeight="bold"
                  type="submit"
                  isLoading={isLoading}
                  loadingText={t("common.saving")}
                  leftIcon={<FiCheckCircle />}
                  boxShadow="0 4px 14px 0 rgba(49, 130, 206, 0.39)"
                >
                  {isEdit ? t("tenant.update_profile") : t("tenant.save_tenant")}
                </Button>
                <Button
                  mt={3}
                  w="full"
                  variant="ghost"
                  onClick={() => navigate("/dashboard/tenants")}
                >
                  {t("common.cancel")}
                </Button>
              </Box>
            </VStack>

          </SimpleGrid>
        </form>
      </VStack>
    </Box>
  );
};

export default AddNewTenant;
