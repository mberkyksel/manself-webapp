<script setup>
defineProps({
  task: { type: Object, required: true },
});

defineEmits(['dragstart', 'dragend', 'remove', 'update-due-date', 'sync-due-date']);
</script>

<template>
  <div draggable="true" class="task-card" @dragstart="$emit('dragstart')" @dragend="$emit('dragend')">
    <div class="task-card__header">
      <p class="task-card__title">{{ task.title }}</p>
      <button type="button" class="task-card__delete" aria-label="Delete task" @click="$emit('remove')">
        &times;
      </button>
    </div>

    <span
      v-if="task.calendarEvents?.length"
      class="task-card__event-badge"
      :title="`${task.calendarEvents.length} linked calendar event${task.calendarEvents.length > 1 ? 's' : ''}`"
    >
      📅 {{ task.calendarEvents.length }}
    </span>

    <p v-if="task.description" class="task-card__description">
      {{ task.description }}
    </p>

    <div class="task-card__footer">
      <span :class="['task-card__priority', `task-card__priority--${task.priority}`]">
        {{ task.priority }}
      </span>
      <input
        type="date"
        class="task-card__due-date"
        :value="task.dueDate || ''"
        @change="$emit('update-due-date', $event.target.value || null)"
      />
      <button
        v-if="task.dueDate"
        type="button"
        title="Sync due date to calendar"
        class="task-card__sync"
        @click="$emit('sync-due-date')"
      >
        📅↻
      </button>
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
.task-card__event-badge {
  @apply mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600;
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
  @apply rounded border-none bg-transparent text-xs text-slate-400 focus:outline-none;
}
.task-card__sync {
  @apply shrink-0 text-xs text-slate-300 hover:text-indigo-600;
}
</style>
