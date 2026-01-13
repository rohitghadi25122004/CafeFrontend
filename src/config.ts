export const API_BASE_URL = 
   import.meta.env.VITE_API_URL?.replace(/\/$/, '') || `http://${window.location.hostname}:3000`;
