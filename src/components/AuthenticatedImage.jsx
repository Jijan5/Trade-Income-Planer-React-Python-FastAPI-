import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * AuthenticatedImage
 *
 * Renders images stored on the backend's /static/ endpoint.
 * Static files are served publicly by FastAPI (no auth required),
 * so we simply build the full URL and use a plain <img> tag.
 * This avoids the previous axios double-URL bug that caused Network Errors.
 *
 * Supports all image types including .gif (animated GIFs work fine).
 */
const AuthenticatedImage = ({ src, alt, fallback = null, ...props }) => {
  const [hasError, setHasError] = useState(false);

  // If no src provided, render nothing or a placeholder
  if (!src) {
    return fallback || null;
  }

  // If already a full URL (http/https), use it directly.
  // Otherwise, join API_BASE_URL with the path, avoiding double slashes.
  let imageUrl;
  if (src.startsWith("http://") || src.startsWith("https://")) {
    imageUrl = src;
  } else {
    const cleanSrc = src.startsWith("/") ? src : `/${src}`;
    imageUrl = `${API_BASE_URL}${cleanSrc}`;
  }

  if (hasError) {
    // Render fallback or a neutral placeholder div on error
    return fallback || (
      <div
        style={{ background: "#1a1f2e", display: "flex", alignItems: "center", justifyContent: "center" }}
        {...props}
      >
        <span style={{ color: "#4a5568", fontSize: "0.7rem" }}>—</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default AuthenticatedImage;
