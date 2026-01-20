// Default to the deployed backend, but allow override via VITE_API_URL.
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "https://cafebackend-x7ku.onrender.com").replace(/\/$/, "");
