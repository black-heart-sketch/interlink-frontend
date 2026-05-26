import axiosInstance from '../config/axiosConfig';

export const mediaService = {
  getMedia: async (type = '') => {
    const response = await axiosInstance.get(`/media${type ? `?type=${type}` : ''}`);
    return response.data;
  },
  
  createMedia: async (data) => {
    const response = await axiosInstance.post('/media', data);
    return response.data;
  },
  
  deleteMedia: async (id) => {
    const response = await axiosInstance.delete(`/media/${id}`);
    return response.data;
  }
};
