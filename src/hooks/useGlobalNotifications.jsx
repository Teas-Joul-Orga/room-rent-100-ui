import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Box, Flex, Text, Icon, VStack } from '@chakra-ui/react';
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import echo from '../lib/echo';

export default function useGlobalNotifications(currentUser) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser?.id) return;
    const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
    if (!token) return;

    // 1. Listen for new messages
    const chatChannel = echo().private(`chat.user.${currentUser.id}`)
      .listen('.App\\Events\\MessageSent', (e) => {
        // ... (rest of message logic)
        if (location.pathname.includes('/chat')) return;

        toast((t) => (
          <div 
            onClick={() => {
              toast.dismiss(t.id);
              navigate('/chat');
            }}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <strong style={{ fontSize: '14px' }}>New message from {e.sender_name}</strong>
            <span style={{ fontSize: '13px', color: '#666' }}>{e.message.length > 50 ? e.message.substring(0, 50) + '...' : e.message}</span>
          </div>
        ), {
          duration: 4000,
          position: 'top-right',
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '12px 16px',
            border: '1px solid #eee'
          }
        });
      });

    // 2. Listen for System Notifications (Real-time Toasts)
    const notificationChannel = echo().private(`App.Models.User.${currentUser.id}`)
      .notification((notification) => {
        const { title, message, url, type } = notification;

        // Custom Toast UI based on type
        const getIcon = () => {
          switch (type) {
            case 'success': return FiCheckCircle;
            case 'warning': return FiAlertCircle;
            case 'danger': return FiAlertCircle;
            default: return FiInfo;
          }
        };

        const getColor = () => {
          switch (type) {
            case 'success': return 'green.500';
            case 'warning': return 'orange.500';
            case 'danger': return 'red.500';
            default: return 'blue.500';
          }
        };

        toast.custom((t) => (
          <Box
            bg="white"
            p={4}
            borderRadius="xl"
            shadow="xl"
            borderLeft="4px solid"
            borderColor={getColor()}
            onClick={() => {
              toast.dismiss(t.id);
              if (url && url !== '#') navigate(url);
            }}
            cursor="pointer"
            maxW="350px"
            animation={t.visible ? 'fade-in 0.2s ease-out' : 'fade-out 0.2s ease-in'}
          >
            <Flex align="center" gap={3}>
              <Icon as={getIcon()} boxSize={5} color={getColor()} />
              <VStack align="flex-start" spacing={0}>
                <Text fontWeight="black" fontSize="sm" color="gray.800" letterSpacing="tight">
                  {title}
                </Text>
                <Text fontSize="xs" color="gray.600" noOfLines={2}>
                  {message}
                </Text>
              </VStack>
            </Flex>
          </Box>
        ), { duration: 5000, position: 'top-right' });
      })
      .listen('.App\\Events\\AccountDisabled', () => {
        // Handle real-time logout
        ['token', 'user', 'role', 'isLoggedIn', 'token_expires_at'].forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        toast.error('Your account has been disabled. You have been logged out.', { duration: 6000 });
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      });

    return () => {
      echo().leaveChannel(`chat.user.${currentUser.id}`);
      echo().leaveChannel(`App.Models.User.${currentUser.id}`);
    };
  }, [currentUser?.id, location.pathname, navigate]);
}
