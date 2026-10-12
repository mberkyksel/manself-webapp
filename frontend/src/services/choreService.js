import { api } from './api.js';

export const choreService = {
  get: () => api.get('/chores').then((res) => res.data),
  save: (state) => api.put('/chores', state).then((res) => res.data),
};
