<script setup>
import { ref, computed } from 'vue';
import { choreIcon, choreColorClass, choreLabel } from '../../constants/chores.js';

const props = defineProps({
  date: { type: Date, required: true },
  events: { type: Array, default: () => [] },
  tasks: { type: Array, default: () => [] },
  chores: { type: Array, default: () => [] },
  isToday: { type: Boolean, default: false },
  outside: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['add-event', 'update-event', 'remove-event', 'drop-chore', 'remove-chore']);

// Reads the JSON payload a ChoresWidget icon set on dragstart; silently
// ignores drops that don't carry our chore payload (e.g. stray file drags).
function onDrop(event) {
  const raw = event.dataTransfer.getData('application/json');
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error(err);
    return;
  }

  emit('drop-chore', { id: crypto.randomUUID(), type: payload.type, state: payload.state });
}

const isOpen = ref(false);
const editingEventId = ref(null);
const form = ref(emptyForm());

function emptyForm() {
  return { title: '', startTime: '09:00', endTime: '10:00', allDay: false, taskId: '' };
}

function toLocalTimeInput(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function openForm() {
  form.value = emptyForm();
  editingEventId.value = null;
  isOpen.value = true;
}

function openEditForm(event) {
  form.value = {
    title: event.title,
    startTime: toLocalTimeInput(event.startTime),
    endTime: toLocalTimeInput(event.endTime),
    allDay: event.allDay,
    taskId: event.task?.id ?? '',
  };
  editingEventId.value = event.id;
  isOpen.value = true;
}

function closeForm() {
  isOpen.value = false;
  editingEventId.value = null;
}

// Builds a real UTC instant from this cell's local Y/M/D plus the entered
// local time-of-day, so storage/display stay correct regardless of which
// timezone the backend process happens to run in.
function submit() {
  const title = form.value.title.trim();
  if (!title) return;

  const y = props.date.getFullYear();
  const m = props.date.getMonth();
  const d = props.date.getDate();

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

  const payload = {
    title,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    allDay: form.value.allDay,
    taskId: form.value.taskId ? Number(form.value.taskId) : null,
  };

  if (editingEventId.value != null) {
    emit('update-event', { id: editingEventId.value, payload });
  } else {
    emit('add-event', payload);
  }
  closeForm();
}

function formatTime(iso) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

const weekdayLabel = computed(() => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(props.date));
</script>

<template>
  <div
    :class="['calendar-day-cell', compact && 'calendar-day-cell--compact', outside && 'calendar-day-cell--outside']"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <div v-if="chores.length" class="calendar-day-cell__chores">
      <button
        v-for="chore in chores"
        :key="chore.id"
        type="button"
        class="calendar-day-cell__chore-badge"
        :class="choreColorClass(chore)"
        :title="`${choreLabel(chore)} — click to remove`"
        @click="emit('remove-chore', chore.id)"
      >
        <component :is="choreIcon(chore.type)" :size="11" />
      </button>
    </div>

    <div class="calendar-day-cell__header">
      <span
        :class="[
          'calendar-day-cell__badge',
          isToday ? 'calendar-day-cell__badge--today' : outside ? 'calendar-day-cell__badge--outside' : '',
        ]"
      >
        {{ date.getDate() }}
      </span>
      <span v-if="compact" class="calendar-day-cell__weekday">{{ weekdayLabel }}</span>
    </div>

    <div class="calendar-day-cell__events">
      <div v-for="event in events" :key="event.id" class="calendar-day-cell__event-row">
        <button type="button" title="Click to edit" class="calendar-day-cell__event" @click="openEditForm(event)">
          {{ event.allDay ? event.title : `${formatTime(event.startTime)} ${event.title}` }}
          <span v-if="event.task" class="calendar-day-cell__event-task">🔗 {{ event.task.title }}</span>
        </button>
        <button
          type="button"
          title="Remove"
          class="calendar-day-cell__event-remove"
          @click="emit('remove-event', event.id)"
        >
          &times;
        </button>
      </div>
    </div>

    <button v-if="!isOpen" type="button" class="calendar-day-cell__add-trigger" @click="openForm">+ Add</button>

    <form v-else class="calendar-day-cell__form" @submit.prevent="submit">
      <input v-model="form.title" type="text" placeholder="Title" class="calendar-day-cell__input" />
      <select v-model="form.taskId" class="calendar-day-cell__input">
        <option value="">No linked task</option>
        <option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.title }}</option>
      </select>
      <label class="calendar-day-cell__checkbox-label">
        <input v-model="form.allDay" type="checkbox" />
        All day
      </label>
      <div v-if="!form.allDay" class="calendar-day-cell__time-row">
        <input v-model="form.startTime" type="time" class="calendar-day-cell__input" />
        <input v-model="form.endTime" type="time" class="calendar-day-cell__input" />
      </div>
      <div class="calendar-day-cell__actions">
        <button type="submit" class="calendar-day-cell__submit">{{ editingEventId != null ? 'Save' : 'Add' }}</button>
        <button type="button" class="calendar-day-cell__cancel" @click="closeForm">Cancel</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.calendar-day-cell {
  @apply relative flex min-h-24 flex-col bg-white p-1 text-left align-top;
}
.calendar-day-cell__chores {
  @apply absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 gap-0.5;
}
.calendar-day-cell__chore-badge {
  @apply flex h-4 w-4 items-center justify-center rounded-full shadow-sm;
}
.calendar-day-cell--compact {
  @apply min-h-28;
}
.calendar-day-cell--outside {
  @apply bg-slate-50;
}
.calendar-day-cell__header {
  @apply flex items-center justify-between;
}
.calendar-day-cell__badge {
  @apply inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-slate-600;
}
.calendar-day-cell__badge--today {
  @apply bg-slate-800 text-white;
}
.calendar-day-cell__badge--outside {
  @apply text-slate-300;
}
.calendar-day-cell__weekday {
  @apply text-[10px] text-slate-400;
}
.calendar-day-cell__events {
  @apply mt-1 flex flex-col gap-0.5;
}
.calendar-day-cell__event-row {
  @apply flex items-center gap-0.5;
}
.calendar-day-cell__event {
  @apply min-w-0 flex-1 truncate rounded bg-indigo-100 px-1 py-0.5 text-left text-[10px] text-indigo-700 hover:bg-indigo-200;
}
.calendar-day-cell__event-task {
  @apply ml-1 text-indigo-500;
}
.calendar-day-cell__event-remove {
  @apply shrink-0 rounded px-1 text-[10px] text-slate-300 hover:bg-rose-100 hover:text-rose-700;
}
.calendar-day-cell__add-trigger {
  @apply mt-1 text-[10px] text-slate-300 hover:text-slate-500;
}
.calendar-day-cell__form {
  @apply mt-1 flex flex-col gap-1;
}
.calendar-day-cell__input {
  @apply w-full rounded border border-slate-200 px-1 py-0.5 text-[10px];
}
.calendar-day-cell__checkbox-label {
  @apply flex items-center gap-1 text-[10px] text-slate-500;
}
.calendar-day-cell__time-row {
  @apply flex gap-1;
}
.calendar-day-cell__actions {
  @apply flex gap-1;
}
.calendar-day-cell__submit {
  @apply flex-1 rounded bg-slate-800 py-0.5 text-[10px] font-medium text-white hover:bg-slate-700;
}
.calendar-day-cell__cancel {
  @apply flex-1 rounded border border-slate-200 py-0.5 text-[10px] text-slate-500;
}
</style>
