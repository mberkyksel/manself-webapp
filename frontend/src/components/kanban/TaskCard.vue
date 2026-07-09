<script setup>
defineProps({
  task: { type: Object, required: true },
});

defineEmits(['dragstart', 'dragend', 'remove']);
</script>

<template>
  <div draggable="true" class="task-card" @dragstart="$emit('dragstart')" @dragend="$emit('dragend')">
    <div class="task-card__header">
      <p class="task-card__title">{{ task.title }}</p>
      <button type="button" class="task-card__delete" aria-label="Delete task" @click="$emit('remove')">
        &times;
      </button>
    </div>

    <p v-if="task.description" class="task-card__description">
      {{ task.description }}
    </p>

    <div class="task-card__footer">
      <span :class="['task-card__priority', `task-card__priority--${task.priority}`]">
        {{ task.priority }}
      </span>
      <span v-if="task.dueDate" class="task-card__due-date">{{ task.dueDate }}</span>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  @apply cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing;
}
.task-card__header {
  @apply flex items-start justify-between gap-2;
}
.task-card__title {
  @apply text-sm font-medium text-slate-800;
}
.task-card__delete {
  @apply shrink-0 text-slate-300 hover:text-rose-500;
}
.task-card__description {
  @apply mt-1 line-clamp-2 text-xs text-slate-500;
}
.task-card__footer {
  @apply mt-2 flex items-center justify-between;
}
.task-card__priority {
  @apply rounded-full px-2 py-0.5 text-xs font-medium;
}
.task-card__priority--low {
  @apply bg-slate-100 text-slate-600;
}
.task-card__priority--medium {
  @apply bg-amber-100 text-amber-700;
}
.task-card__priority--high {
  @apply bg-rose-100 text-rose-700;
}
.task-card__due-date {
  @apply text-xs text-slate-400;
}
</style>
