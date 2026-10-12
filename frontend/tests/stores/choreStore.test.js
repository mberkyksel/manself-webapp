import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { CHORE_TYPES } from '../../src/constants/chores.js';

const service = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('../../src/services/choreService.js', () => ({ choreService: service }));

const { useChoreStore } = await import('../../src/stores/choreStore.js');
const { useToast } = await import('../../src/composables/useToast.js');

// Local noon on Wed 7 Oct 2026, so "today" is deterministic.
const TODAY = '2026-10-07';

function keyFor(offsetDays) {
  const d = new Date(2026, 9, 7 + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function occurrences(store, seriesId) {
  return Object.entries(store.choresByDate)
    .filter(([, chores]) => chores.some((c) => c.seriesId === seriesId))
    .map(([dateKey]) => dateKey)
    .sort();
}

const DAILY = { recurrence: 'daily', interval: 1 };
// TODAY is a Wednesday (getDay() === 3).
const WEEKLY = { recurrence: 'weekly', interval: 1, weekdays: [3] };

// Builds a series the way the repeat menu does, from a chore added on TODAY.
function startSeries(store, rule) {
  store.addChore(TODAY, { id: 'c1', type: CHORE_TYPES.TRASH, state: 'grey' });
  store.setChoreRepeat(TODAY, 'c1', rule === 'weekly' ? WEEKLY : DAILY);
  return Object.keys(store.recurringSeries)[0];
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12, 0, 0));
  localStorage.clear();
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('basic chores', () => {
  it('adds a chore as not done', () => {
    const store = useChoreStore();
    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.LAUNDRY, state: 'colors' });

    expect(store.choresByDate[TODAY]).toEqual([
      { id: 'a', type: 'laundry', state: 'colors', isDone: false, seriesId: null },
    ]);
  });

  it('toggles done on and off', () => {
    const store = useChoreStore();
    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });

    store.toggleChoreDone(TODAY, 'a');
    expect(store.choresByDate[TODAY][0].isDone).toBe(true);
    store.toggleChoreDone(TODAY, 'a');
    expect(store.choresByDate[TODAY][0].isDone).toBe(false);
  });

  it('removes a chore and restores it at its old position, once', () => {
    const store = useChoreStore();
    ['a', 'b', 'c'].forEach((id) => store.addChore(TODAY, { id, type: CHORE_TYPES.MOP }));
    const removed = store.choresByDate[TODAY][1];

    store.removeChore(TODAY, 'b');
    expect(store.choresByDate[TODAY].map((c) => c.id)).toEqual(['a', 'c']);

    store.restoreChore(TODAY, removed, 1);
    store.restoreChore(TODAY, removed, 1); // a second undo must not duplicate it
    expect(store.choresByDate[TODAY].map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('recurrence', () => {
  it('materializes a daily series 30 days ahead, today included', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');

    const dates = occurrences(store, seriesId);
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe(TODAY);
    expect(dates.at(-1)).toBe(keyFor(30));
  });

  it('materializes a weekly series every 7 days over 12 weeks', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'weekly');

    const dates = occurrences(store, seriesId);
    expect(dates).toHaveLength(13);
    expect(dates.slice(0, 3)).toEqual([TODAY, keyFor(7), keyFor(14)]);
  });

  it('is idempotent and leaves done state alone', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'weekly');
    store.toggleChoreDone(keyFor(7), store.choresByDate[keyFor(7)][0].id);

    store.materializeSeries();
    store.materializeSeries();

    expect(occurrences(store, seriesId)).toHaveLength(13);
    expect(store.choresByDate[keyFor(7)][0].isDone).toBe(true);
  });

  it('turning repeat off stops generating but keeps existing occurrences', () => {
    const store = useChoreStore();
    startSeries(store, 'weekly');
    store.setChoreRepeat(TODAY, 'c1', null);

    expect(store.recurringSeries).toEqual({});
    expect(store.choresByDate[keyFor(7)]).toHaveLength(1);

    vi.setSystemTime(new Date(2026, 10, 20, 12));
    store.materializeSeries();
    expect(store.choresByDate[keyFor(60)]).toBeUndefined();
  });

  describe('switching between daily and weekly', () => {
    it('leaves only the weekly occurrences, not the daily ones created before', () => {
      const store = useChoreStore();
      const seriesId = startSeries(store, 'daily');
      expect(occurrences(store, seriesId)).toHaveLength(31);

      store.setChoreRepeat(TODAY, 'c1', WEEKLY);

      const dates = occurrences(store, seriesId);
      expect(dates).toHaveLength(13);
      expect(dates).toEqual([0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84].map(keyFor));
      expect(store.choresByDate[keyFor(1)]).toBeUndefined();
    });

    it('keeps done occurrences as history', () => {
      const store = useChoreStore();
      startSeries(store, 'daily');
      const doneDay = keyFor(3);
      store.toggleChoreDone(doneDay, store.choresByDate[doneDay][0].id);

      store.setChoreRepeat(TODAY, 'c1', WEEKLY);

      expect(store.choresByDate[doneDay]).toHaveLength(1);
      expect(store.choresByDate[doneDay][0].isDone).toBe(true);
    });

    it('only regenerates from the occurrence that was clicked, leaving earlier days alone', () => {
      const store = useChoreStore();
      const seriesId = startSeries(store, 'daily');

      store.setChoreRepeat(keyFor(4), store.choresByDate[keyFor(4)][0].id, { ...WEEKLY, weekdays: [0] }); // every Sunday, from day 4 (a Sunday)

      const dates = occurrences(store, seriesId);
      expect(dates.slice(0, 5)).toEqual([0, 1, 2, 3, 4].map(keyFor));
      expect(dates.slice(5, 8)).toEqual([11, 18, 25].map(keyFor));
    });

    it('does not touch other series or one-off chores on those days', () => {
      const store = useChoreStore();
      startSeries(store, 'daily');
      store.addChore(keyFor(5), { id: 'oneoff', type: CHORE_TYPES.MOP });

      store.setChoreRepeat(TODAY, 'c1', WEEKLY);

      expect(store.choresByDate[keyFor(5)].map((c) => c.id)).toEqual(['oneoff']);
    });

    it('fills every one of the next 30 days again when switched back to daily', () => {
      const store = useChoreStore();
      startSeries(store, 'weekly');
      store.setChoreRepeat(TODAY, 'c1', null); // off keeps what exists
      store.setChoreRepeat(TODAY, 'c1', DAILY);

      for (let day = 0; day <= 30; day++) {
        expect(store.choresByDate[keyFor(day)]).toHaveLength(1);
      }
    });
  });

  it('fills the window forward as days pass', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');

    vi.setSystemTime(new Date(2026, 9, 17, 12)); // ten days later
    store.materializeSeries();

    expect(occurrences(store, seriesId).at(-1)).toBe(keyFor(40));
  });
});

