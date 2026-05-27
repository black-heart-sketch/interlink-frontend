import axiosInstance from '../config/axiosConfig';

export const attendanceService = {
  getAttendance: async (params = {}) => {
    const response = await axiosInstance.get('/attendance', { params });
    return response.data;
  },
  checkIn: async (payload = {}) => {
    const response = await axiosInstance.post('/attendance/check-in', payload);
    return response.data;
  },
  checkOut: async (payload = {}) => {
    const response = await axiosInstance.post('/attendance/check-out', payload);
    return response.data;
  },
  markAttendance: async (payload) => {
    const response = await axiosInstance.post('/attendance/mark', payload);
    return response.data;
  },
};
