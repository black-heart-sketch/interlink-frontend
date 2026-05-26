import axiosInstance from '../config/axiosConfig';

export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await axiosInstance.post('/auth/login', userData);
  return response.data;
};

export const initiateRegistrationPayment = async (payload) => {
  const response = await axiosInstance.post('/auth/initiate-registration-payment', payload);
  return response.data;
};

export const getRegistrationPaymentStatus = async (transactionId) => {
  const response = await axiosInstance.get(`/auth/registration-payment-status/${transactionId}`);
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post('/auth/logout');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axiosInstance.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};
