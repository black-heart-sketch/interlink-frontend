import axiosInstance from '../config/axiosConfig';

export const paymentService = {
  createPayment: async (data) => {
    const res = await axiosInstance.post('/payments', data);
    return res.data;
  },
  getPayments: async () => {
    const res = await axiosInstance.get('/payments');
    return res.data;
  },
  getPaymentById: async (id) => {
    const res = await axiosInstance.get(`/payments/${id}`);
    return res.data;
  },
  updatePayment: async (id, data) => {
    const res = await axiosInstance.put(`/payments/${id}`, data);
    return res.data;
  },
  deletePayment: async (id) => {
    const res = await axiosInstance.delete(`/payments/${id}`);
    return res.data;
  }
};
