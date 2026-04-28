import React, { useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
  Image,
} from "@chakra-ui/react";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import Logo from "../../assets/Arun_MuyKea.png";

export default function TenantRegistrationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const bg = useColorModeValue("gray.50", "gray.900");
  const paperBg = useColorModeValue("white", "white");
  const textColor = "gray.800"; // Keep text dark for printing
  const borderColor = "gray.400"; // Darker border for printing

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="calc(100vh - 100px)">
      {/* Action Bar - Hidden during print */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6} 
        sx={{ "@media print": { display: "none" } }}
      >
        <Button leftIcon={<FiArrowLeft />} onClick={() => navigate(-1)} variant="ghost">
          {t('tenant_registration_form.back')}
        </Button>
        <HStack spacing={4}>
          <Box bg="white" rounded="md" shadow="sm">
            <LanguageSwitcher />
          </Box>
          <Button leftIcon={<FiPrinter />} colorScheme="blue" onClick={handlePrint} shadow="md">
            {t('tenant_registration_form.print_form')}
          </Button>
        </HStack>
      </Flex>

      {/* Printable Area */}
      <Box 
        ref={printRef}
        bg={paperBg} 
        color={textColor}
        maxW="210mm" // A4 width
        minH="297mm" // A4 height
        mx="auto" 
        p="20mm" 
        shadow="xl"
        borderRadius="md"
        sx={{
          "@media print": {
            boxShadow: "none",
            p: "10mm",
            m: 0,
            minH: "auto",
          }
        }}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={4} borderBottom="2px solid" borderColor={textColor} pb={2}>
          <HStack spacing={3}>
            <Image src={Logo} alt="Logo" boxSize="50px" objectFit="contain" />
            <VStack align="flex-start" spacing={0}>
              <Heading size="md" fontWeight="black">{t('tenant_registration_form.brand_name')}</Heading>
              <Text fontSize="xs" fontWeight="bold">{t('tenant_registration_form.brand_subtitle')}</Text>
            </VStack>
          </HStack>
          <VStack align="flex-end" spacing={0}>
            <Heading size="lg" fontWeight="black">{t('tenant_registration_form.form_title')}</Heading>
            <Text fontSize="sm" fontStyle="italic">{t('tenant_registration_form.form_subtitle')}</Text>
          </VStack>
        </Flex>

        {/* Section 1: Personal Information */}
        <Box mb={4}>
          <Heading size="sm" bg="gray.100" p={1.5} mb={2} border="1px solid" borderColor={borderColor}>
            {t('tenant_registration_form.section1')}
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.full_name')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.dob')}</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.gender')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.national_id')}</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Section 2: Contact Details */}
        <Box mb={4}>
          <Heading size="sm" bg="gray.100" p={1.5} mb={2} border="1px solid" borderColor={borderColor}>
            {t('tenant_registration_form.section2')}
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.phone')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.email')}</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
          <Box borderBottom="1px solid" borderColor={borderColor} pb={1} mb={2}>
            <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.address')}</Text>
            <Box h="12px"></Box>
          </Box>
        </Box>

        {/* Section 3: Employment Information */}
        <Box mb={4}>
          <Heading size="sm" bg="gray.100" p={1.5} mb={2} border="1px solid" borderColor={borderColor}>
            {t('tenant_registration_form.section3')}
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.occupation')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.company')}</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Section 4: Emergency Contact */}
        <Box mb={4}>
          <Heading size="sm" bg="gray.100" p={1.5} mb={2} border="1px solid" borderColor={borderColor}>
            {t('tenant_registration_form.section4')}
          </Heading>
          <SimpleGrid columns={3} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.contact_name')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.relationship')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.phone')}</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Section 5: Room Details */}
        <Box mb={6}>
          <Heading size="sm" bg="gray.100" p={1.5} mb={2} border="1px solid" borderColor={borderColor}>
            {t('tenant_registration_form.section5')}
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.move_in_date')}</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600">{t('tenant_registration_form.room_type')}</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Declaration & Signature */}
        <Box border="1px solid" borderColor={borderColor} p={3}>
          <Text fontSize="sm" mb={6} textAlign="justify">
            {t('tenant_registration_form.declaration')}
          </Text>
          <SimpleGrid columns={2} spacing={10}>
            <Box borderTop="1px solid" borderColor={textColor} pt={1} textAlign="center">
              <Text fontSize="md" fontWeight="bold">{t('tenant_registration_form.applicant_sig')}</Text>
              <Text fontSize="sm" color="gray.500">{t('tenant_registration_form.date_line')}</Text>
            </Box>
            <Box borderTop="1px solid" borderColor={textColor} pt={1} textAlign="center">
              <Text fontSize="md" fontWeight="bold">{t('tenant_registration_form.landlord_sig')}</Text>
              <Text fontSize="sm" color="gray.500">{t('tenant_registration_form.date_line')}</Text>
            </Box>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
}
