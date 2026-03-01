import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Avatar, VStack, HStack, Input, IconButton, Spinner,
  useColorModeValue, Divider, Tooltip, useToast, Popover, PopoverTrigger,
  PopoverContent, PopoverArrow, PopoverBody, Button, useDisclosure,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Tag
} from '@chakra-ui/react';
import { FiSend, FiMoreVertical, FiEdit2, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import dayjs from 'dayjs';

const API = "http://localhost:8000/api/v1";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  // Edit State
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // Delete State
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [messageToDelete, setMessageToDelete] = useState(null);

  const messagesEndRef = useRef(null);
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const myMessageBg = useColorModeValue("blue.500", "blue.400");
  const otherMessageBg = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const otherMessageTextColor = useColorModeValue("gray.800", "gray.100");

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Current User & Contacts
  useEffect(() => {
    const initChat = async () => {
      try {
        // Get Me
        const meRes = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.ok) {
          const userData = await meRes.json();
          setCurrentUser(userData.user); // The API returns { user: {...} }
        }

        // Get Contacts
        if (role === 'admin') {
          // Admin sees tenants
          const tRes = await fetch(`${API}/admin/tenants?limit=all`, { headers: { Authorization: `Bearer ${token}` } });
          if (tRes.ok) {
            const data = await tRes.json();
            // Filter out tenants without an active user account
            const validContacts = data.filter(t => t.user).map(t => ({
              id: t.user.id, // Must use user_id because Messages table links to users
              name: t.name,
              email: t.email,
              photo: t.photo_path ? `http://localhost:8000/storage/${t.photo_path}` : null,
              role: 'tenant'
            }));
            setContacts(validContacts);
          }
        } else {
          // Tenant sees Admin 
          // (Hardcoding Admin contact since Tenants only talk to management)
          setContacts([{
             id: 1, // Usually Admin is user 1
             name: 'Property Management',
             email: 'admin@system.com',
             photo: null,
             role: 'admin'
          }]);
        }
      } catch (e) {
        console.error("Failed to init chat", e);
      } finally {
        setLoadingContacts(false);
      }
    };
    initChat();
  }, [role, token]);

  // 2. Fetch Messages (Poll every 10 seconds)
  useEffect(() => {
    if (!selectedContact) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          // The API returns the last 50 messages for the current user.
          // We need to filter for the conversation with the selected contact.
          // A message belongs to this thread if:
          // (sender is me AND receiver is contact) OR (sender is contact AND receiver is me)
          const thread = data.messages.filter(m => 
            (m.sender_id === currentUser?.id && m.receiver_id === selectedContact.id) ||
            (m.sender_id === selectedContact.id && m.receiver_id === currentUser?.id)
          ).reverse(); // Reverse because API returns latest first (DESC), but we want chronological (ASC) for display
          
          setMessages(thread);
        }
      } catch(e) {
        // silent fail for polling
      }
    };

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedContact, currentUser?.id, token]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    setIsSending(true);
    const tempText = newMessage;
    setNewMessage(''); // optimistic clear
    
    // Create optimistic message
    const optMsg = {
        id: 'temp-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: selectedContact.id,
        message: tempText,
        created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);

    try {
      const res = await fetch(`${API}/messages/send`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ message: tempText, receiver_id: selectedContact.id })
      });
      
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();
      
      // Replace optimistic message with real db message
      setMessages(prev => prev.map(m => m.id === optMsg.id ? data.data : m));
      
    } catch (e) {
      toast({ title: "Message failed to send", status: "error" });
      setNewMessage(tempText); // revert input
      setMessages(prev => prev.filter(m => m.id !== optMsg.id)); // remove optimistic
    } finally {
      setIsSending(false);
    }
  };

  // 4. Update Message
  const submitEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      const res = await fetch(`${API}/messages/${editingMessage.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ message: editContent })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === editingMessage.id ? data.data : m));
        toast({ title: "Message updated", status: "success", duration: 2000 });
        setEditingMessage(null);
      }
    } catch(e) {
      toast({ title: "Failed to edit", status: "error" });
    }
  };

  // 5. Delete Message
  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API}/messages/${messageToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
        toast({ title: "Message deleted", status: "success", duration: 2000 });
      }
    } catch(e) {
      toast({ title: "Failed to delete", status: "error" });
    } finally {
      onDeleteClose();
      setMessageToDelete(null);
    }
  };

  return (
    <Flex h="calc(100vh - 80px)" bg="gray.100" p={4} direction={{ base: 'column', md: 'row' }} gap={4}>
      
      {/* LEFT SIDEBAR: Contacts list */}
      <Box w={{ base: "100%", md: "350px" }} bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} display="flex" flexDirection="column" overflow="hidden">
        <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>Messages</Text>
        </Box>
        
        <Box flex="1" overflowY="auto" p={2}>
          {loadingContacts ? (
             <Flex justify="center" p={10}><Spinner color="blue.500" /></Flex>
          ) : contacts.length === 0 ? (
             <Text textAlign="center" color="gray.500" p={6}>No contacts found.</Text>
          ) : (
            <VStack spacing={1} align="stretch">
              {contacts.map(contact => (
                <Flex 
                  key={contact.id} 
                  p={3} 
                  align="center" 
                  gap={3} 
                  borderRadius="xl"
                  cursor="pointer"
                  bg={selectedContact?.id === contact.id ? 'blue.50' : 'transparent'}
                  _hover={{ bg: selectedContact?.id === contact.id ? 'blue.50' : hoverBg }}
                  onClick={() => setSelectedContact(contact)}
                  transition="all 0.2s"
                >
                  <Avatar size="md" name={contact.name} src={contact.photo} />
                  <Box flex="1" overflow="hidden">
                    <Text fontWeight="semibold" color={textColor} isTruncated>{contact.name}</Text>
                    <Text fontSize="sm" color="gray.500" isTruncated>{contact.role.toUpperCase()}</Text>
                  </Box>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Box>

      {/* RIGHT AREA: Message Thread */}
      <Box flex="1" bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} display="flex" flexDirection="column" overflow="hidden">
        {selectedContact ? (
          <>
            {/* Thread Header */}
            <Flex p={4} borderBottom="1px solid" borderColor={borderColor} align="center" gap={3} bg={useColorModeValue('gray.50', 'gray.800')}>
              <Avatar size="sm" name={selectedContact.name} src={selectedContact.photo} />
              <Box>
                <Text fontWeight="bold" color={textColor}>{selectedContact.name}</Text>
                <Text fontSize="xs" color="gray.500">{selectedContact.email}</Text>
              </Box>
            </Flex>

            {/* Messages Area */}
            <Box flex="1" p={6} overflowY="auto" display="flex" flexDirection="column" gap={4}>
               {messages.length === 0 && (
                  <Flex flex="1" justify="center" align="center" direction="column" color="gray.400">
                     <FiMessageSquare size={40} />
                     <Text mt={4}>Start a conversation with {selectedContact.name}</Text>
                  </Flex>
               )}
               
               {messages.map((msg) => {
                 const isMe = msg.sender_id === currentUser?.id;
                 
                 return (
                   <Flex key={msg.id} justify={isMe ? "flex-end" : "flex-start"} w="100%" group="true">
                     
                     <HStack maxW="70%" align="flex-start" flexDirection={isMe ? "row-reverse" : "row"}>
                        <Avatar size="sm" name={isMe ? currentUser?.name : selectedContact.name} src={isMe ? null : selectedContact.photo} mt={1} />
                        
                        <Flex direction="column" align={isMe ? "flex-end" : "flex-start"}>
                          
                          {/* Message Bubble container */}
                          <HStack>
                             {/* Actions (Only for my messages) */}
                             {isMe && !msg.id.toString().startsWith('temp') && editingMessage?.id !== msg.id && (
                               <Popover placement="top">
                                  <PopoverTrigger>
                                     <IconButton 
                                       size="sm" 
                                       variant="ghost" 
                                       icon={<FiMoreVertical />} 
                                       aria-label="Options" 
                                       opacity={0} 
                                       _groupHover={{ opacity: 1 }} 
                                     />
                                  </PopoverTrigger>
                                  <PopoverContent w="auto">
                                     <PopoverArrow />
                                     <PopoverBody p={1} display="flex" gap={1}>
                                        <Tooltip label="Edit">
                                           <IconButton size="sm" icon={<FiEdit2 />} onClick={() => { setEditingMessage(msg); setEditContent(msg.message); }} />
                                        </Tooltip>
                                        <Tooltip label="Delete">
                                           <IconButton size="sm" colorScheme="red" icon={<FiTrash2 />} onClick={() => { setMessageToDelete(msg); onDeleteOpen(); }} />
                                        </Tooltip>
                                     </PopoverBody>
                                  </PopoverContent>
                               </Popover>
                             )}

                             {/* Bubble */}
                             {editingMessage?.id === msg.id ? (
                               <Flex direction="column" gap={2} bg="gray.100" p={3} borderRadius="xl" border="1px solid" borderColor="blue.300">
                                  <Input size="sm" value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus />
                                  <HStack justify="flex-end">
                                     <Button size="xs" onClick={() => setEditingMessage(null)}>Cancel</Button>
                                     <Button size="xs" colorScheme="blue" onClick={submitEdit}>Save</Button>
                                  </HStack>
                               </Flex>
                             ) : (
                               <Box 
                                 p={3} 
                                 bg={isMe ? myMessageBg : otherMessageBg} 
                                 color={isMe ? "white" : otherMessageTextColor}
                                 borderRadius="2xl"
                                 borderTopRightRadius={isMe ? "sm" : "2xl"}
                                 borderTopLeftRadius={!isMe ? "sm" : "2xl"}
                                 boxShadow="sm"
                               >
                                 <Text>{msg.message}</Text>
                               </Box>
                             )}
                          </HStack>
                          
                          {/* Timestamp below bubble */}
                          <HStack spacing={2} mt={1} px={1} opacity={0.7}>
                             <Text fontSize="10px" color="gray.500">
                               {dayjs(msg.created_at).format('MMM D, h:mm A')} {msg.is_edited ? '(edited)' : ''}
                             </Text>
                          </HStack>

                        </Flex>
                     </HStack>
                   </Flex>
                 );
               })}
               <div ref={messagesEndRef} />
            </Box>

            {/* Input Box */}
            <Box p={4} borderTop="1px solid" borderColor={borderColor}>
              <form onSubmit={handleSendMessage}>
                <Flex gap={2}>
                  <Input 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    borderRadius="full"
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    border="none"
                    _focus={{ ring: 2, ringColor: "blue.400" }}
                  />
                  <IconButton 
                    type="submit"
                    colorScheme="blue" 
                    icon={<FiSend />} 
                    isRound 
                    isLoading={isSending}
                    isDisabled={!newMessage.trim()}
                    aria-label="Send message"
                  />
                </Flex>
              </form>
            </Box>
          </>
        ) : (
           <Flex flex="1" direction="column" justify="center" align="center" color="gray.400" textAlign="center" px={10}>
              <Box bg={useColorModeValue('gray.100', 'gray.700')} p={6} borderRadius="full" mb={6}>
                 <FiMessageSquare size={48} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={textColor} mb={2}>RoomRent Chat Support</Text>
              <Text>Select a contact from the left sidebar to view messages or start a new conversation.</Text>
           </Flex>
        )}
      </Box>

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Message</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Flex>
  );
}
