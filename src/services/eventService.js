import axiosInstance from '../config/axiosConfig';

export const eventService = {
  getEvents: async (type = '') => {
    const response = await axiosInstance.get(`/events${type ? `?type=${type}` : ''}`);
    return response.data;
  },
  
  createEvent: async (data) => {
    const response = await axiosInstance.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  
  updateEvent: async (id, data) => {
    const response = await axiosInstance.put(`/events/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  
  deleteEvent: async (id) => {
    const response = await axiosInstance.delete(`/events/${id}`);
    return response.data;
  }
};
