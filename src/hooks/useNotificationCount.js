import { useState, useEffect } from "react";
import echo from "../lib/echo";

const API = "http://localhost:8000/api/v1";

export default function useNotificationCount(currentUser) {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`${API}/notifications?limit=100`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        // Count unread (where read_at is null)
        const unread = data.notifications?.filter(n => !n.read_at).length || 0;
        setCount(unread);
      }
    } catch (e) {
      console.error("Failed to fetch notification count", e);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchCount();

    // Listen for real-time notifications
    const channel = echo().private(`App.Models.User.${currentUser.id}`)
      .notification(() => {
        // Increment count when a new notification arrives
        setCount(prev => prev + 1);
      });

    // Listen for local "mark as read" events from Notification.jsx
    const handleRead = () => fetchCount();
    window.addEventListener('notificationRead', handleRead);

    return () => {
      echo().leaveChannel(`App.Models.User.${currentUser.id}`);
      window.removeEventListener('notificationRead', handleRead);
    };
  }, [currentUser?.id]);

  return count;
}
