import { ref } from 'vue';
import { api } from '../services/api.js';
import { useUserStore } from '../stores/userStore.js';

// Shown when the browser won't share its location and the account has no
// saved one, so the card still has something real to display.
export const DEFAULT_WEATHER_CITY = 'Berlin';

const GEOLOCATION_TIMEOUT_MS = 8000;

// Resolves with the device's coordinates, or null when location isn't
// available (denied, unsupported, timed out) so the caller can fall back.
function getDeviceCoordinates() {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(null),
      { timeout: GEOLOCATION_TIMEOUT_MS }
    );
  });
}

export function useWeather() {
  const userStore = useUserStore();

  const weather = ref(null);
  const loading = ref(false);
  const error = ref(null);
  // Where the numbers came from: 'device' (browser location), 'profile' (the
  // location saved in Settings) or 'default' (the built-in city).
  const source = ref(null);

  async function fetchWeather() {
    loading.value = true;
    error.value = null;

    try {
      const coordinates = await getDeviceCoordinates();

      let params;
      if (coordinates) {
        params = coordinates;
        source.value = 'device';
      } else if (userStore.location) {
        params = { city: userStore.location };
        source.value = 'profile';
      } else {
        params = { city: DEFAULT_WEATHER_CITY };
        source.value = 'default';
      }

      const res = await api.get('/weather', { params });
      weather.value = res.data;
    } catch (err) {
      error.value = err.response?.data?.error?.message || 'Could not load weather.';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  return { weather, loading, error, source, fetchWeather };
}
