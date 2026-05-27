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

export const studentProjectService = {
  getProjects: async (params = {}) => {
    const response = await axiosInstance.get('/student-projects', { params });
    return response.data;
  },

  getProject: async (id) => {
    const response = await axiosInstance.get(`/student-projects/${id}`);
    return response.data;
  },

  createProject: async (payload) => {
    const response = await axiosInstance.post('/student-projects', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  validateProject: async (id, payload) => {
    const response = await axiosInstance.patch(`/student-projects/${id}/validate`, payload);
    return response.data;
  },

  updateTimelineItem: async (projectId, itemId, payload) => {
    const response = await axiosInstance.patch(`/student-projects/${projectId}/timeline/${itemId}`, payload);
    return response.data;
  },
};
