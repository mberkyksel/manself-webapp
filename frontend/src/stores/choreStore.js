import { defineStore } from 'pinia';
import { CHORE_TYPES } from '../constants/chores.js';

const STORAGE_KEY = 'manself:chores';

// How far ahead to keep occurrences materialized for each recurrence type,
// so the calendar always has upcoming badges without generating forever.
const RECURRENCE_WINDOW_DAYS = { daily: 30, weekly: 12 * 7 };
const RECURRENCE_STEP_DAYS = { daily: 1, weekly: 7 };

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    // Older saves stored choresByDate directly at the top level; fall back
    // to that shape so existing local data isn't dropped on upgrade.
    return {
      choresByDate: parsed.choresByDate ?? parsed ?? {},
      recurringSeries: parsed.recurringSeries ?? {},
    };
  } catch (err) {
    console.error(err);
    return { choresByDate: {}, recurringSeries: {} };
  }
}

function saveToStorage(choresByDate, recurringSeries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ choresByDate, recurringSeries }));
}

function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const useChoreStore = defineStore('chore', {
  state: () => ({
    ...loadFromStorage(),
  }),

  actions: {
    persist() {
      saveToStorage(this.choresByDate, this.recurringSeries);
    },

    addChore(dateKey, chore) {
      const existing = this.choresByDate[dateKey] ?? [];
      this.choresByDate = {
        ...this.choresByDate,
        [dateKey]: [...existing, { ...chore, isDone: false, seriesId: null }],
      };
      this.persist();
    },

    removeChore(dateKey, choreId) {
      const existing = this.choresByDate[dateKey];
      if (!existing) return;
      this.choresByDate = { ...this.choresByDate, [dateKey]: existing.filter((c) => c.id !== choreId) };
      this.persist();
    },

    // Puts back a chore exactly as it was (same id, done state and series)
    // at its old position in the day, for undoing a removal.
    restoreChore(dateKey, chore, index = Infinity) {
      const existing = this.choresByDate[dateKey] ?? [];
      if (existing.some((c) => c.id === chore.id)) return;
      const restored = [...existing];
      restored.splice(Math.min(index, restored.length), 0, chore);
      this.choresByDate = { ...this.choresByDate, [dateKey]: restored };
      this.persist();
    },

    toggleChoreDone(dateKey, choreId) {
      const existing = this.choresByDate[dateKey];
      if (!existing) return;
      this.choresByDate = {
        ...this.choresByDate,
        [dateKey]: existing.map((c) => (c.id === choreId ? { ...c, isDone: !c.isDone } : c)),
      };
      this.persist();
    },

    // Chores only live in this browser (localStorage), so unlike tasks/events/
    // notes the server can't seed them for the demo account - the demo login
    // calls this instead. Today is deliberately one chore short of done, so
    // finishing the last one shows off the celebration.
    loadDemoChores() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const keyFor = (offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return toDateKey(d);
      };
      const chore = (type, { state = null, isDone = false } = {}) => ({
        id: crypto.randomUUID(),
        type,
        state,
        isDone,
        seriesId: null,
      });

      this.choresByDate = {
        [keyFor(0)]: [
          chore(CHORE_TYPES.SWEEP, { isDone: true }),
          chore(CHORE_TYPES.GROCERIES, { isDone: true }),
          chore(CHORE_TYPES.LAUNDRY, { state: 'colors' }),
        ],
        [keyFor(1)]: [chore(CHORE_TYPES.PLANTS)],
        [keyFor(2)]: [chore(CHORE_TYPES.MOP)],
        [keyFor(3)]: [chore(CHORE_TYPES.MEALS, { state: 'prep' })],
      };
      this.recurringSeries = {
        [crypto.randomUUID()]: {
          type: CHORE_TYPES.TRASH,
          state: 'grey',
          recurrence: 'weekly',
          anchorDateKey: keyFor(2),
        },
      };
      this.materializeSeries();
    },

    // Cycles a chore's repeat rule: none -> daily -> weekly -> none. Turning
    // it on starts a series anchored to this occurrence's date/type/state;
    // turning it off just stops future generation, it never deletes
    // occurrences that already exist (including this one).
    cycleChoreRecurrence(dateKey, choreId) {
      const dayChores = this.choresByDate[dateKey];
      const chore = dayChores?.find((c) => c.id === choreId);
      if (!chore) return;

      const NEXT = { none: 'daily', daily: 'weekly', weekly: 'none' };
      const current = chore.seriesId ? (this.recurringSeries[chore.seriesId]?.recurrence ?? 'none') : 'none';
      const next = NEXT[current];

      if (next === 'none') {
        if (chore.seriesId) delete this.recurringSeries[chore.seriesId];
        this.recurringSeries = { ...this.recurringSeries };
        this.persist();
        return;
      }

      const seriesId = chore.seriesId ?? crypto.randomUUID();
      this.recurringSeries = {
        ...this.recurringSeries,
        [seriesId]: { type: chore.type, state: chore.state, recurrence: next, anchorDateKey: dateKey },
      };
      this.choresByDate = {
        ...this.choresByDate,
        [dateKey]: dayChores.map((c) => (c.id === choreId ? { ...c, seriesId } : c)),
      };
      this.materializeSeries();
    },

    // Fills in future occurrences for every active series up to its
    // recurrence window, without duplicating a date that's already there or
    // touching the done/removed state of occurrences that already exist.
    materializeSeries() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const [seriesId, series] of Object.entries(this.recurringSeries)) {
        const step = RECURRENCE_STEP_DAYS[series.recurrence];
        const windowDays = RECURRENCE_WINDOW_DAYS[series.recurrence];
        if (!step || !windowDays) continue;

        const anchorDate = parseDateKey(series.anchorDateKey);
        const horizon = new Date(today);
        horizon.setDate(horizon.getDate() + windowDays);

        const existingDates = new Set(
          Object.entries(this.choresByDate)
            .filter(([, chores]) => chores.some((c) => c.seriesId === seriesId))
            .map(([dateKey]) => dateKey)
        );

        const cursor = new Date(Math.max(anchorDate, today));
        while (cursor <= horizon) {
          const dateKey = toDateKey(cursor);
          if (!existingDates.has(dateKey)) {
            const existing = this.choresByDate[dateKey] ?? [];
            this.choresByDate = {
              ...this.choresByDate,
              [dateKey]: [
                ...existing,
                {
                  id: crypto.randomUUID(),
                  type: series.type,
                  state: series.state,
                  isDone: false,
                  seriesId,
                },
              ],
            };
          }
          cursor.setDate(cursor.getDate() + step);
        }
      }

      this.persist();
    },
  },
});
