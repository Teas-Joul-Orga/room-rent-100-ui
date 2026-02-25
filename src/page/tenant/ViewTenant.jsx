import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, Flex, Grid, Text, Heading, Badge, Button, Image, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
  ModalBody, ModalCloseButton, useDisclosure, useColorModeValue, 
  useColorMode, VStack, HStack, Input, FormControl, FormLabel,
  Icon, Spinner, Table, Thead, Tbody, Tr, Th, Td, IconButton,
  useToast
} from "@chakra-ui/react";
import { CiEdit } from "react-icons/ci";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { LuArrowLeft, LuFileText } from "react-icons/lu";

export default function ViewTenant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem("token");

  // Chakra UI colors
  const { colorMode } = useColorMode();
  const bgMain = useColorModeValue("sky.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const tableHeaderBg = useColorModeValue("sky.50", "gray.700");

  const [tenant, setTenant] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(true);

  // Modals
  const { isOpen: isIdOpen, onOpen: onIdOpen, onClose: onIdClose } = useDisclosure();
  const { isOpen: isPwdOpen, onOpen: onPwdOpen, onClose: onPwdClose } = useDisclosure();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  const fetchTenantDetails = async () => {
    try {
      setLoadingTenant(true);
      const res = await fetch(`http://localhost:8000/api/v1/admin/tenants/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch tenant details.", status: "error", duration: 3000 });
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Could not connect to the server.", status: "error", duration: 3000 });
    } finally {
      setLoadingTenant(false);
    }
  };

  const isMismatch = confirmPassword && newPassword !== confirmPassword;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (isMismatch) return;

    setLoadingPwd(true);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tenants/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          change_password: true,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewPassword("");
        setConfirmPassword("");
        onPwdClose();
        toast({ title: "Success", description: "Password updated successfully", status: "success", duration: 3000 });
      } else {
        toast({ title: "Error", description: data.error || data.message || "Failed to update password", status: "error", duration: 4000 });
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Network error occurred.", status: "error", duration: 3000 });
    } finally {
      setLoadingPwd(false);
    }
  };

  if (loadingTenant) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgMain}>
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!tenant) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgMain}>
        <Text color="red.500" fontSize="xl">Tenant not found.</Text>
      </Flex>
    );
  }

  return (
    <Box p={6} bg={bgMain} minH="100vh">
      <VStack spacing={6} align="stretch" w="full">
        
        {/* ===== HEADER ===== */}
        <Flex justify="space-between" align="center">
          <Heading size="lg" color={textColor}>Tenant Profile</Heading>
          <Button 
            leftIcon={<LuArrowLeft />} 
            onClick={() => navigate(-1)} 
            variant="outline" 
            bg={cardBg} 
            borderColor={borderColor}
            _hover={{ bg: hoverBg }}
          >
            Back
          </Button>
        </Flex>

        {/* ===== PROFILE & INFO CARD ===== */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
          
          {/* LEFT: AVATAR CARD */}
          <Box bg={cardBg} p={8} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor} textAlign="center">
            <Flex direction="column" align="center" justify="center" h="full" gap={4}>
              <Box position="relative">
                <Image
                  src={tenant.photo_path ? `http://localhost:8000/storage/${tenant.photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name)}&background=random&size=150`}
                  alt="Tenant"
                  boxSize="160px"
                  objectFit="cover"
                  borderRadius="full"
                  borderWidth="4px"
                  borderColor={colorMode === 'light' ? "sky.100" : "blue.900"}
                  boxShadow="lg"
                />
                <CircleBadge isActive={!!tenant.user_id} />
              </Box>

              <Heading size="md" color={textColor} mt={2}>{tenant.name}</Heading>
              
              <Badge 
                colorScheme={tenant.user_id ? "green" : "orange"} 
                px={3} py={1} borderRadius="full" textTransform="uppercase" letterSpacing="wider" fontSize="xs"
              >
                {tenant.user_id ? "Account Linked" : "Pending Registration"}
              </Badge>
            </Flex>
          </Box>

          {/* RIGHT: DETAILS CARD */}
          <Box bg={cardBg} p={8} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
              <Heading size="md" color={textColor}>Personal Details</Heading>
              {tenant.user_id && (
                <Button 
                  leftIcon={<CiEdit />} 
                  colorScheme="blue" 
                  size="sm" 
                  onClick={onPwdOpen}
                  borderRadius="lg"
                >
                  Change Password
                </Button>
              )}
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              <InfoItem label="Email Address" value={tenant.email || "N/A"} bg={bgMain} border={borderColor} />
              <InfoItem label="Phone Number" value={tenant.phone || "N/A"} bg={bgMain} border={borderColor} />
              <InfoItem label="Occupation" value={tenant.occupation || tenant.job || "N/A"} bg={bgMain} border={borderColor} />
              <InfoItem label="Date of Birth" value={tenant.dob || "N/A"} bg={bgMain} border={borderColor} />
              
              {/* ID Card Button within the grid */}
              <Box 
                as="button" 
                onClick={onIdOpen}
                p={4} 
                borderRadius="xl" 
                bg={colorMode === 'light' ? 'sky.50' : 'blue.900'} 
                borderWidth="1px" 
                borderColor={colorMode === 'light' ? 'sky.200' : 'blue.700'}
                _hover={{ bg: colorMode === 'light' ? 'sky.100' : 'blue.800', transform: "translateY(-2px)" }}
                transition="all 0.2s"
                textAlign="left"
              >
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontSize="xs" color={colorMode === 'light' ? 'sky.600' : 'blue.300'} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Identity Verification
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color={textColor} mt={1}>
                      View ID Scans
                    </Text>
                  </Box>
                  <Icon as={LuFileText} boxSize={6} color={colorMode === 'light' ? 'sky.500' : 'blue.400'} />
                </Flex>
              </Box>
            </Grid>
          </Box>
        </Grid>

        {/* ===== LEASE HISTORY ===== */}
        <Box bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor} overflow="hidden">
           <Flex p={6} borderBottom="1px" borderColor={borderColor} align="center" justify="space-between">
            <Heading size="md" color={textColor}>Lease History</Heading>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => navigate(`/dashboard/tenants/createlease`, { state: { id: tenant.id, email: tenant.email } })}
            >
              + Create Lease
            </Button>
           </Flex>
           
           <Box overflowX="auto">
             <Table variant="simple">
               <Thead bg={tableHeaderBg} boxShadow="sm" position="relative" zIndex={1}>
                 <Tr>
                   <Th>Room</Th>
                   <Th>Dates</Th>
                   <Th isNumeric>Rent Amount</Th>
                   <Th>Status</Th>
                 </Tr>
               </Thead>
               <Tbody>
                 {tenant.leases && tenant.leases.length > 0 ? (
                   tenant.leases.map((lease) => (
                     <Tr key={lease.id} _hover={{ bg: hoverBg }}>
                       <Td fontWeight="bold" color={textColor}>{lease.room?.name || `Room ${lease.room_id}`}</Td>
                       <Td color={mutedTextColor}>
                         {lease.start_date} <Text as="span" mx={1} opacity={0.5}>to</Text> {lease.end_date}
                       </Td>
                       <Td isNumeric fontWeight="medium" color={textColor}>${parseFloat(lease.rent_amount).toFixed(2)}</Td>
                       <Td>
                         <Badge 
                           colorScheme={lease.status === 'active' ? 'green' : 'gray'} 
                           variant="subtle" 
                           px={2} py={1} borderRadius="md"
                         >
                           {lease.status}
                         </Badge>
                       </Td>
                     </Tr>
                   ))
                 ) : (
                   <Tr>
                     <Td colSpan={4} textAlign="center" py={8} color={mutedTextColor} fontStyle="italic">
                       No lease history found for this tenant.
                     </Td>
                   </Tr>
                 )}
               </Tbody>
             </Table>
           </Box>
        </Box>
      </VStack>

      {/* ===== ID MODAL ===== */}
      <Modal isOpen={isIdOpen} onClose={onIdClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="2xl">
          <ModalHeader color={textColor}>Tenant ID Scans</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <Box>
                <Text fontWeight="bold" color={mutedTextColor} mb={2} fontSize="sm" textTransform="uppercase">Front</Text>
                <Image
                  src={tenant.id_photo_path ? `http://localhost:8000/storage/${tenant.id_photo_path}` : "https://via.placeholder.com/600x400?text=No+Front+ID"}
                  alt="ID Front"
                  w="full"
                  h="250px"
                  objectFit="cover"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                />
              </Box>
              <Box>
                <Text fontWeight="bold" color={mutedTextColor} mb={2} fontSize="sm" textTransform="uppercase">Back</Text>
                <Image
                  src={tenant.id_card_back_path ? `http://localhost:8000/storage/${tenant.id_card_back_path}` : "https://via.placeholder.com/600x400?text=No+Back+ID"}
                  alt="ID Back"
                  w="full"
                  h="250px"
                  objectFit="cover"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                />
              </Box>
            </Grid>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button onClick={onIdClose} variant="ghost" mr={3}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== PASSWORD MODAL ===== */}
      <Modal isOpen={isPwdOpen} onClose={onPwdClose} isCentered>
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="2xl">
          <ModalHeader color={textColor}>Admin Password Override</ModalHeader>
          <ModalBody pb={6}>
            <form id="pwd-form" onSubmit={handleUpdatePassword}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" color={mutedTextColor}>Tenant Email</FormLabel>
                  <Input value={tenant.email} isDisabled bg={hoverBg} borderColor={borderColor} />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedTextColor}>New Password</FormLabel>
                  <Box position="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "blue.400", boxShadow: "outline" }}
                    />
                    <IconButton
                      icon={showNew ? <FaEyeSlash /> : <FaEye />}
                      size="sm"
                      variant="ghost"
                      position="absolute"
                      right="2"
                      top="1"
                      zIndex={2}
                      onClick={() => setShowNew(!showNew)}
                      aria-label="Toggle new password"
                    />
                  </Box>
                </FormControl>

                <FormControl isRequired isInvalid={isMismatch}>
                  <FormLabel fontSize="sm" color={isMismatch ? "red.500" : mutedTextColor}>
                    {isMismatch ? "Passwords do not match" : "Confirm Password"}
                  </FormLabel>
                  <Box position="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      borderColor={isMismatch ? "red.400" : borderColor}
                      _focus={{ borderColor: isMismatch ? "red.400" : "blue.400", boxShadow: "outline" }}
                    />
                    <IconButton
                      icon={showConfirm ? <FaEyeSlash /> : <FaEye />}
                      size="sm"
                      variant="ghost"
                      position="absolute"
                      right="2"
                      top="1"
                      zIndex={2}
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label="Toggle confirm password"
                    />
                  </Box>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="ghost" mr={3} onClick={onPwdClose} isDisabled={loadingPwd}>
              Cancel
            </Button>
            <Button type="submit" form="pwd-form" colorScheme="blue" isLoading={loadingPwd} isDisabled={isMismatch || !newPassword}>
              Update Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}

// Subcomponents
function InfoItem({ label, value, bg, border }) {
  return (
    <Box p={4} borderRadius="xl" bg={bg} borderWidth="1px" borderColor={border}>
      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>{label}</Text>
      <Text fontSize="md" fontWeight="bold" color={useColorModeValue("gray.800", "white")}>{value}</Text>
    </Box>
  );
}

function CircleBadge({ isActive }) {
  return (
    <Box
      position="absolute"
      bottom="2"
      right="2"
      w="5"
      h="5"
      borderRadius="full"
      borderWidth="3px"
      borderColor={useColorModeValue("white", "gray.800")}
      bg={isActive ? "green.400" : "orange.400"}
      boxShadow="sm"
    />
  );
}
