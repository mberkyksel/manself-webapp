<script setup>
import { ref } from 'vue';
import { Info, WashingMachine, ShoppingCart, BrushCleaning, PaintBucket } from '@lucide/vue';
import { CHORE_TYPES, LAUNDRY_STATES, choreColorClass } from '../../constants/chores.js';

const legendOpen = ref(false);
const laundryState = ref('white');

function cycleLaundryState() {
  const nextIndex = (LAUNDRY_STATES.indexOf(laundryState.value) + 1) % LAUNDRY_STATES.length;
  laundryState.value = LAUNDRY_STATES[nextIndex];
}

function onDragStart(event, type, state = null) {
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/json', JSON.stringify({ type, state }));
}
</script>

<template>
  <div class="chores-widget">
    <div class="chores-widget__header">
      <span class="chores-widget__title">House Chores</span>
      <button
        type="button"
        class="chores-widget__info-btn"
        :aria-expanded="legendOpen"
        title="What do these icons mean?"
        @click="legendOpen = !legendOpen"
      >
        <Info :size="14" />
      </button>
    </div>

    <div class="chores-widget__icons">
      <button
        type="button"
        draggable="true"
        class="chores-widget__icon-btn"
        :class="choreColorClass({ type: CHORE_TYPES.LAUNDRY, state: laundryState })"
        title="Laundry — click to change load color, drag to schedule"
        @click="cycleLaundryState"
        @dragstart="onDragStart($event, CHORE_TYPES.LAUNDRY, laundryState)"
      >
        <WashingMachine :size="18" />
      </button>

      <button
        type="button"
        draggable="true"
        class="chores-widget__icon-btn"
        :class="choreColorClass({ type: CHORE_TYPES.GROCERIES })"
        title="Groceries — drag to schedule"
        @dragstart="onDragStart($event, CHORE_TYPES.GROCERIES)"
      >
        <ShoppingCart :size="18" />
      </button>

      <button
        type="button"
        draggable="true"
        class="chores-widget__icon-btn"
        :class="choreColorClass({ type: CHORE_TYPES.SWEEP })"
        title="Sweeping — drag to schedule"
        @dragstart="onDragStart($event, CHORE_TYPES.SWEEP)"
      >
        <BrushCleaning :size="18" />
      </button>

      <button
        type="button"
        draggable="true"
        class="chores-widget__icon-btn"
        :class="choreColorClass({ type: CHORE_TYPES.MOP })"
        title="Mopping — drag to schedule"
        @dragstart="onDragStart($event, CHORE_TYPES.MOP)"
      >
        <PaintBucket :size="18" />
      </button>
    </div>

    <div class="chores-widget__legend" :class="legendOpen ? 'chores-widget__legend--open' : ''">
      <ul class="chores-widget__legend-list">
        <li><WashingMachine :size="12" class="chores-widget__legend-icon" /> Laundry — click cycles Whites / Colors / Darks</li>
        <li><ShoppingCart :size="12" class="chores-widget__legend-icon" /> Groceries — shopping run</li>
        <li><BrushCleaning :size="12" class="chores-widget__legend-icon" /> Sweeping — floors need a sweep or vacuum</li>
        <li><PaintBucket :size="12" class="chores-widget__legend-icon" /> Mopping — floors need a mop</li>
      </ul>
      <p class="chores-widget__legend-hint">Drag any icon onto a day. Click a scheduled badge to remove it.</p>
    </div>
  </div>
</template>

<style scoped>
.chores-widget {
  @apply fixed right-4 top-4 z-50 w-56 rounded-2xl border border-white/40 bg-white/30 p-3 shadow-lg shadow-slate-900/10 backdrop-blur-md;
}
.chores-widget__header {
  @apply flex items-center justify-between;
}
.chores-widget__title {
  @apply text-xs font-semibold uppercase tracking-wide text-slate-600;
}
.chores-widget__info-btn {
  @apply flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-white/60 hover:text-slate-700;
}
.chores-widget__icons {
  @apply mt-3 flex items-center justify-between gap-2;
}
.chores-widget__icon-btn {
  @apply flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-full shadow-sm transition-transform duration-150 hover:scale-105 active:cursor-grabbing;
}
.chores-widget__legend {
  @apply mt-0 max-h-0 overflow-hidden opacity-0 transition-all duration-300;
}
.chores-widget__legend--open {
  @apply mt-3 max-h-64 opacity-100;
}
.chores-widget__legend-list {
  @apply flex flex-col gap-1.5 text-[11px] text-slate-600;
}
.chores-widget__legend-list li {
  @apply flex items-center gap-1.5;
}
.chores-widget__legend-icon {
  @apply shrink-0 text-slate-500;
}
.chores-widget__legend-hint {
  @apply mt-2 border-t border-white/40 pt-2 text-[10px] text-slate-500;
}
</style>
