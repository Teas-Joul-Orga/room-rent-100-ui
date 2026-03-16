import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Button, Badge, useColorModeValue, Spinner, IconButton, useToast, Image, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure, Avatar, HStack,
  VStack, Icon, AspectRatio, Stack, Menu, MenuButton, MenuList, MenuItem, Container
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiClock, FiMoreHorizontal, FiCalendar, FiAlertCircle, FiThumbsUp } from 'react-icons/fi';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AddAnnouncementModal from '../Admin/AddAnnouncementModal';

dayjs.extend(relativeTime);

const API = "http://localhost:8000/api/v1";
const IMAGE_URL = "http://localhost:8000/storage"; // Adjust based on your public config

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // AlertDialog state for deletion
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const cancelRef = React.useRef();
  const toast = useToast();
  
  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const mediaBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const footerBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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

  return (
    <Container maxW="container.md" py={10}>
      <Flex justify="space-between" align="center" mb={10}>
        <Box>
          <Text fontSize="3xl" fontWeight="black" color={textColor} letterSpacing="tight">
            Broadcast Center
          </Text>
          <Text fontSize="sm" color={mutedText} fontWeight="medium">
            Create and manage property-wide updates.
          </Text>
        </Box>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue" 
          borderRadius="full" 
          size="lg"
          px={8}
          shadow="lg"
          _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
          onClick={() => setIsAddModalOpen(true)}
        >
          Broadcast
        </Button>
      </Flex>

      {loading ? (
        <Flex py={20} justify="center"><Spinner size="xl" color="blue.500" thickness="4px" /></Flex>
      ) : (
        <VStack spacing={8} align="stretch">
          {announcements.length > 0 ? announcements.map(a => {
            const isScheduled = dayjs(a.published_at).isAfter(dayjs());
            
            return (
              <Box 
                key={a.id} 
                bg={bg} 
                borderRadius="3xl" 
                shadow="sm" 
                border="1px solid" 
                borderColor={borderColor} 
                overflow="hidden"
                transition="all 0.3s"
                _hover={{ shadow: 'md' }}
              >
                {/* Post Header */}
                <Flex p={5} justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Avatar 
                      name="Management" 
                      bg="blue.500" 
                      color="white" 
                      size="md"
                      boxShadow="inner"
                    />
                    <Box>
                      <HStack spacing={2}>
                        <Text fontWeight="black" color={textColor}>Property Management</Text>
                        <Badge colorScheme={a.priority === 'urgent' ? 'red' : 'blue'} variant="subtle" borderRadius="full" px={2} fontSize="10px">
                           {a.priority}
                        </Badge>
                      </HStack>
                      <HStack spacing={2} color={mutedText} fontSize="xs">
                        <Icon as={isScheduled ? FiCalendar : FiClock} />
                        <Text fontWeight="bold">
                          {isScheduled ? `Scheduled for ${dayjs(a.published_at).format('MMM D')}` : dayjs(a.published_at).fromNow()}
                        </Text>
                        {isScheduled && <Badge colorScheme="purple" variant="solid" boxSize="8px" borderRadius="full" />}
                      </HStack>
                    </Box>
                  </HStack>

                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreHorizontal />}
                      variant="ghost"
                      borderRadius="full"
                      aria-label="Options"
                    />
                    <MenuList borderRadius="xl" shadow="xl" border="1px" borderColor={borderColor}>
                      <MenuItem 
                        icon={<FiTrash2 />} 
                        color="red.500" 
                        fontWeight="bold"
                        onClick={() => confirmDelete(a.id)}
                      >
                        Delete Broadcast
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>

                {/* Post Content */}
                <Box px={6} pb={4}>
                   <Text fontSize="xl" fontWeight="black" mb={2} color={textColor}>{a.title}</Text>
                   <Text color={textColor} lineHeight="tall" whiteSpace="pre-wrap">{a.content}</Text>
                </Box>

                {/* Post Media */}
                {a.photo_path && (
                  <Box bg={mediaBg} mx={4} mb={4} borderRadius="2xl" overflow="hidden">
                    <Image 
                      src={`${IMAGE_URL}/${a.photo_path}`} 
                      alt="Announcement Media" 
                      w="full"
                      maxH="500px"
                      objectFit="cover"
                      transition="transform 0.5s"
                      _hover={{ transform: 'scale(1.02)' }}
                    />
                  </Box>
                )}

                {/* Post Footer/Indicators */}
                <Flex px={6} py={4} bg={footerBg} justify="space-between" align="center">
                  <HStack spacing={6} color={mutedText} fontSize="xs" fontWeight="bold">
                     <HStack spacing={1}>
                        <Icon as={FiAlertCircle} />
                        <Text textTransform="uppercase" letterSpacing="widest">Official Update</Text>
                     </HStack>
                     <HStack spacing={2} color="blue.500">
                        <Icon as={FiThumbsUp} />
                        <Text>{a.likes_count || 0} People Reacted</Text>
                     </HStack>
                  </HStack>
                  {isScheduled && (
                    <Badge colorScheme="purple" variant="outline" borderRadius="full" px={3}>
                      Queued
                    </Badge>
                  )}
                </Flex>
              </Box>
            );
          }) : (
            <Flex direction="column" align="center" justify="center" py={20} bg={bg} borderRadius="3xl" border="2px dashed" borderColor={borderColor}>
              <Icon as={FiMoreHorizontal} boxSize={12} color="gray.300" mb={4} />
              <Text fontSize="lg" fontWeight="bold" color={mutedText}>No news at the moment</Text>
              <Text fontSize="sm" color="gray.400">Everything is quiet across the community.</Text>
            </Flex>
          )}
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
        <AlertDialogOverlay>
          <AlertDialogContent bg={bg} borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="black" color={textColor}>Delete Announcement</AlertDialogHeader>
            <AlertDialogBody color={mutedText}>
              Are you sure you want to delete this broadcast? It will be removed from the tenant portal immediately.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} borderRadius="xl">Cancel</Button>
              <Button colorScheme="red" onClick={executeDelete} ml={3} borderRadius="xl">Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
