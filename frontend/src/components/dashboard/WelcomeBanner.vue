<script setup>
import { computed } from 'vue';
import { useUserStore } from '../../stores/userStore.js';

const userStore = useUserStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-slate-800">{{ greeting }}, {{ userStore.name }}</h1>
    <p class="mt-1 text-slate-500">Here's what's happening today.</p>
  </div>
</template>
