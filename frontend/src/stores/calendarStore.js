import { defineStore } from 'pinia';
import { calendarService } from '../services/calendarService.js';

// Mirrors taskStore.js so calendar events are shared reactive state instead
// of a ref local to CalendarView - anything reading calendarStore.events
// (e.g. WelcomeBanner's "today" counts, a task's linked-event badge) stays
// in sync with edits/links made from the calendar UI without a page refresh.
export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    events: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchEvents() {
      this.loading = true;
      this.error = null;
      try {
        this.events = await calendarService.list();
      } catch (err) {
        this.error = 'Could not load calendar events. Is the backend running?';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async addEvent(payload) {
      const event = await calendarService.create(payload);
      this.events.push(event);
      return event;
    },

    async updateEvent(id, payload) {
      const event = await calendarService.update(id, payload);
      const index = this.events.findIndex((e) => e.id === id);
      if (index !== -1) this.events[index] = event;
      return event;
    },

    async removeEvent(id) {
      const previous = this.events;
      this.events = this.events.filter((e) => e.id !== id);
      try {
        await calendarService.remove(id);
      } catch (err) {
        this.events = previous;
        console.error(err);
      }
    },
  },
});
