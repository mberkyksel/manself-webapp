<script setup>
import { choreIcon, choreColorClass, choreLabel } from '../../constants/chores.js';
import { useChoreBadgeClick } from '../../composables/useChoreBadgeClick.js';

const props = defineProps({
  chore: { type: Object, required: true },
  size: { type: String, default: 'sm' }, // 'sm' (calendar badge) | 'md' (welcome panel)
});

const emit = defineEmits(['toggle', 'delete']);

const { onBadgeClick, onBadgeDoubleClick } = useChoreBadgeClick({
  onToggle: () => emit('toggle', props.chore.id),
  onDelete: () => emit('delete', props.chore.id),
});
</script>

<template>
  <button
    type="button"
    class="chore-badge"
    :class="[`chore-badge--${size}`, chore.isDone ? 'chore-badge--done' : choreColorClass(chore)]"
    :title="`${choreLabel(chore)} — click to toggle done, double-click to remove`"
    @click="onBadgeClick"
    @dblclick="onBadgeDoubleClick"
  >
    <span v-if="chore.isDone" class="chore-badge__check" aria-hidden="true">✅</span>
    <component :is="choreIcon(chore.type)" v-else :size="size === 'md' ? 16 : 11" />
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
  line-height: 1;
}
.chore-badge--sm .chore-badge__check {
  font-size: 9px;
}
.chore-badge--md .chore-badge__check {
  font-size: 15px;
}
</style>
