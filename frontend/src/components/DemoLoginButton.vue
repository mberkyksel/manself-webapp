<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import { useAppConfig } from '../composables/useAppConfig.js';

const userStore = useUserStore();
const router = useRouter();
const { demoEnabled } = useAppConfig();

async function onClick() {
  if (await userStore.loginAsDemo()) {
    router.push({ name: 'dashboard' });
  }
}
</script>

<template>
  <div v-if="demoEnabled" class="demo-login">
    <div class="demo-login__divider"><span>or</span></div>
    <button type="button" class="demo-login__button" :disabled="userStore.loading" @click="onClick">
      {{ userStore.loading ? 'Loading the demo...' : 'Try the demo' }}
    </button>
    <p class="demo-login__hint">One click, no sign-up - loads a sample account full of example data.</p>
  </div>
</template>

<style scoped>
.demo-login {
  @apply mt-5;
}
.demo-login__divider {
  @apply flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400;
}
.demo-login__divider::before,
.demo-login__divider::after {
  content: '';
  @apply h-px flex-1 bg-slate-200;
}
.demo-login__button {
  @apply mt-4 w-full rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50;
}
.demo-login__hint {
  @apply mt-2 text-xs text-slate-400;
}
</style>
