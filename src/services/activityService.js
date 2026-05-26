import axiosInstance from '../config/axiosConfig';

export const activityService = {
  getActivities: async () => {
    const response = await axiosInstance.get('/activities');
    return response.data;
  },
  
  createActivity: async (data) => {
    const response = await axiosInstance.post('/activities', data);
    return response.data;
  },
  
  deleteActivity: async (id) => {
    const response = await axiosInstance.delete(`/activities/${id}`);
    return response.data;
  }
};
