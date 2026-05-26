import axiosInstance from '../config/axiosConfig';

export const libraryService = {
  getItems: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/library${query ? `?${query}` : ''}`);
    return response.data;
  },

  createItem: async (data) => {
    const response = await axiosInstance.post('/library', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateItem: async (id, data) => {
    const response = await axiosInstance.put(`/library/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await axiosInstance.delete(`/library/${id}`);
    return response.data;
  },

  toggleCompleteItem: async (id) => {
    const response = await axiosInstance.patch(`/library/${id}/toggle-complete`);
    return response.data;
  }
};
