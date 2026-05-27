import axiosInstance from '../config/axiosConfig';

export const interlinkAiService = {
  generateReport: async (payload) => {
    const response = await axiosInstance.post('/ai/generate-report', payload);
    return response.data;
  },
  reviewReport: async (payload) => {
    const response = await axiosInstance.post('/ai/review-report', payload);
    return response.data;
  },
  taskSuggestions: async (payload) => {
    const response = await axiosInstance.post('/ai/task-suggestions', payload);
    return response.data;
  },
  performanceAnalysis: async (payload) => {
    const response = await axiosInstance.post('/ai/performance-analysis', payload);
    return response.data;
  },
  finalSummary: async (payload) => {
    const response = await axiosInstance.post('/ai/final-summary', payload);
    return response.data;
  },
  chat: async (payload) => {
    const response = await axiosInstance.post('/ai/chat', payload);
    return response.data;
  },
};
