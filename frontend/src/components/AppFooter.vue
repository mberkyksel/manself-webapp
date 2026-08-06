<script setup>
const year = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer">© {{ year }} mbaerky</footer>
</template>

<style scoped>
.app-footer {
  @apply py-6 text-center text-xs text-slate-400;
}
</style>
