import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const apiGet = vi.hoisted(() => vi.fn());
vi.mock('../../src/services/api.js', () => ({ TOKEN_STORAGE_KEY: 'manself_token', api: { get: apiGet } }));

const { useWeather, DEFAULT_WEATHER_CITY } = await import('../../src/composables/useWeather.js');
const { useUserStore } = await import('../../src/stores/userStore.js');

const REPORT = { location: 'Somewhere', temperature: 10 };

function setGeolocation(impl) {
  Object.defineProperty(navigator, 'geolocation', { value: impl, configurable: true });
}
const grants = () =>
  setGeolocation({ getCurrentPosition: (ok) => ok({ coords: { latitude: 52.5, longitude: 13.4 } }) });
const denies = () => setGeolocation({ getCurrentPosition: (_ok, fail) => fail(new Error('denied')) });

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
  apiGet.mockResolvedValue({ data: REPORT });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
});

describe('useWeather', () => {
  it("uses the device's location when it is shared", async () => {
    grants();
    const { fetchWeather, weather, source } = useWeather();
    await fetchWeather();

    expect(apiGet).toHaveBeenCalledWith('/weather', { params: { lat: 52.5, lon: 13.4 } });
    expect(source.value).toBe('device');
    expect(weather.value).toEqual(REPORT);
  });

  it("falls back to the account's saved city when location is denied", async () => {
    denies();
    useUserStore().user = { name: 'Tess', location: 'Munich' };
    const { fetchWeather, source } = useWeather();
    await fetchWeather();

    expect(apiGet).toHaveBeenCalledWith('/weather', { params: { city: 'Munich' } });
    expect(source.value).toBe('profile');
  });

  it('falls back to the default city when there is no saved one', async () => {
    denies();
    const { fetchWeather, source } = useWeather();
    await fetchWeather();

    expect(apiGet).toHaveBeenCalledWith('/weather', { params: { city: DEFAULT_WEATHER_CITY } });
    expect(source.value).toBe('default');
  });

  it('falls back too when the browser has no geolocation at all', async () => {
    const { fetchWeather, source } = useWeather();
    await fetchWeather();
    expect(source.value).toBe('default');
  });

  it("shows the server's message when the lookup fails, and stops loading", async () => {
    denies();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiGet.mockRejectedValue({ response: { data: { error: { message: 'city not found' } } } });
    const { fetchWeather, error, loading, weather } = useWeather();
    await fetchWeather();

    expect(error.value).toBe('city not found');
    expect(loading.value).toBe(false);
    expect(weather.value).toBeNull();
  });

  it('clears an earlier error when retried', async () => {
    denies();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiGet.mockRejectedValueOnce(new Error('boom'));
    const { fetchWeather, error, weather } = useWeather();

    await fetchWeather();
    expect(error.value).toBe('Could not load weather.');

    await fetchWeather();
    expect(error.value).toBeNull();
    expect(weather.value).toEqual(REPORT);
  });
});