describe('repeat rules', () => {
  it('repeats on chosen weekdays, with the chore it was set on as the first one', () => {
    const store = useChoreStore();
    store.addChore(TODAY, { id: 'c1', type: CHORE_TYPES.TRASH, state: 'yellow' });
    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'weekly', interval: 1, weekdays: [4, 2] }); // Tue + Thu

    const seriesId = Object.keys(store.recurringSeries)[0];
    // Wed 7th itself, then Thu 8th, Tue 13th, Thu 15th, ...
    expect(occurrences(store, seriesId).slice(0, 5)).toEqual([0, 1, 6, 8, 13].map(keyFor));
    expect(store.choresByDate[keyFor(1)][0].state).toBe('yellow');
    expect(store.recurringSeries[seriesId].weekdays).toEqual([2, 4]);
  });

  it('repeats every two weeks', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'weekly', interval: 2, weekdays: [3] });

    expect(occurrences(store, seriesId)).toEqual([0, 14, 28, 42, 56, 70, 84].map(keyFor));
  });

  it('repeats monthly for a year ahead, on the same day of the month', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'monthly', interval: 1 });

    const dates = occurrences(store, seriesId);
    expect(dates).toHaveLength(13);
    expect(dates.slice(0, 3)).toEqual(['2026-10-07', '2026-11-07', '2026-12-07']);
    expect(dates.at(-1)).toBe('2027-10-07');
  });

  it('keeps the colour of the chore it was started from on every occurrence', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'weekly');

    expect(store.recurringSeries[seriesId].state).toBe('grey');
    expect(store.choresByDate[keyFor(7)][0].state).toBe('grey');
  });

  it('changing the interval regenerates the upcoming days', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'weekly');
    expect(occurrences(store, seriesId)).toHaveLength(13);

    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'weekly', interval: 2, weekdays: [3] });

    expect(occurrences(store, seriesId)).toHaveLength(7);
    expect(store.choresByDate[keyFor(7)]).toBeUndefined();
  });

  it('does nothing when the rule picked is the one already set', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'weekly');
    const id = store.choresByDate[keyFor(7)][0].id;
    store.toggleChoreDone(keyFor(7), id);

    store.setChoreRepeat(keyFor(14), store.choresByDate[keyFor(14)][0].id, WEEKLY);

    expect(store.recurringSeries[seriesId].anchorDateKey).toBe(TODAY);
    expect(store.choresByDate[keyFor(7)][0]).toMatchObject({ id, isDone: true });
  });

  it('replaces the weekdays of a series when switching to another rule', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'weekly');

    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'daily', interval: 3 });

    expect(store.recurringSeries[seriesId]).toMatchObject({ recurrence: 'daily', interval: 3 });
    expect(store.recurringSeries[seriesId].weekdays).toBeUndefined();
    expect(occurrences(store, seriesId).slice(0, 4)).toEqual([0, 3, 6, 9].map(keyFor));
  });

  it('ignores a rule it does not understand', () => {
    const store = useChoreStore();
    store.addChore(TODAY, { id: 'c1', type: CHORE_TYPES.MOP });

    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'yearly' });

    expect(store.recurringSeries).toEqual({});
  });

  it('still understands series saved before intervals and weekdays existed', () => {
    const store = useChoreStore();
    store.recurringSeries = { old: { type: 'trash', state: 'blue', recurrence: 'weekly', anchorDateKey: keyFor(2) } };

    store.materializeSeries();

    expect(occurrences(store, 'old').slice(0, 3)).toEqual([2, 9, 16].map(keyFor));
    expect(store.repeatLabelOf({ seriesId: 'old' })).toBe('Every Friday');
  });

  it('describes what a chore repeats as, or null', () => {
    const store = useChoreStore();
    startSeries(store, 'weekly');

    expect(store.repeatLabelOf(store.choresByDate[TODAY][0])).toBe('Every Wednesday');
    expect(store.repeatLabelOf({ seriesId: null })).toBeNull();
    expect(store.repeatRuleOf({ seriesId: 'gone' })).toBeNull();
  });
});

