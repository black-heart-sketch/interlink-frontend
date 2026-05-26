import axiosInstance from '../config/axiosConfig';

export const testimonialService = {
  createTestimonial: async (data) => {
    const res = await axiosInstance.post('/testimonials', data);
    return res.data;
  },
  getTestimonials: async () => {
    const res = await axiosInstance.get('/testimonials');
    return res.data;
  },
  getTestimonialById: async (id) => {
    const res = await axiosInstance.get(`/testimonials/${id}`);
    return res.data;
  },
  updateTestimonial: async (id, data) => {
    const res = await axiosInstance.put(`/testimonials/${id}`, data);
    return res.data;
  },
  deleteTestimonial: async (id) => {
    const res = await axiosInstance.delete(`/testimonials/${id}`);
    return res.data;
  }
};
