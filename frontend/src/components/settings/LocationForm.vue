<script setup>
import { computed, ref } from 'vue';
import { api } from '../../services/api.js';
import { useUserStore } from '../../stores/userStore.js';
import { useToast } from '../../composables/useToast.js';
import { DEFAULT_WEATHER_CITY } from '../../composables/useWeather.js';
import SettingsCard from './SettingsCard.vue';

const userStore = useUserStore();
const toast = useToast();

const location = ref(userStore.location ?? '');
const error = ref(null);
const saving = ref(false);

const unchanged = computed(() => location.value.trim() === (userStore.location ?? ''));

async function onSubmit() {
  error.value = null;
  const city = location.value.trim();
  saving.value = true;

  // Make sure the weather service knows the place before saving it, so a typo
  // is caught here rather than as a broken card on the dashboard.
  if (city) {
    try {
      await api.get('/weather', { params: { city } });
    } catch (err) {
      saving.value = false;
      error.value =
        err.response?.status === 404
          ? `We couldn't find "${city}". Try a nearby larger city.`
          : err.response?.data?.error?.message || 'Could not check that location.';
      return;
    }
  }

  const ok = await userStore.updateProfile({ location: city });
  saving.value = false;
  if (ok) {
    location.value = userStore.location ?? '';
    toast.success(city ? 'Weather location updated.' : 'Weather location cleared.');
  } else {
    error.value = userStore.error;
  }
}
</script>

<template>
  <SettingsCard
    title="Weather location"
    :description="`Used when your browser doesn't share its location. Leave empty to show ${DEFAULT_WEATHER_CITY}.`"
  >
    <form class="settings-form" @submit.prevent="onSubmit">
      <label class="settings-form__label">
        City
        <input
          v-model="location"
          type="text"
          class="field-input"
          maxlength="100"
          placeholder="e.g. Munich"
          autocomplete="address-level2"
        />
      </label>
      <p v-if="error" class="settings-form__error" role="alert">{{ error }}</p>
      <button type="submit" class="btn-primary settings-form__submit" :disabled="saving || unchanged">
        {{ saving ? 'Saving…' : 'Save location' }}
      </button>
    </form>
  </SettingsCard>
</template>
