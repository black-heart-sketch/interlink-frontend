import axiosInstance from '../config/axiosConfig';

const toFormData = (payload = {}) => {
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'attachments') return;
    if (value !== undefined && value !== null) data.append(key, value);
  });

  Array.from(payload.attachments || []).forEach((file) => {
    data.append('attachments', file);
  });

  return data;
};

export const reportService = {
  getReports: async (params = {}) => {
    const response = await axiosInstance.get('/reports', { params });
    return response.data;
  },

  getReport: async (id) => {
    const response = await axiosInstance.get(`/reports/${id}`);
    return response.data;
  },

  createReport: async (payload) => {
    const response = await axiosInstance.post('/reports', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateReport: async (id, payload) => {
    const response = await axiosInstance.patch(`/reports/${id}`, toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  reviewReport: async (id, payload) => {
    const response = await axiosInstance.patch(`/reports/${id}/review`, payload);
    return response.data;
  },

  generateAiReport: async (payload) => {
    const response = await axiosInstance.post('/reports/generate-ai', payload);
    return response.data;
  },
};
