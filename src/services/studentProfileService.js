import axiosInstance from '../config/axiosConfig';

export const studentProfileService = {
  createProfile: async (data) => {
    const res = await axiosInstance.post('/student-profiles', data);
    return res.data;
  },
  getProfiles: async () => {
    const res = await axiosInstance.get('/student-profiles');
    return res.data;
  },
  getProfileById: async (id) => {
    const res = await axiosInstance.get(`/student-profiles/${id}`);
    return res.data;
  },
  getMyProfile: async () => {
    const res = await axiosInstance.get('/student-profiles/me');
    return res.data;
  },
  updateProfile: async (id, data) => {
    const res = await axiosInstance.put(`/student-profiles/${id}`, data);
    return res.data;
  },
  deleteProfile: async (id) => {
    const res = await axiosInstance.delete(`/student-profiles/${id}`);
    return res.data;
  }
};
