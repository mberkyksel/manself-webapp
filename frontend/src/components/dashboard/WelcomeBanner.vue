<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/userStore.js';

const userStore = useUserStore();
const router = useRouter();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});

function onLogout() {
  userStore.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="welcome-banner">
    <h1 class="welcome-banner__title">{{ greeting }}, {{ userStore.name }}</h1>
    <p class="welcome-banner__subtitle">Here's what's happening today. ere's what's happening today</p>
    <p class="welcome-banner__subtitle">Here's what's happening today.</p>
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
.welcome-banner__logout {
  @apply mt-2 text-sm text-slate-400 hover:text-slate-600 hover:underline;
}
</style>
