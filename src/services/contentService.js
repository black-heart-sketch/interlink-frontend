import axiosInstance from '../config/axiosConfig';

const form = (payload) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'image') return;
    if (value !== undefined && value !== null) fd.append(key, Array.isArray(value) ? value.join(',') : value);
  });
  if (payload.image) fd.append('image', payload.image);
  return fd;
};

const api = (base) => ({
  list: async () => (await axiosInstance.get(`/content/${base}`)).data,
  create: async (payload) => (await axiosInstance.post(`/content/${base}`, form(payload), { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  update: async (id, payload) => (await axiosInstance.put(`/content/${base}/${id}`, form(payload), { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  remove: async (id) => (await axiosInstance.delete(`/content/${base}/${id}`)).data,
});

export const serviceContentService = api('services');
export const projectContentService = api('projects');
