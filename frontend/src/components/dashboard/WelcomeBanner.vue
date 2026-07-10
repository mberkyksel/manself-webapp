<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/userStore.js';
import { useTaskStore } from '../../stores/taskStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';

const userStore = useUserStore();
const taskStore = useTaskStore();
const calendarStore = useCalendarStore();
const router = useRouter();

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

onMounted(() => {
  taskStore.fetchTasks();
  calendarStore.fetchEvents();
});

function onLogout() {
  userStore.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="welcome-banner">
    <h1 class="welcome-banner__title">{{ greeting }}, {{ userStore.name }}</h1>
    <p class="welcome-banner__subtitle">Here's what's happening today.</p>

    <div class="welcome-banner__stats">
      <span class="welcome-banner__stat">📅 {{ eventsToday }} event{{ eventsToday === 1 ? '' : 's' }} today</span>
      <span class="welcome-banner__stat">✓ {{ todosToday }} todo{{ todosToday === 1 ? '' : 's' }} due today</span>
    </div>

    <button v-if="userStore.isAuthenticated" type="button" class="welcome-banner__logout" @click="onLogout">
      Log out
    </button>
  </div>
</template>

<style scoped>
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
.welcome-banner__logout {
  @apply mt-3 text-sm text-slate-400 hover:text-slate-600 hover:underline;
}
</style>
