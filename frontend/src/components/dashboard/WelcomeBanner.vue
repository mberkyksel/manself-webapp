<script setup>
import { computed, onMounted } from 'vue';
import { House } from '@lucide/vue';
import { useUserStore } from '../../stores/userStore.js';
import { useTaskStore } from '../../stores/taskStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useChoreStore } from '../../stores/choreStore.js';
import ChoreBadge from './ChoreBadge.vue';

defineProps({
  choresOpen: { type: Boolean, default: false },
});
defineEmits(['toggle-chores']);

const userStore = useUserStore();
const taskStore = useTaskStore();
const calendarStore = useCalendarStore();
const choreStore = useChoreStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});

function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const todayDateOnly = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
});

const eventsToday = computed(() => calendarStore.events.filter((event) => isToday(new Date(event.startTime))).length);

const todosToday = computed(
  () => taskStore.tasks.filter((task) => task.dueDate === todayDateOnly.value && task.status !== 'done').length
);

const todaysChores = computed(() => choreStore.choresByDate[todayDateOnly.value] || []);

onMounted(() => {
  taskStore.fetchTasks();
  calendarStore.fetchEvents();
});
</script>

<template>
  <div class="welcome-banner">
    <button
      type="button"
      class="welcome-banner__chores-toggle"
      :aria-pressed="choresOpen"
      :title="choresOpen ? 'Hide House Chores widget' : 'Show House Chores widget'"
      @click="$emit('toggle-chores')"
    >
      <House :size="18" />
    </button>

    <h1 class="welcome-banner__title">{{ greeting }}, {{ userStore.name }}</h1>
    <p class="welcome-banner__subtitle">Here's what's happening today.</p>

    <div class="welcome-banner__stats">
      <span class="welcome-banner__stat">📅 {{ eventsToday }} event{{ eventsToday === 1 ? '' : 's' }} </span>
      <span class="welcome-banner__stat">✓ {{ todosToday }} todo{{ todosToday === 1 ? '' : 's' }} </span>
      <span v-if="todaysChores.length" class="welcome-banner__stat welcome-banner__stat--chores">
        🧹 {{ todaysChores.length }} house dut{{ todaysChores.length === 1 ? 'y' : 'ies' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.welcome-banner {
  @apply relative z-10 flex-1 rounded-2xl border border-white/70 bg-white/60 p-6 shadow-[0_8px_30px_-10px_rgba(30,41,59,0.25)] backdrop-blur-xl backdrop-saturate-150 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300/60 hover:shadow-[0_14px_34px_-10px_rgba(79,70,229,0.35)] sm:min-w-[260px];
}
.welcome-banner__title {
  @apply text-2xl font-semibold text-slate-800;
}
.welcome-banner__subtitle {
  @apply mt-1 text-slate-500;
}
.welcome-banner__stats {
  @apply mt-3 flex flex-wrap gap-2;
}
.welcome-banner__stat {
  @apply inline-flex w-fit items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600;
}
.welcome-banner__stat--chores {
  @apply bg-amber-50 text-amber-700;
}
.welcome-banner__chores-toggle {
  @apply absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-700 transition duration-200 hover:scale-110 hover:bg-amber-400/20;
  box-shadow: 0 0 0 rgba(251, 191, 36, 0);
}
.welcome-banner__chores-toggle:hover {
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.55);
}
.welcome-banner__chores-row {
  @apply mt-3 flex flex-wrap items-center gap-2;
}
</style>
