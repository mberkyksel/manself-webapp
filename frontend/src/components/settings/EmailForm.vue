<script setup>
import { ref } from 'vue';
import { useUserStore } from '../../stores/userStore.js';
import { useToast } from '../../composables/useToast.js';
import SettingsCard from './SettingsCard.vue';

const userStore = useUserStore();
const toast = useToast();

const newEmail = ref('');
const currentPassword = ref('');
const error = ref(null);
const saving = ref(false);

async function onSubmit() {
  error.value = null;
  saving.value = true;
  const ok = await userStore.updateEmail({ newEmail: newEmail.value.trim(), currentPassword: currentPassword.value });
  saving.value = false;
  if (ok) {
    newEmail.value = '';
    currentPassword.value = '';
    toast.success('Email updated.');
  } else {
    error.value = userStore.error;
  }
}
</script>

<template>
  <SettingsCard title="Email" :description="`You sign in with ${userStore.user?.email ?? 'your email'}.`" :locked="userStore.isDemo">
    <form class="settings-form" @submit.prevent="onSubmit">
      <label class="settings-form__label">
        New email
        <input v-model="newEmail" type="email" class="field-input" required autocomplete="email" />
      </label>
      <label class="settings-form__label">
        Current password
        <input v-model="currentPassword" type="password" class="field-input" required autocomplete="current-password" />
      </label>
      <p v-if="error" class="settings-form__error" role="alert">{{ error }}</p>
      <button type="submit" class="btn-primary settings-form__submit" :disabled="saving">
        {{ saving ? 'Updating…' : 'Update email' }}
      </button>
    </form>
  </SettingsCard>
</template>
