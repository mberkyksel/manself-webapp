import { defineStore } from 'pinia';
import { authService } from '../services/authService.js';
import { TOKEN_STORAGE_KEY } from '../services/api.js';
import { useChoreStore } from './choreStore.js';

// Centralized auth state. token/user are only ever written by the actions
// below (setSession/clearSession) - components call login()/register()/
// logout() and read the results, they never assign store state directly.
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_STORAGE_KEY),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    // Fall back to the pre-auth placeholder defaults so WelcomeBanner/
    // ClockWidget keep working unchanged while logged out.
    name: (state) => state.user?.name ?? 'there',
    timezone: (state) => state.user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: (state) => state.user?.location ?? null,
    isDemo: (state) => Boolean(state.user?.isDemo),
  },

  actions: {
    setSession(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    },

    clearSession() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    },

    async register({ name, email, password, timezone }) {
      this.loading = true;
      this.error = null;
      try {
        const { token, user } = await authService.register({ name, email, password, timezone });
        this.setSession(token, user);
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Could not register.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async login({ email, password }) {
      this.loading = true;
      this.error = null;
      try {
        const { token, user } = await authService.login({ email, password });
        this.setSession(token, user);
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Invalid email or password.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // One-click login to the shared demo account. The server resets the
    // account's tasks/events/notes on every call; chores are browser-local,
    // so they get reseeded here.
    async loginAsDemo() {
      this.loading = true;
      this.error = null;
      try {
        const { token, user } = await authService.demoLogin();
        useChoreStore().loadDemoChores();
        this.setSession(token, user);
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Could not start the demo.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // Re-validates a token restored from localStorage on app boot, and
    // refreshes `user` since only the token itself is persisted.
    async fetchCurrentUser() {
      if (!this.token) return;
      try {
        const { user } = await authService.me();
        this.user = user;
      } catch {
        this.clearSession();
      }
    },

    async updatePassword({ currentPassword, newPassword }) {
      this.loading = true;
      this.error = null;
      try {
        const { user } = await authService.updatePassword({ currentPassword, newPassword });
        this.user = user;
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Could not update password.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // Takes any of { name, location }; only the given fields are changed.
    async updateProfile(changes) {
      this.loading = true;
      this.error = null;
      try {
        const { user } = await authService.updateProfile(changes);
        this.user = user;
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Could not update profile.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async updateEmail({ newEmail, currentPassword }) {
      this.loading = true;
      this.error = null;
      try {
        // A fresh token comes back too (the old one's email claim would
        // otherwise go stale), so this re-runs setSession like login/register.
        const { token, user } = await authService.updateEmail({ newEmail, currentPassword });
        this.setSession(token, user);
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Could not update email.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async deleteAccount({ currentPassword }) {
      this.loading = true;
      this.error = null;
      try {
        await authService.deleteAccount({ currentPassword });
        this.clearSession();
        return true;
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Could not delete account.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.clearSession();
    },
  },
});
