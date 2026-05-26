import axiosInstance from '../config/axiosConfig';

export const programService = {
  createProgram: async (data) => {
    const res = await axiosInstance.post('/programs', data);
    return res.data;
  },
  getPrograms: async () => {
    const res = await axiosInstance.get('/programs');
    return res.data;
  },
  getProgramById: async (id) => {
    const res = await axiosInstance.get(`/programs/${id}`);
    return res.data;
  },
  updateProgram: async (id, data) => {
    const res = await axiosInstance.put(`/programs/${id}`, data);
    return res.data;
  },
  deleteProgram: async (id) => {
    const res = await axiosInstance.delete(`/programs/${id}`);
    return res.data;
  }
};
