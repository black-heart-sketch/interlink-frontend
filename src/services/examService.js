import axiosInstance from '../config/axiosConfig';

export const examService = {
  getExams: async () => {
    const response = await axiosInstance.get('/exams');
    return response.data;
  },

  startAttempt: async (examId) => {
    const response = await axiosInstance.post(`/exams/${examId}/start`);
    return response.data; // { exam, attempt }
  },

  submitAttempt: async (examId, answers) => {
    const response = await axiosInstance.post(`/exams/${examId}/submit`, { answers });
    return response.data;
  },

  // Admin routes
  createExam: async (examData) => {
    const response = await axiosInstance.post('/exams', examData);
    return response.data;
  },
  
  updateExam: async (id, examData) => {
    const response = await axiosInstance.put(`/exams/${id}`, examData);
    return response.data;
  },
  
  deleteExam: async (id) => {
    const response = await axiosInstance.delete(`/exams/${id}`);
    return response.data;
  }
};