describe('removing one occurrence of a recurring chore', () => {
  it('stays removed after the series is materialized again (the day is skipped)', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    const target = keyFor(3);
    const chore = store.choresByDate[target][0];

    store.removeChore(target, chore.id);
    store.materializeSeries(); // what happens on the next page load

    expect(store.choresByDate[target] ?? []).toHaveLength(0);
    expect(occurrences(store, seriesId)).toHaveLength(30);
    expect(store.recurringSeries[seriesId].skippedDateKeys).toEqual([target]);
  });

  it('does not touch the neighbouring days', () => {
    const store = useChoreStore();
    startSeries(store, 'daily');
    store.removeChore(keyFor(3), store.choresByDate[keyFor(3)][0].id);

    expect(store.choresByDate[keyFor(2)]).toHaveLength(1);
    expect(store.choresByDate[keyFor(4)]).toHaveLength(1);
  });

  it('undo brings it back and clears the skip, without duplicates after re-materializing', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    const target = keyFor(3);
    const chore = store.choresByDate[target][0];

    store.removeChore(target, chore.id);
    store.restoreChore(target, chore, 0);
    store.materializeSeries();

    expect(store.choresByDate[target]).toHaveLength(1);
    expect(store.recurringSeries[seriesId].skippedDateKeys).toEqual([]);
  });

  it('removing a one-off chore never touches a series', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    store.addChore(keyFor(2), { id: 'oneoff', type: CHORE_TYPES.MOP });

    store.removeChore(keyFor(2), 'oneoff');

    expect(store.recurringSeries[seriesId].skippedDateKeys ?? []).toEqual([]);
    expect(store.choresByDate[keyFor(2)]).toHaveLength(1); // the series occurrence is still there
  });

  it('keeps the skipped days when the repeat rule changes daily -> weekly', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    const target = keyFor(7);
    store.removeChore(target, store.choresByDate[target][0].id);

    store.setChoreRepeat(TODAY, 'c1', WEEKLY);

    expect(store.recurringSeries[seriesId].recurrence).toBe('weekly');
    expect(store.recurringSeries[seriesId].skippedDateKeys).toEqual([target]);
    expect(store.choresByDate[target] ?? []).toHaveLength(0);
  });

  it('forgets skipped days that are already in the past', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');
    store.removeChore(keyFor(1), store.choresByDate[keyFor(1)][0].id);
    expect(store.recurringSeries[seriesId].skippedDateKeys).toEqual([keyFor(1)]);

    vi.setSystemTime(new Date(2026, 9, 10, 12));
    store.materializeSeries();

    expect(store.recurringSeries[seriesId].skippedDateKeys).toEqual([]);
  });
});

