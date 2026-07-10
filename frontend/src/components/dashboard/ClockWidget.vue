<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../../stores/userStore.js';

const userStore = useUserStore();
const now = ref(new Date());

let intervalId;
onMounted(() => {
  intervalId = setInterval(() => {
    now.value = new Date();
  }, 1000);
});
onUnmounted(() => clearInterval(intervalId));

const timeFormatter = computed(
  () =>
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZone: userStore.timezone,
    })
);

const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: userStore.timezone,
    })
);

const formattedTime = computed(() => timeFormatter.value.format(now.value));
const formattedDate = computed(() => dateFormatter.value.format(now.value));
</script>

<template>
  <div class="clock-widget">
    <p class="clock-widget__time">{{ formattedTime }}</p>
    <p class="clock-widget__date">{{ formattedDate }}</p>
  </div>
</template>

<style scoped>
.clock-widget {
  @apply relative z-10 flex flex-col justify-center rounded-2xl border border-white/70 bg-white/60 p-6 shadow-[0_8px_30px_-10px_rgba(30,41,59,0.25)] backdrop-blur-xl backdrop-saturate-150 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300/60 hover:shadow-[0_14px_34px_-10px_rgba(79,70,229,0.35)] sm:w-[200px] sm:flex-none;
}
.clock-widget__time {
  @apply text-4xl font-semibold tabular-nums text-slate-800;
}
.clock-widget__date {
  @apply mt-1 text-sm text-slate-500;
}
</style>
