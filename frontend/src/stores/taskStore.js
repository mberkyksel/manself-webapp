import { defineStore } from 'pinia';
import { taskService } from '../services/taskService.js';
import { useCalendarStore } from './calendarStore.js';
import { useToast } from '../composables/useToast.js';

// How long a just-finished task keeps playing its "DONE" stamp animation.
const STAMP_MS = 700;
let stampTimer = null;

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    // Id of the task currently being dragged, shared across columns so any
    // column can accept the drop regardless of which one it started in.
    draggingTaskId: null,
    // Task that was just marked done, so its card can play the stamp. It lives
    // here because finishing a task moves its card to another lane, which is a
    // new component instance that can't tell a fresh completion from a reload.
    justCompletedId: null,
  }),

  getters: {
    byStatus: (state) => (status) =>
      state.tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position),
  },

  actions: {
    startDragging(taskId) {
      this.draggingTaskId = taskId;
    },

    stopDragging() {
      this.draggingTaskId = null;
    },

    flagCompleted(taskId) {
      this.justCompletedId = taskId;
      clearTimeout(stampTimer);
      stampTimer = setTimeout(() => {
        this.justCompletedId = null;
      }, STAMP_MS);
    },

    async fetchTasks() {
      this.loading = true;
      this.error = null;
      try {
        this.tasks = await taskService.list();
      } catch (err) {
        this.error = 'Could not load tasks. Is the backend running?';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async addTask({ title, status = 'todo', priority = 'medium', dueDate = null }) {
      this.error = null;
      try {
        const task = await taskService.create({ title, status, priority, dueDate });
        this.tasks.push(task);
        return task;
      } catch (err) {
        this.error = 'Could not add task. Is the backend running?';
        console.error(err);
        return null;
      }
    },

    async updateTask(id, payload) {
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return;

      const previous = { ...task };
      Object.assign(task, payload);
      if (payload.status === 'done' && previous.status !== 'done') this.flagCompleted(id);

      try {
        await taskService.update(id, payload);
      } catch (err) {
        Object.assign(task, previous);
        console.error(err);
        useToast().error("Couldn't save that change, so it was reverted.", { key: 'task-save-failed' });
      }
    },

    // Manual trigger only (never automatic) so editing a due date doesn't
    // silently spawn/move calendar events behind the user's back. Reuses
    // the task's existing linked all-day event if there is one, instead of
    // creating a duplicate each time this is clicked. Goes through
    // calendarStore (shared with CalendarView) so the calendar grid and the
    // linked-event badge on this task both update immediately.
    async syncDueDateToCalendar(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task || !task.dueDate) return;

      const calendarStore = useCalendarStore();
      const [y, m, d] = task.dueDate.split('-').map(Number);
      const payload = {
        title: task.title,
        startTime: new Date(y, m - 1, d, 0, 0, 0).toISOString(),
        endTime: new Date(y, m - 1, d, 23, 59, 59).toISOString(),
        allDay: true,
        taskId: task.id,
      };

      const existing = calendarStore.events.find((e) => e.allDay && e.task?.id === task.id);

      try {
        if (existing) {
          await calendarStore.updateEvent(existing.id, payload);
          useToast().success('Calendar event updated.');
        } else {
          await calendarStore.addEvent(payload);
          useToast().success('Added to your calendar.');
        }
      } catch (err) {
        console.error(err);
        useToast().error("Couldn't add this to your calendar.", { key: 'task-calendar-sync-failed' });
      }
    },

    async removeTask(id) {
      const previous = this.tasks;
      this.tasks = this.tasks.filter((task) => task.id !== id);
      try {
        await taskService.remove(id);
        useToast().success('Task deleted.');
      } catch (err) {
        this.tasks = previous;
        console.error(err);
        useToast().error("Couldn't delete the task, so it was put back.", { key: 'task-delete-failed' });
      }
    },

    // Moves a task to a new column/position, averaging the positions of its
    // new neighbors instead of renumbering the whole column (see the
    // `position` column comment in the tasks migration).
    async moveTask(taskId, { status, beforeId, afterId }) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const siblings = this.byStatus(status).filter((t) => t.id !== taskId);
      const beforeTask = siblings.find((t) => t.id === beforeId);
      const afterTask = siblings.find((t) => t.id === afterId);

      let position;
      if (beforeTask && afterTask) {
        position = (beforeTask.position + afterTask.position) / 2;
      } else if (afterTask) {
        position = afterTask.position / 2;
      } else if (beforeTask) {
        position = beforeTask.position + 1;
      } else {
        position = 1;
      }

      const previousStatus = task.status;
      const previousPosition = task.position;
      task.status = status;
      task.position = position;
      if (status === 'done' && previousStatus !== 'done') this.flagCompleted(taskId);

      try {
        await taskService.update(taskId, { status, position });
      } catch (err) {
        task.status = previousStatus;
        task.position = previousPosition;
        console.error(err);
        useToast().error("Couldn't move the task, so it was put back.", { key: 'task-save-failed' });
      }
    },
  },
});
