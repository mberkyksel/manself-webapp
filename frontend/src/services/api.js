import axios from 'axios';

// Requests to /api/* are proxied to the backend by Vite in development
// (see vite.config.js) and served from the same origin once deployed.
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});
