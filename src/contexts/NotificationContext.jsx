import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Polling interval in milliseconds (15 seconds)
const POLL_INTERVAL = 15000;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token, userData, setUnreadCount: setGlobalUnreadCount } = useAuth();
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [notifsRes, unreadRes] = await Promise.all([
        fetch(`${baseUrl}/api/notifications`, { headers }),
        fetch(`${baseUrl}/api/notifications/unread_count`, { headers }),
      ]);

      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data);
      }
      if (unreadRes.ok) {
        const unreadData = await unreadRes.json();
        setUnreadCount(unreadData.count);
        if (setGlobalUnreadCount) setGlobalUnreadCount(unreadData.count);
      }
    } catch (error) {
      // Silent fail — network errors are expected when backend is restarting
    }
  }, [token, setGlobalUnreadCount]);

  useEffect(() => {
    if (!token || !userData?.id) {
      // Clear polling if user logs out
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch on login
    fetchNotifications();

    // Start polling every 15 seconds
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [token, userData?.id, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      await fetch(`${baseUrl}/api/notifications/mark_as_read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCount(0);
      if (setGlobalUnreadCount) setGlobalUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Mark read failed", error);
    }
  }, [token, setGlobalUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
