<script setup>
import { reactive, ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps({
  note: { type: Object, required: true },
});

// Every note gets a small persistent tilt, like it was actually stuck down
// by hand, deterministic per id so it doesn't jump around on re-render.
const restRotation = computed(() => {
  const n = props.note.id;
  return (((n * 47) % 13) - 6) * 0.5;
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
    :class="[colorClasses[note.color], { 'sticky-note--dragging': dragging }]"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex: note.zIndex,
      '--rest-rotation': `${restRotation}deg`,
    }"
    @mousedown="onMouseDown"
  >
    <div class="sticky-note__content">
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
  </div>
</template>

<style scoped>
/*
 * Font: Permanent Marker, imported in index.html via <link> (preconnect +
 * stylesheet, non-render-blocking). Equivalent @import if you ever need to
 * inline it into a global stylesheet instead:
 *   @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
 * It only ships one weight (400) - there's no bold cut to switch to, so the
 * extra "thick marker" weight below is faked with a text-stroke + shadow
 * stack on .sticky-note__textarea rather than font-weight.
 */

.sticky-note {
  @apply pointer-events-auto absolute flex h-[200px] w-[200px] flex-col rounded-lg;

  /* Two background-image layers over the Tailwind bg-color utility below:
     a diagonal light/dark sheen (uneven reflection off the paper) painted
     on top, and a fine noise grain underneath it. Listed top-to-bottom;
     background-blend-mode pairs with them in the same order. */
  background-image: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0) 45%,
      rgba(0, 0, 0, 0.05) 100%
    ),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-blend-mode: soft-light, multiply;

  /* One tight, dark shadow to pin down the paper's own edge, plus one
     soft, blurred, asymmetric shadow (offset down-right, as if lit from
     the upper left) so the note reads as lifting off the surface. */
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3), 6px 14px 24px -8px rgba(0, 0, 0, 0.28);

  transform: rotate(var(--rest-rotation, 0deg));
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.sticky-note:hover {
  transform: rotate(calc(var(--rest-rotation, 0deg) * 1.6)) scale(1.035);
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.3), 10px 20px 32px -8px rgba(0, 0, 0, 0.32);
}
.sticky-note.sticky-note--dragging {
  transform: rotate(-1.5deg) scale(1.06);
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.32), 14px 28px 42px -10px rgba(0, 0, 0, 0.4);
  cursor: grabbing;
}

/* Folded corner, built from two stacked pseudo-elements for real depth:
   ::before is a soft, blurred dark patch cast onto the page by the lifted
   flap; ::after is the flap itself, a crisp triangle lightest at the
   crease (catching light as it lifts) and darkest at the folded tip. */
.sticky-note::before {
  content: '';
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 34px;
  height: 34px;
  pointer-events: none;
  background: radial-gradient(circle at 100% 100%, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.16) 45%, transparent 72%);
  filter: blur(3px);
  z-index: 0;
}
.sticky-note::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28px;
  height: 28px;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.35) 35%,
    rgba(0, 0, 0, 0.1) 60%,
    rgba(0, 0, 0, 0.28) 100%
  );
  clip-path: polygon(100% 0, 0% 100%, 100% 100%);
  border-bottom-right-radius: 8px;
  box-shadow: -1px -1px 3px rgba(0, 0, 0, 0.22);
  z-index: 1;
}

/* Real DOM content sits above both corner pseudo-elements. */
.sticky-note__content {
  @apply relative z-[2] flex h-full w-full flex-col;
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
  @apply h-full w-full flex-1 resize-none border-none bg-transparent p-2 pt-0 text-base leading-relaxed text-slate-800 focus:outline-none;
  font-family: 'Permanent Marker', cursive;
  /* Permanent Marker has no bold weight to switch to, so the "thick
     marker" feel comes from a hairline stroke plus a soft downward
     shadow instead of font-weight. */
  -webkit-text-stroke: 0.5px currentColor;
  text-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.15);
}
.sticky-note__textarea::placeholder {
  @apply text-slate-800/40;
}
</style>
