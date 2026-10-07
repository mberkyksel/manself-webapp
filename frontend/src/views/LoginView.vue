<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import AppFooter from '../components/AppFooter.vue';
import DemoLoginButton from '../components/DemoLoginButton.vue';
import brandMark from '../assets/brand/manself-mark-transparent.svg';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

// Set by api.js's response interceptor when a request 401s mid-session
// (expired/invalid token), as opposed to a plain failed login attempt.
// Stripped from the URL immediately so refreshing the login page doesn't
// keep re-showing it.
const showSessionExpired = ref(route.query.sessionExpired === '1');
if (showSessionExpired.value) {
  router.replace({ name: 'login' });
}

const email = ref('');
const password = ref('');

async function onSubmit() {
  const success = await userStore.login({ email: email.value, password: password.value });
  if (success) {
    router.push({ name: 'dashboard' });
  }
}
</script>

<template>
  <main class="login-view">
    <div class="login-view__center">
      <div class="login-view__panel">
        <div class="login-view__heading">
          <img :src="brandMark" alt="" class="login-view__logo" />
          <h1 class="login-view__title">Log in</h1>
        </div>
        <p class="login-view__subtitle">Welcome back.</p>

        <p v-if="showSessionExpired" class="login-view__notice">Your session expired. Please log in again.</p>

        <form class="login-view__form" @submit.prevent="onSubmit">
          <input v-model="email" type="email" placeholder="Email" required class="login-view__input" />
          <input v-model="password" type="password" placeholder="Password" required class="login-view__input" />

          <p v-if="userStore.error" class="login-view__error">{{ userStore.error }}</p>

          <button type="submit" class="login-view__submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Logging in...' : 'Log in' }}
          </button>
        </form>

        <DemoLoginButton />

        <p class="login-view__footer">
          Don't have an account?
          <router-link to="/register" class="login-view__link">Register</router-link>
        </p>
      </div>
    </div>

    <AppFooter />
  </main>
</template>

<style scoped>
.login-view {
  @apply flex min-h-screen flex-col bg-slate-100;
}
.login-view__center {
  @apply flex flex-1 items-center justify-center;
}
.login-view__heading {
  @apply flex items-center justify-center gap-2;
}
.login-view__logo {
  @apply h-9 w-9;
}
.login-view__panel {
  @apply w-full max-w-sm text-center;
}
.login-view__title {
  @apply text-2xl font-semibold text-slate-800;
}
.login-view__subtitle {
  @apply mt-2 text-slate-500;
}
.login-view__notice {
  @apply mt-4 rounded-lg bg-amber-50 p-2 text-sm text-amber-700;
}
.login-view__form {
  @apply mt-6 flex flex-col gap-3 text-left;
}
.login-view__input {
  @apply w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none;
}
.login-view__error {
  @apply rounded-lg bg-rose-50 p-2 text-sm text-rose-600;
}
.login-view__submit {
  @apply rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50;
}
.login-view__footer {
  @apply mt-4 text-sm text-slate-500;
}
.login-view__link {
  @apply font-medium text-slate-700 hover:underline;
}
</style>
