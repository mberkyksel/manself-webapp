import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const service = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../services/taskService.js', () => ({ taskService: service }));
vi.mock('../services/calendarService.js', () => ({ calendarService: {} }));

const { useTaskStore } = await import('./taskStore.js');

const TASKS = [
  { id: 1, title: 'A', status: 'todo', position: 1 },
  { id: 2, title: 'B', status: 'in_progress', position: 1 },
  { id: 3, title: 'C', status: 'done', position: 1 },
];

function loaded() {
  const store = useTaskStore();
  store.tasks = TASKS.map((t) => ({ ...t }));
  return store;
}

beforeEach(() => {
  vi.useFakeTimers();
  setActivePinia(createPinia());
  service.update.mockResolvedValue({});
});

afterEach(() => vi.useRealTimers());

describe('moveTask', () => {
  it('moves a task to the end of another lane', async () => {
    const store = loaded();
    await store.moveTask(1, { status: 'in_progress', beforeId: 2, afterId: null });

    expect(store.byStatus('in_progress').map((t) => t.id)).toEqual([2, 1]);
    expect(service.update).toHaveBeenCalledWith(1, { status: 'in_progress', position: 2 });
  });

  it('puts the task back when the save fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service.update.mockRejectedValue(new Error('down'));
    const store = loaded();

    await store.moveTask(1, { status: 'done', beforeId: 3, afterId: null });

    expect(store.tasks.find((t) => t.id === 1)).toMatchObject({ status: 'todo', position: 1 });
  });
});

describe('completion stamp', () => {
  it('flags a task that was just finished, then clears the flag', async () => {
    const store = loaded();
    await store.moveTask(2, { status: 'done', beforeId: 3, afterId: null });
    expect(store.justCompletedId).toBe(2);

    vi.advanceTimersByTime(700);
    expect(store.justCompletedId).toBeNull();
  });

  it('also flags a task finished through updateTask (the todo list checkbox)', async () => {
    const store = loaded();
    await store.updateTask(1, { status: 'done' });
    expect(store.justCompletedId).toBe(1);
  });

  it('does not flag moves between open lanes, or a task that was already done', async () => {
    const store = loaded();
    await store.moveTask(1, { status: 'in_progress', beforeId: 2, afterId: null });
    expect(store.justCompletedId).toBeNull();

    await store.moveTask(3, { status: 'done', beforeId: null, afterId: null });
    expect(store.justCompletedId).toBeNull();
  });
});
