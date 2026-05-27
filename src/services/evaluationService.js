import axiosInstance from '../config/axiosConfig';

export const evaluationService = {
  getEvaluations: async (params = {}) => (await axiosInstance.get('/evaluations', { params })).data,
  createEvaluation: async (payload) => (await axiosInstance.post('/evaluations', payload)).data,
  aiAnalysis: async (payload) => (await axiosInstance.post('/evaluations/ai-analysis', payload)).data,
};
