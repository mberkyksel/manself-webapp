import { api } from './api.js';

export const taskService = {
  list: () => api.get('/tasks').then((res) => res.data),
  create: (payload) => api.post('/tasks', payload).then((res) => res.data),
  update: (id, payload) => api.patch(`/tasks/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/tasks/${id}`),
};
