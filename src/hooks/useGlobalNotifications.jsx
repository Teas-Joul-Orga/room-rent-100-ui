import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import echo from '../lib/echo';

export default function useGlobalNotifications(currentUser) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // 2. Use the centralized echo singleton

    // 1. Listen for new messages
    const chatChannel = echo().private(`chat.user.${currentUser.id}`)
      .listen('.App\\Events\\MessageSent', (e) => {
        // Don't show toast if we are already on the chat page
        // (Optional: even more granularly, check if we're in the thread with THIS sender)
        if (location.pathname.includes('/chat')) {
           // We might want to keep the current behavior where Chat.jsx handles it
           return;
        }

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

    return () => {
      echo().leaveChannel(`chat.user.${currentUser.id}`);
    };
  }, [currentUser?.id, location.pathname, navigate]);
}
