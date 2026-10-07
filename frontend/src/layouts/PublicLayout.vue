<script setup>
import { useUserStore } from '../stores/userStore.js';
import AppFooter from '../components/AppFooter.vue';
import wordmark from '../assets/brand/manself-wordmark-lockup.svg';

const userStore = useUserStore();
</script>

<template>
  <div class="public-layout">
    <header class="public-layout__header">
      <router-link :to="{ name: 'landing' }" class="public-layout__brand" aria-label="manself home">
        <img :src="wordmark" alt="manself" class="public-layout__logo" />
      </router-link>

      <nav class="public-layout__nav" aria-label="Main">
        <router-link v-if="userStore.isAuthenticated" :to="{ name: 'dashboard' }" class="public-layout__cta">
          Open dashboard
        </router-link>
        <template v-else>
          <router-link :to="{ name: 'login' }" class="public-layout__link">Log in</router-link>
          <router-link :to="{ name: 'register' }" class="public-layout__cta">Get started</router-link>
        </template>
      </nav>
    </header>

    <div class="public-layout__content">
      <router-view />
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.public-layout {
  @apply flex min-h-screen flex-col bg-slate-100;
}
.public-layout__header {
  @apply relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4;
}
.public-layout__logo {
  @apply h-11 w-auto sm:h-14;
}
.public-layout__nav {
  @apply flex items-center gap-2 sm:gap-4;
}
.public-layout__link {
  @apply whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:px-3;
}
.public-layout__cta {
  @apply whitespace-nowrap rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:px-4;
}
.public-layout__content {
  @apply flex flex-1 flex-col;
}
</style>
