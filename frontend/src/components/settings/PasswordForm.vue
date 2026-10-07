<script setup>
import { ref } from 'vue';
import { useUserStore } from '../../stores/userStore.js';
import { useToast } from '../../composables/useToast.js';
import SettingsCard from './SettingsCard.vue';

const userStore = useUserStore();
const toast = useToast();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref(null);
const saving = ref(false);

async function onSubmit() {
  error.value = null;

  if (newPassword.value.length < 8) {
    error.value = 'New password must be at least 8 characters.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New passwords do not match.';
    return;
  }

  saving.value = true;
  const ok = await userStore.updatePassword({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
  });
  saving.value = false;
  if (ok) {
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    toast.success('Password updated.');
  } else {
    error.value = userStore.error;
  }
}
</script>

<template>
  <SettingsCard title="Password" description="Use at least 8 characters." :locked="userStore.isDemo">
    <form class="settings-form" @submit.prevent="onSubmit">
      <label class="settings-form__label">
        Current password
        <input v-model="currentPassword" type="password" class="field-input" required autocomplete="current-password" />
      </label>
      <label class="settings-form__label">
        New password
        <input v-model="newPassword" type="password" class="field-input" required autocomplete="new-password" />
      </label>
      <label class="settings-form__label">
        Confirm new password
        <input v-model="confirmPassword" type="password" class="field-input" required autocomplete="new-password" />
      </label>
      <p v-if="error" class="settings-form__error" role="alert">{{ error }}</p>
      <button type="submit" class="btn-primary settings-form__submit" :disabled="saving">
        {{ saving ? 'Updating…' : 'Update password' }}
      </button>
    </form>
  </SettingsCard>
</template>
