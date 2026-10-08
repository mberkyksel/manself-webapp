<script setup>
import { computed, onMounted } from 'vue';
import KanbanColumn from './KanbanColumn.vue';
import BoardProgress from './BoardProgress.vue';
import { useTaskStore } from '../../stores/taskStore.js';
import { todayKey } from '../../utils/dueDate.js';

const taskStore = useTaskStore();

// "Now" is what's in progress, "Next" is what's queued. They keep the
// existing in_progress / todo statuses, so nothing changes in the database.
const lanes = [
  { status: 'in_progress', title: 'Now', subtitle: 'In progress', emphasis: true },
  { status: 'todo', title: 'Next', subtitle: 'To do', emphasis: false },
  { status: 'done', title: 'Done', subtitle: '', emphasis: false },
];

const progress = computed(() => {
  const today = todayKey();
  const open = taskStore.tasks.filter((task) => task.status !== 'done');
  return {
    total: taskStore.tasks.length,
    done: taskStore.tasks.length - open.length,
    overdue: open.filter((task) => task.dueDate && task.dueDate < today).length,
    dueToday: open.filter((task) => task.dueDate === today).length,
  };
});

onMounted(() => {
  taskStore.fetchTasks();
});
</script>

<template>
  <section class="kanban-board" aria-label="Task board">
    <BoardProgress v-bind="progress" />

    <div v-if="taskStore.error" class="kanban-board__error">
      {{ taskStore.error }}
    </div>

    <div class="kanban-board__lanes">
      <KanbanColumn
        v-for="lane in lanes"
        :key="lane.status"
        :status="lane.status"
        :title="lane.title"
        :subtitle="lane.subtitle"
        :emphasis="lane.emphasis"
        :tasks="taskStore.byStatus(lane.status)"
      />
    </div>
  </section>
</template>

<style scoped>
.kanban-board {
  @apply card bg-white p-5;
}
.kanban-board__error {
  @apply mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600;
}
.kanban-board__lanes {
  @apply mt-5 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1fr)];
}
</style>
