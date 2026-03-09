import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Badge, useColorModeValue, Spinner, Image, 
  Avatar, HStack, VStack, Icon, Container
} from '@chakra-ui/react';
import { FiClock, FiCalendar, FiAlertCircle, FiMoreHorizontal } from 'react-icons/fi';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const API = "http://localhost:8000/api/v1";
const IMAGE_URL = "http://localhost:8000/storage"; // Adjust based on your public config

export default function TenantAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
      const res = await fetch(`${API}/tenant/announcements`, {
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
                      </HStack>
                    </Box>
                  </HStack>
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
                  <HStack spacing={4} color={mutedText} fontSize="xs" fontWeight="bold">
                     <HStack>
                        <Icon as={FiAlertCircle} />
                        <Text textTransform="uppercase" letterSpacing="widest">Official Update</Text>
                     </HStack>
                  </HStack>
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
    </Container>
  );
}
