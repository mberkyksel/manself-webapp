<script setup>
import { reactive, ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  note: { type: Object, required: true },
});

const emit = defineEmits(['focus', 'move', 'update-text', 'update-color', 'delete']);

const NOTE_SIZE = 200;
const TEXT_SAVE_DELAY = 500;

const COLORS = [
  { key: 'yellow', class: 'bg-amber-100' },
  { key: 'cyan', class: 'bg-cyan-100' },
  { key: 'green', class: 'bg-emerald-100' },
];
const colorClasses = { yellow: 'bg-amber-100', cyan: 'bg-cyan-100', green: 'bg-emerald-100' };

// Local reactive position so dragging feels instant; only synced back to
// the store (and persisted) on mouseup.
const position = reactive({ x: props.note.positionX, y: props.note.positionY });
const dragging = ref(false);
let dragOffset = { x: 0, y: 0 };

watch(
  () => [props.note.positionX, props.note.positionY],
  ([x, y]) => {
    if (!dragging.value) {
      position.x = x;
      position.y = y;
    }
  }
);

function clamp(value, max) {
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}

function onMouseMove(event) {
  if (!dragging.value) return;
  position.x = clamp(event.clientX - dragOffset.x, window.innerWidth - NOTE_SIZE);
  position.y = clamp(event.clientY - dragOffset.y, window.innerHeight - NOTE_SIZE);
}

function stopDragging() {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', stopDragging);
  if (!dragging.value) return;
  dragging.value = false;
  emit('move', { x: position.x, y: position.y });
}

function onMouseDown(event) {
  emit('focus');

  // Let clicks on the textarea/buttons behave normally (typing, color pick,
  // delete) instead of starting a drag.
  if (event.target.closest('textarea, button')) return;

  dragging.value = true;
  dragOffset = { x: event.clientX - position.x, y: event.clientY - position.y };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', stopDragging);
}

// Defensive cleanup in case the note is deleted (unmounted) mid-drag.
onUnmounted(stopDragging);

const localText = ref(props.note.text);
let saveTimer = null;

function onInput(event) {
  localText.value = event.target.value;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => emit('update-text', localText.value), TEXT_SAVE_DELAY);
}

function flushText() {
  clearTimeout(saveTimer);
  emit('update-text', localText.value);
}

onUnmounted(() => clearTimeout(saveTimer));
</script>

<template>
  <div
    class="sticky-note"
    :class="colorClasses[note.color]"
    :style="{ left: `${position.x}px`, top: `${position.y}px`, zIndex: note.zIndex }"
    @mousedown="onMouseDown"
  >
    <div class="sticky-note__handle">
      <div class="sticky-note__swatches">
        <button
          v-for="c in COLORS"
          :key="c.key"
          type="button"
          class="sticky-note__swatch"
          :class="[c.class, note.color === c.key && 'sticky-note__swatch--active']"
          :aria-label="`Set color ${c.key}`"
          @click="emit('update-color', c.key)"
        />
      </div>
      <button type="button" class="sticky-note__delete" aria-label="Delete note" @click="emit('delete')">
        &times;
      </button>
    </div>

    <textarea
      class="sticky-note__textarea"
      :value="localText"
      placeholder="Type something..."
      @input="onInput"
      @blur="flushText"
    />
  </div>
</template>

<style scoped>
.sticky-note {
  @apply pointer-events-auto absolute flex h-[200px] w-[200px] flex-col rounded-lg shadow-lg;
}
.sticky-note__handle {
  @apply flex cursor-grab items-center justify-between rounded-t-lg px-2 py-1.5 active:cursor-grabbing;
}
.sticky-note__swatches {
  @apply flex items-center gap-1.5;
}
.sticky-note__swatch {
  @apply h-3.5 w-3.5 rounded-full border border-black/10;
}
.sticky-note__swatch--active {
  @apply ring-2 ring-slate-500/60 ring-offset-1;
}
.sticky-note__delete {
  @apply text-base leading-none text-slate-500 hover:text-rose-600;
}
.sticky-note__textarea {
  @apply h-full w-full flex-1 resize-none border-none bg-transparent p-2 pt-0 text-sm text-slate-700 focus:outline-none;
}
</style>
