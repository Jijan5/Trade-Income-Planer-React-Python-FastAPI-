import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userData, setUserData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // don't need URL manual header
      const res = await api.get("/users/me");
      const profileData = res.data;
      // If avatar URL exists, fetch it as a blob
      if (profileData.avatar_url) {
        try {
          const imageRes = await api.get(profileData.avatar_url, {
            responseType: "blob",
          });
          const blobUrl = URL.createObjectURL(imageRes.data);
          setAvatarUrl(blobUrl);
        } catch (imgError) {
          console.error("Failed to fetch avatar image", imgError);
          setAvatarUrl(null); // Reset on failure
        }
      } else {
        setAvatarUrl(null); // Reset if no avatar
      }
      // Optimization: Only update state if data actually changed to prevent re-renders
      setUserData((prev) => {
        return JSON.stringify(prev) !== JSON.stringify(profileData)
          ? profileData
          : prev;
      });
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      setUserData(null);
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/notifications/unread_count");
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUnreadCount();
      // Polling unread count every 15 seconds
      const unreadInterval = setInterval(fetchUnreadCount, 15000);
      // Polling user profile every 5 seconds (for suspension/plan updates)
      const profileInterval = setInterval(fetchUserProfile, 5000);

      return () => {
        clearInterval(unreadInterval);
        clearInterval(profileInterval);
      };
    } else {
      // When token is null (e.g., on logout), clear user data and stop loading.
      setUserData(null);
      setAvatarUrl(null);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [token, fetchUserProfile, fetchUnreadCount]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setLoading(true);
    // fetchUserProfile();
  };
  useEffect(() => {
    // Cleanup blob URL on component unmount or when avatar changes
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeView");
    if (userData?.id) {
      localStorage.removeItem(`manual_trade_session_${userData.id}`);
    }
    setToken(null);
    setUserData(null);
    setAvatarUrl(null);
    setUnreadCount(0);
    navigate("/");
  }, [userData, navigate]);

  // Global Axios interceptor for auto-logout if token expired (401)
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          !error.config.url.endsWith("/api/token")
        ) {
          console.error("Session expired. Auto logout.");
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      userData,
      avatarUrl,
      loading,
      setUserData,
      unreadCount,
      setUnreadCount,
      login,
      logout,
      fetchUserProfile,
      fetchUnreadCount,
    }),
    [
      token,
      userData,
      avatarUrl,
      loading,
      unreadCount,
      login,
      logout,
      fetchUserProfile,
      fetchUnreadCount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
