export const COURSE_TYPES = ['free', 'freemium', 'premium'];
const FALLBACK_API_URL = 'https://interiilink.com/api/api/';

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || FALLBACK_API_URL;
  try {
    const url = new URL(configuredUrl);
    const isBrowserHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    return isBrowserHttps && url.protocol !== 'https:' ? FALLBACK_API_URL : configuredUrl;
  } catch {
    return FALLBACK_API_URL;
  }
};

export const API_BASE_URL = resolveApiBaseUrl();
