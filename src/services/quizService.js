import axiosInstance from '../config/axiosConfig';

export const quizService = {
  // Retrieve quiz associated with a specific library resource
  getQuiz: async (itemId) => {
    const response = await axiosInstance.get(`/quizzes/item/${itemId}`);
    return response.data;
  },

  // Submit and grade MCQ answers for an item
  submitQuiz: async (itemId, answers) => {
    const response = await axiosInstance.post(`/quizzes/item/${itemId}/submit`, { answers });
    return response.data;
  },

  // Create or update a quiz (Teacher/Admin scope)
  createQuiz: async (quizData) => {
    const response = await axiosInstance.post('/quizzes', quizData);
    return response.data;
  }
};
