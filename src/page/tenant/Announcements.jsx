import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Badge, useColorModeValue, Spinner, Image,
  Avatar, HStack, VStack, Icon, Container, Divider, IconButton, Tooltip,
  Menu, MenuButton, MenuList, MenuItem, Button, Input, Skeleton, SkeletonCircle, SkeletonText,
  Collapse, useDisclosure
} from '@chakra-ui/react';
import { useTranslation } from "react-i18next";
import { 
  FiClock, FiMoreHorizontal, FiThumbsUp, FiMessageCircle, FiShare2, 
  FiGlobe, FiSend, FiFlag, FiBookmark, FiXCircle 
} from 'react-icons/fi';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const API = "http://localhost:8000/api/v1";
const IMAGE_URL = "http://localhost:8000/storage"; // Adjust based on your public config

export default function TenantAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  const bg = useColorModeValue("white", "#1c1e21"); // Facebook-y dark mode
  const borderColor = useColorModeValue("gray.200", "#303338");
  const textColor = useColorModeValue("gray.800", "#e4e6eb");
  const mutedText = useColorModeValue("gray.500", "#b0b3b8");
  const btnHover = useColorModeValue("gray.100", "whiteAlpha.100");
  const primaryBlue = "#1877f2"; 

  const [likedPosts, setLikedPosts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");

  const toggleLike = (id) => {
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleComments = (id) => {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (id) => {
    if (!newComment.trim()) return;
    const postComments = comments[id] || [];
    setComments({
      ...comments,
      [id]: [...postComments, { id: Date.now(), text: newComment, user: "You", time: "Just now" }]
    });
    setNewComment("");
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/tenant/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.data || json.announcements || json || []); 
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

  return (
    <Container maxW="container.md" py={10}>
      <Flex justify="space-between" align="center" mb={10}>
        <Box>
          <Text fontSize="3xl" fontWeight="black" color={textColor} letterSpacing="tight">
            Community Feed
          </Text>
          <Text fontSize="sm" color={mutedText} fontWeight="medium">
            Stay updated with the latest news from your community.
          </Text>
        </Box>
      </Flex>

      {loading ? (
        <VStack spacing={6} align="stretch">
          {[1, 2, 3].map(i => (
            <Box key={i} p={4} bg={bg} borderRadius="xl" shadow="sm" border="1px" borderColor={borderColor}>
              <HStack spacing={3} mb={4}>
                <SkeletonCircle size="10" />
                <VStack align="start" spacing={1}>
                  <Skeleton h="10px" w="120px" />
                  <Skeleton h="8px" w="60px" />
                </VStack>
              </HStack>
              <SkeletonText noOfLines={3} spacing="3" />
            </Box>
          ))}
        </VStack>
      ) : (
        <VStack spacing={8} align="stretch">
          {announcements.length > 0 ? announcements.map(a => {
            const isScheduled = dayjs(a.published_at).isAfter(dayjs());
            const isLiked = likedPosts[a.id];
            
            return (
              <Box 
                key={a.id} 
                bg={bg} 
                borderRadius="xl" 
                shadow="sm" 
                border="1px solid" 
                borderColor={borderColor} 
                overflow="hidden"
                transition="all 0.2s"
              >
                {/* Post Header */}
                <Flex p={4} justify="space-between" align="start">
                  <HStack spacing={3}>
                    <Avatar 
                      name="P M" 
                      bg={primaryBlue} 
                      color="white" 
                      size="md"
                    />
                    <Box>
                      <HStack spacing={2} align="center">
                        <Text fontWeight="bold" color={textColor} fontSize="sm">
                          Property Management
                        </Text>
                        {a.priority === 'urgent' && (
                          <Badge colorScheme="red" variant="solid" fontSize="9px" px={1} borderRadius="sm">
                             URGENT
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing={1} color={mutedText} fontSize="xs">
                        <Text>{dayjs(a.published_at).fromNow()}</Text>
                        <Text>•</Text>
                        <Icon as={FiGlobe} boxSize={3} title="Public to Community" />
                      </HStack>
                    </Box>
                  </HStack>
                  <Menu gutter={8}>
                    <MenuButton
                      as={IconButton}
                      size="sm"
                      variant="ghost"
                      icon={<FiMoreHorizontal />}
                      aria-label="Options"
                      borderRadius="full"
                      color={mutedText}
                      _hover={{ bg: btnHover }}
                    />
                    <MenuList bg={bg} borderColor={borderColor} shadow="xl" py={2} borderRadius="xl">
                      <MenuItem icon={<FiBookmark />} fontSize="sm" bg="transparent" _hover={{ bg: btnHover }}>Save Post</MenuItem>
                      <MenuItem icon={<FiFlag />} fontSize="sm" bg="transparent" _hover={{ bg: btnHover }}>Report to Management</MenuItem>
                      <Divider my={2} borderColor={borderColor} />
                      <MenuItem icon={<FiXCircle />} fontSize="sm" color="red.400" bg="transparent" _hover={{ bg: btnHover }}>Hide Post</MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>

                {/* Post Content */}
                <Box px={4} pb={3}>
                   <Text fontSize="md" fontWeight="bold" mb={1} color={textColor}>{a.title}</Text>
                   <Text color={textColor} fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">{a.content}</Text>
                </Box>

                {/* Post Media */}
                {a.photo_path && (
                  <Box mb={1} borderY="1px solid" borderColor={borderColor}>
                    <Image 
                      src={`${IMAGE_URL}/${a.photo_path}`} 
                      alt="Announcement Media" 
                      w="full"
                      maxH="600px"
                      objectFit="cover"
                      cursor="zoom-in"
                    />
                  </Box>
                )}

                {/* Interaction Counts (Visual Only) */}
                <Flex px={4} py={2} justify="space-between" align="center">
                  <HStack spacing={1}>
                     <Flex 
                        bg={primaryBlue} 
                        borderRadius="full" 
                        boxSize={4} 
                        align="center" 
                        justify="center"
                      >
                         <Icon as={FiThumbsUp} color="white" boxSize={2.5} />
                     </Flex>
                     <Text fontSize="xs" color={mutedText} fontWeight="medium">
                       { (likedPosts[a.id] ? 1 : 0) + (a.likes_count || 0) } People
                     </Text>
                  </HStack>
                  <HStack spacing={3} color={mutedText} fontSize="xs">
                    <Text display={openComments[a.id] ? "none" : "block"}>
                      {(comments[a.id]?.length || 0)} Comments
                    </Text>
                    <Text fontWeight="bold" color={primaryBlue}>OFFICIAL</Text>
                  </HStack>
                </Flex>

                <Box px={4} pb={1}><Divider borderColor={borderColor} /></Box>

                {/* Post Footer / Social Actions */}
                <Flex px={2} py={1} gap={1}>
                   <Button 
                     flex={1} 
                     variant="ghost" 
                     size="sm" 
                     leftIcon={<Icon as={FiThumbsUp} fill={isLiked ? primaryBlue : "none"} color={isLiked ? primaryBlue : "inherit"} />}
                     color={isLiked ? primaryBlue : mutedText}
                     _hover={{ bg: btnHover }}
                     fontSize="xs"
                     fontWeight="bold"
                     onClick={() => toggleLike(a.id)}
                   >
                     Like
                   </Button>
                   <Button 
                     flex={1} 
                     variant="ghost" 
                     size="sm" 
                     leftIcon={<FiMessageCircle />}
                     color={openComments[a.id] ? primaryBlue : mutedText}
                     _hover={{ bg: btnHover }}
                     fontSize="xs"
                     fontWeight="bold"
                     onClick={() => toggleComments(a.id)}
                   >
                     Comment
                   </Button>
                   <Button 
                     flex={1} 
                     variant="ghost" 
                     size="sm" 
                     leftIcon={<FiShare2 />}
                     color={mutedText}
                     _hover={{ bg: btnHover }}
                     fontSize="xs"
                     fontWeight="bold"
                   >
                     Share
                   </Button>
                </Flex>

                {/* Comment Section (Collapsible) */}
                <Collapse in={openComments[a.id]} animateOpacity>
                  <Box px={4} pb={4}>
                    <Divider borderColor={borderColor} mb={4} />
                    
                    {/* Comment List */}
                    <VStack align="stretch" spacing={3} mb={4}>
                      {(comments[a.id] || []).map(comm => (
                        <HStack key={comm.id} align="start" spacing={2}>
                          <Avatar size="xs" name={comm.user} />
                          <Box bg={btnHover} p={2} borderRadius="2xl" flex={1}>
                            <Text fontSize="xs" fontWeight="bold">{comm.user}</Text>
                            <Text fontSize="xs">{comm.text}</Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>

                    {/* Write a comment */}
                    <HStack spacing={2}>
                      <Avatar size="sm" name="Me" src={localStorage.getItem('avatar')} />
                      <Input 
                        placeholder="Write a comment..." 
                        size="sm" 
                        bg={btnHover} 
                        border="none" 
                        borderRadius="full" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(a.id)}
                      />
                      <IconButton 
                        icon={<FiSend />} 
                        size="sm" 
                        colorScheme="blue" 
                        variant="ghost" 
                        borderRadius="full"
                        onClick={() => handleAddComment(a.id)}
                      />
                    </HStack>
                  </Box>
                </Collapse>
              </Box>
            );
          }) : (
            <Flex direction="column" align="center" justify="center" py={20} bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor}>
              <Icon as={FiMoreHorizontal} boxSize={12} color="gray.300" mb={4} />
              <Text fontSize="lg" fontWeight="bold" color={mutedText}>No news at the moment</Text>
              <Text fontSize="sm" color="gray.400">Everything is quiet across the community.</Text>
            </Flex>
          )}
        </VStack>
      )}
    </Container>
  );
}
