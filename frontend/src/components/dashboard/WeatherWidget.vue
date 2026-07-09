<script setup>
import { onMounted } from 'vue';
import { useWeather } from '../../composables/useWeather.js';

const { weather, loading, error, fetchWeather } = useWeather();

onMounted(fetchWeather);

function iconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
</script>

<template>
  <div class="rounded-xl bg-white p-4 shadow-sm">
    <p v-if="loading" class="text-sm text-slate-400">Loading weather...</p>
    <p v-else-if="error" class="text-sm text-rose-500">{{ error }}</p>
    <div v-else-if="weather" class="flex items-center gap-3">
      <img :src="iconUrl(weather.icon)" :alt="weather.description" class="h-12 w-12" />
      <div>
        <p class="text-2xl font-semibold text-slate-800">{{ weather.temperature }}&deg;C</p>
        <p class="text-xs capitalize text-slate-500">{{ weather.description }}</p>
        <p class="text-xs text-slate-400">{{ weather.location }}</p>
      </div>
    </div>
  </div>
</template>
