<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/userStore.js';
import { useToast } from '../../composables/useToast.js';
import { useConfirm } from '../../composables/useConfirm.js';
import SettingsCard from './SettingsCard.vue';

const userStore = useUserStore();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const password = ref('');
const error = ref(null);
const saving = ref(false);

async function onSubmit() {
  error.value = null;

  const confirmed = await confirm({
    title: 'Delete your account?',
    message: 'Your boards, tasks, calendar events and notes will be permanently deleted. This cannot be undone.',
    confirmLabel: 'Delete my account',
  });
  if (!confirmed) return;

  saving.value = true;
  const ok = await userStore.deleteAccount({ currentPassword: password.value });
  saving.value = false;
  if (ok) {
    await router.push({ name: 'landing' });
    toast.info('Your account has been deleted.');
  } else {
    error.value = userStore.error;
  }
}
</script>

<template>
  <SettingsCard
    title="Delete account"
    description="Permanently removes your account and everything in it: tasks, calendar events and notes."
    danger
    :locked="userStore.isDemo"
  >
    <form class="settings-form" @submit.prevent="onSubmit">
      <label class="settings-form__label">
        Current password
        <input v-model="password" type="password" class="field-input" required autocomplete="current-password" />
      </label>
      <p v-if="error" class="settings-form__error" role="alert">{{ error }}</p>
      <button type="submit" class="btn-danger settings-form__submit" :disabled="saving">
        {{ saving ? 'Deleting…' : 'Delete my account' }}
      </button>
    </form>
  </SettingsCard>
</template>
