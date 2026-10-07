<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import AppFooter from '../components/AppFooter.vue';
import DemoLoginButton from '../components/DemoLoginButton.vue';
import brandMark from '../assets/brand/manself-mark-transparent.svg';

const userStore = useUserStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');

async function onSubmit() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const success = await userStore.register({ name: name.value, email: email.value, password: password.value, timezone });
  if (success) {
    router.push({ name: 'dashboard' });
  }
}
</script>

<template>
  <main class="register-view">
    <div class="register-view__center">
      <div class="register-view__panel">
        <div class="register-view__heading">
          <img :src="brandMark" alt="" class="register-view__logo" />
          <h1 class="register-view__title">Create an account</h1>
        </div>
        <p class="register-view__subtitle">Get started with your dashboard.</p>

        <form class="register-view__form" @submit.prevent="onSubmit">
          <input v-model="name" type="text" placeholder="Name" required class="register-view__input" />
          <input v-model="email" type="email" placeholder="Email" required class="register-view__input" />
          <input
            v-model="password"
            type="password"
            placeholder="Password (min 8 characters)"
            required
            minlength="8"
            class="register-view__input"
          />

          <p v-if="userStore.error" class="register-view__error">{{ userStore.error }}</p>

          <button type="submit" class="register-view__submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <DemoLoginButton />

        <p class="register-view__footer">
          Already have an account?
          <router-link to="/login" class="register-view__link">Log in</router-link>
        </p>
        <p class="register-view__back">
          <router-link :to="{ name: 'landing' }" class="register-view__link">&larr; Back to home</router-link>
        </p>
      </div>
    </div>

    <AppFooter />
  </main>
</template>

<style scoped>
.register-view {
  @apply flex min-h-screen flex-col bg-slate-100;
}
.register-view__center {
  @apply flex flex-1 items-center justify-center;
}
.register-view__heading {
  @apply flex items-center justify-center gap-2;
}
.register-view__logo {
  @apply h-9 w-9;
}
.register-view__panel {
  @apply w-full max-w-sm text-center;
}
.register-view__title {
  @apply text-2xl font-semibold text-slate-800;
}
.register-view__subtitle {
  @apply mt-2 text-slate-500;
}
.register-view__form {
  @apply mt-6 flex flex-col gap-3 text-left;
}
.register-view__input {
  @apply w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none;
}
.register-view__error {
  @apply rounded-lg bg-rose-50 p-2 text-sm text-rose-600;
}
.register-view__submit {
  @apply rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50;
}
.register-view__footer {
  @apply mt-4 text-sm text-slate-500;
}
.register-view__back {
  @apply mt-3 text-xs;
}
.register-view__link {
  @apply font-medium text-slate-700 hover:underline;
}
</style>
