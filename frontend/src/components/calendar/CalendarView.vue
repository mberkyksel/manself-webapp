<script setup>
import { ref, computed, onMounted } from 'vue';
import CalendarDayCell from './CalendarDayCell.vue';
import { useTaskStore } from '../../stores/taskStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useChoreStore } from '../../stores/choreStore.js';

const taskStore = useTaskStore();
const calendarStore = useCalendarStore();
const choreStore = useChoreStore();

const today = new Date();
const viewDate = ref(new Date(today.getFullYear(), today.getMonth(), 1));

// Single source of truth for the collapsed/expanded toggle. Collapsed shows
// a compact 15-day horizon; expanded shows the full month grid for viewDate.
const isExpanded = ref(false);

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate.value)
);

// Local calendar-grid math only (no timezone conversion involved), so plain
// local getters are safe here.
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(date) {
  return dateKey(date) === dateKey(today);
}

// Collapsed default: today plus the next 10 days (a half-month/bi-weekly
// horizon), independent of calendar-month boundaries.
const next10Days = computed(() => {
  const days = [];
  for (let i = 0; i < 10; i++) {
    days.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }
  return days;
});

// Expanded: the full month grid for viewDate, padded with the leading/
// trailing days needed to fill out the first and last weeks.
const monthCells = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true });
  }

  return cells;
});

const eventsByDay = computed(() => {
  const map = {};
  for (const event of calendarStore.events) {
    const key = dateKey(new Date(event.startTime));
    (map[key] ??= []).push(event);
  }
  for (const key in map) {
    map[key].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }
  return map;
});

function eventsFor(date) {
  return eventsByDay.value[dateKey(date)] || [];
}

function choresFor(date) {
  const chores = choreStore.choresByDate[dateKey(date)] || [];
  return chores.map((chore) => ({
    ...chore,
    recurrence: chore.seriesId ? (choreStore.recurringSeries[chore.seriesId]?.recurrence ?? 'none') : 'none',
  }));
}

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1);
}
function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1);
}
function goToday() {
  viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
}

function toggleExpanded() {
  if (!isExpanded.value) {
    viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  isExpanded.value = !isExpanded.value;
}

onMounted(calendarStore.fetchEvents);
onMounted(taskStore.fetchTasks);
// Catches date rollover across app sessions (e.g. reopening after a few
// days away) so recurring series stay filled up to their window.
onMounted(choreStore.materializeSeries);

async function addEvent(payload) {
  try {
    await calendarStore.addEvent(payload);
  } catch (err) {
    calendarStore.error = 'Could not create event.';
    console.error(err);
  }
}

async function updateEvent(id, payload) {
  try {
    await calendarStore.updateEvent(id, payload);
  } catch (err) {
    calendarStore.error = 'Could not update event.';
    console.error(err);
  }
}
</script>

<template>
  <div class="calendar-view">
    <div class="calendar-view__header">
      <h2 class="calendar-view__title">
        {{ isExpanded ? monthLabel : 'Next 1O days' }}
      </h2>

      <div class="calendar-view__nav">
        <template v-if="isExpanded">
          <button type="button" class="calendar-view__nav-btn" @click="goToday">Today</button>
          <button type="button" class="calendar-view__nav-btn" @click="prevMonth">&lsaquo;</button>
          <button type="button" class="calendar-view__nav-btn" @click="nextMonth">&rsaquo;</button>
        </template>
        <button type="button" class="calendar-view__nav-btn calendar-view__nav-btn--toggle" @click="toggleExpanded">
          {{ isExpanded ? 'Collapse ▲' : 'Full month ▾' }}
        </button>
      </div>
    </div>

    <p v-if="calendarStore.error" class="calendar-view__error">{{ calendarStore.error }}</p>

    <!-- Collapsed: compact 15-day list -->
    <div v-if="!isExpanded" class="calendar-view__compact-grid">
      <CalendarDayCell
        v-for="date in next10Days"
        :key="dateKey(date)"
        :date="date"
        :date-key="dateKey(date)"
        :events="eventsFor(date)"
        :tasks="taskStore.tasks"
        :chores="choresFor(date)"
        :is-today="isToday(date)"
        compact
        class="calendar-view__compact-cell"
        @add-event="addEvent"
        @update-event="({ id, payload }) => updateEvent(id, payload)"
        @remove-event="calendarStore.removeEvent"
        @remove-chore="choreStore.removeChore(dateKey(date), $event)"
        @toggle-chore="choreStore.toggleChoreDone(dateKey(date), $event)"
        @cycle-chore-recurrence="choreStore.cycleChoreRecurrence(dateKey(date), $event)"
      />
    </div>

    <!-- Expanded: full month grid -->
    <template v-else>
      <div class="calendar-view__weekday-row">
        <div v-for="label in dayLabels" :key="label" class="calendar-view__weekday">{{ label }}</div>
      </div>

      <div class="calendar-view__month-grid">
        <CalendarDayCell
          v-for="cell in monthCells"
          :key="dateKey(cell.date)"
          :date="cell.date"
          :date-key="dateKey(cell.date)"
          :events="eventsFor(cell.date)"
          :tasks="taskStore.tasks"
          :chores="choresFor(cell.date)"
          :is-today="isToday(cell.date)"
          :outside="cell.outside"
          @add-event="addEvent"
          @update-event="({ id, payload }) => updateEvent(id, payload)"
          @remove-event="calendarStore.removeEvent"
          @remove-chore="choreStore.removeChore(dateKey(cell.date), $event)"
          @toggle-chore="choreStore.toggleChoreDone(dateKey(cell.date), $event)"
          @cycle-chore-recurrence="choreStore.cycleChoreRecurrence(dateKey(cell.date), $event)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.calendar-view {
  @apply card bg-white p-4;
}
.calendar-view__header {
  @apply mb-3 flex items-center justify-between;
}
.calendar-view__title {
  @apply text-sm font-semibold text-slate-600;
}
.calendar-view__nav {
  @apply flex items-center gap-1;
}
.calendar-view__nav-btn {
  @apply rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100;
}
.calendar-view__nav-btn--toggle {
  @apply font-medium;
}
.calendar-view__error {
  @apply mb-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-600;
}
.calendar-view__compact-grid {
  @apply grid grid-cols-3 gap-2 sm:grid-cols-5;
}
.calendar-view__compact-cell {
  @apply rounded-lg border border-slate-100;
}
.calendar-view__weekday-row {
  @apply grid grid-cols-7 gap-px overflow-hidden rounded-t-lg bg-slate-200 text-center text-[11px] font-medium text-slate-500;
}
.calendar-view__weekday {
  @apply bg-slate-50 py-1;
}
.calendar-view__month-grid {
  @apply grid grid-cols-7 gap-px overflow-hidden rounded-b-lg bg-slate-200;
}
</style>
