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
    :class="{ 'sticky-note--dragging': dragging }"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex: note.zIndex,
      '--rest-rotation': `${restRotation}deg`,
    }"
    @mousedown="onMouseDown"
  >
    <!-- The page's own body. Clipped with a notch matching the fold's
         footprint - once the corner is genuinely rotated away in 3D
         (see .sticky-note__fold below), that corner of the page itself
         has to actually be gone, or its square edge shows past the
         now-foreshortened flap sitting in front of it. -->
    <div class="sticky-note__page" :class="colorClasses[note.color]">
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

    <!-- Real 3D fold: a small flap rotated in space around the diagonal
         crease, with separate front/back faces so the back genuinely
         comes into view as it rotates past 90deg, instead of a flat
         gradient standing in for depth. -->
    <div class="sticky-note__fold" aria-hidden="true">
      <div class="sticky-note__fold-face sticky-note__fold-face--front"></div>
      <div class="sticky-note__fold-face sticky-note__fold-face--back"></div>
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
  @apply pointer-events-auto absolute flex h-[200px] w-[200px] flex-col;
  perspective: 220px;

  transform: rotate(var(--rest-rotation, 0deg));
  transition: transform 0.15s ease;
}
.sticky-note:hover {
  transform: rotate(calc(var(--rest-rotation, 0deg) * 1.6)) scale(1.035);
}
.sticky-note.sticky-note--dragging {
  transform: rotate(-1.5deg) scale(1.06);
  cursor: grabbing;
}

/* Soft blurred shadow cast into the gap under the fold - sits on the
   outer element (unclipped) rather than .sticky-note__page, so cutting
   that page's corner below doesn't cut the shadow meant to fill the gap. */
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

/* The page's own body. Clipped to a pentagon: full square minus the
   bottom-right corner triangle that the fold now occupies in 3D, with
   the other 3 corners kept at the previous 8px rounding via arcs in the
   path (clip-path polygons can't mix straight cuts and round corners,
   hence path() instead of a plain polygon). */
.sticky-note__page {
  @apply relative h-full w-full;
  clip-path: path(
    'M8 0 L192 0 A8 8 0 0 1 200 8 L200 158 L158 200 L8 200 A8 8 0 0 1 0 192 L0 8 A8 8 0 0 1 8 0 Z'
  );

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
  transition: box-shadow 0.15s ease;
}
.sticky-note:hover .sticky-note__page {
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.3), 10px 20px 32px -8px rgba(0, 0, 0, 0.32);
}
.sticky-note.sticky-note--dragging .sticky-note__page {
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.32), 14px 28px 42px -10px rgba(0, 0, 0, 0.4);
}

/* Real 3D fold: rotated around the diagonal crease (axis (1,-1,0), the
   anti-diagonal of the flap's own box) rather than faked with a gradient.
   Past 90deg the front face's backface-visibility hides it and the back
   face - pre-rotated 180deg on the same axis so it lands facing the
   viewer - takes over, the same technique flip-cards use, just on a
   diagonal axis instead of a straight one. */
.sticky-note__fold {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 42px;
  height: 42px;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  transform: rotate3d(1, -1, 0, 155deg);
  transition: transform 0.2s ease;
  pointer-events: none;
  z-index: 1;
}
.sticky-note:hover .sticky-note__fold {
  transform: rotate3d(1, -1, 0, 167deg);
}
.sticky-note.sticky-note--dragging .sticky-note__fold {
  transform: rotate3d(1, -1, 0, 170deg);
}
.sticky-note__fold-face {
  position: absolute;
  inset: 0;
  clip-path: polygon(100% 0, 0% 100%, 100% 100%);
  backface-visibility: hidden;
}
.sticky-note__fold-face--front {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0.04));
}
.sticky-note__fold-face--back {
  transform: rotate3d(1, -1, 0, 180deg);
  background: linear-gradient(315deg, #fffbea 0%, #f0dc9a 45%, #c9a94f 100%);
  box-shadow: -3px 3px 8px rgba(0, 0, 0, 0.32);
}
.sticky-note__page.bg-cyan-100 ~ .sticky-note__fold .sticky-note__fold-face--back {
  background: linear-gradient(315deg, #f2fdff 0%, #a9e4ee 45%, #4fb3c4 100%);
}
.sticky-note__page.bg-emerald-100 ~ .sticky-note__fold .sticky-note__fold-face--back {
  background: linear-gradient(315deg, #f3fdf7 0%, #a3e6c1 45%, #4aa876 100%);
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
