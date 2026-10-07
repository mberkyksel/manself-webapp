<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  danger: { type: Boolean, default: false },
  // The shared demo account can't change these; the form below is disabled
  // and this note says why.
  locked: { type: Boolean, default: false },
});
</script>

<template>
  <section class="settings-card" :class="{ 'settings-card--danger': danger }">
    <header class="settings-card__header">
      <h2 class="settings-card__title">{{ title }}</h2>
      <p v-if="description" class="settings-card__description">{{ description }}</p>
    </header>

    <p v-if="locked" class="settings-card__locked">Not available in the demo account.</p>

    <fieldset class="settings-card__body" :disabled="locked">
      <slot />
    </fieldset>
  </section>
</template>

<style scoped>
.settings-card {
  @apply card bg-white p-5;
}
.settings-card--danger {
  @apply border border-rose-200;
}
.settings-card__title {
  @apply text-base font-semibold text-slate-800;
}
.settings-card--danger .settings-card__title {
  @apply text-rose-700;
}
.settings-card__description {
  @apply mt-1 text-sm text-slate-500;
}
.settings-card__locked {
  @apply mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700;
}
.settings-card__body {
  @apply m-0 mt-4 min-w-0 border-0 p-0;
}
</style>
