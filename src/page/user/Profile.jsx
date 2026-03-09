import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Avatar, VStack, HStack, Icon, 
  SimpleGrid, Divider, useColorModeValue, Container, Badge,
  Button, FormControl, FormLabel, Input, InputGroup, InputLeftAddon,
  useToast, Spinner, Stack
} from '@chakra-ui/react';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiShield, 
  FiMapPin, FiBriefcase, FiEdit2, FiSave, FiLock
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    occupation: "",
    address: ""
  });

  const toast = useToast();
  const token = localStorage.getItem("token");

  const mainBg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setFormData({
          name: parsed.name || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          occupation: parsed.occupation || parsed.job || "",
          address: parsed.address || ""
        });
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) {
      toast({ title: t('common.error'), description: t('profile_page.not_found'), status: "error", position: "top-right" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${user.uid}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Update local state and localStorage
        const updatedUser = { ...user, ...formData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        toast({ 
          title: t('tenant.update_success'), 
          status: 'success', 
          duration: 3000, 
          position: 'top-right' 
        });
        setIsEditing(false);
      } else {
        toast({ 
          title: t('common.error'), 
          description: result.message || 'Server error', 
          status: 'error', 
          position: 'top-right' 
        });
      }
    } catch(e) {
      toast({ title: t('common.network_error'), status: 'error', duration: 3000, position: 'top-right' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Flex py={40} justify="center" bg={mainBg} h="100vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  if (!user) {
    return (
      <Flex py={40} justify="center" bg={mainBg} h="100vh">
        <Text color={textColor}>{t('profile_page.not_found')}</Text>
      </Flex>
    );
  }

  const role = localStorage.getItem("role") || "user";

  return (
    <Box bg={mainBg} minH="calc(100vh - 80px)" p={{ base: 4, md: 8 }}>
      <Container maxW="100%" p={0}>
        
        {/* Header Section */}
        <Flex justify="space-between" align="center" mb={10} flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" fontWeight="black" color={textColor} letterSpacing="tight">
              {t('profile_page.title')}
            </Heading>
            <Text color={mutedText} fontWeight="medium">
              {t('profile_page.subtitle')}
            </Text>
          </Box>
          <HStack spacing={4}>
            {isEditing ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to current user data
                    setFormData({
                      name: user.name || "",
                      email: user.email || "",
                      phone: user.phone || "",
                      occupation: user.occupation || user.job || "",
                      address: user.address || ""
                    });
                  }}
                >
                  {t('profile_page.cancel')}
                </Button>
                <Button 
                  leftIcon={<FiSave />} 
                  colorScheme="blue" 
                  borderRadius="xl"
                  shadow="lg"
                  onClick={handleSave}
                  isLoading={saving}
                  loadingText={t('profile_page.saving')}
                >
                  {t('profile_page.save')}
                </Button>
              </>
            ) : (
              <Button 
                leftIcon={<FiEdit2 />} 
                variant="outline" 
                borderRadius="xl"
                borderColor={borderColor}
                bg={cardBg}
                _hover={{ bg: useColorModeValue("gray.50", "#1c2128") }}
                onClick={() => setIsEditing(true)}
              >
                {t('profile_page.edit')}
              </Button>
            )}
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          
          {/* Left Column: Avatar & Summary */}
          <VStack spacing={6} align="stretch">
            <Box bg={cardBg} p={8} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm" textAlign="center">
              <Avatar 
                size="2xl" 
                name={user.name} 
                src={user.photo_path ? `http://localhost:8000/storage/${user.photo_path}` : null} 
                mb={4}
                border="4px solid"
                borderColor="blue.500"
              />
              <Heading size="md" color={textColor} mb={1}>{user.name}</Heading>
              <Text fontSize="sm" color={mutedText} mb={4}>{user.email}</Text>
              <Badge 
                px={4} py={1} borderRadius="full" colorScheme="blue" variant="subtle" fontWeight="black" textTransform="uppercase"
              >
                {role}
              </Badge>
            </Box>

            <Box bg={cardBg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm">
              <VStack align="stretch" spacing={4}>
                <HStack spacing={3}>
                  <Icon as={FiShield} color="green.500" />
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>{t('profile_page.security_header')}</Text>
                </HStack>
                <Divider borderColor={borderColor} />
                <Text fontSize="xs" color={mutedText}>
                  {t('profile_page.security_desc')}
                </Text>
                <Button 
                  size="sm" 
                  variant="link" 
                  color="blue.500" 
                  leftIcon={<FiLock />} 
                  justifyContent="flex-start"
                >
                  {t('profile_page.change_password')}
                </Button>
              </VStack>
            </Box>
          </VStack>

          {/* Right Column: Detailed Info Form */}
          <Box gridColumn={{ md: "span 2" }} bg={cardBg} p={{ base: 6, md: 10 }} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm">
            <Box mb={8}>
              <HStack spacing={3} mb={1}>
                <Icon as={FiUser} boxSize={6} color="blue.500" />
                <Heading size="md" color={textColor} letterSpacing="tight">{t('profile_page.personal_header')}</Heading>
              </HStack>
              <Text fontSize="sm" color={mutedText}>{t('profile_page.personal_desc')}</Text>
              <Divider mt={4} borderColor={borderColor} />
            </Box>

            <Stack spacing={8}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <FormControl isDisabled={!isEditing}>
                  <FormLabel fontWeight="black" fontSize="xs" color={mutedText} textTransform="uppercase">{t('profile_page.label_name')}</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftAddon borderLeftRadius="xl"><FiUser /></InputLeftAddon>
                    <Input name="name" value={formData.name} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                  </InputGroup>
                </FormControl>

                <FormControl isDisabled={!isEditing}>
                  <FormLabel fontWeight="black" fontSize="xs" color={mutedText} textTransform="uppercase">{t('profile_page.label_email')}</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftAddon borderLeftRadius="xl"><FiMail /></InputLeftAddon>
                    <Input name="email" value={formData.email} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                  </InputGroup>
                </FormControl>

                <FormControl isDisabled={!isEditing}>
                  <FormLabel fontWeight="black" fontSize="xs" color={mutedText} textTransform="uppercase">{t('profile_page.label_phone')}</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftAddon borderLeftRadius="xl"><FiPhone /></InputLeftAddon>
                    <Input name="phone" value={formData.phone} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                  </InputGroup>
                </FormControl>

                <FormControl isDisabled={!isEditing}>
                  <FormLabel fontWeight="black" fontSize="xs" color={mutedText} textTransform="uppercase">{t('profile_page.label_occupation')}</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftAddon borderLeftRadius="xl"><FiBriefcase /></InputLeftAddon>
                    <Input name="occupation" value={formData.occupation} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                  </InputGroup>
                </FormControl>
              </SimpleGrid>

              <FormControl isDisabled={!isEditing}>
                <FormLabel fontWeight="black" fontSize="xs" color={mutedText} textTransform="uppercase">{t('profile_page.label_address')}</FormLabel>
                <InputGroup size="lg">
                  <InputLeftAddon borderLeftRadius="xl"><FiMapPin /></InputLeftAddon>
                  <Input name="address" value={formData.address} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                </InputGroup>
              </FormControl>

              <Box bg={mainBg} p={6} borderRadius="2xl" border="1px dashed" borderColor={borderColor}>
                <HStack spacing={3} mb={2}>
                  <Icon as={FiCalendar} color="blue.500" />
                  <Text fontWeight="bold" fontSize="sm" color={textColor}>{t('profile_page.account_details')}</Text>
                </HStack>
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="10px" fontWeight="black" color={mutedText} textTransform="uppercase">{t('profile_page.member_since')}</Text>
                    <Text fontSize="sm" fontWeight="bold">{new Date(user.created_at).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="10px" fontWeight="black" color={mutedText} textTransform="uppercase">{t('profile_page.user_id')}</Text>
                    <Text fontSize="sm" fontWeight="bold">#{user.id}</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Stack>
          </Box>

        </SimpleGrid>
      </Container>
    </Box>
  );
}
