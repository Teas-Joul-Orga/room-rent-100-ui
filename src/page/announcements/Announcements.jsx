import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Button, TableContainer, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useColorModeValue, Spinner, IconButton, useToast, Image, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiClock } from 'react-icons/fi';
import dayjs from "dayjs";
import AddAnnouncementModal from './AddAnnouncementModal';

const API = "http://localhost:8000/api/v1";
const IMAGE_URL = "http://localhost:8000/storage"; // Adjust based on your public config

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // AlertDialog state for deletion
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toast = useToast();
  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const hoverBg = useColorModeValue("gray.50", "#1c2333");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.data || json); // Handles if paginated vs direct array
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
    <Box p={6}>
      <Flex justify="space-between" align="flex-end" mb={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" color={textColor} letterSpacing="tight">Announcements</Text>
          <Text fontSize="sm" color={mutedText}>Broadcast notifications to tenants directly to their portal.</Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" borderRadius="xl" onClick={() => setIsAddModalOpen(true)}>
          New Broadcast
        </Button>
      </Flex>

      {loading ? (
        <Flex py={20} justify="center"><Spinner size="xl" color="blue.500" thickness="4px" /></Flex>
      ) : (
        <Box bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
           <TableContainer>
              <Table size="md" variant="simple">
                 <Thead bg={hoverBg}>
                   <Tr>
                     <Th>Media</Th>
                     <Th>Title</Th>
                     <Th>Priority</Th>
                     <Th>Status</Th>
                     <Th>Scheduled For</Th>
                     <Th textAlign="right">Actions</Th>
                   </Tr>
                 </Thead>
                 <Tbody>
                   {announcements.length > 0 ? announcements.map(a => {
                     const isScheduled = dayjs(a.published_at).isAfter(dayjs());
                     return (
                       <Tr key={a.id} _hover={{ bg: hoverBg }}>
                         <Td>
                           {a.photo_path ? (
                             <Image src={`${IMAGE_URL}/${a.photo_path}`} alt="Announcement" boxSize="50px" objectFit="cover" borderRadius="md" />
                           ) : (
                             <Box boxSize="50px" bg={useColorModeValue("gray.100", "#30363d")} borderRadius="md" display="flex" alignItems="center" justify="center">
                               <Text fontSize="xs" color="gray.400">No Image</Text>
                             </Box>
                           )}
                         </Td>
                         <Td>
                           <Text fontSize="sm" fontWeight="bold" color={textColor} isTruncated maxW="300px">{a.title}</Text>
                           <Text fontSize="xs" color={mutedText} isTruncated maxW="400px">{a.content}</Text>
                         </Td>
                         <Td><Badge colorScheme={a.priority === 'urgent' ? 'red' : 'blue'}>{a.priority}</Badge></Td>
                         <Td>
                           {isScheduled ? (
                             <Badge colorScheme="purple" variant="subtle"><Icon as={FiClock} mr={1} />Scheduled</Badge>
                           ) : (
                             <Badge colorScheme="green" variant="subtle">Published</Badge>
                           )}
                         </Td>
                         <Td fontSize="sm" color={mutedText}>{dayjs(a.published_at).format('MMM D, YYYY h:mm A')}</Td>
                         <Td textAlign="right">
                           <Tooltip label="Delete" placement="top">
                             <IconButton icon={<FiTrash2 />} onClick={() => confirmDelete(a.id)} size="sm" colorScheme="red" variant="ghost" aria-label="Delete announcement" />
                           </Tooltip>
                         </Td>
                       </Tr>
                     );
                   }) : (
                     <Tr><Td colSpan={6} textAlign="center" py={10} color={mutedText}>No announcements found.</Td></Tr>
                   )}
                 </Tbody>
              </Table>
           </TableContainer>
        </Box>
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
      <AlertDialog isOpen={isOpen} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={bg} borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="black" color={textColor}>Delete Announcement</AlertDialogHeader>
            <AlertDialogBody color={mutedText}>
              Are you sure you want to delete this broadcast? It will be removed from the tenant portal immediately.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onClose} borderRadius="xl">Cancel</Button>
              <Button colorScheme="red" onClick={executeDelete} ml={3} borderRadius="xl">Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
