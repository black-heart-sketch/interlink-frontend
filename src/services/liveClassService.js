import axiosInstance from '../config/axiosConfig';

export const liveClassService = {
  getLiveClasses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/live-classes${query ? `?${query}` : ''}`);
    return response.data;
  },

  createLiveClass: async (data) => {
    const response = await axiosInstance.post('/live-classes', data);
    return response.data;
  },

  updateLiveClass: async (id, data) => {
    const response = await axiosInstance.put(`/live-classes/${id}`, data);
    return response.data;
  },

  deleteLiveClass: async (id) => {
    const response = await axiosInstance.delete(`/live-classes/${id}`);
    return response.data;
  }
};
