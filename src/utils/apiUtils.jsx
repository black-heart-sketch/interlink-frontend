import { store } from 'redux/store';
import { clearCredentials } from 'redux/authSlice';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://interiilink.com/api/api/';

const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/projects/getAll',
  '/firms',
  '/map',
  '/chat/reply',
  '/courses/free',
  '/smtp/send'
];

function buildUrlWithParams(baseUrl, endpoint, params = {}) {
  const url = new URL(`${baseUrl}${endpoint}`);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
}

function getStoredToken() {
  const state = store.getState();
  return state.auth.token || sessionStorage.getItem('token');
}

export const fetchWithAuth = async (endpoint, options = {}, params = {}) => {
  const headers = {
    ...(options.headers || {})
  };

  if (!publicRoutes.includes(endpoint)) {
    const token = getStoredToken();

    if (!token) {
      store.dispatch(clearCredentials());
      window.location.href = '/login';
      return;
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrlWithParams(BASE_URL, endpoint, params), {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 401 || response.status === 403) {
      toast.error('You are not authorized to perform this action.');
    }

    throw new Error(errorText);
  }

  return response.json();
};

export const get = (endpoint, params) => fetchWithAuth(endpoint, {}, params);

export const post = (endpoint, body) => {
  const isFormData = body instanceof FormData;
  return fetchWithAuth(endpoint, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' }
  });
};

export const put = (endpoint, body) => {
  const isFormData = body instanceof FormData;
  return fetchWithAuth(endpoint, {
    method: 'PUT',
    body: isFormData ? body : JSON.stringify(body),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' }
  });
};

export const patch = (endpoint, body) => {
  const isFormData = body instanceof FormData;
  return fetchWithAuth(endpoint, {
    method: 'PATCH',
    body: isFormData ? body : JSON.stringify(body),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' }
  });
};

export const del = (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' });
