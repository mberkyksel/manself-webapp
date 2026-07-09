<script setup>
import { ref, computed, onMounted } from 'vue';
import CalendarDayCell from './CalendarDayCell.vue';
import { calendarService } from '../../services/calendarService.js';

const today = new Date();
const viewDate = ref(new Date(today.getFullYear(), today.getMonth(), 1));

// Single source of truth for the collapsed/expanded toggle. Collapsed shows
// a compact 15-day horizon; expanded shows the full month grid for viewDate.
const isExpanded = ref(false);

const events = ref([]);
const error = ref(null);

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

// Collapsed default: today plus the next 14 days (a half-month/bi-weekly
// horizon), independent of calendar-month boundaries.
const next15Days = computed(() => {
  const days = [];
  for (let i = 0; i < 15; i++) {
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
  for (const event of events.value) {
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

async function fetchEvents() {
  try {
    events.value = await calendarService.list();
  } catch (err) {
    error.value = 'Could not load calendar events. Is the backend running?';
    console.error(err);
  }
}

onMounted(fetchEvents);

async function addEvent(payload) {
  try {
    const event = await calendarService.create(payload);
    events.value.push(event);
  } catch (err) {
    error.value = 'Could not create event.';
    console.error(err);
  }
}

async function removeEvent(id) {
  const previous = events.value;
  events.value = events.value.filter((e) => e.id !== id);
  try {
    await calendarService.remove(id);
  } catch (err) {
    events.value = previous;
    console.error(err);
  }
}
</script>

<template>
  <div class="rounded-xl bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-600">
        {{ isExpanded ? monthLabel : 'Next 15 days' }}
      </h2>

      <div class="flex items-center gap-1">
        <template v-if="isExpanded">
          <button type="button" class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" @click="goToday">
            Today
          </button>
          <button type="button" class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" @click="prevMonth">
            &lsaquo;
          </button>
          <button type="button" class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" @click="nextMonth">
            &rsaquo;
          </button>
        </template>
        <button
          type="button"
          class="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
          @click="toggleExpanded"
        >
          {{ isExpanded ? 'Collapse ▲' : 'Full month ▾' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="mb-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-600">{{ error }}</p>

    <!-- Collapsed: compact 15-day list -->
    <div v-if="!isExpanded" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <CalendarDayCell
        v-for="date in next15Days"
        :key="dateKey(date)"
        :date="date"
        :events="eventsFor(date)"
        :is-today="isToday(date)"
        compact
        class="rounded-lg border border-slate-100"
        @add-event="addEvent"
        @remove-event="removeEvent"
      />
    </div>

    <!-- Expanded: full month grid -->
    <template v-else>
      <div
        class="grid grid-cols-7 gap-px overflow-hidden rounded-t-lg bg-slate-200 text-center text-[11px] font-medium text-slate-500"
      >
        <div v-for="label in dayLabels" :key="label" class="bg-slate-50 py-1">{{ label }}</div>
      </div>

      <div class="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg bg-slate-200">
        <CalendarDayCell
          v-for="cell in monthCells"
          :key="dateKey(cell.date)"
          :date="cell.date"
          :events="eventsFor(cell.date)"
          :is-today="isToday(cell.date)"
          :outside="cell.outside"
          @add-event="addEvent"
          @remove-event="removeEvent"
        />
      </div>
    </template>
  </div>
</template>
