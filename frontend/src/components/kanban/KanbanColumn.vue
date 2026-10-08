<script setup>
import { computed, ref } from 'vue';
import TaskCard from './TaskCard.vue';
import { useTaskStore } from '../../stores/taskStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useConfirm } from '../../composables/useConfirm.js';

const props = defineProps({
  status: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // The "Now" lane: wider cards and a soft highlight so it reads as the focus.
  emphasis: { type: Boolean, default: false },
  tasks: { type: Array, required: true },
});

// Finished work shouldn't push everything else down the page, so the Done
// lane shows the latest few and tucks the rest behind a toggle.
const DONE_VISIBLE = 5;

const taskStore = useTaskStore();
const { confirm } = useConfirm();
const calendarStore = useCalendarStore();
const newTitle = ref('');
const newDueDate = ref('');
const showAllDone = ref(false);

const isDone = computed(() => props.status === 'done');
const visibleTasks = computed(() =>
  isDone.value && !showAllDone.value ? props.tasks.slice(-DONE_VISIBLE) : props.tasks
);
const hiddenCount = computed(() => props.tasks.length - visibleTasks.value.length);

const EMPTY_HINTS = {
  todo: 'Nothing queued. Add a task below.',
  in_progress: 'Nothing in progress. Drag a task here when you start it.',
  done: 'Finished tasks end up here.',
};

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

// Ticking a task off or reopening it is a move to the end of another lane,
// the same thing a drag does.
function moveToEndOf(task, status) {
  const last = taskStore.byStatus(status).filter((t) => t.id !== task.id).at(-1);
  taskStore.moveTask(task.id, { status, beforeId: last?.id ?? null, afterId: null });
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
  <div class="kanban-column" :class="{ 'kanban-column--emphasis': emphasis }" :data-column-status="status">
    <div class="kanban-column__header">
      <h3 class="kanban-column__title">
        {{ title }}
        <span v-if="subtitle" class="kanban-column__subtitle">{{ subtitle }}</span>
      </h3>
      <span class="kanban-column__count">{{ tasks.length }}</span>
    </div>

    <p v-if="tasks.length === 0" class="kanban-column__empty">{{ EMPTY_HINTS[status] ?? 'No tasks.' }}</p>

    <div class="kanban-column__list">
      <TaskCard
        v-for="task in visibleTasks"
        :key="task.id"
        :task="task"
        :size="emphasis ? 'lg' : 'md'"
        :event-count="eventCountFor(task.id)"
        @dragstart="onDragStart(task)"
        @dragend="onDragEnd"
        @remove="requestRemoveTask(task)"
        @complete="moveToEndOf(task, 'done')"
        @reopen="moveToEndOf(task, 'todo')"
        @update-due-date="taskStore.updateTask(task.id, { dueDate: $event })"
        @sync-due-date="taskStore.syncDueDateToCalendar(task.id)"
      />
    </div>

    <button
      v-if="isDone && tasks.length > DONE_VISIBLE"
      type="button"
      class="kanban-column__toggle"
      @click="showAllDone = !showAllDone"
    >
      {{ showAllDone ? 'Show fewer' : `Show ${hiddenCount} more` }}
    </button>

    <form v-if="!isDone" class="kanban-column__form" @submit.prevent="submitNewTask">
      <input v-model="newTitle" type="text" placeholder="Add a task..." class="kanban-column__input" />
      <input v-model="newDueDate" type="date" class="kanban-column__due-input" aria-label="Due date" />
      <button type="submit" class="kanban-column__submit">Add</button>
    </form>
  </div>
</template>

<style scoped>
.kanban-column {
  @apply flex min-w-0 flex-col rounded-xl bg-slate-50 p-3;
}
.kanban-column--emphasis {
  @apply bg-indigo-50/60 p-4 ring-1 ring-inset ring-indigo-100;
}
.kanban-column__header {
  @apply mb-3 flex items-center justify-between px-1;
}
.kanban-column__title {
  @apply flex items-baseline gap-2 text-sm font-semibold text-slate-700;
}
.kanban-column--emphasis .kanban-column__title {
  @apply text-base text-indigo-900;
}
.kanban-column__subtitle {
  @apply text-[11px] font-normal uppercase tracking-wide text-slate-400;
}
.kanban-column__count {
  @apply rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500;
}
.kanban-column__empty {
  @apply rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-400;
}
.kanban-column__list {
  @apply flex flex-col gap-2;
}
.kanban-column__toggle {
  @apply mt-2 self-start rounded px-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline;
}
.kanban-column__form {
  @apply mt-3 flex flex-wrap gap-2;
}
.kanban-column__input {
  @apply min-w-[9rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none;
}
.kanban-column__due-input {
  @apply w-[7.5rem] shrink-0 rounded-md border border-slate-200 bg-white px-1 py-1 text-xs text-slate-500 focus:border-slate-400 focus:outline-none;
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
