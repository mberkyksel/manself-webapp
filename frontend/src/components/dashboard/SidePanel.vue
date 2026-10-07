<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LayoutDashboard, LogOut, Settings, X } from '@lucide/vue';
import { useUserStore } from '../../stores/userStore.js';
import brandMark from '../../assets/brand/manself-mark-transparent.svg';

const userStore = useUserStore();
const router = useRouter();

const isOpen = ref(false);

function close() {
  isOpen.value = false;
}

function onLogout() {
  close();
  userStore.logout();
  router.push({ name: 'landing' });
}
</script>

<template>
  <button type="button" class="side-panel-trigger" title="Open menu" @click="isOpen = true">
    <img :src="brandMark" alt="manself" class="side-panel-trigger__mark" />
  </button>

  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="side-panel-scrim" @click="close"></div>
  </Transition>

  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="-translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="-translate-x-full opacity-0"
  >
    <aside v-if="isOpen" class="side-panel">
      <div class="side-panel__blob side-panel__blob--1" aria-hidden="true"></div>
      <div class="side-panel__blob side-panel__blob--2" aria-hidden="true"></div>

      <div class="side-panel__header">
        <span class="side-panel__title">Menu</span>
        <button type="button" class="side-panel__close" title="Close menu" @click="close">
          <X :size="16" />
        </button>
      </div>

      <template v-if="userStore.isAuthenticated">
        <p class="side-panel__user">{{ userStore.name }}</p>

        <router-link :to="{ name: 'dashboard' }" class="side-panel__action" @click="close">
          <LayoutDashboard :size="16" />
          Dashboard
        </router-link>

        <router-link :to="{ name: 'settings' }" class="side-panel__action" @click="close">
          <Settings :size="16" />
          Settings
        </router-link>

        <button type="button" class="side-panel__action" @click="onLogout">
          <LogOut :size="16" />
          Log out
        </button>
      </template>
    </aside>
  </Transition>
</template>

<style scoped>
.side-panel-trigger {
  @apply fixed left-4 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 shadow-[0_8px_24px_-8px_rgba(30,41,59,0.35)] backdrop-blur-xl backdrop-saturate-150 transition duration-200 hover:scale-110;
}
.side-panel-trigger__mark {
  @apply h-6 w-6;
}
.side-panel-scrim {
  @apply fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm;
}
.side-panel {
  @apply fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto overflow-x-hidden border-r border-white/70 bg-white/70 p-5 shadow-[0_0_40px_-10px_rgba(30,41,59,0.35)] backdrop-blur-xl backdrop-saturate-150;
}
.side-panel__blob {
  @apply pointer-events-none absolute rounded-full opacity-40 blur-2xl;
}
.side-panel__blob--1 {
  @apply -left-10 -top-10 h-52 w-52 bg-indigo-400;
}
.side-panel__blob--2 {
  @apply -bottom-16 -left-6 h-48 w-48 bg-purple-400;
}
.side-panel__header {
  @apply relative z-10 flex items-center justify-between;
}
.side-panel__title {
  @apply text-xs font-semibold uppercase tracking-wide text-slate-500;
}
.side-panel__close {
  @apply flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white/60 hover:text-slate-700;
}
.side-panel__user {
  @apply relative z-10 mt-6 text-lg font-semibold text-slate-800;
}
.side-panel__action {
  @apply relative z-10 mt-3 flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-800 hover:underline;
}
.side-panel__action.router-link-exact-active {
  @apply font-semibold text-slate-800;
}
</style>
