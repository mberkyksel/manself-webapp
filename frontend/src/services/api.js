import axios from 'axios';

// localStorage (not the Pinia store) is the source of truth for the token
// here, so this module never has to import the store and risk a circular
// dependency (api.js <- authService.js <- userStore.js -> api.js).
export const TOKEN_STORAGE_KEY = 'manself_token';

// Requests to /api/* are proxied to the backend by Vite in development
// (see vite.config.js) and served from the same origin once deployed.
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Clears a stale/expired token so the next route navigation's auth
    // guard correctly treats the user as logged out.
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);
