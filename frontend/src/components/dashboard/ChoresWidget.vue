<script setup>
import { ref, computed } from 'vue';
import {
  Info,
  WashingMachine,
  ShoppingCart,
  BrushCleaning,
  PaintBucket,
  Trash2,
  Sprout,
  CookingPot,
  Bed,
  Cog,
} from '@lucide/vue';
import { CHORE_TYPES, LAUNDRY_STATES, TRASH_STATES, MEAL_STATES, choreColorClass } from '../../constants/chores.js';

const legendOpen = ref(false);

const laundryState = ref('white');
const trashState = ref('grey');
const mealsState = ref('home');

function cycleState(stateRef, states) {
  const nextIndex = (states.indexOf(stateRef.value) + 1) % states.length;
  stateRef.value = states[nextIndex];
}

function onDragStart(event, type, state) {
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/json', JSON.stringify({ type, state: state ?? null }));
}

// Everyday chores, rendered as a 4-column icon grid.
const primaryIcons = computed(() => [
  {
    type: CHORE_TYPES.LAUNDRY,
    icon: WashingMachine,
    state: laundryState.value,
    title: 'Laundry — click to change load color, drag to schedule',
    onClick: () => cycleState(laundryState, LAUNDRY_STATES),
  },
  {
    type: CHORE_TYPES.GROCERIES,
    icon: ShoppingCart,
    state: null,
    title: 'Groceries — drag to schedule',
  },
  {
    type: CHORE_TYPES.SWEEP,
    icon: BrushCleaning,
    state: null,
    title: 'Sweeping — drag to schedule',
  },
  {
    type: CHORE_TYPES.MOP,
    icon: PaintBucket,
    state: null,
    title: 'Mopping — drag to schedule',
  },
  {
    type: CHORE_TYPES.TRASH,
    icon: Trash2,
    state: trashState.value,
    title: 'Trash — click to cycle Restmüll / Gelber Sack / Altpapier / Biomüll',
    onClick: () => cycleState(trashState, TRASH_STATES),
  },
  {
    type: CHORE_TYPES.PLANTS,
    icon: Sprout,
    state: null,
    title: 'Plant care — drag to schedule watering or fertilizing',
  },
  {
    type: CHORE_TYPES.MEALS,
    icon: CookingPot,
    state: mealsState.value,
    title: 'Meals — click to toggle Home Cooking / Weekly Meal Prep',
    onClick: () => cycleState(mealsState, MEAL_STATES),
  },
]);

// Deep Maintenance: less frequent, appliance-level upkeep.
const maintenanceIcons = computed(() => [
  {
    type: CHORE_TYPES.BED_LINEN,
    icon: Bed,
    state: null,
    title: 'Change bed linen — drag to schedule',
  },
  {
    type: CHORE_TYPES.WASHER_CLEAN,
    icon: WashingMachine,
    state: null,
    title: 'Washing machine self-clean (Trommelreinigung) — drag to schedule',
  },
  {
    type: CHORE_TYPES.DISHWASHER,
    icon: Cog,
    state: null,
    title: 'Dishwasher maintenance — drag to schedule',
  },
]);

const legendItems = [
  { icon: WashingMachine, text: 'Laundry — click cycles Whites / Colors / Darks' },
  { icon: ShoppingCart, text: 'Groceries — shopping run' },
  { icon: BrushCleaning, text: 'Sweeping — floors need a sweep or vacuum' },
  { icon: PaintBucket, text: 'Mopping — floors need a mop' },
  { icon: Trash2, text: 'Trash — click cycles Restmüll (grey) / Gelber Sack (yellow) / Altpapier (blue) / Biomüll (brown)' },
  { icon: Sprout, text: 'Plant Care — watering or fertilizing' },
  { icon: CookingPot, text: 'Meals — click toggles Home Cooking (orange) / Weekly Meal Prep (green)' },
  { icon: Bed, text: 'Bed Linen — time to change the sheets' },
  { icon: WashingMachine, text: 'Washer Self-Clean — monthly drum/scale clean (Trommelreinigung)' },
  { icon: Cog, text: 'Dishwasher — filter & deep clean' },
];
</script>

