import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  useToast,
  Spinner
} from "@chakra-ui/react";
import { FiSearch, FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiUserCheck, FiUserX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]); // For unlinked tenants
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const toast = useToast();
  
  // Pagination & Filtering state
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [perPage, setPerPage] = useState(8);

  useEffect(() => {
    const calculatePerPage = () => {
      // 56(navbar) + 48(padding) + 40(heading) + 24(mb) + 80(toolbar) + 40(thead) + 65(footer) = ~353px
      // 100vh - 420px = conservative available space for rows
      // each row is ~60px
      const availableHeight = window.innerHeight - 420;
      let calculated = Math.floor(availableHeight / 60);
      if (calculated < 3) calculated = 3;
      setPerPage(calculated);
    };
    calculatePerPage();

    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePerPage, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Colors
  const bgMain = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const thColor = useColorModeValue("gray.500", "gray.400");
  const trHoverBadge = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  
  // Modals
  const { isOpen: isCreateOpen, onOpen: onOpenCreate, onClose: onCloseCreate } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();
  
  // Form State
  const initialForm = { name: "", email: "", password: "", password_confirmation: "", role: "tenant", tenant_id: "" };
  const [formData, setFormData] = useState(initialForm);
  const [selectedUser, setSelectedUser] = useState(null);

  // Retrieve token
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchTenants(); // Needed for dropdown linking a user to a tenant
    // eslint-disable-next-line
  }, [pagination.current_page, searchTerm, roleFilter, perPage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users?page=${pagination.current_page}&search=${searchTerm}&role=${roleFilter}&per_page=${perPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data);
        setPagination(prev => ({
          ...prev,
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total
        }));
      } else {
        toast({ title: "Error", description: "Failed to fetch users.", status: "error", duration: 3000 });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error occurred.", status: "error", duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tenants?has_account=no&limit=all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      toast({ title: "Error", description: "Passwords do not match.", status: "error", duration: 3000 });
      return;
    }
    setIsSubmitLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: result.message || "User created.", status: "success", duration: 3000 });
        onCloseCreate();
        setFormData(initialForm);
        fetchUsers();
      } else {
        toast({ title: "Error", description: result.message || "Failed to create user.", status: "error", duration: 3000 });
      }
    } catch(err) {
      toast({ title: "Network Error", status: "error", duration: 3000 });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.password_confirmation) {
      toast({ title: "Error", description: "Passwords do not match.", status: "error", duration: 3000 });
      return;
    }
    setIsSubmitLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${selectedUser.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined,
          password_confirmation: formData.password_confirmation || undefined
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: result.message || "User updated.", status: "success", duration: 3000 });
        onCloseEdit();
        fetchUsers();
      } else {
        toast({ title: "Error", description: result.message || "Failed to update user.", status: "error", duration: 3000 });
      }
    } catch(err) {
      toast({ title: "Network Error", status: "error", duration: 3000 });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${user.uid}/toggle-status`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchUsers();
        toast({ title: "Success", description: "User status toggled.", status: "success", duration: 3000 });
      } else {
        toast({ title: "Error", description: "Failed to toggle status.", status: "error", duration: 3000 });
      }
    } catch (err) {
      toast({ title: "Network Error", status: "error", duration: 3000 });
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${selectedUser.uid}`, {
        method: "DELETE",
        headers: {
           Accept: "application/json",
           Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast({ title: "Success", description: "User deleted.", status: "info", duration: 3000 });
        onCloseDelete();
        fetchUsers();
      } else {
        toast({ title: "Error", description: "Failed to delete user.", status: "error", duration: 3000 });
      }
    } catch(err) {
      toast({ title: "Network Error", status: "error", duration: 3000 });
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({ ...initialForm, name: user.name, email: user.email, role: user.role });
    onOpenEdit();
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    onOpenDelete();
  };

  return (
    <Box p={6} bg={bgMain} h={{ base: "auto", lg: "calc(100vh - 140px)" }} overflow="hidden" display="flex" flexDirection="column">
      <Flex justify="space-between" align="center" mb={6} flexShrink={0}>
        <Box>
          <Heading size="lg" color={textColor} fontWeight="extrabold" letterSpacing="tight">
            System Users
          </Heading>
          <Text color={mutedTextColor} mt={1} fontSize="sm">
            Manage administrative access and tenant portal accounts.
          </Text>
        </Box>

        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue" 
          onClick={() => { setFormData(initialForm); onOpenCreate(); fetchTenants(); }}
          borderRadius="lg"
          px={6}
          shadow="md"
        >
          Add User
        </Button>
      </Flex>

      <Box bg={cardBg} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={borderColor} display="flex" flexDirection="column" flex={1} minH={0}>
        {/* Toolbar */}
        <Flex p={4} borderBottomWidth="1px" borderColor={borderColor} gap={4} flexWrap="wrap" flexShrink={0}>
          <InputGroup maxW="320px">
            <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
            <Input 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })) }}
              focusBorderColor="blue.500"
              borderRadius="lg"
            />
          </InputGroup>

          <Select 
            maxW="200px" 
            borderRadius="lg" 
            focusBorderColor="blue.500" 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })) }}
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="tenant">Tenant</option>
          </Select>
        </Flex>

        {/* Table */}
        <Box overflow="hidden" flex={1}>
          <Table variant="simple" size="md">
            <Thead bg={useColorModeValue("gray.50", "gray.700")} position="sticky" top={0} zIndex={2} boxShadow="sm">
              <Tr>
                <Th w="20px"></Th>
                <Th color={thColor}>User Details</Th>
                <Th color={thColor}>Role</Th>
                <Th color={thColor}>Status</Th>
                <Th isNumeric color={thColor}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={12}>
                    <Spinner size="lg" color="blue.500" />
                  </Td>
                </Tr>
              ) : users.length > 0 ? (
                users.map(user => (
                  <Tr key={user.uid || user.id} _hover={{ bg: trHoverBadge }}>
                    <Td pr={0}>
                       <Box 
                         w="10px" 
                         h="10px" 
                         borderRadius="full" 
                         bg={user.is_active ? "green.400" : "red.400"} 
                         boxShadow="sm"
                       />
                    </Td>
                    <Td>
                      <Flex direction="column">
                        <Text fontWeight="bold" color={textColor}>{user.name}</Text>
                        <Text fontSize="sm" color={mutedTextColor}>{user.email}</Text>
                      </Flex>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={user.role === 'admin' ? "purple" : "blue"}
                        borderRadius="full"
                        px={3} py={1}
                        textTransform="capitalize"
                      >
                        {user.role}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={user.is_active ? "green" : "red"} 
                        variant="subtle"
                        cursor="pointer"
                        display="inline-flex"
                        alignItems="center"
                        px={3} 
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                        letterSpacing="wider"
                        boxShadow="sm"
                        transition="all 0.2s"
                        onClick={() => handleToggleStatus(user)}
                        _hover={{ 
                          transform: "translateY(-1px)", 
                          boxShadow: "md",
                          opacity: 0.9
                        }}
                      >
                        {user.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <Menu>
                        <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                        <MenuList shadow="lg" border={`1px solid`} borderColor={borderColor} p={1}>
                          <MenuItem icon={<FiEdit2 />} onClick={() => openEditModal(user)} borderRadius="md">Edit details</MenuItem>
                          <MenuItem 
                            icon={user.is_active ? <FiUserX /> : <FiUserCheck />} 
                            onClick={() => handleToggleStatus(user)}
                            borderRadius="md"
                          >
                            {user.is_active ? "Disable account" : "Enable account"}
                          </MenuItem>
                          <MenuItem icon={<FiTrash2 />} onClick={() => openDeleteModal(user)} color="red.500" borderRadius="md">Delete</MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={10} color={mutedTextColor}>
                    No users found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
        
        {/* Pagination Footer */}
        {users.length > 0 && (
          <Flex p={4} borderTopWidth="1px" borderColor={borderColor} justify="space-between" align="center" flexShrink={0}>
            <Text fontSize="sm" color={mutedTextColor}>
              Total {pagination.total} users
            </Text>
            <HStack>
              <Button 
                size="sm" 
                variant="outline" 
                leftIcon={<FiChevronLeft />}
                isDisabled={pagination.current_page === 1}
                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
              >
                Previous
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                rightIcon={<FiChevronRight />}
                isDisabled={pagination.current_page === pagination.last_page}
                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateOpen} onClose={onCloseCreate} isCentered backdropFilter="blur(5px)">
        <ModalOverlay />
        <ModalContent borderRadius="xl" bg={cardBg}>
          <form onSubmit={handleCreateSubmit}>
            <ModalHeader>Create New User</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Email Address</FormLabel>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </FormControl>
              
              <HStack mb={4} align="flex-start">
                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="tenant">Tenant</option>
                    <option value="admin">Administrator</option>
                  </Select>
                </FormControl>
                
                {formData.role === "tenant" && (
                  <FormControl>
                    <FormLabel>Link to Tenant (Optional)</FormLabel>
                    <Select name="tenant_id" value={formData.tenant_id} onChange={handleInputChange}>
                      <option value="">-- No Link --</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                  </FormControl>
                )}
              </HStack>

              <HStack mb={4}>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" name="password" value={formData.password} onChange={handleInputChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Confirm</FormLabel>
                  <Input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange} />
                </FormControl>
              </HStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseCreate}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={isSubmitLoading}>Create User</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} onClose={onCloseEdit} isCentered backdropFilter="blur(5px)">
        <ModalOverlay />
        <ModalContent borderRadius="xl" bg={cardBg}>
          <form onSubmit={handleEditSubmit}>
            <ModalHeader>Edit User</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Email Address</FormLabel>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Role</FormLabel>
                <Select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="tenant">Tenant</option>
                  <option value="admin">Administrator</option>
                </Select>
              </FormControl>

              <Box mt={6} pt={4} borderTopWidth="1px" borderColor={borderColor}>
                <FormLabel color={mutedTextColor} fontSize="sm" fontWeight="bold">Change Password (Optional)</FormLabel>
                <HStack mb={4}>
                  <FormControl>
                    <Input type="password" placeholder="New Password" name="password" value={formData.password} onChange={handleInputChange} />
                  </FormControl>
                  <FormControl>
                    <Input type="password" placeholder="Confirm New" name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange} />
                  </FormControl>
                </HStack>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseEdit}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={isSubmitLoading}>Save Changes</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={onCloseDelete} isCentered>
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="xl" bg={cardBg}>
          <ModalHeader color="red.500">Delete User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={textColor}>
              Are you sure you want to permanently delete <strong>{selectedUser?.name}</strong>? This action cannot be undone and will revoke their system access immediately.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseDelete}>Cancel</Button>
            <Button colorScheme="red" onClick={handleDelete}>Delete Permanently</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
