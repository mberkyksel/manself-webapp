import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const list = vi.hoisted(() => vi.fn());
vi.mock('../../services/taskService.js', () => ({
  taskService: { list, create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
vi.mock('../../services/calendarService.js', () => ({ calendarService: {} }));

const { default: KanbanBoard } = await import('./KanbanBoard.vue');

// Wednesday 7 Oct 2026, local noon.
const task = (id, status, extra = {}) => ({ id, title: `Task ${id}`, status, priority: 'medium', position: id, dueDate: null, ...extra });

async function mountBoard(tasks) {
  list.mockResolvedValue(tasks);
  const wrapper = mount(KanbanBoard);
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 12));
  setActivePinia(createPinia());
});

afterEach(() => vi.useRealTimers());

describe('KanbanBoard', () => {
  it('shows progress, and what is overdue or due today', async () => {
    const wrapper = await mountBoard([
      task(1, 'done'),
      task(2, 'done'),
      task(3, 'in_progress', { dueDate: '2026-10-07' }),
      task(4, 'todo', { dueDate: '2026-10-05' }),
      task(5, 'todo', { dueDate: '2026-10-07' }),
    ]);

    expect(wrapper.find('.board-progress__summary').text()).toBe('2 of 5 done');
    expect(wrapper.find('.board-progress__chip--overdue').text()).toContain('1 overdue');
    expect(wrapper.find('.board-progress__chip--today').text()).toContain('2 due today');
    expect(wrapper.find('[role=progressbar]').attributes('aria-valuenow')).toBe('40');
  });

  it('does not count finished tasks as overdue or due today', async () => {
    const wrapper = await mountBoard([task(1, 'done', { dueDate: '2026-10-01' }), task(2, 'done', { dueDate: '2026-10-07' })]);

    expect(wrapper.find('.board-progress__chip').exists()).toBe(false);
    expect(wrapper.find('.board-progress__summary').text()).toBe('2 of 2 done');
  });

  it('puts in-progress tasks in Now, to-do in Next and finished in Done', async () => {
    const wrapper = await mountBoard([task(1, 'in_progress'), task(2, 'todo'), task(3, 'done')]);

    const lane = (status) => wrapper.find(`[data-column-status="${status}"]`);
    expect(lane('in_progress').text()).toContain('Now');
    expect(lane('in_progress').text()).toContain('Task 1');
    expect(lane('todo').text()).toContain('Next');
    expect(lane('todo').text()).toContain('Task 2');
    expect(lane('done').text()).toContain('Task 3');
  });

  it('labels due dates on open cards, and flags an overdue one', async () => {
    const wrapper = await mountBoard([task(1, 'todo', { dueDate: '2026-10-05' }), task(2, 'todo')]);

    const cards = wrapper.findAll('.task-card');
    expect(cards[0].text()).toContain('2 days overdue');
    expect(cards[0].classes()).toContain('task-card--overdue');
    expect(cards[1].text()).toContain('Add date');
  });

  it('shows the latest five finished tasks and tucks the rest behind a toggle', async () => {
    const done = Array.from({ length: 8 }, (_, i) => task(i + 1, 'done'));
    const wrapper = await mountBoard(done);
    const doneLane = () => wrapper.find('[data-column-status="done"]');

    expect(doneLane().findAll('.task-card')).toHaveLength(5);
    expect(doneLane().text()).toContain('Show 3 more');

    await doneLane().find('.kanban-column__toggle').trigger('click');
    expect(doneLane().findAll('.task-card')).toHaveLength(8);
    expect(doneLane().text()).toContain('Show fewer');
  });

  it('has no add-task form in the Done lane', async () => {
    const wrapper = await mountBoard([]);
    expect(wrapper.find('[data-column-status="done"] form').exists()).toBe(false);
    expect(wrapper.find('[data-column-status="todo"] form').exists()).toBe(true);
  });
});
