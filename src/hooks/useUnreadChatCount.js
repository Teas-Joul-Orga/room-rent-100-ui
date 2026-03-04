import { useState, useEffect } from 'react';
import echo from '../lib/echo';

const API = "http://localhost:8000/api/v1";

export default function useUnreadChatCount(currentUser) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // 1. Fetch initial count from API
    const fetchInitialCount = async () => {
      try {
        const res = await fetch(`${API}/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (e) {
        console.error("Failed to fetch unread count", e);
      }
    };
    fetchInitialCount();

    const channel = echo().private(`chat.user.${currentUser.id}`)
      .listen('.App\\Events\\ChatCountsUpdated', (e) => {
         // The server literally tells us exactly what the total unread count is over WebSockets
         // There is no more bandwidth-heavy React event dispatching math to compute.
         setUnreadCount(e.totalUnread || 0);
      });

    // Cleanup
    return () => {
      echo().leaveChannel(`chat.user.${currentUser.id}`);
    };
  }, [currentUser?.id]);

  return unreadCount;
}
