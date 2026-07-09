<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import skyconsFactory from 'skycons';

const props = defineProps({
  icon: { type: String, required: true }, // OpenWeatherMap icon code, e.g. "01d"
  size: { type: Number, default: 48 },
  color: { type: String, default: '#0ea5e9' }, // sky-500
});

const canvasRef = ref(null);
const Skycons = skyconsFactory(window);
let skycons = null;

// OpenWeatherMap icon codes -> Skycons animated icon types. Skycons has no
// thunderstorm icon, so 11xx falls back to RAIN.
const ICON_MAP = {
  '01d': 'CLEAR_DAY',
  '01n': 'CLEAR_NIGHT',
  '02d': 'PARTLY_CLOUDY_DAY',
  '02n': 'PARTLY_CLOUDY_NIGHT',
  '03d': 'CLOUDY',
  '03n': 'CLOUDY',
  '04d': 'CLOUDY',
  '04n': 'CLOUDY',
  '09d': 'RAIN',
  '09n': 'RAIN',
  '10d': 'RAIN',
  '10n': 'RAIN',
  '11d': 'RAIN',
  '11n': 'RAIN',
  '13d': 'SNOW',
  '13n': 'SNOW',
  '50d': 'FOG',
  '50n': 'FOG',
};

function skyconType(owmIcon) {
  return Skycons[ICON_MAP[owmIcon] || 'CLEAR_DAY'];
}

onMounted(() => {
  skycons = new Skycons({ color: props.color });
  skycons.add(canvasRef.value, skyconType(props.icon));
  skycons.play();
});

watch(
  () => props.icon,
  (newIcon) => {
    skycons?.set(canvasRef.value, skyconType(newIcon));
  }
);

onUnmounted(() => {
  skycons?.pause();
  skycons?.remove(canvasRef.value);
});
</script>

<template>
  <canvas ref="canvasRef" :width="size" :height="size" />
</template>
