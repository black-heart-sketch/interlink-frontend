import axiosInstance from '../config/axiosConfig';

const toFormData = (payload = {}) => {
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'attachments') return;
    if (value !== undefined && value !== null) data.append(key, value);
  });
  Array.from(payload.attachments || []).forEach((file) => data.append('attachments', file));
  return data;
};

export const messageService = {
  getContacts: async () => {
    const response = await axiosInstance.get('/messages/contacts');
    return response.data;
  },
  getConversation: async (userId) => {
    const response = await axiosInstance.get(`/messages/${userId}`);
    return response.data;
  },
  sendMessage: async (payload) => {
    const response = await axiosInstance.post('/messages', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  markRead: async (userId) => {
    const response = await axiosInstance.patch(`/messages/${userId}/read`);
    return response.data;
  },
};
