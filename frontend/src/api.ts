export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper to remove double /api/api if present or format path correctly
export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${cleanEndpoint}`;
};

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Backend base host without trailing /api
  const serverBase = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${serverBase}${cleanPath}`;
};
