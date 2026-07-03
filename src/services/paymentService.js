import axiosInstance from '../config/axiosConfig';

export const paymentService = {
  createPayment: async (data) => {
    console.log('[PaymentService] Creating payment with data:', data);
    try {
      const res = await axiosInstance.post('/payments', data);
      console.log('[PaymentService] Payment created successfully:', res.data);
      return res.data;
    } catch (error) {
      console.error('[PaymentService] Error creating payment:', error);
      throw error;
    }
  },
  getPayments: async () => {
    console.log('[PaymentService] Fetching all payments...');
    try {
      const res = await axiosInstance.get('/payments');
      console.log(`[PaymentService] Successfully fetched ${res.data?.length || 0} payments.`);
      return res.data;
    } catch (error) {
      console.error('[PaymentService] Error fetching payments:', error);
      throw error;
    }
  },
  getMyInternshipSummary: async () => {
    const res = await axiosInstance.get('/payments/internship/me');
    return res.data;
  },
  payInternshipInstallment: async (data = {}) => {
    const res = await axiosInstance.post('/payments/internship/installment', data);
    return res.data;
  },
  getPaymentById: async (id) => {
    console.log(`[PaymentService] Fetching payment detail for ID: ${id}`);
    try {
      const res = await axiosInstance.get(`/payments/${id}`);
      console.log(`[PaymentService] Successfully fetched payment detail for ID: ${id}`, res.data);
      return res.data;
    } catch (error) {
      console.error(`[PaymentService] Error fetching payment ID ${id}:`, error);
      throw error;
    }
  },
  updatePayment: async (id, data) => {
    console.log(`[PaymentService] Updating payment ID: ${id} with data:`, data);
    try {
      const res = await axiosInstance.put(`/payments/${id}`, data);
      console.log(`[PaymentService] Payment ID: ${id} updated successfully:`, res.data);
      return res.data;
    } catch (error) {
      console.error(`[PaymentService] Error updating payment ID ${id}:`, error);
      throw error;
    }
  },
  deletePayment: async (id) => {
    console.log(`[PaymentService] Deleting payment ID: ${id}`);
    try {
      const res = await axiosInstance.delete(`/payments/${id}`);
      console.log(`[PaymentService] Payment ID: ${id} deleted successfully.`);
      return res.data;
    } catch (error) {
      console.error(`[PaymentService] Error deleting payment ID ${id}:`, error);
      throw error;
    }
  }
};
