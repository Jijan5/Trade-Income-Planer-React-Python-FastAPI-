import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios'; // Import instance axios

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [userData, setUserData] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const fetchUserProfile = useCallback(async () => {
        if (!token) return;
        try {
            // don't need URL manual header
            const res = await api.get("/users/me");
            setUserData(res.data);
        } catch (error) {
            console.error("Failed to fetch user profile", error);
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
            const intervalId = setInterval(fetchUnreadCount, 15000);
            return () => clearInterval(intervalId);
        } else {
            setUserData(null);
            setUnreadCount(0);
        }
    }, [token, fetchUserProfile, fetchUnreadCount]);

    const login = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("activeView");
        if (userData?.id) {
            localStorage.removeItem(`manual_trade_session_${userData.id}`);
        }
        setToken(null);
        setUserData(null);
        setUnreadCount(0);
        navigate("/");
    }, [userData, navigate]);

    // Global Axios interceptor for auto-logout if token expired (401)
    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401 && !error.config.url.endsWith('/api/token')) {
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

    const value = {
        token,
        userData,
        setUserData,
        unreadCount,
        setUnreadCount,
        login,
        logout,
        fetchUserProfile,
        fetchUnreadCount
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};