const toasts = useToast();

// A loaded store, as it is after a user signs in.
async function loadedStore(doc = { choresByDate: {}, recurringSeries: {} }) {
  service.get.mockResolvedValue(doc);
  const store = useChoreStore();
  await store.load();
  service.save.mockClear();
  return store;
}

describe('loading', () => {
  it('fills the store from the server and ignores the old browser-wide copy', async () => {
    localStorage.setItem('manself:chores', JSON.stringify({ choresByDate: { [TODAY]: [{ id: 'leak', type: 'mop' }] } }));
    const doc = { choresByDate: { [TODAY]: [{ id: 'mine', type: 'mop', isDone: false, seriesId: null }] }, recurringSeries: {} };
    service.get.mockResolvedValue(doc);
    const store = useChoreStore();

    await store.load();

    expect(store.loaded).toBe(true);
    expect(store.choresByDate[TODAY].map((c) => c.id)).toEqual(['mine']);
    expect(localStorage.getItem('manself:chores')).not.toBeNull(); // left alone, just never read
  });

  it('starts a brand-new user with nothing', async () => {
    const store = await loadedStore({ choresByDate: {}, recurringSeries: {} });
    expect(store.choresByDate).toEqual({});
    expect(store.recurringSeries).toEqual({});
  });

  it('fills in upcoming repeats, and saves because that changed the chores', async () => {
    const series = { type: 'trash', state: 'yellow', recurrence: 'weekly', anchorDateKey: keyFor(2) };
    service.get.mockResolvedValue({ choresByDate: {}, recurringSeries: { s1: series } });
    const store = useChoreStore();

    await store.load();
    vi.advanceTimersByTime(400);

    expect(Object.keys(store.choresByDate)).toHaveLength(12);
    expect(service.save).toHaveBeenCalledOnce();
  });

  it('does not save straight after loading when nothing changed', async () => {
    await loadedStore({ choresByDate: { [TODAY]: [{ id: 'a', type: 'mop', isDone: false, seriesId: null }] }, recurringSeries: {} });
    vi.advanceTimersByTime(5000);
    expect(service.save).not.toHaveBeenCalled();
  });

  it('tells the user, and never saves, when the chores could not be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service.get.mockRejectedValue(new Error('down'));
    const store = useChoreStore();

    await store.load();
    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });
    vi.advanceTimersByTime(5000);

    expect(store.loaded).toBe(false);
    expect(service.save).not.toHaveBeenCalled();
    expect(toasts.toasts.value.map((t) => t.message)).toEqual([expect.stringContaining("Couldn't load your chores")]);
    toasts.toasts.value.forEach((t) => toasts.dismiss(t.id));
  });

  it('ignores a slow response that arrives after the user signed out', async () => {
    let resolve;
    service.get.mockReturnValue(new Promise((r) => (resolve = r)));
    const store = useChoreStore();

    const pending = store.load();
    store.reset(); // signed out while the request was still in flight
    resolve({ choresByDate: { [TODAY]: [{ id: 'old-users', type: 'mop' }] }, recurringSeries: {} });
    await pending;

    expect(store.choresByDate).toEqual({});
    expect(store.loaded).toBe(false);
  });

  it('lets the newest sign-in win when two loads overlap', async () => {
    let resolveFirst;
    service.get.mockReturnValueOnce(new Promise((r) => (resolveFirst = r)));
    service.get.mockResolvedValueOnce({ choresByDate: { [TODAY]: [{ id: 'second', type: 'mop' }] }, recurringSeries: {} });
    const store = useChoreStore();

    const first = store.load();
    await store.load();
    resolveFirst({ choresByDate: { [TODAY]: [{ id: 'first', type: 'mop' }] }, recurringSeries: {} });
    await first;

    expect(store.choresByDate[TODAY].map((c) => c.id)).toEqual(['second']);
  });
});

