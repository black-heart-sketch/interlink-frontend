import axiosInstance from '../config/axiosConfig';

export const userService = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/users${query ? `?${query}` : ''}`);
    return response.data;
  },

  createUser: async (data) => {
    const response = await axiosInstance.post('/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await axiosInstance.put(`/users/${id}`, data);
    return response.data;
  },

  validateUser: async (id) => {
    const response = await axiosInstance.patch(`/users/${id}/validate`);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (formData) => {
    const response = await axiosInstance.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
