import { defineStore } from 'pinia';
import { choreService } from '../services/choreService.js';
import { useToast } from '../composables/useToast.js';

// Chores used to live in the browser under one shared key ('manself:chores'),
// which let one account's chores (including the demo's) show up for the next
// account to use that browser. They are now stored per user on the server and
// that old key is never read again. It is not imported, because there is no
// telling whose chores it holds, and not deleted, because it may hold chores
// someone made themselves.

// Edits are saved shortly after the last one, so a burst (dragging, ticking
// several chores) becomes one request.
const SAVE_DELAY_MS = 400;

// How far ahead to keep occurrences materialized for each recurrence type,
// so the calendar always has upcoming badges without generating forever.
const RECURRENCE_WINDOW_DAYS = { daily: 30, weekly: 12 * 7 };
const RECURRENCE_STEP_DAYS = { daily: 1, weekly: 7 };

// Module-level because they belong to "the one pending save / load", not to
// state that should be reactive or serialized.
let saveTimer = null;
let lastSavedSnapshot = null;
// Bumped by every load() and reset(), so a response that arrives after the
// user signed out (or another sign-in began) is ignored instead of applied.
let generation = 0;

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
    choresByDate: {},
    recurringSeries: {},
    // False until the signed-in user's chores have been fetched. Nothing is
    // saved before then, so a failed or slow load can never overwrite the
    // server's copy with an empty one.
    loaded: false,
  }),

  actions: {
    snapshot() {
      return JSON.stringify({ choresByDate: this.choresByDate, recurringSeries: this.recurringSeries });
    },

    // Called after every change. Schedules a save; see flush().
    persist() {
      if (!this.loaded) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.flush(), SAVE_DELAY_MS);
    },

    // Saves right now (skipping the wait), but only if something changed since
    // the last successful save or load.
    async flush() {
      clearTimeout(saveTimer);
      saveTimer = null;
      if (!this.loaded) return;

      const snapshot = this.snapshot();
      if (snapshot === lastSavedSnapshot) return;
      try {
        await choreService.save(JSON.parse(snapshot));
        lastSavedSnapshot = snapshot;
      } catch (err) {
        console.error(err);
        useToast().error("Couldn't save your chores. Recent changes may be lost if you close this page.", {
          key: 'chores-save-failed',
        });
      }
    },

    // Fetches the signed-in user's chores. Called after every sign-in.
    async load() {
      const mine = ++generation;
      clearTimeout(saveTimer);
      saveTimer = null;
      this.loaded = false;

      try {
        const data = await choreService.get();
        if (mine !== generation) return;
        this.choresByDate = data.choresByDate ?? {};
        this.recurringSeries = data.recurringSeries ?? {};
        lastSavedSnapshot = this.snapshot();
        this.loaded = true;
      } catch (err) {
        if (mine !== generation) return;
        console.error(err);
        useToast().error("Couldn't load your chores. Reload the page to try again.", { key: 'chores-load-failed' });
        return;
      }

      // Fill in upcoming repeats; saves only if that actually changed anything.
      this.materializeSeries();
    },

    // Forgets everything held for the previous user. Called on sign-out and
    // whenever the session ends, so chores can never carry over to whoever
    // uses this browser next.
    reset() {
      generation += 1;
      clearTimeout(saveTimer);
      saveTimer = null;
      lastSavedSnapshot = null;
      this.choresByDate = {};
      this.recurringSeries = {};
      this.loaded = false;
    },

    addChore(dateKey, chore) {
      const existing = this.choresByDate[dateKey] ?? [];
      this.choresByDate = {
        ...this.choresByDate,
        [dateKey]: [...existing, { ...chore, isDone: false, seriesId: null }],
      };
      this.persist();
    },

    // Removing one occurrence of a recurring chore only skips that day: the
    // date is remembered on the series so materializeSeries doesn't refill it.
    removeChore(dateKey, choreId) {
      const existing = this.choresByDate[dateKey];
      if (!existing) return;
      const removed = existing.find((c) => c.id === choreId);
      this.choresByDate = { ...this.choresByDate, [dateKey]: existing.filter((c) => c.id !== choreId) };
      if (removed?.seriesId) this.setSeriesDateSkipped(removed.seriesId, dateKey, true);
      this.persist();
    },

    setSeriesDateSkipped(seriesId, dateKey, skipped) {
      const series = this.recurringSeries[seriesId];
      if (!series) return;
      const others = (series.skippedDateKeys ?? []).filter((k) => k !== dateKey);
      this.recurringSeries = {
        ...this.recurringSeries,
        [seriesId]: { ...series, skippedDateKeys: skipped ? [...others, dateKey] : others },
      };
    },

    // Puts back a chore exactly as it was (same id, done state and series)
    // at its old position in the day, for undoing a removal.
    restoreChore(dateKey, chore, index = Infinity) {
      const existing = this.choresByDate[dateKey] ?? [];
      if (existing.some((c) => c.id === chore.id)) return;
      const restored = [...existing];
      restored.splice(Math.min(index, restored.length), 0, chore);
      this.choresByDate = { ...this.choresByDate, [dateKey]: restored };
      if (chore.seriesId) this.setSeriesDateSkipped(chore.seriesId, dateKey, false);
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

    // Drops a series' not-yet-done occurrences after a given day, so a changed
    // repeat rule can regenerate them. Done ones are history and stay.
    dropOpenOccurrencesAfter(seriesId, dateKey) {
      const next = {};
      for (const [key, chores] of Object.entries(this.choresByDate)) {
        const kept = key > dateKey ? chores.filter((c) => c.seriesId !== seriesId || c.isDone) : chores;
        if (kept.length > 0) next[key] = kept;
      }
      this.choresByDate = next;
    },

    // Cycles a chore's repeat rule: none -> daily -> weekly -> none. Turning
    // it on starts a series anchored to this occurrence's date/type/state.
    // Switching between daily and weekly regenerates the upcoming occurrences
    // under the new rule (otherwise the old daily ones would linger for a
    // month); turning repeat off just stops future generation, it never
    // deletes occurrences that already exist (including this one).
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
      if (current !== 'none') this.dropOpenOccurrencesAfter(seriesId, dateKey);
      

      this.recurringSeries = {
        ...this.recurringSeries,
        [seriesId]: {
          ...this.recurringSeries[seriesId],
          type: chore.type,
          state: chore.state,
          recurrence: next,
          anchorDateKey: dateKey,
        },
      };
      this.choresByDate = {
        ...this.choresByDate,
        [dateKey]: this.choresByDate[dateKey].map((c) => (c.id === choreId ? { ...c, seriesId } : c)),
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

        // Days the user removed on purpose; dropping the past ones keeps the
        // list from growing forever, since only today onwards is generated.
        const todayKey = toDateKey(today);
        const skippedDates = new Set((series.skippedDateKeys ?? []).filter((k) => k >= todayKey));
        if (skippedDates.size !== (series.skippedDateKeys ?? []).length) {
          this.recurringSeries = {
            ...this.recurringSeries,
            [seriesId]: { ...series, skippedDateKeys: [...skippedDates] },
          };
        }

        const existingDates = new Set(
          Object.entries(this.choresByDate)
            .filter(([, chores]) => chores.some((c) => c.seriesId === seriesId))
            .map(([dateKey]) => dateKey)
        );

        const cursor = new Date(Math.max(anchorDate, today));
        while (cursor <= horizon) {
          const dateKey = toDateKey(cursor);
          if (!existingDates.has(dateKey) && !skippedDates.has(dateKey)) {
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
