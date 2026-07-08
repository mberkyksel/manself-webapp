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
  <div class="rounded-xl bg-white p-6 shadow-sm">
    <p class="text-4xl font-semibold tabular-nums text-slate-800">{{ formattedTime }}</p>
    <p class="mt-1 text-sm text-slate-500">{{ formattedDate }}</p>
  </div>
</template>
