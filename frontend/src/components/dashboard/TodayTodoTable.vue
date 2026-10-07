<script setup>
import { computed, onMounted } from 'vue';
import { useTaskStore } from '../../stores/taskStore.js';

const taskStore = useTaskStore();

const todayDateOnly = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
});

// Overdue tasks are surfaced here too (not just the kanban board) so an
// open item due yesterday doesn't silently fall out of view; once marked
// done it drops off this list like any other completed task.
const overdueTodos = computed(() =>
  taskStore.tasks
    .filter((task) => task.dueDate && task.dueDate < todayDateOnly.value && task.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
);

const dueTodayTodos = computed(() =>
  taskStore.tasks.filter((task) => task.dueDate === todayDateOnly.value).sort((a, b) => a.position - b.position)
);

const todosToday = computed(() => [...overdueTodos.value, ...dueTodayTodos.value]);

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function isOverdue(task) {
  return task.dueDate < todayDateOnly.value && task.status !== 'done';
}

// A checkbox only distinguishes done/not-done, so unchecking a task that
// was 'in_progress' resets it to 'todo' rather than trying to restore the
// prior status — this list is a quick-complete view, not a status editor
// (use the kanban board for that).
function onCheckToggle(task, checked) {
  taskStore.updateTask(task.id, { status: checked ? 'done' : 'todo' });
}

onMounted(() => {
  taskStore.fetchTasks();
});
</script>

<template>
  <div class="today-todos">
    <div class="today-todos__header">
      <h2 class="today-todos__title">Today's Todos</h2>
      <span class="today-todos__count">{{ todosToday.length }}</span>
    </div>

    <p v-if="todosToday.length === 0" class="today-todos__empty">
      Nothing due today. Give a task a due date on the board below and it will show up here.
    </p>

    <table v-else class="today-todos__table">
      <thead>
        <tr>
          <th class="today-todos__th today-todos__th--check"></th>
          <th class="today-todos__th">Task</th>
          <th class="today-todos__th">Priority</th>
          <th class="today-todos__th">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in todosToday" :key="task.id">
          <td class="today-todos__td today-todos__td--check">
            <input
              type="checkbox"
              class="today-todos__checkbox"
              :checked="task.status === 'done'"
              title="Mark done"
              @change="onCheckToggle(task, $event.target.checked)"
            />
          </td>
          <td class="today-todos__td today-todos__td--title" :class="task.status === 'done' && 'today-todos__td--done'">
            {{ task.title }}
            <span v-if="isOverdue(task)" class="today-todos__overdue">Overdue</span>
          </td>
          <td class="today-todos__td">
            <span :class="['today-todos__priority', `today-todos__priority--${task.priority}`]">
              {{ task.priority }}
            </span>
          </td>
          <td class="today-todos__td">
            <span :class="['today-todos__status', `today-todos__status--${task.status}`]">
              {{ STATUS_LABELS[task.status] }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.today-todos {
  @apply card mx-auto mt-8 max-w-5xl bg-white p-5;
}
.today-todos__header {
  @apply mb-3 flex items-center justify-between;
}
.today-todos__title {
  @apply text-sm font-semibold text-slate-600;
}
.today-todos__count {
  @apply text-xs text-slate-400;
}
.today-todos__empty {
  @apply text-sm text-slate-400;
}
.today-todos__table {
  @apply w-full border-collapse text-left text-sm;
}
.today-todos__th {
  @apply border-b border-slate-100 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400;
}
.today-todos__th--check {
  @apply w-6;
}
.today-todos__td {
  @apply border-b border-slate-50 py-2 pr-4 text-slate-700;
}
.today-todos__td--check {
  @apply w-6 pr-2;
}
.today-todos__checkbox {
  @apply h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500;
}
.today-todos__td--title {
  @apply font-medium text-slate-800;
}
.today-todos__td--done {
  @apply text-slate-400 line-through;
}
.today-todos__overdue {
  @apply ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600;
}
.today-todos__priority {
  @apply rounded-full px-2 py-0.5 text-xs font-medium;
}
.today-todos__priority--low {
  @apply bg-slate-100 text-slate-600;
}
.today-todos__priority--medium {
  @apply bg-amber-100 text-amber-700;
}
.today-todos__priority--high {
  @apply bg-rose-100 text-rose-700;
}
.today-todos__status {
  @apply rounded-full px-2 py-0.5 text-xs font-medium;
}
.today-todos__status--todo {
  @apply bg-slate-100 text-slate-600;
}
.today-todos__status--in_progress {
  @apply bg-indigo-50 text-indigo-600;
}
.today-todos__status--done {
  @apply bg-emerald-50 text-emerald-600;
}
</style>
