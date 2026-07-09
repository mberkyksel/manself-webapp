<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  date: { type: Date, required: true },
  events: { type: Array, default: () => [] },
  isToday: { type: Boolean, default: false },
  outside: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['add-event', 'remove-event']);

const isOpen = ref(false);
const form = ref({ title: '', startTime: '09:00', endTime: '10:00', allDay: false });

function openForm() {
  form.value = { title: '', startTime: '09:00', endTime: '10:00', allDay: false };
  isOpen.value = true;
}
function closeForm() {
  isOpen.value = false;
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

  emit('add-event', {
    title,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    allDay: form.value.allDay,
  });
  closeForm();
}

function formatTime(iso) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

const weekdayLabel = computed(() => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(props.date));
</script>

<template>
  <div
    :class="[
      'flex flex-col bg-white p-1 text-left align-top',
      compact ? 'min-h-28' : 'min-h-24',
      outside && 'bg-slate-50',
    ]"
  >
    <div class="flex items-center justify-between">
      <span
        :class="[
          'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
          isToday ? 'bg-slate-800 text-white' : outside ? 'text-slate-300' : 'text-slate-600',
        ]"
      >
        {{ date.getDate() }}
      </span>
      <span v-if="compact" class="text-[10px] text-slate-400">{{ weekdayLabel }}</span>
    </div>

    <div class="mt-1 flex flex-col gap-0.5">
      <button
        v-for="event in events"
        :key="event.id"
        type="button"
        title="Click to remove"
        class="truncate rounded bg-indigo-100 px-1 py-0.5 text-left text-[10px] text-indigo-700 hover:bg-rose-100 hover:text-rose-700"
        @click="emit('remove-event', event.id)"
      >
        {{ event.allDay ? event.title : `${formatTime(event.startTime)} ${event.title}` }}
      </button>
    </div>

    <button v-if="!isOpen" type="button" class="mt-1 text-[10px] text-slate-300 hover:text-slate-500" @click="openForm">
      + Add
    </button>

    <form v-else class="mt-1 flex flex-col gap-1" @submit.prevent="submit">
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
