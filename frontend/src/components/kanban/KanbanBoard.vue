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
    <div v-if="taskStore.error" class="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
      {{ taskStore.error }}
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2">
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
