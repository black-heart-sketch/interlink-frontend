export const ONLINE_API_URL = 'https://interiilink.com/api/api/';

const normalizeUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url : `${url}/`;
};

const isSafeBrowserUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    const isBrowserHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    return !(isBrowserHttps && parsedUrl.protocol !== 'https:');
  } catch {
    return false;
  }
};

export const resolveApiBaseUrl = () => {
  const apiUrl = normalizeUrl(import.meta.env.VITE_API_URL || ONLINE_API_URL);

  return isSafeBrowserUrl(apiUrl) ? apiUrl : ONLINE_API_URL;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
