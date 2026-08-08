// In production (single Render service), frontend is served by Express
// so relative /api works perfectly. In local dev, use localhost:5000
const isDev = import.meta.env.DEV;
const defaultApiUrl = isDev ? 'http://localhost:5000/api' : '/api';

export const rawApiUrl = import.meta.env.VITE_API_BASE_URL || defaultApiUrl;

const getNormalizedBaseUrl = () => {
    let base = rawApiUrl.trim().replace(/\/$/, '');
    if (!base.startsWith('http://') && !base.startsWith('https://') && !base.startsWith('/')) {
          base = `https://${base}`;
    }
    if (!base.endsWith('/api') && base !== '/') {
          base = `${base}/api`;
    }
    return base;
};

export const API_BASE_URL = getNormalizedBaseUrl();

export const getApiUrl = (endpoint: string) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${cleanEndpoint}`;
};

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const serverBase = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${serverBase}${cleanPath}`;
};
