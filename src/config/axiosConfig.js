import axios from 'axios';

const FALLBACK_API_URL = 'https://interiilink.com/api/api/';

const resolveApiUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL || FALLBACK_API_URL;

  try {
    const url = new URL(configuredUrl);
    const isBrowserHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isBrowserHttps && url.protocol !== 'https:') {
      return FALLBACK_API_URL;
    }
  } catch {
    return FALLBACK_API_URL;
  }

  return configuredUrl;
};

// Base instance configuration
const axiosInstance = axios.create({
  baseURL: resolveApiUrl(),
  timeout: 0, // No timeout — video uploads can take several minutes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const lang = localStorage.getItem('i18nextLng') || 'fr';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically append lang query parameter
    config.params = { ...config.params, lang };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error is due to unauthorized token
    if (error.response && error.response.status === 401) {
      // Handle session expiration
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
