<script setup>
import { useUserStore } from '../stores/userStore.js';

const userStore = useUserStore();
</script>

<template>
  <section class="not-found">
    <p class="not-found__code">404</p>
    <h1 class="not-found__title">This page wandered off.</h1>
    <p class="not-found__text">The link may be broken, or the page may have moved.</p>

    <div class="not-found__actions">
      <router-link :to="{ name: 'landing' }" class="not-found__primary">Back to home</router-link>
      <router-link v-if="userStore.isAuthenticated" :to="{ name: 'dashboard' }" class="not-found__secondary">
        Go to dashboard
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  @apply mx-auto flex flex-1 flex-col items-center justify-center px-5 py-16 text-center;
}
.not-found__code {
  @apply bg-gradient-to-br from-indigo-500 via-violet-400 to-sky-400 bg-clip-text text-8xl text-transparent;
  font-family: 'Fredoka', system-ui, sans-serif;
  font-weight: 700;
}
.not-found__title {
  @apply mt-2 text-2xl font-semibold text-slate-800;
}
.not-found__text {
  @apply mt-2 text-slate-500;
}
.not-found__actions {
  @apply mt-8 flex flex-col items-center gap-3 sm:flex-row;
}
.not-found__primary {
  @apply rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700;
}
.not-found__secondary {
  @apply rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50;
}
</style>
