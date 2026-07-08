import { api } from './api.js';

export const calendarService = {
  list: () => api.get('/calendar-events').then((res) => res.data),
  create: (payload) => api.post('/calendar-events', payload).then((res) => res.data),
  update: (id, payload) => api.patch(`/calendar-events/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/calendar-events/${id}`),
};
