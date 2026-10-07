import { api } from './api.js';

export const configService = {
  get: () => api.get('/config').then((res) => res.data),
};
