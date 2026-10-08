<script setup>
import { ArrowLeft } from '@lucide/vue';
import ProfileForm from '../components/settings/ProfileForm.vue';
import LocationForm from '../components/settings/LocationForm.vue';
import EmailForm from '../components/settings/EmailForm.vue';
import PasswordForm from '../components/settings/PasswordForm.vue';
import DeleteAccountCard from '../components/settings/DeleteAccountCard.vue';
</script>

<template>
  <main class="settings-view">
    <div class="settings-view__inner">
      <router-link :to="{ name: 'dashboard' }" class="settings-view__back">
        <ArrowLeft :size="14" />
        Back to dashboard
      </router-link>

      <h1 class="settings-view__title">Settings</h1>

      <div class="settings-view__sections">
        <ProfileForm />
        <LocationForm />
        <EmailForm />
        <PasswordForm />
        <DeleteAccountCard />
      </div>
    </div>
  </main>
</template>

<style scoped>
.settings-view {
  @apply flex-1 px-6 pb-12 pt-24;
}
.settings-view__inner {
  @apply mx-auto max-w-xl;
}
.settings-view__back {
  @apply inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline;
}
.settings-view__title {
  @apply mt-3 text-2xl font-semibold text-slate-800;
}
.settings-view__sections {
  @apply mt-6 flex flex-col gap-5;
}
</style>
