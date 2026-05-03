import React, { useState, useEffect } from 'react';
import { useSessionState } from '../../hooks/useSessionState';
import {
  Box, Flex, Text, Button, Badge, Spinner, IconButton, useToast, Image,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure, Avatar, HStack,
  VStack, Icon, Menu, MenuButton, MenuList, MenuItem, Container, Heading, Divider
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiClock, FiMoreHorizontal, FiCalendar, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AddAnnouncementModal from '../Admin/AddAnnouncementModal';

dayjs.extend(relativeTime);

const API = "http://localhost:8000/api/v1";
const IMAGE_URL = "http://localhost:8000/storage";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useSessionState("adminAnnouncements", []);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const cancelRef = React.useRef();
  const toast = useToast();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
      const res = await fetch(`${API}/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.data || json); 
      }
    } catch (e) {
      console.error("Error fetching announcements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const confirmDelete = (id) => {
    setDeleteTarget(id);
    onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
      const res = await fetch(`${API}/admin/announcements/${deleteTarget}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: 'Announcement deleted.', status: 'success', duration: 3000 });
        fetchAnnouncements();
      } else {
        toast({ title: 'Delete failed.', status: 'error', duration: 3000 });
      }
    } catch(e) {
      toast({ title: 'Network error.', status: 'error', duration: 3000 });
    }
    onClose();
  };

  const toggleVisibility = async (id) => {
    try {
      const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
      const res = await fetch(`${API}/admin/announcements/${id}/toggle-visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: result.announcement.is_hidden ? 'Broadcast Hidden' : 'Broadcast Visible', status: 'info', duration: 3000 });
        fetchAnnouncements();
      } else {
        toast({ title: 'Update failed.', status: 'error', duration: 3000 });
      }
    } catch(e) {
      toast({ title: 'Network error.', status: 'error', duration: 3000 });
    }
  };

  return (
    <Box bg="gray.50" color="gray.800" minH="100vh" p={8}>
      <Box w="full">
        {/* Header matching public style logic with admin actions */}
        <Flex justify="space-between" align="center" mb={10}>
          <Box>
            <Heading as="h1" size="xl" color="gray.800" letterSpacing="tight">
              Broadcast Center
            </Heading>
            <Text fontSize="lg" color="gray.500" mt={2}>
              Create and manage property-wide updates.
            </Text>
          </Box>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            bg="blue.500"
            color="white"
            borderRadius="full" 
            px={6} 
            py={6}
            fontSize="15px"
            fontWeight="bold"
            _hover={{ bg: "blue.600" }}
            onClick={() => setIsAddModalOpen(true)}
          >
            New Broadcast
          </Button>
        </Flex>

        {loading && announcements.length === 0 ? (
          <Flex py={20} justify="center"><Spinner size="xl" color="blue.500" thickness="4px" /></Flex>
        ) : announcements.length > 0 ? (
          <VStack spacing={8} w="full" align="stretch">
            {announcements.map(a => {
              const isScheduled = dayjs(a.published_at).isAfter(dayjs());
              
              return (
                <Box 
                  key={a.uid || a.id} 
                  bg={a.priority === 'urgent' ? "red.50" : "white"} 
                  p={8} 
                  borderRadius="2xl" 
                  shadow="sm" 
                  border="1px solid" 
                  borderColor={a.priority === 'urgent' ? "red.300" : "gray.200"}
                >
                  <Flex justify="space-between" align="flex-start" mb={5}>
                    <HStack spacing={3}>
                      <Avatar size="md" name="Admin" bg="blue.500" color="white" />
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Text fontWeight="bold" color="gray.800">Admin</Text>
                          {a.priority === 'urgent' && (
                            <Badge colorScheme="red" variant="solid" borderRadius="md" px={2} fontSize="10px">
                              URGENT
                            </Badge>
                          )}
                          {a.is_hidden && (
                            <Badge colorScheme="gray" variant="solid" borderRadius="md" px={2} fontSize="10px">
                              Hidden
                            </Badge>
                          )}
                          {isScheduled && (
                            <Badge colorScheme="purple" variant="solid" borderRadius="md" px={2} fontSize="10px">
                              Scheduled
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2} color="gray.500" fontSize="sm">
                          <Icon as={isScheduled ? FiCalendar : FiClock} />
                          <Text>
                            {isScheduled ? `Scheduled for ${dayjs(a.published_at).format('MMM D, YYYY')}` : dayjs(a.published_at).format('MMM D, YYYY, h:mm A')}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    <Menu placement="bottom-end">
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreHorizontal />}
                        variant="ghost"
                        borderRadius="full"
                        aria-label="Options"
                      />
                      <MenuList borderRadius="md" shadow="lg" border="1px" borderColor="gray.200">
                        <MenuItem 
                          icon={a.is_hidden ? <FiEye /> : <FiEyeOff />} 
                          onClick={() => toggleVisibility(a.uid)}
                          fontWeight="semibold"
                        >
                          {a.is_hidden ? 'Show Broadcast' : 'Hide Broadcast'}
                        </MenuItem>
                        <Divider my={1} />
                        <MenuItem 
                          icon={<FiTrash2 />} 
                          color="red.500" 
                          fontWeight="semibold"
                          onClick={() => confirmDelete(a.uid)}
                        >
                          Delete Broadcast
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>

                  {/* Title styling matching public view */}
                  <Heading as="h3" size="md" mb={4} color="gray.800">
                    <Text as="span" bg="yellow.300" px={2} py={1} borderRadius="md" display="inline-block" lineHeight="normal">
                      {a.title}
                    </Text>
                  </Heading>

                  {/* Content styling matching public view */}
                  <Text fontSize="md" color="gray.600" mb={6} whiteSpace="pre-line" lineHeight="tall">
                    {a.content}
                  </Text>

                  {/* Post Media */}
                  {a.photo_path && (
                    <Box w="full" borderRadius="xl" overflow="hidden">
                      <Image 
                        src={`${IMAGE_URL}/${a.photo_path}`} 
                        alt="Announcement Media" 
                        w="full"
                        maxH="500px"
                        objectFit="cover"
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </VStack>
        ) : (
          <VStack py={20} textAlign="center" spacing={4}>
            <Icon as={FiInfo} boxSize={12} color="gray.300" />
            <Heading size="md" color="gray.500">No Announcements</Heading>
            <Text color="gray.400">There are currently no active announcements to display.</Text>
          </VStack>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <AddAnnouncementModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onSuccess={fetchAnnouncements} 
          />
        )}

        {/* Delete Confirmation Alert */}
        <AlertDialog isOpen={isOpen} onClose={onClose} isCentered leastDestructiveRef={cancelRef}>
          <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(2px)">
            <AlertDialogContent borderRadius="xl">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Announcement</AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this broadcast? It will be removed from all tenant portals immediately.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose} borderRadius="md">Cancel</Button>
                <Button colorScheme="red" onClick={executeDelete} ml={3} borderRadius="md">Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Box>
  );
}
