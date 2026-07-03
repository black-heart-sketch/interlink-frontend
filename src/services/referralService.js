import axiosInstance from '../config/axiosConfig';

export const referralService = {
  async getCodes() {
    const response = await axiosInstance.get('/referrals');
    return response.data;
  },

  async getStats() {
    const response = await axiosInstance.get('/referrals/stats');
    return response.data;
  },

  async createCode(payload) {
    const response = await axiosInstance.post('/referrals', payload);
    return response.data;
  },

  async updateCode(id, payload) {
    const response = await axiosInstance.put(`/referrals/${id}`, payload);
    return response.data;
  },

  async deleteCode(id) {
    const response = await axiosInstance.delete(`/referrals/${id}`);
    return response.data;
  },
};
