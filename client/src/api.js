import axios from 'axios';

const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '');

const rawApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000');
const apiBaseUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  ssoEmployee: (data) => api.post('/auth/sso/employee', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout', {}, { withCredentials: true })
};

export const employeeApi = {
  createRequest: (formData) => api.post('/employee/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getRequests: () => api.get('/employee/requests'),
  updateRequest: (id, formData) => api.patch(`/employee/requests/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

export const managerApi = {
  getRequests: () => api.get('/manager/requests'),
  approve: (id, payload) => api.post(`/manager/requests/${id}/approve`, payload),
  reject: (id, payload) => api.post(`/manager/requests/${id}/reject`, payload),
  comment: (id, payload) => api.post(`/manager/requests/${id}/comment`, payload)
};

export const frontDeskApi = {
  today: () => api.get('/frontdesk/today', {
    params: {
      tzOffsetMinutes: new Date().getTimezoneOffset()
    }
  }),
  scan: (payload) => api.post('/frontdesk/scan', payload),
  manual: (payload) => api.post('/frontdesk/manual', payload),
  checkIn: (id, payload) => api.post(`/frontdesk/requests/${id}/check-in`, payload),
  checkOut: (id, payload) => api.post(`/frontdesk/requests/${id}/check-out`, payload),
  noShow: (id, payload) => api.post(`/frontdesk/requests/${id}/no-show`, payload)
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  createUser: (payload) => api.post('/admin/users', payload),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (payload) => api.put('/admin/settings', payload),
  getLogs: (params) => api.get('/admin/logs', { params }),
  exportLogsUrl: `${apiBaseUrl}/admin/logs/export.csv`
};
