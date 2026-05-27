import axiosInstance from '../config/axiosConfig';

export const certificateService = {
  getCertificates: async () => (await axiosInstance.get('/certificates')).data,
  getCertificate: async (id) => (await axiosInstance.get(`/certificates/${id}`)).data,
  generateCertificate: async (internshipId) => (await axiosInstance.post(`/certificates/generate/${internshipId}`)).data,
  approveCertificate: async (id) => (await axiosInstance.patch(`/certificates/${id}/approve`)).data,
  verifyCertificate: async (certificateNumber) => (await axiosInstance.get(`/certificates/verify/${certificateNumber}`)).data,
};
