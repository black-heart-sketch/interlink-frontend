import axiosInstance from '../config/axiosConfig';

export const notificationService = {
  getNotifications: async () => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },
  markRead: async (id) => {
    const response = await axiosInstance.patch(`/notifications/${id}/read`);
    return response.data;
  },
};
