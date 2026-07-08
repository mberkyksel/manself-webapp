<script setup>
defineProps({
  task: { type: Object, required: true },
});

defineEmits(['dragstart', 'dragend', 'remove']);

const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};
</script>

<template>
  <div
    draggable="true"
    class="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
    @dragstart="$emit('dragstart')"
    @dragend="$emit('dragend')"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-medium text-slate-800">{{ task.title }}</p>
      <button
        type="button"
        class="shrink-0 text-slate-300 hover:text-rose-500"
        aria-label="Delete task"
        @click="$emit('remove')"
      >
        &times;
      </button>
    </div>

    <p v-if="task.description" class="mt-1 line-clamp-2 text-xs text-slate-500">
      {{ task.description }}
    </p>

    <div class="mt-2 flex items-center justify-between">
      <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', priorityStyles[task.priority]]">
        {{ task.priority }}
      </span>
      <span v-if="task.dueDate" class="text-xs text-slate-400">{{ task.dueDate }}</span>
    </div>
  </div>
</template>
