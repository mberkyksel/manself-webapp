<script setup>
import { onMounted, computed } from 'vue';
import { useWeather } from '../../composables/useWeather.js';
import WeatherIcon from './WeatherIcon.vue';

const { weather, loading, error, fetchWeather } = useWeather();

onMounted(fetchWeather);

// Tints the card to match the current condition, mirroring how macOS
// Weather colors each card by weather type instead of showing a bare icon.
const GRADIENTS = {
  '01d': 'from-sky-400 to-blue-500',
  '01n': 'from-indigo-900 to-slate-800',
  '02d': 'from-sky-300 to-blue-400',
  '02n': 'from-slate-700 to-indigo-900',
  '03d': 'from-slate-400 to-slate-500',
  '03n': 'from-slate-700 to-slate-800',
  '04d': 'from-slate-400 to-slate-600',
  '04n': 'from-slate-700 to-slate-900',
  '09d': 'from-slate-500 to-blue-700',
  '09n': 'from-slate-700 to-blue-900',
  '10d': 'from-blue-500 to-slate-600',
  '10n': 'from-blue-800 to-slate-900',
  '11d': 'from-slate-600 to-indigo-800',
  '11n': 'from-slate-800 to-indigo-950',
  '13d': 'from-slate-200 to-blue-300',
  '13n': 'from-slate-500 to-blue-700',
  '50d': 'from-slate-300 to-slate-400',
  '50n': 'from-slate-600 to-slate-700',
};

const gradientClass = computed(() => GRADIENTS[weather.value?.icon] || 'from-sky-400 to-blue-500');
</script>

<template>
  <div class="w-60 overflow-hidden rounded-xl shadow-sm">
    <div v-if="loading" class="bg-white p-4 text-sm text-slate-400">Loading weather...</div>
    <div v-else-if="error" class="bg-white p-4 text-sm text-rose-500">{{ error }}</div>

    <div v-else-if="weather" :class="['bg-gradient-to-br p-4 text-white', gradientClass]">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm font-medium">{{ weather.location }}</p>
          <p class="text-4xl font-semibold leading-tight">{{ weather.temperature }}&deg;</p>
          <p class="text-xs capitalize text-white/80">{{ weather.description }}</p>
        </div>
        <WeatherIcon :icon="weather.icon" :size="64" color="#ffffff" />
      </div>

      <div class="mt-4 flex items-center gap-3 border-t border-white/20 pt-2 text-[11px] text-white/80">
        <span>Feels {{ weather.feelsLike }}&deg;</span>
        <span>{{ weather.humidity }}% humidity</span>
        <span>{{ weather.windSpeed }} m/s</span>
      </div>
    </div>
  </div>
</template>
