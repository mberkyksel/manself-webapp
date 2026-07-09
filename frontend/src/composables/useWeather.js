import { ref } from 'vue';
import { api } from '../services/api.js';

export function useWeather() {
  const weather = ref(null);
  const loading = ref(false);
  const error = ref(null);

  function fetchWeather() {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by this browser.';
      return;
    }

    loading.value = true;
    error.value = null;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.get('/weather', { params: { lat: latitude, lon: longitude } });
          weather.value = res.data;
        } catch (err) {
          error.value = err.response?.data?.error?.message || 'Could not load weather.';
          console.error(err);
        } finally {
          loading.value = false;
        }
      },
      (geoErr) => {
        error.value = 'Location permission denied.';
        loading.value = false;
        console.error(geoErr);
      },
      { timeout: 10000 }
    );
  }

  return { weather, loading, error, fetchWeather };
}
