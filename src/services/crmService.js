import axiosInstance from '../config/axiosConfig';

export const crmService = {
  getLeads: async () => {
    const response = await axiosInstance.get('/crm/leads');
    return response.data;
  },
  createLead: async (data) => {
    const response = await axiosInstance.post('/crm/leads', data);
    return response.data;
  },
  updateLead: async (id, data) => {
    const response = await axiosInstance.put(`/crm/leads/${id}`, data);
    return response.data;
  },
  deleteLead: async (id) => {
    const response = await axiosInstance.delete(`/crm/leads/${id}`);
    return response.data;
  },
  updateLeadStatus: async (leadId, status) => {
    const response = await axiosInstance.patch(`/crm/leads/${leadId}/status`, { status });
    return response.data;
  },
  addNoteToLead: async (leadId, content) => {
    const response = await axiosInstance.post(`/crm/leads/${leadId}/notes`, { content });
    return response.data;
  },
  assignLead: async (leadId, advisorId) => {
    const response = await axiosInstance.patch(`/crm/leads/${leadId}/assign`, { advisorId });
    return response.data;
  }
};

