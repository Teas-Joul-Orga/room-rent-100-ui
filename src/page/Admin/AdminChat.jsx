import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Avatar, VStack, HStack, Input, IconButton, Spinner,
  useColorModeValue, Divider, Tooltip, useToast, Popover, PopoverTrigger,
  PopoverContent, PopoverArrow, PopoverBody, Button, useDisclosure,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Tag, Badge
} from '@chakra-ui/react';
import { FiSend, FiMoreVertical, FiEdit2, FiTrash2, FiMessageSquare, FiArrowLeft, FiImage, FiX } from 'react-icons/fi';
import dayjs from 'dayjs';
import echo from '../../lib/echo';

const API = "http://localhost:8000/api/v1";

export default function AdminChat() {
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

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const toast = useToast();

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const hoverBg = useColorModeValue("gray.50", "#1c2333");
  const myMessageBg = useColorModeValue("blue.500", "blue.400");
  const otherMessageBg = useColorModeValue("gray.100", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const otherMessageTextColor = useColorModeValue("gray.800", "gray.100");
  const threadHeaderBg = useColorModeValue("gray.50", "#161b22");
  const noMessagesColor = useColorModeValue("gray.400", "gray.500");
  const inputBg = useColorModeValue("gray.100", "#30363d");

  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const meRes = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.ok) {
          const userData = await meRes.json();
          setCurrentUser(userData.user);
        }

        const tRes = await fetch(`${API}/admin/tenants?limit=all`, { headers: { Authorization: `Bearer ${token}` } });
        if (tRes.ok) {
          const data = await tRes.json();
          const validContacts = data.filter(t => t.user).map(t => ({
            id: t.user.id,
            name: t.name,
            email: t.email,
            photo: t.photo_path ? `http://localhost:8000/storage/${t.photo_path}` : null,
            role: 'tenant'
          }));
          setContacts(validContacts);
        }
      } catch (e) {
        console.error("Failed to init chat", e);
      } finally {
        setLoadingContacts(false);
      }
    };
    initChat();
  }, [token]);

  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!currentUser?.id || !token) return;

    const fetchUnreadCounts = async () => {
      try {
        const res = await fetch(`${API}/messages/unread-per-contact`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUnreadCounts(data.counts || {});
        }
      } catch (e) {}
    };
    fetchUnreadCounts();

    const channel = echo().private(`chat.user.${currentUser.id}`)
      .listen('.App\\Events\\ChatCountsUpdated', (e) => {
         setUnreadCounts(e.unreadPerContact || {});
      })
      .listen('.App\\Events\\MessageSent', (e) => {
         window.dispatchEvent(new CustomEvent('wsMessageRead', { detail: { sender_id: e.sender_id }}));
      });

    return () => {
      echo().leaveChannel(`chat.user.${currentUser.id}`);
    };
  }, [currentUser?.id, token]);

  useEffect(() => {
    if (!selectedContact) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const thread = data.messages.filter(m => 
            (m.sender_id === currentUser?.id && m.receiver_id === selectedContact.id) ||
            (m.sender_id === selectedContact.id && m.receiver_id === currentUser?.id)
          ).reverse(); 
          setMessages(thread);
        }
      } catch(e) {}
    };

    fetchMessages();
    
    const markRead = async () => {
      try {
        await fetch(`${API}/messages/mark-read`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
          },
          body: JSON.stringify({ sender_id: selectedContact.id })
        });
      } catch (e) {}
    };
    
    markRead();
    window.addEventListener('wsMessageRead', markRead);
    const interval = setInterval(fetchMessages, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('wsMessageRead', markRead);
    };
  }, [selectedContact, currentUser?.id, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", status: "error" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() && !imageFile) return;
    if (!selectedContact) return;

    setIsSending(true);
    const tempText = newMessage;
    const tempImage = imageFile;
    setNewMessage('');
    clearImage();

    try {
      const formData = new FormData();
      if (tempText.trim()) formData.append('message', tempText);
      formData.append('receiver_id', selectedContact.id);
      if (tempImage) formData.append('image', tempImage);

      const res = await fetch(`${API}/messages/send`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Accept': 'application/json' 
        },
        body: formData
      });
      
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();
      setMessages(prev => [...prev, data.data]);
    } catch (e) {
      toast({ title: "Message failed to send", status: "error" });
      setNewMessage(tempText);
    } finally {
      setIsSending(false);
    }
  };

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
    <Flex h="100%" w="100%" direction="row" gap={4}>
      <Box 
        w={{ base: "100%", md: "350px" }} 
        display={{ base: selectedContact ? "none" : "flex", md: "flex" }}
        bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} flexDirection="column" overflow="hidden"
      >
        <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>Messages (Admin View)</Text>
        </Box>
        <Box flex="1" overflowY="auto" p={2}>
          {loadingContacts ? (
             <Flex justify="center" p={10}><Spinner color="blue.500" /></Flex>
          ) : contacts.length === 0 ? (
             <Text textAlign="center" color="gray.500" p={6}>No contacts found.</Text>
          ) : (
            <VStack spacing={1} align="stretch">
              {contacts.map(contact => {
                const unread = unreadCounts[contact.id] || 0;
                return (
                <Flex 
                  key={contact.id} 
                  p={3} 
                  align="center" 
                  gap={3} 
                  borderRadius="xl"
                  cursor="pointer"
                  bg={selectedContact?.id === contact.id ? (useColorModeValue('blue.50', '#1c2333')) : 'transparent'}
                  _hover={{ bg: selectedContact?.id === contact.id ? (useColorModeValue('blue.50', '#1c2333')) : hoverBg }}
                  onClick={() => setSelectedContact(contact)}
                  transition="all 0.2s"
                >
                  <Avatar size="md" name={contact.name} src={contact.photo} />
                  <Box flex="1" overflow="hidden">
                    <Text fontWeight={unread > 0 ? "bold" : "semibold"} color={textColor} isTruncated>{contact.name}</Text>
                    <Text fontSize="sm" color={unread > 0 ? "blue.500" : "gray.500"} fontWeight={unread > 0 ? "bold" : "normal"} isTruncated>{contact.role.toUpperCase()}</Text>
                  </Box>
                  {unread > 0 && (
                     <Badge colorScheme="red" borderRadius="full" px={2} py={0.5}>{unread > 9 ? '9+' : unread}</Badge>
                  )}
                </Flex>
                );
              })}
            </VStack>
          )}
        </Box>
      </Box>

      <Box flex="1" display={{ base: selectedContact ? "flex" : "none", md: "flex" }} bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} flexDirection="column" overflow="hidden">
        {selectedContact ? (
          <>
            <Flex p={4} borderBottom="1px solid" borderColor={borderColor} align="center" gap={3} bg={threadHeaderBg}>
              <IconButton display={{ base: "flex", md: "none" }} icon={<FiArrowLeft />} size="sm" variant="ghost" onClick={() => setSelectedContact(null)} aria-label="Back" mr={1} />
              <Avatar size="sm" name={selectedContact.name} src={selectedContact.photo} />
              <Box>
                <Text fontWeight="bold" color={textColor}>{selectedContact.name}</Text>
                <Text fontSize="xs" color="gray.500">{selectedContact.email}</Text>
              </Box>
            </Flex>
            <Box flex="1" p={6} overflowY="auto" display="flex" flexDirection="column" gap={4}>
               {messages.length === 0 && (
                  <Flex flex="1" justify="center" align="center" direction="column" color={noMessagesColor}>
                     <FiMessageSquare size={40} />
                     <Text mt={4}>Start a conversation with {selectedContact.name}</Text>
                  </Flex>
               )}
               {messages.map((msg) => {
                 const isMe = msg.sender_id === currentUser?.id;
                 return (
                   <Flex key={msg.id} justify={isMe ? "flex-end" : "flex-start"} w="100%" role="group">
                     <HStack maxW="70%" align="flex-start" flexDirection={isMe ? "row-reverse" : "row"}>
                        {!isMe && <Avatar size="sm" name={selectedContact.name} src={selectedContact.photo} mt={1} />}
                        <Flex direction="column" align={isMe ? "flex-end" : "flex-start"}>
                          <HStack>
                             {isMe && !msg.id.toString().startsWith('temp') && editingMessage?.id !== msg.id && (
                               <Popover placement="top">
                                  <PopoverTrigger>
                                     <IconButton size="sm" variant="ghost" icon={<FiMoreVertical />} aria-label="Options" opacity={0} _groupHover={{ opacity: 1 }} />
                                  </PopoverTrigger>
                                  <PopoverContent w="auto">
                                     <PopoverArrow />
                                     <PopoverBody p={1} display="flex" gap={1}>
                                        <Tooltip label="Edit"><IconButton size="sm" icon={<FiEdit2 />} onClick={() => { setEditingMessage(msg); setEditContent(msg.message); }} /></Tooltip>
                                        <Tooltip label="Delete"><IconButton size="sm" colorScheme="red" icon={<FiTrash2 />} onClick={() => { setMessageToDelete(msg); onDeleteOpen(); }} /></Tooltip>
                                     </PopoverBody>
                                  </PopoverContent>
                               </Popover>
                             )}
                             {editingMessage?.id === msg.id ? (
                               <Flex direction="column" gap={2} bg="gray.100" p={3} borderRadius="xl" border="1px solid" borderColor="blue.300">
                                  <Input size="sm" value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus />
                                  <HStack justify="flex-end">
                                     <Button size="xs" onClick={() => setEditingMessage(null)}>Cancel</Button>
                                     <Button size="xs" colorScheme="blue" onClick={submitEdit}>Save</Button>
                                  </HStack>
                               </Flex>
                             ) : (
                               <Box p={3} bg={isMe ? myMessageBg : otherMessageBg} color={isMe ? "white" : otherMessageTextColor} borderRadius="2xl" borderTopRightRadius={isMe ? "sm" : "2xl"} borderTopLeftRadius={!isMe ? "sm" : "2xl"} boxShadow="sm">
                                 {msg.image_path && (
                                   <Box as="a" href={`http://localhost:8000/storage/${msg.image_path}`} target="_blank" rel="noopener noreferrer" display="block" mb={msg.message ? 2 : 0} borderRadius="lg" overflow="hidden" cursor="pointer">
                                     <Box as="img" src={`http://localhost:8000/storage/${msg.image_path}`} alt="Shared image" maxH="250px" maxW="100%" objectFit="cover" borderRadius="lg" _hover={{ opacity: 0.9 }} />
                                   </Box>
                                 )}
                                 {msg.message && <Text>{msg.message}</Text>}
                               </Box>
                             )}
                          </HStack>
                          <HStack spacing={2} mt={1} px={1} opacity={0.7}>
                             <Text fontSize="10px" color="gray.500">{dayjs(msg.created_at).format('MMM D, h:mm A')} {msg.is_edited ? '(edited)' : ''}</Text>
                          </HStack>
                        </Flex>
                     </HStack>
                   </Flex>
                 );
               })}
               <div ref={messagesEndRef} />
            </Box>
            <Box p={4} borderTop="1px solid" borderColor={borderColor}>
              {imagePreview && (
                <Flex mb={3} p={2} bg={inputBg} borderRadius="xl" align="center" gap={3}>
                  <Box borderRadius="lg" overflow="hidden" position="relative">
                    <Box as="img" src={imagePreview} alt="Preview" maxH="80px" maxW="120px" objectFit="cover" borderRadius="lg" />
                  </Box>
                  <Text fontSize="sm" color="gray.500" flex="1" isTruncated>{imageFile?.name}</Text>
                  <IconButton size="sm" icon={<FiX />} variant="ghost" colorScheme="red" onClick={clearImage} aria-label="Remove image" isRound />
                </Flex>
              )}
              <form onSubmit={handleSendMessage}>
                <Flex gap={2}>
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageSelect} />
                  <IconButton icon={<FiImage />} variant="ghost" colorScheme="blue" onClick={() => fileInputRef.current?.click()} aria-label="Attach image" isRound />
                  <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} borderRadius="full" bg={inputBg} border="none" _focus={{ ring: 2, ringColor: "blue.400" }} />
                  <IconButton type="submit" colorScheme="blue" icon={<FiSend />} isRound isLoading={isSending} isDisabled={!newMessage.trim() && !imageFile} aria-label="Send" />
                </Flex>
              </form>
            </Box>
          </>
        ) : (
           <Flex flex="1" direction="column" justify="center" align="center" color="gray.400" textAlign="center" px={10}>
              <Box bg={inputBg} p={6} borderRadius="full" mb={6}><FiMessageSquare size={48} /></Box>
              <Text fontSize="xl" fontWeight="bold" color={textColor} mb={2}>Property Management Chat</Text>
              <Text>Select a tenant to view messages or start a new conversation.</Text>
           </Flex>
        )}
      </Box>

      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Message</AlertDialogHeader>
            <AlertDialogBody>Are you sure you want to delete this message? This action cannot be undone.</AlertDialogBody>
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
