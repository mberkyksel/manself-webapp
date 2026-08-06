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

// /auth/login and /auth/register are the only endpoints that legitimately
// 401 without an existing session (wrong credentials) - everywhere else a
// 401 means a previously-valid token died mid-session (expired/invalid),
// which needs a real logout + redirect, not just clearing localStorage.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => error.config?.url?.includes(path));

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Dynamic imports (not static ones) so this module never has to
      // import the store/router at load time and risk a circular
      // dependency (api.js <- authService.js <- userStore.js -> api.js,
      // and router/index.js -> userStore.js). By the time a request can
      // actually fail, the app is already fully bootstrapped, so these
      // resolve instantly from the module cache.
      const [{ useUserStore }, { default: router }] = await Promise.all([
        import('../stores/userStore.js'),
        import('../router/index.js'),
      ]);

      useUserStore().clearSession();

      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login', query: { sessionExpired: '1' } });
      }
    }

    return Promise.reject(error);
  }
);
