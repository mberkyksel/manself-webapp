<script setup>
import { onMounted } from 'vue';
import KanbanColumn from './KanbanColumn.vue';
import { useTaskStore } from '../../stores/taskStore.js';

const taskStore = useTaskStore();

const columns = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

onMounted(() => {
  taskStore.fetchTasks();
});
</script>

<template>
  <div>
    <div v-if="taskStore.error" class="kanban-board__error">
      {{ taskStore.error }}
    </div>

    <div class="kanban-board__columns">
      <KanbanColumn
        v-for="column in columns"
        :key="column.status"
        :status="column.status"
        :title="column.title"
        :tasks="taskStore.byStatus(column.status)"
      />
    </div>
  </div>
</template>

<style scoped>
.kanban-board__error {
  @apply mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-600;
}
.kanban-board__columns {
  @apply flex gap-4 overflow-x-auto pb-2;
}
</style>
