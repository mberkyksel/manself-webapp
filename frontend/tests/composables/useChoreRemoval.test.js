import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useChoreStore } from '../../src/stores/choreStore.js';
import { useChoreRemoval } from '../../src/composables/useChoreRemoval.js';
import { useToast } from '../../src/composables/useToast.js';

const DAY = '2026-10-07';
const toast = useToast();

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
});

afterEach(() => {
  [...toast.toasts.value].forEach((t) => toast.dismiss(t.id));
});

function seed() {
  const store = useChoreStore();
  ['a', 'b', 'c'].forEach((id) => store.addChore(DAY, { id, type: 'mop' }));
  store.toggleChoreDone(DAY, 'b');
  return store;
}

describe('removeChoreWithUndo', () => {
  it('removes the chore and offers an Undo toast', () => {
    const store = seed();
    useChoreRemoval().removeChoreWithUndo(DAY, 'b');

    expect(store.choresByDate[DAY].map((c) => c.id)).toEqual(['a', 'c']);
    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].action.label).toBe('Undo');
  });

  it('Undo puts it back in the same place with its done state', () => {
    const store = seed();
    useChoreRemoval().removeChoreWithUndo(DAY, 'b');

    toast.toasts.value[0].action.onClick();

    expect(store.choresByDate[DAY].map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(store.choresByDate[DAY][1].isDone).toBe(true);
  });

  it('does nothing for a chore that is not there', () => {
    seed();
    useChoreRemoval().removeChoreWithUndo(DAY, 'missing');
    expect(toast.toasts.value).toHaveLength(0);
  });
});
