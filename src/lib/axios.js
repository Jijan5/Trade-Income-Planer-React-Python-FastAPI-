import axios from "axios";

// Base URL backend (later, change with environment variable)
export const API_BASE_URL = "http://127.0.0.1:8000";

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
