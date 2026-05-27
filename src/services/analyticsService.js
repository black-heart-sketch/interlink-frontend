import axiosInstance from '../config/axiosConfig';

export const analyticsService = {
  getAnalytics: async () => (await axiosInstance.get('/analytics')).data,
  getMyPortfolio: async () => (await axiosInstance.get('/analytics/portfolio/me')).data,
  getPortfolio: async (internId) => (await axiosInstance.get(`/analytics/portfolio/${internId}`)).data,
};