describe('saving', () => {
  it('does not save anything before the chores have been loaded', () => {
    const store = useChoreStore();
    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });
    vi.advanceTimersByTime(5000);
    expect(service.save).not.toHaveBeenCalled();
  });

  it('saves the whole document shortly after a change, not instantly', async () => {
    const store = await loadedStore();
    service.save.mockResolvedValue({});

    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });
    expect(service.save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);

    expect(service.save).toHaveBeenCalledOnce();
    expect(service.save.mock.calls[0][0].choresByDate[TODAY]).toHaveLength(1);
  });

  it('turns a burst of changes into one save', async () => {
    const store = await loadedStore();
    service.save.mockResolvedValue({});

    ['a', 'b', 'c'].forEach((id) => {
      store.addChore(TODAY, { id, type: CHORE_TYPES.MOP });
      vi.advanceTimersByTime(100);
    });
    vi.advanceTimersByTime(400);

    expect(service.save).toHaveBeenCalledOnce();
    expect(service.save.mock.calls[0][0].choresByDate[TODAY]).toHaveLength(3);
  });

  it('flush() sends pending changes right away, and does nothing when there are none', async () => {
    const store = await loadedStore();
    service.save.mockResolvedValue({});

    await store.flush();
    expect(service.save).not.toHaveBeenCalled();

    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });
    await store.flush();
    expect(service.save).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(5000); // the timer was cancelled, so no second save
    expect(service.save).toHaveBeenCalledOnce();
  });

  it('warns when a save fails, and tries again with the next change', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = await loadedStore();
    service.save.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({});

    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });
    await store.flush();
    expect(toasts.toasts.value.map((t) => t.message)).toEqual([expect.stringContaining("Couldn't save your chores")]);
    toasts.toasts.value.forEach((t) => toasts.dismiss(t.id));

    store.addChore(TODAY, { id: 'b', type: CHORE_TYPES.MOP });
    await store.flush();
    expect(service.save).toHaveBeenCalledTimes(2);
    expect(service.save.mock.calls[1][0].choresByDate[TODAY]).toHaveLength(2); // nothing was lost
  });
});

describe('reset (signing out)', () => {
  it('empties the store so the next user starts clean', async () => {
    const store = await loadedStore({ choresByDate: { [TODAY]: [{ id: 'a', type: 'mop' }] }, recurringSeries: { s: { type: 'trash', recurrence: 'daily', anchorDateKey: TODAY } } });

    store.reset();

    expect(store.choresByDate).toEqual({});
    expect(store.recurringSeries).toEqual({});
    expect(store.loaded).toBe(false);
  });

  it('cancels a save that was waiting to go out, so it cannot reach the next user', async () => {
    const store = await loadedStore();
    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.MOP });

    store.reset();
    vi.advanceTimersByTime(5000);

    expect(service.save).not.toHaveBeenCalled();
  });
});
