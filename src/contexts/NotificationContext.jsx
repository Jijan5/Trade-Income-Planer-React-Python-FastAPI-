import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { token, userData, setUnreadCount: setGlobalUnreadCount } = useAuth();
  const userId = userData?.id;
  const username = userData?.username;

  const connectSocket = useCallback(() => {
    if (!token || !userId) return;

    const newSocket = io(
      `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}`,
      {
        auth: { token },
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: false,
        timeout: 20000,
      }
    );

    newSocket.on("connect_error", (err) => {
      console.warn(
        "Socket connect error (normal if backend down):",
        err.message
      );
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("join_notifications", { user_id: userId });
    });

    newSocket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      if (setGlobalUnreadCount) setGlobalUnreadCount((prev) => prev + 1);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token, userId, setGlobalUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const headers = { Authorization: `Bearer ${token}` };
      
      const [notifsRes, unreadRes] = await Promise.all([
        fetch(`${baseUrl}/api/notifications`, { headers }),
        fetch(`${baseUrl}/api/notifications/unread_count`, { headers })
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
      console.error("Failed to fetch notifications:", error);
    }
  }, [token, setGlobalUnreadCount]);

  useEffect(() => {
    if (!token || !userData?.id) {
      return; // No connect if not logged in
    }

    fetchNotifications();
    const cleanup = connectSocket();
    return cleanup;
  }, [token, userData?.id, connectSocket, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      await fetch(`${baseUrl}/api/notifications/mark_as_read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUnreadCount(0);
      if (setGlobalUnreadCount) setGlobalUnreadCount(0);
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Mark read failed", error);
    }
  }, [token, setGlobalUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    socket,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
