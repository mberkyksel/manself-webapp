import { api } from './api.js';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  demoLogin: () => api.post('/auth/demo').then((res) => res.data),
  me: () => api.get('/auth/me').then((res) => res.data),
  updatePassword: (payload) => api.patch('/auth/password', payload).then((res) => res.data),
  updateProfile: (payload) => api.patch('/auth/profile', payload).then((res) => res.data),
  updateEmail: (payload) => api.patch('/auth/email', payload).then((res) => res.data),
  deleteAccount: (payload) => api.delete('/auth/account', { data: payload }).then((res) => res.data),
};
