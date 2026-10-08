<script setup>
import { onMounted, computed } from 'vue';
import { useWeather } from '../../composables/useWeather.js';
import { CloudOff } from '@lucide/vue';
import WeatherIcon from './WeatherIcon.vue';

const { weather, loading, error, source, fetchWeather } = useWeather();

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
  <div class="weather-card">
    <div v-if="loading" class="weather-card__status weather-card__status--loading">Loading weather...</div>
    <div v-else-if="error" class="weather-card__status">
      <CloudOff :size="22" class="weather-card__status-icon" aria-hidden="true" />
      <p class="weather-card__status-title">Weather unavailable</p>
      <p class="weather-card__status-text">{{ error }}</p>
      <button type="button" class="weather-card__retry" @click="fetchWeather">Try again</button>
    </div>

    <div v-else-if="weather" :class="['weather-card__body', gradientClass]">
      <div class="weather-card__header">
        <div>
          <p class="weather-card__location">{{ weather.location }}</p>
          <p class="weather-card__temp">{{ weather.temperature }}&deg;</p>
          <p class="weather-card__description">{{ weather.description }}</p>
        </div>
        <WeatherIcon :icon="weather.icon" :size="64" color="#ffffff" />
      </div>

      <div class="weather-card__details">
        <span>Feels {{ weather.feelsLike }}&deg;</span>
        <span>{{ weather.humidity }}% humidity</span>
        <span>{{ weather.windSpeed }} m/s</span>
      </div>

      <p v-if="source !== 'device'" class="weather-card__source">
        {{ source === 'profile' ? 'Your saved location.' : 'Default location.' }}
        <router-link :to="{ name: 'settings' }" class="weather-card__source-link">Change</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.weather-card {
  @apply relative z-10 w-60 overflow-hidden rounded-2xl shadow-[0_10px_30px_-10px_rgba(59,130,246,0.55)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(59,130,246,0.65)] sm:w-[220px] sm:flex-none;
}
.weather-card__status {
  @apply rounded-2xl bg-white p-4 text-sm;
}
.weather-card__status--loading {
  @apply text-slate-400;
}
.weather-card__status-icon {
  @apply text-slate-400;
}
.weather-card__status-title {
  @apply mt-2 font-medium text-slate-700;
}
.weather-card__status-text {
  @apply mt-0.5 text-xs text-slate-500;
}
.weather-card__retry {
  @apply mt-3 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200;
}
.weather-card__source {
  @apply mt-2 text-[11px] text-white/70;
}
.weather-card__source-link {
  @apply font-medium text-white underline;
}
.weather-card__body {
  @apply bg-gradient-to-br p-4 text-white;
}
.weather-card__header {
  @apply flex items-start justify-between;
}
.weather-card__location {
  @apply text-sm font-medium;
}
.weather-card__temp {
  @apply text-4xl font-semibold leading-tight;
}
.weather-card__description {
  @apply text-xs capitalize text-white/80;
}
.weather-card__details {
  @apply mt-4 flex items-center gap-3 border-t border-white/20 pt-2 text-[11px] text-white/80;
}
</style>
