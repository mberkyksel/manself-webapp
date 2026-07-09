<script setup>
import { ref } from 'vue';
import TaskCard from './TaskCard.vue';
import { useTaskStore } from '../../stores/taskStore.js';

const props = defineProps({
  status: { type: String, required: true },
  title: { type: String, required: true },
  tasks: { type: Array, required: true },
});

const taskStore = useTaskStore();
const newTitle = ref('');

function onDragStart(task) {
  taskStore.draggingTaskId = task.id;
}

function onDragEnd() {
  taskStore.draggingTaskId = null;
}

// Dropping directly on a card inserts the dragged task just before it.
function onDropOnCard(targetTask) {
  const draggedId = taskStore.draggingTaskId;
  if (draggedId == null || draggedId === targetTask.id) return;

  const index = props.tasks.findIndex((t) => t.id === targetTask.id);
  const beforeTask = props.tasks[index - 1];

  taskStore.moveTask(draggedId, {
    status: props.status,
    beforeId: beforeTask?.id ?? null,
    afterId: targetTask.id,
  });
}

// Dropping on empty column space (below the last card) appends to the end.
function onDropOnColumn() {
  const draggedId = taskStore.draggingTaskId;
  if (draggedId == null) return;

  const lastTask = props.tasks[props.tasks.length - 1];
  taskStore.moveTask(draggedId, {
    status: props.status,
    beforeId: lastTask?.id ?? null,
    afterId: null,
  });
}

async function submitNewTask() {
  const title = newTitle.value.trim();
  if (!title) return;
  newTitle.value = '';
  await taskStore.addTask({ title, status: props.status });
}
</script>

<template>
  <div class="kanban-column" @dragover.prevent @drop="onDropOnColumn">
    <div class="kanban-column__header">
      <h2 class="kanban-column__title">{{ title }}</h2>
      <span class="kanban-column__count">{{ tasks.length }}</span>
    </div>

    <div class="kanban-column__list">
      <div v-for="task in tasks" :key="task.id" @dragover.prevent @drop.stop="onDropOnCard(task)">
        <TaskCard
          :task="task"
          @dragstart="onDragStart(task)"
          @dragend="onDragEnd"
          @remove="taskStore.removeTask(task.id)"
        />
      </div>
    </div>

    <form class="kanban-column__form" @submit.prevent="submitNewTask">
      <input v-model="newTitle" type="text" placeholder="Add a task..." class="kanban-column__input" />
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
.kanban-column__submit {
  @apply shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700;
}
</style>
