import axios from "axios";

// Base URL — set VITE_API_BASE_URL in your .env file (baked into build by Vite)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For multi-tenancy, send the domain as a header
    config.headers["X-Tenant-Domain"] = window.location.hostname;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle error global (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;