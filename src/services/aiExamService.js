import axiosInstance from '../config/axiosConfig';

const withQuery = (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  return `${path}${query ? `?${query}` : ''}`;
};

export const aiExamService = {
  getBlueprints: async (params = {}) => {
    const response = await axiosInstance.get(withQuery('/ai-exams/blueprints', params));
    return response.data;
  },

  createBlueprint: async (data) => {
    const response = await axiosInstance.post('/ai-exams/blueprints', data);
    return response.data;
  },

  updateBlueprint: async (id, data) => {
    const response = await axiosInstance.put(`/ai-exams/blueprints/${id}`, data);
    return response.data;
  },

  generateExam: async (data) => {
    const response = await axiosInstance.post('/ai-exams/generate', data);
    return response.data;
  },

  getGeneratedExams: async (params = {}) => {
    const response = await axiosInstance.get(withQuery('/ai-exams/generated', params));
    return response.data;
  },

  getGeneratedExam: async (id) => {
    const response = await axiosInstance.get(`/ai-exams/${id}`);
    return response.data;
  },

  approveGeneratedExam: async (id) => {
    const response = await axiosInstance.patch(`/ai-exams/${id}/approve`);
    return response.data;
  },

  regenerateSection: async (id, sectionKey, data = {}) => {
    const response = await axiosInstance.patch(`/ai-exams/${id}/regenerate-section/${sectionKey}`, data);
    return response.data;
  },

  getSessions: async (params = {}) => {
    const response = await axiosInstance.get(withQuery('/exam-sessions', params));
    return response.data;
  },

  getAvailableSessions: async () => {
    const response = await axiosInstance.get('/exam-sessions/available');
    return response.data;
  },

  createSession: async (data) => {
    const response = await axiosInstance.post('/exam-sessions', data);
    return response.data;
  },

  scheduleSession: async (id, data) => {
    const response = await axiosInstance.patch(`/exam-sessions/${id}/schedule`, data);
    return response.data;
  },

  launchSession: async (id) => {
    const response = await axiosInstance.patch(`/exam-sessions/${id}/launch`);
    return response.data;
  },

  closeSession: async (id) => {
    const response = await axiosInstance.patch(`/exam-sessions/${id}/close`);
    return response.data;
  },

  runCorrection: async (id) => {
    const response = await axiosInstance.patch(`/exam-sessions/${id}/run-correction`);
    return response.data;
  },

  releaseResults: async (id) => {
    const response = await axiosInstance.patch(`/exam-sessions/${id}/release-results`);
    return response.data;
  },

  startSession: async (id) => {
    const response = await axiosInstance.post(`/exam-sessions/${id}/start`);
    return response.data;
  },

  saveAttempt: async (attemptId, data) => {
    const response = await axiosInstance.patch(`/exam-attempts/${attemptId}/save`, data);
    return response.data;
  },

  submitAttempt: async (attemptId, data) => {
    const response = await axiosInstance.post(`/exam-attempts/${attemptId}/submit`, data);
    return response.data;
  },

  getAttemptResult: async (attemptId) => {
    const response = await axiosInstance.get(`/exam-attempts/${attemptId}/result`);
    return response.data;
  },
};
