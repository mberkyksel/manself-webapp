<script setup>
import { ref } from 'vue';
import TaskCard from './TaskCard.vue';
import { useTaskStore } from '../../stores/taskStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useConfirm } from '../../composables/useConfirm.js';

const props = defineProps({
  status: { type: String, required: true },
  title: { type: String, required: true },
  tasks: { type: Array, required: true },
});

const taskStore = useTaskStore();
const { confirm } = useConfirm();
const calendarStore = useCalendarStore();
const newTitle = ref('');
const newDueDate = ref('');

function eventCountFor(taskId) {
  return calendarStore.events.filter((event) => event.task?.id === taskId).length;
}

function onDragStart(task) {
  taskStore.startDragging(task.id);
}

function onDragEnd() {
  taskStore.stopDragging();
}

async function requestRemoveTask(task) {
  const confirmed = await confirm({
    title: 'Delete this task?',
    message: `"${task.title}" will be permanently deleted.`,
    confirmLabel: 'Delete task',
  });
  if (confirmed) taskStore.removeTask(task.id);
}

async function submitNewTask() {
  const title = newTitle.value.trim();
  if (!title) return;
  const dueDate = newDueDate.value || null;
  const task = await taskStore.addTask({ title, status: props.status, dueDate });
  if (task) {
    newTitle.value = '';
    newDueDate.value = '';
  }
}
</script>

<template>
  <div class="kanban-column" :data-column-status="status">
    <div class="kanban-column__header">
      <h2 class="kanban-column__title">{{ title }}</h2>
      <span class="kanban-column__count">{{ tasks.length }}</span>
    </div>

    <div class="kanban-column__list">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :event-count="eventCountFor(task.id)"
        @dragstart="onDragStart(task)"
        @dragend="onDragEnd"
        @remove="requestRemoveTask(task)"
        @update-due-date="taskStore.updateTask(task.id, { dueDate: $event })"
        @sync-due-date="taskStore.syncDueDateToCalendar(task.id)"
      />
    </div>

    <form class="kanban-column__form" @submit.prevent="submitNewTask">
      <input v-model="newTitle" type="text" placeholder="Add a task..." class="kanban-column__input" />
      <input v-model="newDueDate" type="date" class="kanban-column__due-input" />
      <button type="submit" class="kanban-column__submit">Add</button>
    </form>
  </div>
</template>

<style scoped>
.kanban-column {
  @apply flex w-72 shrink-0 flex-col rounded-xl bg-slate-100 p-3;
}
.kanban-column__header {
  @apply mb-3 flex items-center justify-between px-1;
}
.kanban-column__title {
  @apply text-sm font-semibold text-slate-600;
}
.kanban-column__count {
  @apply text-xs text-slate-400;
}
.kanban-column__list {
  @apply flex flex-col gap-2;
}
.kanban-column__form {
  @apply mt-3 flex gap-2;
}
.kanban-column__input {
  @apply min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none;
}
.kanban-column__due-input {
  @apply shrink-0 rounded-md border border-slate-200 bg-white px-1 py-1 text-xs text-slate-500 focus:border-slate-400 focus:outline-none;
}
.kanban-column__submit {
  @apply shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700;
}
</style>

<style>
/* Unscoped: toggled externally via classList by TaskCard's pointer-drag
   handler on whatever element document.elementFromPoint resolves to. */
.kanban-drop-target {
  @apply ring-2 ring-indigo-400;
}
</style>
