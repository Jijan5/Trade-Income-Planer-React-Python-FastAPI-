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

  const connectSocket = useCallback(() => {
    if (!token || !userData?.id) return;

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
      newSocket.emit("join_notifications", { user_id: userData.id });
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
  }, [token, userData, setGlobalUnreadCount]);

  // Fixed useEffect - no re-render loop

  useEffect(() => {
    if (!token || !userData?.id) {
      return; // No connect if not logged in
    }

    const cleanup = connectSocket();
    return cleanup;
  }, [token, userData?.id]);

  const markAllRead = useCallback(async () => {
    try {
      setUnreadCount(0);
      if (setGlobalUnreadCount) setGlobalUnreadCount(0);
    } catch (error) {
      console.error("Mark read failed", error);
    }
  }, [setGlobalUnreadCount]);

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
