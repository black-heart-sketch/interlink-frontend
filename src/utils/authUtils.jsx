import { setCredentials, clearCredentials } from 'redux/authSlice';
import { post, put } from 'utils/apiUtils';
import { store } from 'redux/store';
import { jwtDecode } from 'jwt-decode';

const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
};

const persistAuth = (data) => {
  const token = data.token;
  const decodedToken = token ? decodeToken(token) : null;
  const user = {
    id: data._id || decodedToken?.id || null,
    email: data.email || decodedToken?.email || null,
    role: data.role || decodedToken?.role || null
  };

  sessionStorage.setItem('token', token);
  localStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('user', JSON.stringify(user));
  
  if (user.id) {
    sessionStorage.setItem('userId', user.id);
    localStorage.setItem('userId', user.id);
  }
  if (user.email) {
    sessionStorage.setItem('userName', user.email);
    localStorage.setItem('userName', user.email);
  }
  if (user.role) {
    sessionStorage.setItem('userRoles', JSON.stringify([user.role]));
    localStorage.setItem('userRoles', JSON.stringify([user.role]));
  }

  store.dispatch(setCredentials({
    token,
    userId: user.id,
    userName: user.email,
    email: user.email,
    userRoles: user.role ? [user.role] : [],
    profile: user
  }));

  return {
    token,
    decodedToken,
    user
  };
};

export const validateToken = (token) => {
  const decodedToken = decodeToken(token);
  const currentTime = Date.now() / 1000;

  return Boolean(decodedToken?.exp && decodedToken.exp > currentTime);
};

export const login = async (endpoint, loginData) => {
  const data = await post(endpoint, loginData);
  return persistAuth(data);
};

export const register = async (endpoint, registerData) => {
  const data = await post(endpoint, registerData);
  return data.token ? persistAuth(data) : data;
};

export const logout = () => {
  store.dispatch(clearCredentials());
  sessionStorage.clear();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRoles');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userRole');
};

export const isAuthenticated = () => {
  const token = store.getState().auth.token || sessionStorage.getItem('token');
  return token ? validateToken(token) : false;
};

export const getToken = () => {
  return store.getState().auth.token || sessionStorage.getItem('token');
};

export const hydrateAuthFromStorage = () => {
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  const userId = sessionStorage.getItem('userId');
  const userName = sessionStorage.getItem('userName');
  const userRoles = JSON.parse(sessionStorage.getItem('userRoles') || '[]');

  if (token) {
    store.dispatch(setCredentials({
      token,
      user,
      userId,
      userName,
      userRoles
    }));
  }
};

export const updateUserProfile = async (profileData) => {
  const data = await put('/user/profile', profileData);
  store.dispatch(setCredentials({ ...store.getState().auth, profile: data }));
  return data;
};

export const refreshToken = async () => {
  const data = await post('/auth/refresh-token');
  sessionStorage.setItem('token', data.token);
  store.dispatch(setCredentials({ ...store.getState().auth, token: data.token }));
  return data.token;
};
