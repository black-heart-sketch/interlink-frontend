import axiosInstance from '../config/axiosConfig';

export const publicService = {
  // Get all published programs
  getPrograms: async () => {
    const response = await axiosInstance.get('/public/programs');
    return response.data;
  },

  // Get a specific program by slug
  getProgramBySlug: async (slug) => {
    const response = await axiosInstance.get(`/public/programs/${slug}`);
    return response.data;
  },

  // Get active partners
  getPartners: async () => {
    const response = await axiosInstance.get('/public/partners');
    return response.data;
  },

  // Get verified testimonials
  getTestimonials: async () => {
    const response = await axiosInstance.get('/public/testimonials');
    return response.data;
  },

  // Get published events
  getEvents: async () => {
    const response = await axiosInstance.get('/public/events');
    return response.data;
  },

  // Get live gallery
  getGallery: async () => {
    const response = await axiosInstance.get('/public/gallery');
    return response.data;
  },

  // Submit contact/admission form
  submitContactForm: async (formData) => {
    const response = await axiosInstance.post('/public/contact', formData);
    return response.data;
  }
};
