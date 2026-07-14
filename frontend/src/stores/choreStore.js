import { defineStore } from 'pinia';

const STORAGE_KEY = 'manself:chores';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error(err);
    return {};
  }
}

function saveToStorage(choresByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choresByDate));
}

export const useChoreStore = defineStore('chore', {
  state: () => ({
    choresByDate: loadFromStorage(),
  }),

  actions: {
    addChore(dateKey, chore) {
      const existing = this.choresByDate[dateKey] ?? [];
      this.choresByDate = { ...this.choresByDate, [dateKey]: [...existing, { ...chore, isDone: false }] };
      saveToStorage(this.choresByDate);
    },

    removeChore(dateKey, choreId) {
      const existing = this.choresByDate[dateKey];
      if (!existing) return;
      this.choresByDate = { ...this.choresByDate, [dateKey]: existing.filter((c) => c.id !== choreId) };
      saveToStorage(this.choresByDate);
    },

    toggleChoreDone(dateKey, choreId) {
      const existing = this.choresByDate[dateKey];
      if (!existing) return;
      this.choresByDate = {
        ...this.choresByDate,
        [dateKey]: existing.map((c) => (c.id === choreId ? { ...c, isDone: !c.isDone } : c)),
      };
      saveToStorage(this.choresByDate);
    },
  },
});