<template>
  <div class="chores-widget">
    <div class="chores-widget__roof" aria-hidden="true"></div>

    <div class="chores-widget__body">
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

      <div class="chores-widget__grid">
        <button
          v-for="item in primaryIcons"
          :key="item.type"
          type="button"
          draggable="true"
          class="chores-widget__icon-btn"
          :class="choreColorClass({ type: item.type, state: item.state })"
          :title="item.title"
          @click="item.onClick && item.onClick()"
          @dragstart="onDragStart($event, item.type, item.state)"
        >
          <component :is="item.icon" :size="16" />
        </button>
      </div>

      <div class="chores-widget__divider">
        <span class="chores-widget__divider-label">Deep Maintenance</span>
      </div>

      <div class="chores-widget__grid">
        <button
          v-for="item in maintenanceIcons"
          :key="item.type"
          type="button"
          draggable="true"
          class="chores-widget__icon-btn"
          :class="choreColorClass({ type: item.type, state: item.state })"
          :title="item.title"
          @dragstart="onDragStart($event, item.type, item.state)"
        >
          <component :is="item.icon" :size="16" />
        </button>
      </div>

      <div class="chores-widget__legend" :class="legendOpen ? 'chores-widget__legend--open' : ''">
        <ul class="chores-widget__legend-list">
          <li v-for="(entry, index) in legendItems" :key="index">
            <component :is="entry.icon" :size="12" class="chores-widget__legend-icon" />
            {{ entry.text }}
          </li>
        </ul>
        <p class="chores-widget__legend-hint">
          Drag any icon onto a day or the Welcome Panel. Click a scheduled badge to mark it done, double-click to
          remove it.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chores-widget {
  /* Tailwind's amber-400 (#fbbf24 = rgb(251,191,36)) and amber-700 (#b45309)
     are exactly the colors called out in spec, so the opacity-modifier
     utilities below hit those rgba() values precisely. */
  @apply fixed right-4 top-12 z-50 w-64 rounded-2xl border border-amber-400/20 bg-amber-400/10;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 10px 30px -10px rgba(120, 53, 15, 0.35);
}

/* Stylized gable roof, built with the classic CSS border-triangle technique
   (a zero-size box whose slanted borders form the triangle) instead of
   clip-path. clip-path + backdrop-filter on the same element is a known
   cross-browser/GPU compositing landmine that can silently fail to paint;
   this sidesteps it entirely at the cost of a live blur on the roof itself
   — the roof reads as glass via its translucent color + drop-shadow, while
   the body below keeps the full blur/gradient/inset-shadow treatment. */
.chores-widget__roof {
  position: absolute;
  top: -34px;
  left: 50%;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 122px solid transparent;
  border-right: 122px solid transparent;
  border-bottom: 38px solid rgba(251, 191, 36, 0.22);
  filter: drop-shadow(0 6px 10px rgba(120, 53, 15, 0.4));
}

.chores-widget__body {
  @apply relative p-3;
}
.chores-widget__header {
  @apply flex items-center justify-between;
}
.chores-widget__title {
  @apply text-xs font-semibold justify-center uppercase tracking-wide text-amber-900;
  text-align: center
}
.chores-widget__info-btn {
  @apply flex h-5 w-5 items-center justify-center rounded-full text-amber-700 hover:bg-amber-400/20 hover:text-amber-900;
}
.chores-widget__grid {
  @apply mt-3 grid grid-cols-4 gap-2;
}
.chores-widget__icon-btn {
  @apply flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-full shadow-sm transition-transform duration-150 hover:scale-105 active:cursor-grabbing;
}
.chores-widget__divider {
  @apply my-3 flex items-center gap-2;
}
.chores-widget__divider::before,
.chores-widget__divider::after {
  content: '';
  @apply h-px flex-1 bg-amber-400/30;
}
.chores-widget__divider-label {
  @apply shrink-0 text-[9px] font-semibold uppercase tracking-wide text-amber-700;
}
.chores-widget__legend {
  @apply mt-0 max-h-0 overflow-hidden opacity-0 transition-all duration-300;
}
.chores-widget__legend--open {
  @apply mt-3 max-h-[26rem] rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 opacity-100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
.chores-widget__legend-list {
  @apply flex flex-col gap-1.5 text-[11px] text-amber-900/90;
}
.chores-widget__legend-list li {
  @apply flex items-center gap-1.5;
}
.chores-widget__legend-icon {
  @apply shrink-0 text-amber-700;
}
.chores-widget__legend-hint {
  @apply mt-2 border-t border-amber-400/30 pt-2 text-[10px] text-amber-700;
}
</style>
