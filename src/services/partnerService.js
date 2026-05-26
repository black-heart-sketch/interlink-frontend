import axiosInstance from '../config/axiosConfig';

export const partnerService = {
  createPartner: async (data) => {
    const res = await axiosInstance.post('/partners', data);
    return res.data;
  },
  getPartners: async () => {
    const res = await axiosInstance.get('/partners');
    return res.data;
  },
  getPartnerById: async (id) => {
    const res = await axiosInstance.get(`/partners/${id}`);
    return res.data;
  },
  updatePartner: async (id, data) => {
    const res = await axiosInstance.put(`/partners/${id}`, data);
    return res.data;
  },
  deletePartner: async (id) => {
    const res = await axiosInstance.delete(`/partners/${id}`);
    return res.data;
  }
};
