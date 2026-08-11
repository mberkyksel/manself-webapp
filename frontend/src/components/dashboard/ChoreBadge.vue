<script setup>
import { choreIcon, choreColorClass, choreLabel } from '../../constants/chores.js';
import { useChoreBadgeClick } from '../../composables/useChoreBadgeClick.js';

const props = defineProps({
  chore: { type: Object, required: true },
  size: { type: String, default: 'sm' }, // 'sm' (calendar badge) | 'md' (welcome panel)
});

const emit = defineEmits(['toggle', 'delete', 'cycle-recurrence']);

const { onBadgeClick, onBadgeDoubleClick } = useChoreBadgeClick({
  onToggle: () => emit('toggle', props.chore.id),
  onDelete: () => emit('delete', props.chore.id),
});

const RECURRENCE_LABELS = { daily: 'repeats daily', weekly: 'repeats weekly' };

function recurrenceHint() {
  const label = RECURRENCE_LABELS[props.chore.recurrence];
  return label ? `, ${label} (right-click to change)` : ', right-click to repeat';
}
</script>

<template>
  <button
    type="button"
    class="chore-badge"
    :class="[`chore-badge--${size}`, chore.isDone ? 'chore-badge--done' : choreColorClass(chore)]"
    :title="`${choreLabel(chore)} — click to toggle done, double-click to remove${recurrenceHint()}`"
    @click="onBadgeClick"
    @dblclick="onBadgeDoubleClick"
    @contextmenu.prevent="emit('cycle-recurrence', chore.id)"
  >
    <component :is="choreIcon(chore.type)" :size="size === 'md' ? 16 : 11" />
    <span v-if="chore.isDone" class="chore-badge__check" aria-hidden="true">✅</span>
    <span
      v-if="chore.recurrence && chore.recurrence !== 'none'"
      class="chore-badge__repeat"
      :title="RECURRENCE_LABELS[chore.recurrence]"
      aria-hidden="true"
      >🔁</span
    >
  </button>
</template>

<style scoped>
.chore-badge {
  @apply flex shrink-0 items-center justify-center rounded-full shadow-sm;
}
.chore-badge--sm {
  @apply h-4 w-4;
}
.chore-badge--md {
  @apply h-8 w-8;
}
.chore-badge--done {
  @apply bg-emerald-100 ring-1 ring-inset ring-emerald-300;
}
.chore-badge__check {
  /* Overlaid on top of the icon rather than replacing it, so a completed
     chore is still identifiable by its type at a glance instead of only
     via the hover tooltip - the reduced opacity lets the icon show through. */
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  opacity: 0.75;
  pointer-events: none;
}
.chore-badge--sm .chore-badge__check {
  font-size: 9px;
}
.chore-badge--md .chore-badge__check {
  font-size: 15px;
}
.chore-badge {
  position: relative;
}
.chore-badge__repeat {
  @apply absolute -bottom-1 -right-1 leading-none;
  font-size: 8px;
}
.chore-badge--md .chore-badge__repeat {
  font-size: 11px;
}
</style>
