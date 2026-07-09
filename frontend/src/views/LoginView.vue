<template>
  <main class="login-view">
    <div class="login-view__panel">
      <h1 class="login-view__title">Login</h1>
      <p class="login-view__subtitle">Authentication is not implemented yet.</p>
    </div>
  </main>
</template>

<style scoped>
.login-view {
  @apply flex min-h-screen items-center justify-center bg-slate-100;
}
.login-view__panel {
  @apply text-center;
}
.login-view__title {
  @apply text-2xl font-semibold text-slate-800;
}
.login-view__subtitle {
  @apply mt-2 text-slate-500;
}
</style>
