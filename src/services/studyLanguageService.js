import axiosInstance from '../config/axiosConfig';

export const studyLanguageService = {
  getLanguages: async (activeOnly = false) => {
    const response = await axiosInstance.get(`/study-languages${activeOnly ? '?activeOnly=true' : ''}`);
    return response.data;
  },

  createLanguage: async (data) => {
    const response = await axiosInstance.post('/study-languages', data);
    return response.data;
  },

  updateLanguage: async (id, data) => {
    const response = await axiosInstance.put(`/study-languages/${id}`, data);
    return response.data;
  },

  deleteLanguage: async (id) => {
    const response = await axiosInstance.delete(`/study-languages/${id}`);
    return response.data;
  }
};
