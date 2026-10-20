import { defineStore } from 'pinia';
import { choreService } from '../services/choreService.js';
import { useToast } from '../composables/useToast.js';
import { describeRule, normalizeRule, occursOn, parseDateKey, sameRule, toDateKey } from '../utils/recurrence.js';

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
const RECURRENCE_WINDOW_DAYS = { daily: 30, weekly: 12 * 7, monthly: 366 };

// Module-level because they belong to "the one pending save / load", not to
// state that should be reactive or serialized.
let saveTimer = null;
let lastSavedSnapshot = null;
// Bumped by every load() and reset(), so a response that arrives after the
// user signed out (or another sign-in began) is ignored instead of applied.
let generation = 0;

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

    // The repeat rule of the series a chore belongs to, or null when it
    // doesn't repeat.
    repeatRuleOf(chore) {
      const series = chore.seriesId ? this.recurringSeries[chore.seriesId] : null;
      return series ? normalizeRule(series, series.anchorDateKey) : null;
    },

    // "Every Tuesday" and the like for a chore that repeats, otherwise null.
    repeatLabelOf(chore) {
      const rule = this.repeatRuleOf(chore);
      return rule ? describeRule(rule, this.recurringSeries[chore.seriesId].anchorDateKey) : null;
    },

    // Sets how a chore repeats: `rule` is { recurrence, interval, weekdays? }
    // (see utils/recurrence.js), or null to stop repeating. Turning it on starts
    // a series counting from this occurrence's date and carrying its type and
    // state. Changing the rule of a series regenerates its upcoming
    // occurrences from this day on (otherwise the old ones would linger);
    // turning repeat off just stops future generation, it never deletes
    // occurrences that already exist (including this one).
    setChoreRepeat(dateKey, choreId, rule) {
      const chore = this.choresByDate[dateKey]?.find((c) => c.id === choreId);
      if (!chore) return;

      const next = normalizeRule(rule, dateKey);
      const existing = chore.seriesId ? this.recurringSeries[chore.seriesId] : null;

      if (!next) {
        if (existing) {
          const { [chore.seriesId]: _removed, ...rest } = this.recurringSeries;
          this.recurringSeries = rest;
          this.persist();
        }
        return;
      }

      // Picking what is already set (and this day is part of it) changes nothing.
      const current = existing && normalizeRule(existing, existing.anchorDateKey);
      if (current && sameRule(current, next) && occursOn(current, existing.anchorDateKey, dateKey)) return;

      const seriesId = chore.seriesId ?? crypto.randomUUID();
      if (existing) this.dropOpenOccurrencesAfter(seriesId, dateKey);

      this.recurringSeries = {
        ...this.recurringSeries,
        [seriesId]: {
          type: chore.type,
          state: chore.state,
          ...next,
          anchorDateKey: dateKey,
          ...(existing?.skippedDateKeys ? { skippedDateKeys: existing.skippedDateKeys } : {}),
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
        const rule = normalizeRule(series, series.anchorDateKey);
        if (!rule) continue;

        const anchorDate = parseDateKey(series.anchorDateKey);
        const horizon = new Date(today);
        horizon.setDate(horizon.getDate() + RECURRENCE_WINDOW_DAYS[rule.recurrence]);

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
        for (; cursor <= horizon; cursor.setDate(cursor.getDate() + 1)) {
          const dateKey = toDateKey(cursor);
          if (existingDates.has(dateKey) || skippedDates.has(dateKey) || !occursOn(rule, series.anchorDateKey, dateKey)) continue;

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
      }

      this.persist();
    },
  },
});
