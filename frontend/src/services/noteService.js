import { api } from './api.js';

export const noteService = {
  list: () => api.get('/notes').then((res) => res.data),
  create: (payload) => api.post('/notes', payload).then((res) => res.data),
  update: (id, payload) => api.patch(`/notes/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/notes/${id}`),
};
