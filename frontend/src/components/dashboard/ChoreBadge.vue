<script setup>
import { computed, onBeforeUnmount } from 'vue';
import { choreIcon, choreColorClass, choreLabel } from '../../constants/chores.js';
import { useChoreBadgeClick } from '../../composables/useChoreBadgeClick.js';

const props = defineProps({
  chore: { type: Object, required: true },
  size: { type: String, default: 'sm' }, // 'sm' (calendar badge) | 'md' (welcome panel)
});

const emit = defineEmits(['toggle', 'delete', 'repeat-menu']);

const { onBadgeClick, onBadgeDoubleClick } = useChoreBadgeClick({
  onToggle: () => emit('toggle', props.chore.id),
  onDelete: () => emit('delete', props.chore.id),
});

// Right-click on a mouse, the menu key on a keyboard, long-press on touch:
// all open the repeat menu next to the badge.
function openRepeatMenu(event, point = null) {
  const trigger = event.currentTarget;
  let { x, y } = point ?? { x: event.clientX, y: event.clientY };
  // A keyboard-opened context menu reports no pointer position.
  if (!x && !y) {
    const rect = trigger.getBoundingClientRect();
    x = rect.left;
    y = rect.bottom;
  }
  emit('repeat-menu', { choreId: props.chore.id, x, y, trigger });
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_PX = 10;
let pressTimer = null;
let pressStart = null;
// The finger lifting after a long press still produces a click, which must
// not also tick the chore off.
let swallowClick = false;

function cancelPress() {
  clearTimeout(pressTimer);
  pressTimer = null;
}

function onPointerDown(event) {
  if (event.pointerType !== 'touch') return;
  pressStart = { x: event.clientX, y: event.clientY };
  const target = { currentTarget: event.currentTarget };
  cancelPress();
  pressTimer = setTimeout(() => {
    pressTimer = null;
    swallowClick = true;
    openRepeatMenu(target, pressStart);
  }, LONG_PRESS_MS);
}

function onPointerMove(event) {
  if (!pressTimer) return;
  if (Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > LONG_PRESS_MOVE_PX) cancelPress();
}

function onClick() {
  if (swallowClick) {
    swallowClick = false;
    return;
  }
  onBadgeClick();
}

onBeforeUnmount(cancelPress);

const title = computed(() => {
  const repeat = props.chore.repeatLabel ? `, repeats: ${props.chore.repeatLabel}` : '';
  return `${choreLabel(props.chore)} — click to toggle done, double-click to remove, right-click or long-press to set repeat${repeat}`;
});
</script>

<template>
  <button
    type="button"
    class="chore-badge"
    :class="[`chore-badge--${size}`, chore.isDone ? 'chore-badge--done' : choreColorClass(chore)]"
    :title="title"
    aria-haspopup="menu"
    @click="onClick"
    @dblclick="onBadgeDoubleClick"
    @contextmenu.prevent="openRepeatMenu"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="cancelPress"
    @pointercancel="cancelPress"
    @pointerleave="cancelPress"
  >
    <component :is="choreIcon(chore.type)" :size="size === 'md' ? 16 : 11" />
    <span v-if="chore.isDone" class="chore-badge__check" aria-hidden="true">✅</span>
    <span v-if="chore.repeatLabel" class="chore-badge__repeat" aria-hidden="true">🔁</span>
  </button>
</template>

<style scoped>
.chore-badge {
  @apply flex shrink-0 items-center justify-center rounded-full shadow-sm;
  /* A long press opens the repeat menu, so keep the browser's own touch
     callout and text selection out of it. */
  -webkit-touch-callout: none;
  user-select: none;
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
  /* Corner badge like .chore-badge__repeat below, rather than replacing or
     overlaying the icon, so a completed chore is still identifiable by its
     type at a glance instead of only via the hover tooltip. Opposite corner
     from the repeat badge so a recurring, completed chore shows both. */
  @apply absolute -top-1 -right-1 leading-none;
  font-size: 8px;
}
.chore-badge--md .chore-badge__check {
  font-size: 11px;
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
