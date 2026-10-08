import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useChoreStore } from './choreStore.js';
import { CHORE_TYPES } from '../constants/chores.js';

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

// The UI only reaches "weekly" by cycling through "daily" first, which would
// pre-fill 30 daily occurrences (see the todo below). To test weekly
// generation on its own, the weekly series is set up directly.
function startSeries(store, recurrence) {
  store.addChore(TODAY, { id: 'c1', type: CHORE_TYPES.TRASH, state: 'grey' });
  if (recurrence === 'daily') {
    store.cycleChoreRecurrence(TODAY, 'c1');
    return Object.keys(store.recurringSeries)[0];
  }

  const seriesId = 'weekly-series';
  store.recurringSeries = {
    [seriesId]: { type: CHORE_TYPES.TRASH, state: 'grey', recurrence: 'weekly', anchorDateKey: TODAY },
  };
  store.choresByDate = { [TODAY]: store.choresByDate[TODAY].map((c) => ({ ...c, seriesId })) };
  store.materializeSeries();
  return seriesId;
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
  it('adds a chore as not done and persists it', () => {
    const store = useChoreStore();
    store.addChore(TODAY, { id: 'a', type: CHORE_TYPES.LAUNDRY, state: 'colors' });

    expect(store.choresByDate[TODAY]).toEqual([
      { id: 'a', type: 'laundry', state: 'colors', isDone: false, seriesId: null },
    ]);
    expect(JSON.parse(localStorage.getItem('manself:chores')).choresByDate[TODAY]).toHaveLength(1);
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

  it('loads the older save format that stored the date map at the top level', () => {
    localStorage.setItem('manself:chores', JSON.stringify({ [TODAY]: [{ id: 'old', type: 'mop', isDone: true }] }));
    setActivePinia(createPinia());
    const store = useChoreStore();

    expect(store.choresByDate[TODAY][0].id).toBe('old');
    expect(store.recurringSeries).toEqual({});
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
    store.cycleChoreRecurrence(TODAY, 'c1'); // weekly -> none

    expect(store.recurringSeries).toEqual({});
    expect(store.choresByDate[keyFor(7)]).toHaveLength(1);

    vi.setSystemTime(new Date(2026, 10, 20, 12));
    store.materializeSeries();
    expect(store.choresByDate[keyFor(60)]).toBeUndefined();
  });

  // Known quirk, not fixed here: switching a series from daily to weekly keeps
  // the 30 days of daily occurrences already created and only adds weekly ones
  // after them, so the calendar still shows the chore every day for a month.
  it.todo('switching a series from daily to weekly leaves only the weekly occurrences');

  it('fills the window forward as days pass', () => {
    const store = useChoreStore();
    const seriesId = startSeries(store, 'daily');

    vi.setSystemTime(new Date(2026, 9, 17, 12)); // ten days later
    store.materializeSeries();

    expect(occurrences(store, seriesId).at(-1)).toBe(keyFor(40));
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

    store.cycleChoreRecurrence(TODAY, 'c1'); // daily -> weekly

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

describe('demo chores', () => {
  it('leaves today exactly one chore short of done, with a weekly series coming up', () => {
    const store = useChoreStore();
    store.loadDemoChores();

    const today = store.choresByDate[TODAY];
    expect(today).toHaveLength(3);
    expect(today.filter((c) => c.isDone)).toHaveLength(2);

    const series = Object.values(store.recurringSeries);
    expect(series).toHaveLength(1);
    expect(series[0].recurrence).toBe('weekly');
  });
});
