<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Check, Repeat } from '@lucide/vue';
import { choreLabel } from '../../constants/chores.js';
import { useChoreStore } from '../../stores/choreStore.js';
import { useChoreRepeatMenu } from '../../composables/useChoreRepeatMenu.js';
import {
  WEEKDAY_ORDER,
  describeRule,
  normalizeRule,
  repeatPresets,
  sameRule,
  weekdayName,
} from '../../utils/recurrence.js';

const choreStore = useChoreStore();
const { menu, close } = useChoreRepeatMenu();

const panel = ref(null);
const position = ref({ left: 0, top: 0 });

const chore = computed(() => menu.value && choreStore.choresByDate[menu.value.dateKey]?.find((c) => c.id === menu.value.choreId));
const current = computed(() => (chore.value ? choreStore.repeatRuleOf(chore.value) : null));
const anchorDateKey = computed(() => choreStore.recurringSeries[chore.value?.seriesId]?.anchorDateKey);

// The usual choices. A custom rule (say Tuesday and Thursday) matches none of
// them, so it is spelled out under the weekday chips instead of in the list:
// a row added to the top would push the chips down while they are being clicked.
const options = computed(() =>
  repeatPresets(menu.value.dateKey).map((preset) => {
    const rule = preset.rule && normalizeRule(preset.rule, menu.value.dateKey);
    return { ...preset, rule, checked: sameRule(rule, current.value) };
  })
);
const customLabel = computed(() =>
  current.value && !options.value.some((option) => option.checked) ? describeRule(current.value, anchorDateKey.value) : ''
);

const currentWeekdays = computed(() => (current.value?.recurrence === 'weekly' ? current.value.weekdays : []));

function pick(rule) {
  choreStore.setChoreRepeat(menu.value.dateKey, menu.value.choreId, rule);
  closeAndRestoreFocus();
}

// A weekday chip adds or removes that day from a weekly rule, keeping at
// least one day. From any other rule it starts "every week" on that day.
function toggleWeekday(day) {
  const weekly = current.value?.recurrence === 'weekly' ? current.value : { recurrence: 'weekly', interval: 1, weekdays: [] };
  const weekdays = weekly.weekdays.includes(day) ? weekly.weekdays.filter((d) => d !== day) : [...weekly.weekdays, day];
  if (weekdays.length === 0) return;
  choreStore.setChoreRepeat(menu.value.dateKey, menu.value.choreId, { ...weekly, weekdays });
}

function closeAndRestoreFocus() {
  const trigger = menu.value?.trigger;
  close();
  if (trigger?.isConnected) trigger.focus();
}

function items() {
  return [...(panel.value?.querySelectorAll('[role^="menuitem"]') ?? [])];
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeAndRestoreFocus();
    return;
  }
  if (event.key === 'Tab') {
    close();
    return;
  }

  const all = items();
  const index = all.indexOf(document.activeElement);
  const moves = {
    ArrowDown: index + 1,
    ArrowRight: index + 1,
    ArrowUp: index - 1,
    ArrowLeft: index - 1,
    Home: 0,
    End: all.length - 1,
  };
  if (event.key in moves) {
    event.preventDefault();
    all[(moves[event.key] + all.length) % all.length]?.focus();
  }
}

// Keeps the menu on screen: opens at the pointer, then slides back in if it
// would overflow the right or bottom edge.
async function place() {
  const { x, y } = menu.value;
  position.value = { left: x, top: y };
  await nextTick();
  if (!panel.value) return;
  const { width, height } = panel.value.getBoundingClientRect();
  const margin = 8;
  position.value = {
    left: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
    top: Math.max(margin, Math.min(y, window.innerHeight - height - margin)),
  };
  (panel.value.querySelector('[aria-checked="true"]') ?? items()[0])?.focus();
}

function onOutsidePointerDown(event) {
  if (panel.value && !panel.value.contains(event.target)) close();
}

const dismissEvents = ['resize', 'blur'];

watch(
  menu,
  (now, before) => {
    if (now && !before) {
      document.addEventListener('pointerdown', onOutsidePointerDown, true);
      document.addEventListener('scroll', close, true);
      dismissEvents.forEach((name) => window.addEventListener(name, close));
    } else if (!now && before) {
      removeListeners();
    }
    if (now) place();
  },
  { flush: 'post' }
);

// The chore can disappear while the menu is open (removed, undone, signed out).
watch(chore, (now) => {
  if (menu.value && !now) close();
});

function removeListeners() {
  document.removeEventListener('pointerdown', onOutsidePointerDown, true);
  document.removeEventListener('scroll', close, true);
  dismissEvents.forEach((name) => window.removeEventListener(name, close));
}

onBeforeUnmount(removeListeners);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="menu && chore"
      ref="panel"
      class="repeat-menu"
      role="menu"
      :aria-label="`Repeat ${choreLabel(chore)}`"
      :style="{ left: `${position.left}px`, top: `${position.top}px` }"
      @keydown="onKeydown"
      @contextmenu.prevent
    >
      <p class="repeat-menu__title">
        <Repeat :size="12" aria-hidden="true" />
        <span>Repeat · {{ choreLabel(chore) }}</span>
      </p>

      <button
        v-for="option in options"
        :key="option.label"
        type="button"
        role="menuitemradio"
        :aria-checked="option.checked"
        class="repeat-menu__item"
        :class="{ 'repeat-menu__item--checked': option.checked }"
        @click="pick(option.rule)"
      >
        <Check :size="14" class="repeat-menu__check" aria-hidden="true" />
        {{ option.label }}
      </button>

      <div class="repeat-menu__days">
        <p class="repeat-menu__days-label">On these weekdays</p>
        <div class="repeat-menu__chips">
          <button
            v-for="day in WEEKDAY_ORDER"
            :key="day"
            type="button"
            role="menuitemcheckbox"
            :aria-checked="currentWeekdays.includes(day)"
            :aria-label="weekdayName(day)"
            class="repeat-menu__chip"
            :class="{ 'repeat-menu__chip--on': currentWeekdays.includes(day) }"
            @click="toggleWeekday(day)"
          >
            {{ weekdayName(day).slice(0, 1) }}
          </button>
        </div>
        <p v-if="customLabel" class="repeat-menu__custom">{{ customLabel }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.repeat-menu {
  @apply fixed z-[9990] w-60 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-[0_12px_40px_-12px_rgba(30,41,59,0.45)];
}
.repeat-menu__title {
  @apply mb-1 flex items-center gap-1.5 px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400;
  border-bottom: 1px solid theme('colors.slate.100');
}
.repeat-menu__item {
  @apply flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none;
}
.repeat-menu__item--checked {
  @apply font-medium text-indigo-700;
}
.repeat-menu__check {
  @apply shrink-0 opacity-0;
}
.repeat-menu__item--checked .repeat-menu__check {
  @apply opacity-100;
}
.repeat-menu__days {
  @apply mt-1 px-2 pb-1.5 pt-2;
  border-top: 1px solid theme('colors.slate.100');
}
.repeat-menu__days-label {
  @apply mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400;
}
.repeat-menu__custom {
  @apply mt-2 text-xs font-medium text-indigo-700;
}
.repeat-menu__chips {
  @apply flex justify-between gap-1;
}
.repeat-menu__chip {
  @apply flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400;
}
.repeat-menu__chip--on {
  @apply border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700;
}
</style>
