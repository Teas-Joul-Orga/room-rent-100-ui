import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Avatar,
  Divider,
  useColorModeValue,
  Spinner,
  Flex,
  Icon,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import { IoCheckmarkDoneOutline, IoNotificationsOutline, IoTrashOutline, IoTimeOutline, IoConstructOutline, IoCashOutline, IoInformationCircleOutline } from "react-icons/io5";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import echo from "../../lib/echo";

dayjs.extend(relativeTime);

const API = "http://localhost:8000/api/v1";

// Map a backend URL or path to a frontend SPA route
function resolveRoute(url) {
  if (!url || url === '#') return null;
  try {
    // Handle full URLs (e.g. http://localhost:8000/api/v1/...) or relative paths
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    // Strip Laravel API prefix if present
    const clean = path.replace(/^\/api\/v1/, '');
    // Map backend routes → frontend routes
    if (clean.includes('maintenance')) return '/dashboard/maintenance';
    if (clean.includes('payment')) return '/dashboard/payments';
    if (clean.includes('utility') || clean.includes('bill')) return '/dashboard/utility';
    if (clean.includes('lease')) return '/dashboard/lease';
    if (clean.includes('announcement')) return '/dashboard/announcements';
    if (clean.includes('chat')) return '/dashboard/chat';
    if (clean.includes('expense')) return '/dashboard/expenses';
    if (clean.includes('tenant')) return '/dashboard/tenants';
    if (clean.includes('room')) return '/dashboard/rooms';
    // If the path itself looks like a frontend route, use it directly
    if (clean.startsWith('/dashboard')) return clean;
    return null;
  } catch {
    return null;
  }
}

function Notification({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const toast = useToast();
  const navigate = useNavigate();

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const hoverBg = useColorModeValue("gray.50", "#1c2333");
  const unreadBg = useColorModeValue("blue.50", "blue.900");
  const headerFooterBg = useColorModeValue("gray.50", "#0d1117");
  const iconBg = useColorModeValue("white", "#30363d");

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Get current user for real-time channel
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.id) {
      const channel = echo().private(`App.Models.User.${storedUser.id}`)
        .notification((notification) => {
          // Laravel sends the notification object
          setNotifications((prev) => [notification, ...prev]);
          
          // Show a small toast for the new notification if not looking at this page
          toast({
            title: notification.title || "New Notification",
            description: notification.message || notification.body,
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "top-right",
          });
        });

      return () => {
        echo().leaveChannel(`App.Models.User.${storedUser.id}`);
      };
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API}/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: dayjs().toISOString() } : n))
        );
        // Dispatch global event for Topbar badge update
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const handleNotificationClick = (n, data) => {
    // Close the popover immediately (if inside Topbar)
    onClose?.();
    // Navigate to the relevant page immediately
    const route = resolveRoute(data?.url || data?.action_url);
    if (route) {
      navigate(route);
    }
    // Mark as read in the background (non-blocking)
    if (!n.read_at) {
      markAsRead(n.id);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API}/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: dayjs().toISOString() }))
        );
        toast({
          title: "All marked as read",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        // Dispatch global event for Topbar badge update
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const getNotificationIcon = (type) => {
    // Map Laravel notification types or your custom types to icons
    if (type?.includes("Maintenance")) return <Icon as={IoConstructOutline} color="orange.500" />;
    if (type?.includes("Payment") || type?.includes("Rent")) return <Icon as={IoCashOutline} color="green.500" />;
    return <Icon as={IoInformationCircleOutline} color="blue.500" />;
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box 
      w="full" 
      bg={bg} 
      overflow="hidden"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" px={4} py={3} borderBottom="1px" borderColor={borderColor} bg={headerFooterBg}>
        <HStack>
          <Icon as={IoNotificationsOutline} boxSize={5} color="blue.500" />
          <Text fontWeight="bold">Notifications</Text>
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          colorScheme="blue"
          leftIcon={<IoCheckmarkDoneOutline />}
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      </Flex>

      {/* Notification List */}
      <VStack spacing={0} align="stretch" maxH="500px" overflowY="auto" overflowX="hidden" divider={<Divider />}>
        {notifications.length === 0 ? (
          <Flex direction="column" align="center" justify="center" py={10} px={4} textAlign="center">
            <Icon as={IoNotificationsOutline} boxSize={10} color="gray.300" mb={2} />
            <Text color="gray.500" fontSize="sm">No new notifications.</Text>
          </Flex>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at;
            // Parse data from Laravel DatabaseNotification structure
            const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
            
            return (
              <Box
                key={n.id}
                px={4}
                py={3}
                bg={isUnread ? unreadBg : "transparent"}
                borderLeft="3px solid"
                borderLeftColor={isUnread ? "blue.400" : "transparent"}
                _hover={{ bg: isUnread ? unreadBg : hoverBg, borderLeftColor: "blue.400" }}
                transition="all 0.15s ease"
                cursor="pointer"
                onClick={() => handleNotificationClick(n, data)}
                position="relative"
                role="button"
                aria-label={`Notification: ${data?.title || 'View notification'}`}
              >
                <HStack align="start" spacing={3}>
                  <Flex 
                    shrink={0} 
                    w={8} 
                    h={8} 
                    rounded="full" 
                    bg={iconBg} 
                    align="center" 
                    justify="center" 
                    shadow="sm"
                  >
                    {getNotificationIcon(n.type)}
                  </Flex>
                  
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight={isUnread ? "bold" : "medium"} noOfLines={1}>
                      {data?.title || "New Update"}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={2}>
                      {data?.message || data?.body || "Click to see details"}
                    </Text>
                    <HStack fontSize="10px" color="gray.400" mt={1}>
                      <Icon as={IoTimeOutline} />
                      <Text>{dayjs(n.created_at).fromNow()}</Text>
                    </HStack>
                  </VStack>

                  {isUnread && (
                    <Box shrink={0} w={2} h={2} rounded="full" bg="blue.500" mt={2} />
                  )}
                </HStack>
              </Box>
            );
          })
        )}
      </VStack>

      {/* Footer */}
      <Box px={4} py={2} borderTop="1px" borderColor={borderColor} textAlign="center" bg={headerFooterBg}>
        <Text fontSize="xs" color="gray.500" fontWeight="medium">
          Showing latest {notifications.length} notifications
        </Text>
      </Box>
    </Box>
  );
}

export default Notification;