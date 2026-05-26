import axiosInstance from '../config/axiosConfig';

export const settingService = {
  getPublicSettings: async () => {
    const response = await axiosInstance.get('/settings/public');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosInstance.put('/settings', data);
    return response.data;
  }
};
