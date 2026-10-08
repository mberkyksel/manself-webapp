import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

const burst = vi.hoisted(() => vi.fn());
vi.mock('../../composables/useConfetti.js', () => ({ useConfetti: () => ({ burst }) }));

const { default: ChoresCelebration } = await import('./ChoresCelebration.vue');
const { useChoreStore } = await import('../../stores/choreStore.js');

const TODAY = '2026-10-07';

function mountWithChores(chores) {
  const store = useChoreStore();
  chores.forEach((c) => store.addChore(TODAY, { type: 'mop', ...c }));
  chores.filter((c) => c.done).forEach((c) => store.toggleChoreDone(TODAY, c.id));
  const wrapper = mount(ChoresCelebration, { global: { stubs: { teleport: true } } });
  return { store, wrapper };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
  localStorage.clear();
  setActivePinia(createPinia());
  burst.mockClear();
});

afterEach(() => vi.useRealTimers());

describe('ChoresCelebration', () => {
  it('celebrates when the last open chore is ticked off', async () => {
    const { store, wrapper } = mountWithChores([{ id: 'a', done: true }, { id: 'b' }]);

    store.toggleChoreDone(TODAY, 'b');
    await nextTick();

    expect(burst).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('All chores complete');
  });

  it('hides the banner again after a few seconds', async () => {
    const { store, wrapper } = mountWithChores([{ id: 'a' }]);
    store.toggleChoreDone(TODAY, 'a');
    await nextTick();

    await vi.advanceTimersByTimeAsync(3100);

    expect(wrapper.text()).not.toContain('All chores complete');
  });

  it('does not celebrate when the last open chore is removed instead', async () => {
    const { store } = mountWithChores([{ id: 'a', done: true }, { id: 'b' }]);

    store.removeChore(TODAY, 'b');
    await nextTick();

    expect(burst).not.toHaveBeenCalled();
  });

  it('does not celebrate when a removal is undone', async () => {
    const { store } = mountWithChores([{ id: 'a', done: true }, { id: 'b', done: true }]);
    const removed = store.choresByDate[TODAY][1];

    store.removeChore(TODAY, 'b');
    store.restoreChore(TODAY, removed, 1);
    await nextTick();

    expect(burst).not.toHaveBeenCalled();
  });

  it('does not celebrate for a day that was already finished when the page loaded', async () => {
    mountWithChores([{ id: 'a', done: true }]);
    await nextTick();
    expect(burst).not.toHaveBeenCalled();
  });

  it('celebrates again after un-ticking and re-ticking the last chore', async () => {
    const { store } = mountWithChores([{ id: 'a' }]);

    store.toggleChoreDone(TODAY, 'a');
    await nextTick();
    store.toggleChoreDone(TODAY, 'a');
    await nextTick();
    store.toggleChoreDone(TODAY, 'a');
    await nextTick();

    expect(burst).toHaveBeenCalledTimes(2);
  });
});
