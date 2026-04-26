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
import Logo from "../../assets/Arun_MuyKea.png";

export default function TenantRegistrationForm() {
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
          Back
        </Button>
        <Button leftIcon={<FiPrinter />} colorScheme="blue" onClick={handlePrint} shadow="md">
          Print Form
        </Button>
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
              <Heading size="sm" fontWeight="black" textTransform="uppercase">Arun Muy Kea</Heading>
              <Text fontSize="2xs" fontWeight="bold">Room Rental Management</Text>
            </VStack>
          </HStack>
          <VStack align="flex-end" spacing={0}>
            <Heading size="md" fontWeight="black" textTransform="uppercase">Tenant Registration Form</Heading>
            <Text fontSize="xs" fontStyle="italic">Please fill out this form clearly in BLOCK LETTERS.</Text>
          </VStack>
        </Flex>

        {/* Section 1: Personal Information */}
        <Box mb={4}>
          <Heading size="xs" bg="gray.100" p={1.5} mb={2} textTransform="uppercase" border="1px solid" borderColor={borderColor}>
            1. Personal Information
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Full Name</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Date of Birth (DD/MM/YYYY)</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Gender</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">National ID / Passport Number</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Section 2: Contact Details */}
        <Box mb={4}>
          <Heading size="xs" bg="gray.100" p={1.5} mb={2} textTransform="uppercase" border="1px solid" borderColor={borderColor}>
            2. Contact Details
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Phone Number</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Email Address</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
          <Box borderBottom="1px solid" borderColor={borderColor} pb={1} mb={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.600">Current Address</Text>
            <Box h="12px"></Box>
          </Box>
        </Box>

        {/* Section 3: Employment Information */}
        <Box mb={4}>
          <Heading size="xs" bg="gray.100" p={1.5} mb={2} textTransform="uppercase" border="1px solid" borderColor={borderColor}>
            3. Employment Information
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Occupation / Job Title</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Company Name / School</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Section 4: Emergency Contact */}
        <Box mb={4}>
          <Heading size="xs" bg="gray.100" p={1.5} mb={2} textTransform="uppercase" border="1px solid" borderColor={borderColor}>
            4. Emergency Contact
          </Heading>
          <SimpleGrid columns={3} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Contact Name</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Relationship</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Phone Number</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Section 5: Room Details */}
        <Box mb={6}>
          <Heading size="xs" bg="gray.100" p={1.5} mb={2} textTransform="uppercase" border="1px solid" borderColor={borderColor}>
            5. Room Preferences (Office Use)
          </Heading>
          <SimpleGrid columns={2} spacing={4} mb={2}>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Target Move-in Date</Text>
              <Box h="12px"></Box>
            </Box>
            <Box borderBottom="1px solid" borderColor={borderColor} pb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.600">Preferred Room Type / Number</Text>
              <Box h="12px"></Box>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Declaration & Signature */}
        <Box border="1px solid" borderColor={borderColor} p={3}>
          <Text fontSize="xs" mb={6} textAlign="justify">
            I hereby declare that the information provided above is true and accurate to the best of my knowledge. I understand that any false information may result in the rejection of my application or termination of the lease agreement.
          </Text>
          <SimpleGrid columns={2} spacing={10}>
            <Box borderTop="1px solid" borderColor={textColor} pt={1} textAlign="center">
              <Text fontSize="sm" fontWeight="bold">Applicant's Signature</Text>
              <Text fontSize="xs" color="gray.500">Date: ______ / ______ / ________</Text>
            </Box>
            <Box borderTop="1px solid" borderColor={textColor} pt={1} textAlign="center">
              <Text fontSize="sm" fontWeight="bold">Landlord / Management Signature</Text>
              <Text fontSize="xs" color="gray.500">Date: ______ / ______ / ________</Text>
            </Box>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
}
