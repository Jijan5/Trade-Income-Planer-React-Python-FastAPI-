import React, { useState, useEffect } from 'react';
import api from '../lib/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const AuthenticatedImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
        setIsLoading(false);
        return;
    }

    let isMounted = true;
    const fetchImage = async () => {
      try {
        // Construct the full, absolute URL to bypass the '/api' prefix
        const imageUrl = `${API_BASE_URL}/${src}`;
        const response = await api.get(imageUrl, {
          responseType: 'blob',
        });
        if (isMounted) {
          const blobUrl = URL.createObjectURL(response.data);
          setImageSrc(blobUrl);
        }
      } catch (error) {
        console.error('Failed to load authenticated image:', error);
        if (isMounted) {
          setImageSrc(null); // Or a placeholder
        }
      } finally {
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
        <div className="w-full h-48 bg-gray-700 animate-pulse rounded" {...props}></div>
    );
  }

  if (!imageSrc) {
    return (
        <div className="w-full h-48 bg-gray-800 flex items-center justify-center rounded" {...props}>
            <p className="text-gray-500">Image not available</p>
        </div>
    );
  }

  return <img src={imageSrc} alt={alt} {...props} />;
};

export default AuthenticatedImage;