<script setup>
import SidePanel from '../components/dashboard/SidePanel.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="app-layout">
    <SidePanel />

    <div class="app-layout__content">
      <router-view />
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  @apply flex min-h-screen flex-col bg-slate-100;
}
.app-layout__content {
  @apply flex flex-1 flex-col;
}
</style>
