import { defineStore } from 'pinia';
import { taskService } from '../services/taskService.js';

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    // Id of the task currently being dragged, shared across columns so any
    // column can accept the drop regardless of which one it started in.
    draggingTaskId: null,
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

    async addTask({ title, status = 'todo', priority = 'medium' }) {
      const task = await taskService.create({ title, status, priority });
      this.tasks.push(task);
      return task;
    },

    async removeTask(id) {
      const previous = this.tasks;
      this.tasks = this.tasks.filter((task) => task.id !== id);
      try {
        await taskService.remove(id);
      } catch (err) {
        this.tasks = previous;
        console.error(err);
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

      try {
        await taskService.update(taskId, { status, position });
      } catch (err) {
        task.status = previousStatus;
        task.position = previousPosition;
        console.error(err);
      }
    },
  },
});
