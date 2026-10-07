<script setup>
import { computed, ref } from 'vue';
import { useUserStore } from '../../stores/userStore.js';
import { useToast } from '../../composables/useToast.js';
import SettingsCard from './SettingsCard.vue';

const userStore = useUserStore();
const toast = useToast();

const name = ref(userStore.user?.name ?? '');
const error = ref(null);
const saving = ref(false);

const unchanged = computed(() => name.value.trim() === (userStore.user?.name ?? ''));

async function onSubmit() {
  error.value = null;
  saving.value = true;
  const ok = await userStore.updateProfile({ name: name.value.trim() });
  saving.value = false;
  if (ok) {
    name.value = userStore.user.name;
    toast.success('Name updated.');
  } else {
    error.value = userStore.error;
  }
}
</script>

<template>
  <SettingsCard title="Name" description="How the dashboard greets you.">
    <form class="settings-form" @submit.prevent="onSubmit">
      <label class="settings-form__label">
        Name
        <input v-model="name" type="text" class="field-input" required maxlength="100" autocomplete="name" />
      </label>
      <p v-if="error" class="settings-form__error" role="alert">{{ error }}</p>
      <button type="submit" class="btn-primary settings-form__submit" :disabled="saving || unchanged">
        {{ saving ? 'Saving…' : 'Save name' }}
      </button>
    </form>
  </SettingsCard>
</template>
