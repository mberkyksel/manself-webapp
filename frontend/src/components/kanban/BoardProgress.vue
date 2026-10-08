<script setup>
import { computed } from 'vue';
import { CircleAlert, CalendarClock } from '@lucide/vue';

const props = defineProps({
  total: { type: Number, required: true },
  done: { type: Number, required: true },
  overdue: { type: Number, default: 0 },
  dueToday: { type: Number, default: 0 },
});

const percent = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0));
</script>

<template>
  <div class="board-progress">
    <div class="board-progress__top">
      <h2 class="board-progress__title">Your board</h2>
      <span class="board-progress__summary">
        {{ total ? `${done} of ${total} done` : 'No tasks yet' }}
      </span>
    </div>

    <div
      class="board-progress__track"
      role="progressbar"
      aria-label="Tasks completed"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="board-progress__fill" :style="{ width: `${percent}%` }"></div>
    </div>

    <div v-if="overdue || dueToday" class="board-progress__chips">
      <span v-if="overdue" class="board-progress__chip board-progress__chip--overdue">
        <CircleAlert :size="12" aria-hidden="true" />
        {{ overdue }} overdue
      </span>
      <span v-if="dueToday" class="board-progress__chip board-progress__chip--today">
        <CalendarClock :size="12" aria-hidden="true" />
        {{ dueToday }} due today
      </span>
    </div>
  </div>
</template>

<style scoped>
.board-progress__top {
  @apply flex items-baseline justify-between gap-3;
}
.board-progress__title {
  @apply text-sm font-semibold text-slate-700;
}
.board-progress__summary {
  @apply text-xs font-medium text-slate-500;
}
.board-progress__track {
  @apply mt-2 h-2 overflow-hidden rounded-full bg-slate-100;
}
.board-progress__fill {
  @apply h-full rounded-full bg-emerald-500 transition-all duration-500;
}
.board-progress__chips {
  @apply mt-3 flex flex-wrap gap-2;
}
.board-progress__chip {
  @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium;
}
.board-progress__chip--overdue {
  @apply bg-rose-50 text-rose-600;
}
.board-progress__chip--today {
  @apply bg-amber-50 text-amber-700;
}
@media (prefers-reduced-motion: reduce) {
  .board-progress__fill {
    @apply transition-none;
  }
}
</style>
