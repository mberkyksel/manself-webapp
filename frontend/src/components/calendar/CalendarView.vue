<script setup>
import { ref, computed, onMounted } from 'vue';
import { calendarService } from '../../services/calendarService.js';

const today = new Date();
const viewDate = ref(new Date(today.getFullYear(), today.getMonth(), 1));

const events = ref([]);
const error = ref(null);
const openDayKey = ref(null);
const form = ref({ title: '', startTime: '09:00', endTime: '10:00', allDay: false });

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

const weeks = computed(() => {
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

  const result = [];
  for (let i = 0; i < cells.length; i += 7) {
    result.push(cells.slice(i, i + 7));
  }
  return result;
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

function formatTime(iso) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
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

async function fetchEvents() {
  try {
    events.value = await calendarService.list();
  } catch (err) {
    error.value = 'Could not load calendar events. Is the backend running?';
    console.error(err);
  }
}

onMounted(fetchEvents);

function openForm(day) {
  openDayKey.value = dateKey(day.date);
  form.value = { title: '', startTime: '09:00', endTime: '10:00', allDay: false };
}
function closeForm() {
  openDayKey.value = null;
}

// Build unambiguous UTC instants from the clicked day's local Y/M/D plus the
// entered local time-of-day, so storage/display stay correct regardless of
// which timezone the backend process happens to run in.
async function submitForm(day) {
  const title = form.value.title.trim();
  if (!title) return;

  const y = day.date.getFullYear();
  const m = day.date.getMonth();
  const d = day.date.getDate();

  let startDate;
  let endDate;
  if (form.value.allDay) {
    startDate = new Date(y, m, d, 0, 0, 0);
    endDate = new Date(y, m, d, 23, 59, 59);
  } else {
    const [startH, startM] = form.value.startTime.split(':').map(Number);
    const [endH, endM] = form.value.endTime.split(':').map(Number);
    startDate = new Date(y, m, d, startH, startM);
    endDate = new Date(y, m, d, endH, endM);
  }

  try {
    const event = await calendarService.create({
      title,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      allDay: form.value.allDay,
    });
    events.value.push(event);
    closeForm();
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
      <h2 class="text-sm font-semibold text-slate-600">{{ monthLabel }}</h2>
      <div class="flex items-center gap-1">
        <button type="button" class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" @click="goToday">
          Today
        </button>
        <button type="button" class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" @click="prevMonth">
          &lsaquo;
        </button>
        <button type="button" class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" @click="nextMonth">
          &rsaquo;
        </button>
      </div>
    </div>

    <p v-if="error" class="mb-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-600">{{ error }}</p>

    <div class="grid grid-cols-7 gap-px overflow-hidden rounded-t-lg bg-slate-200 text-center text-[11px] font-medium text-slate-500">
      <div v-for="label in dayLabels" :key="label" class="bg-slate-50 py-1">{{ label }}</div>
    </div>

    <div class="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg bg-slate-200">
      <template v-for="week in weeks" :key="dateKey(week[0].date)">
        <div
          v-for="day in week"
          :key="dateKey(day.date)"
          :class="['min-h-24 bg-white p-1 text-left align-top', day.outside && 'bg-slate-50']"
        >
          <span
            :class="[
              'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
              isToday(day.date) ? 'bg-slate-800 text-white' : day.outside ? 'text-slate-300' : 'text-slate-600',
            ]"
          >
            {{ day.date.getDate() }}
          </span>

          <div class="mt-1 flex flex-col gap-0.5">
            <button
              v-for="event in eventsByDay[dateKey(day.date)] || []"
              :key="event.id"
              type="button"
              title="Click to remove"
              class="truncate rounded bg-indigo-100 px-1 py-0.5 text-left text-[10px] text-indigo-700 hover:bg-rose-100 hover:text-rose-700"
              @click="removeEvent(event.id)"
            >
              {{ event.allDay ? event.title : `${formatTime(event.startTime)} ${event.title}` }}
            </button>
          </div>

          <button
            v-if="openDayKey !== dateKey(day.date)"
            type="button"
            class="mt-1 text-[10px] text-slate-300 hover:text-slate-500"
            @click="openForm(day)"
          >
            + Add
          </button>

          <form v-else class="mt-1 flex flex-col gap-1" @submit.prevent="submitForm(day)">
            <input
              v-model="form.title"
              type="text"
              placeholder="Title"
              class="w-full rounded border border-slate-200 px-1 py-0.5 text-[10px]"
            />
            <label class="flex items-center gap-1 text-[10px] text-slate-500">
              <input v-model="form.allDay" type="checkbox" />
              All day
            </label>
            <div v-if="!form.allDay" class="flex gap-1">
              <input
                v-model="form.startTime"
                type="time"
                class="w-full rounded border border-slate-200 px-1 py-0.5 text-[10px]"
              />
              <input
                v-model="form.endTime"
                type="time"
                class="w-full rounded border border-slate-200 px-1 py-0.5 text-[10px]"
              />
            </div>
            <div class="flex gap-1">
              <button
                type="submit"
                class="flex-1 rounded bg-slate-800 py-0.5 text-[10px] font-medium text-white hover:bg-slate-700"
              >
                Add
              </button>
              <button
                type="button"
                class="flex-1 rounded border border-slate-200 py-0.5 text-[10px] text-slate-500"
                @click="closeForm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </template>
    </div>
  </div>
</template>
