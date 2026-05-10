import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Log the user in with the token received from the backend
      login(token);
      // Redirect to home page
      navigate("/home", { replace: true });
    } else {
      // If no token, maybe there was an error
      console.error("No token found in Google callback");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-engine-bg flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-engine-neon border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold text-engine-neon animate-pulse">
        Authenticating with Google...
      </h2>
    </div>
  );
};

export default GoogleCallback;
