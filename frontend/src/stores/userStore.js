import { defineStore } from 'pinia';

// Placeholder state until authentication (useAuth) is wired up — WelcomeBanner
// and ClockWidget read from here so they don't need to change when real user
// data replaces these defaults.
export const useUserStore = defineStore('user', {
  state: () => ({
    name: 'there',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: null,
  }),
});
