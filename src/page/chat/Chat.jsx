import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Avatar, VStack, HStack, Input, IconButton, Spinner,
  useColorModeValue, Divider, Tooltip, useToast, Button, useDisclosure,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Badge, Menu, MenuButton, MenuList, MenuItem,
  InputGroup, InputLeftElement, AvatarBadge
} from '@chakra-ui/react';
import { FiSend, FiMoreVertical, FiEdit2, FiTrash2, FiMessageSquare, FiArrowLeft, FiSearch, FiPaperclip, FiUser } from 'react-icons/fi';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import echo from '../../lib/echo';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const API = "http://localhost:8000/api/v1";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lastMessages, setLastMessages] = useState({}); // New state for sorting
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

  // Theme Colors (moved outside map to fix hook rules)
  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const hoverBg = useColorModeValue("gray.50", "#1c2333");
  const activeContactBg = useColorModeValue("blue.50", "#1c2333");
  const myMessageBg = useColorModeValue("blue.500", "blue.600");
  const otherMessageBg = useColorModeValue("gray.100", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const otherMessageTextColor = useColorModeValue("gray.800", "gray.100");
  const threadHeaderBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(22, 27, 34, 0.9)");
  const dateBadgeBg = useColorModeValue("gray.100", "gray.700");
  const dateBadgeText = useColorModeValue("gray.500", "gray.300");
  const noMessagesColor = useColorModeValue("gray.400", "gray.500");
  const inputBg = useColorModeValue("gray.100", "#30363d");
  const scrollbarTrack = useColorModeValue("transparent", "transparent");
  const scrollbarThumb = useColorModeValue("gray.200", "gray.600");

  const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role'));

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

  // 1.5 Fetch Unread per contact
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
         // The backend now pipes down the EXACT integers for every contact.
         // No need to blindly compute additions and subtractions natively in React anymore!
         setUnreadCounts(e.unreadPerContact || {});
      })
      .listen('.App\\Events\\MessageSent', (e) => {
         // Keep listening for MessageSent SOLELY to trigger the "on-screen active chat" marking read dispatch
         window.dispatchEvent(new CustomEvent('wsMessageRead', { detail: { sender_id: e.sender_id }}));
      });

    return () => {
      echo().leaveChannel(`chat.user.${currentUser.id}`);
    };
  }, [currentUser?.id, token]);

  // 2. Fetch Messages (Poll every 10 seconds)
  useEffect(() => {
    if (!currentUser?.id) return; // Need user ID to compute last messages

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          
          // Extract last message per contact for sorting
          const lastMsgs = {};
          data.messages.forEach(m => {
             const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
             if (!lastMsgs[otherId] || new Date(m.created_at) > new Date(lastMsgs[otherId].created_at)) {
                lastMsgs[otherId] = m;
             }
          });
          setLastMessages(lastMsgs);

          // Update active thread if a contact is selected
          if (selectedContact) {
            const thread = data.messages.filter(m => 
              (m.sender_id === currentUser.id && m.receiver_id === selectedContact.id) ||
              (m.sender_id === selectedContact.id && m.receiver_id === currentUser.id)
            ).reverse(); 
            setMessages(thread);
          }
        }
      } catch(e) {}
    };

    fetchMessages(); // Initial fetch
    
    // We only need to mark as read when selecting the contact, or actively getting a new websocket push in that thread
    const markRead = async () => {
      if (!selectedContact) return;
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
    
    if (selectedContact) {
      markRead();
    }
    
    // Also mark read if a websocket message from them arrives while we are looking at them
    window.addEventListener('wsMessageRead', markRead);

    const interval = setInterval(fetchMessages, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('wsMessageRead', markRead);
    };
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
    setNewMessage(''); // clear input field

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
      
      // Append the real, verified database message
      setMessages(prev => [...prev, data.data]);
      
      // Instantly update last messages for sorting
      setLastMessages(prev => ({
        ...prev,
        [selectedContact.id]: data.data
      }));
      
    } catch (e) {
      toast({ title: "Message failed to send", status: "error" });
      setNewMessage(tempText); // revert input
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

  // Helper: Format Date
  const formatDateGroup = (dateStr) => {
    const d = dayjs(dateStr);
    if (d.isToday()) return 'Today';
    if (d.isYesterday()) return 'Yesterday';
    return d.format('dddd, MMM D, YYYY');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Sort contacts by most recent message and unread status
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const unreadA = unreadCounts[a.id] || 0;
    const unreadB = unreadCounts[b.id] || 0;
    
    // 1. Unread messages jump to the absolute top
    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadB > 0 && unreadA === 0) return 1;

    // 2. Otherwise sort by the most recent message timestamp
    const timeA = lastMessages[a.id] ? new Date(lastMessages[a.id].created_at).getTime() : 0;
    const timeB = lastMessages[b.id] ? new Date(lastMessages[b.id].created_at).getTime() : 0;
    
    return timeB - timeA; // Descending order (newest first)
  });

  return (
    <Flex h={{ base: "calc(100vh - 150px)", md: "calc(100vh - 120px)" }} w="100%" direction="row" gap={4}>
      
      {/* LEFT SIDEBAR: Contacts list */}
      <Box 
        w={{ base: "100%", md: "380px" }} 
        display={{ base: selectedContact ? "none" : "flex", md: "flex" }}
        bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} flexDirection="column" overflow="hidden"
      >
        <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
          <Text fontSize="2xl" fontWeight="black" color={textColor} mb={4} letterSpacing="tight">Messages</Text>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search contacts..." 
              value={contactSearch} 
              onChange={(e) => setContactSearch(e.target.value)}
              bg={inputBg}
              borderRadius="full"
              border="none"
              _focus={{ ring: 2, ringColor: "blue.400" }}
            />
          </InputGroup>
        </Box>
        
        <Box flex="1" overflowY="auto" p={3} sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { bg: scrollbarTrack }, '&::-webkit-scrollbar-thumb': { bg: scrollbarThumb, borderRadius: 'full' } }}>
          {loadingContacts ? (
             <Flex justify="center" p={10}><Spinner color="blue.500" /></Flex>
          ) : filteredContacts.length === 0 ? (
             <Flex direction="column" align="center" justify="center" color="gray.500" p={6} h="100%">
               <FiUser size={40} opacity={0.3} />
               <Text mt={3} fontWeight="medium">No contacts found.</Text>
             </Flex>
          ) : (
            <VStack spacing={2} align="stretch">
              {sortedContacts.map(contact => {
                const unread = unreadCounts[contact.id] || 0;
                const isSelected = selectedContact?.id === contact.id;
                return (
                <Flex 
                  key={contact.id} 
                  p={3} 
                  align="center" 
                  gap={4} 
                  borderRadius="xl"
                  cursor="pointer"
                  bg={isSelected ? activeContactBg : 'transparent'}
                  _hover={{ bg: isSelected ? activeContactBg : hoverBg }}
                  onClick={() => setSelectedContact(contact)}
                  transition="all 0.2s ease"
                  borderLeft="4px solid"
                  borderColor={isSelected ? "blue.500" : "transparent"}
                >
                  <Avatar size="md" name={contact.name} src={contact.photo}>
                     <AvatarBadge boxSize="1.1em" bg="green.500" borderColor={bg} />
                  </Avatar>
                  <Box flex="1" overflow="hidden">
                    <Flex justify="space-between" align="baseline" mb={0.5}>
                      <Text fontWeight={unread > 0 || isSelected ? "bold" : "semibold"} color={textColor} isTruncated>
                        {contact.name}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color={unread > 0 ? "blue.500" : "gray.500"} fontWeight={unread > 0 ? "bold" : "normal"} isTruncated>
                      {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                    </Text>
                  </Box>
                  {unread > 0 && (
                     <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs" fontWeight="bold" shadow="sm">
                        {unread > 9 ? '9+' : unread}
                     </Badge>
                  )}
                </Flex>
                );
              })}
            </VStack>
          )}
        </Box>
      </Box>

      {/* RIGHT AREA: Message Thread */}
      <Box 
        flex="1" 
        display={{ base: selectedContact ? "flex" : "none", md: "flex" }}
        bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} flexDirection="column" overflow="hidden" position="relative"
      >
        {selectedContact ? (
          <>
            {/* Thread Header (Sticky & Glassy) */}
            <Flex p={4} borderBottom="1px solid" borderColor={borderColor} align="center" gap={4} bg={threadHeaderBg} backdropFilter="blur(10px)" position="sticky" top={0} zIndex={10}>
              <IconButton 
                 display={{ base: "flex", md: "none" }}
                 icon={<FiArrowLeft />}
                 size="sm"
                 variant="ghost"
                 onClick={() => setSelectedContact(null)}
                 aria-label="Back to contacts"
                 mr={1}
              />
              <Avatar size="sm" name={selectedContact.name} src={selectedContact.photo}>
                 <AvatarBadge boxSize="1em" bg="green.500" borderColor={threadHeaderBg} />
              </Avatar>
              <Box>
                <Text fontWeight="black" color={textColor} lineHeight="1.2">{selectedContact.name}</Text>
                <Text fontSize="xs" color="green.500" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">Online</Text>
              </Box>
              <Flex flex={1} justify="flex-end">
                <IconButton icon={<FiMoreVertical />} variant="ghost" size="sm" aria-label="Options" color="gray.500" />
              </Flex>
            </Flex>

            {/* Messages Area */}
            <Box flex="1" p={6} overflowY="auto" display="flex" flexDirection="column" gap={6} sx={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { bg: scrollbarTrack }, '&::-webkit-scrollbar-thumb': { bg: scrollbarThumb, borderRadius: 'full' } }}>
               {messages.length === 0 && (
                  <Flex flex="1" justify="center" align="center" direction="column" color={noMessagesColor}>
                     <Box bg={inputBg} p={6} borderRadius="full" mb={4}>
                        <FiMessageSquare size={32} />
                     </Box>
                     <Text fontWeight="bold" color={textColor}>Start a conversation with {selectedContact.name}</Text>
                     <Text fontSize="sm" mt={1}>Messages are end-to-end encrypted.</Text>
                  </Flex>
               )}
               
               {(() => {
                 let lastDate = null;
                 return messages.map((msg, index) => {
                   const isMe = msg.sender_id === currentUser?.id;
                   const msgDate = dayjs(msg.created_at).format('YYYY-MM-DD');
                   const showDate = msgDate !== lastDate;
                   if (showDate) lastDate = msgDate;

                   // Check if previous or next message is from same user to adjust border radius
                   const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id || dayjs(messages[index - 1].created_at).format('YYYY-MM-DD') !== msgDate;
                   const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id || dayjs(messages[index + 1].created_at).format('YYYY-MM-DD') !== msgDate;

                   return (
                     <React.Fragment key={msg.id}>
                       {showDate && (
                         <Flex justify="center" my={4}>
                           <Badge bg={dateBadgeBg} color={dateBadgeText} px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                             {formatDateGroup(msg.created_at)}
                           </Badge>
                         </Flex>
                       )}
                       <Flex justify={isMe ? "flex-end" : "flex-start"} w="100%" role="group" mb={isLastInGroup ? 4 : 1}>
                         <HStack maxW={{ base: "90%", md: "75%" }} align="flex-end" flexDirection={isMe ? "row-reverse" : "row"} spacing={2}>
                            
                            {!isMe && isLastInGroup ? (
                               <Avatar size="sm" name={selectedContact.name} src={selectedContact.photo} mb={1} />
                            ) : (!isMe && <Box w="32px" />)} {/* Placeholder for alignment */}
                            
                            <Flex direction="column" align={isMe ? "flex-end" : "flex-start"}>
                              {/* Bubble */}
                              <HStack spacing={2}>
                                 {/* Actions (Only for my messages) */}
                                 {isMe && !msg.id.toString().startsWith('temp') && editingMessage?.id !== msg.id && (
                                    <Menu placement="top-end">
                                      <MenuButton as={IconButton} size="xs" variant="ghost" icon={<FiMoreVertical />} aria-label="Options" opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 0.2s" />
                                      <MenuList minW="120px" shadow="xl" border="1px solid" borderColor={borderColor} borderRadius="xl" p={1}>
                                        <MenuItem icon={<FiEdit2 />} onClick={() => { setEditingMessage(msg); setEditContent(msg.message); }} fontSize="sm" borderRadius="md" _hover={{ bg: hoverBg }}>Edit Message</MenuItem>
                                        <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => { setMessageToDelete(msg); onDeleteOpen(); }} fontSize="sm" borderRadius="md" _hover={{ bg: "red.50" }}>Delete</MenuItem>
                                      </MenuList>
                                    </Menu>
                                 )}

                                 {editingMessage?.id === msg.id ? (
                                   <Flex direction="column" gap={2} bg={otherMessageBg} p={3} borderRadius="2xl" border="1px solid" borderColor="blue.400" minW="280px" shadow="sm">
                                      <Input size="sm" bg={bg} border="none" value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus _focus={{ ring: 0 }} borderRadius="lg" />
                                      <HStack justify="flex-end" spacing={1}>
                                         <Button size="xs" variant="ghost" onClick={() => setEditingMessage(null)}>Cancel</Button>
                                         <Button size="xs" colorScheme="blue" borderRadius="full" px={4} onClick={submitEdit}>Save</Button>
                                      </HStack>
                                   </Flex>
                                 ) : (
                                   <Box 
                                     py={3} 
                                     px={4} 
                                     bg={isMe ? myMessageBg : otherMessageBg} 
                                     color={isMe ? "white" : otherMessageTextColor}
                                     borderRadius="2xl"
                                     borderBottomRightRadius={isMe && isLastInGroup ? "sm" : "2xl"}
                                     borderBottomLeftRadius={!isMe && isLastInGroup ? "sm" : "2xl"}
                                     borderTopRightRadius={isMe && isFirstInGroup ? "2xl" : isMe ? "sm" : "2xl"}
                                     borderTopLeftRadius={!isMe && isFirstInGroup ? "2xl" : !isMe ? "sm" : "2xl"}
                                     boxShadow="sm"
                                     fontSize="md"
                                     lineHeight="tall"
                                     position="relative"
                                   >
                                     <Text whiteSpace="pre-wrap" wordBreak="break-word">{msg.message}</Text>
                                   </Box>
                                 )}
                              </HStack>
                              
                              {/* Timestamp */}
                              {isLastInGroup && (
                                <Text fontSize="xs" color={mutedText} mt={1} px={2} fontWeight="medium">
                                  {dayjs(msg.created_at).format('h:mm A')} {msg.is_edited ? '• Edited' : ''}
                                </Text>
                              )}
                            </Flex>
                         </HStack>
                       </Flex>
                     </React.Fragment>
                   );
                 });
               })()}
               <div ref={messagesEndRef} />
            </Box>

            {/* Input Box */}
            <Box p={4} bg={bg} borderTop="1px solid" borderColor={borderColor}>
              <form onSubmit={handleSendMessage}>
                <Flex gap={3} align="center" bg={inputBg} p={2} borderRadius="full" border="1px solid" borderColor="transparent" _focusWithin={{ borderColor: "blue.400", bg: bg, shadow: "sm" }} transition="all 0.2s">
                  <IconButton 
                    icon={<FiPaperclip />} 
                    variant="ghost" 
                    color="gray.500" 
                    isRound 
                    aria-label="Attach file" 
                    _hover={{ bg: "transparent", color: "blue.500" }}
                  />
                  <Input 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    bg="transparent"
                    border="none"
                    _focus={{ ring: 0 }}
                    fontSize="md"
                    autoComplete="off"
                  />
                  <IconButton 
                    type="submit"
                    colorScheme="blue" 
                    icon={<FiSend />} 
                    isRound 
                    isLoading={isSending}
                    isDisabled={!newMessage.trim()}
                    aria-label="Send message"
                    boxShadow="md"
                  />
                </Flex>
              </form>
            </Box>
          </>
        ) : (
           <Flex flex="1" direction="column" justify="center" align="center" color="gray.400" textAlign="center" px={10} bg={bg}>
              <Box bg={inputBg} p={8} borderRadius="full" mb={6} shadow="inner">
                 <FiMessageSquare size={56} color={useColorModeValue("#A0AEC0", "#4A5568")} />
              </Box>
              <Text fontSize="2xl" fontWeight="black" color={textColor} mb={2} letterSpacing="tight">Your Messages</Text>
              <Text color={mutedText} maxW="md" fontSize="lg">Select a conversation from the sidebar to chat securely with tenants or management.</Text>
           </Flex>
        )}
      </Box>

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay backdropFilter="blur(4px)">
          <AlertDialogContent bg={bg} borderRadius="2xl" shadow="2xl">
            <AlertDialogHeader fontSize="xl" fontWeight="black" color={textColor}>Delete Message</AlertDialogHeader>
            <AlertDialogBody color={mutedText} fontSize="md">
              Are you sure you want to delete this message? This action cannot be undone and it will be removed for everyone in the chat.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose} borderRadius="full" fontWeight="bold">Cancel</Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3} borderRadius="full" fontWeight="bold">Delete for everyone</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Flex>
  );
}