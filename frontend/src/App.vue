<script setup>
import ToastHost from './components/ToastHost.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import ChoreRepeatMenu from './components/dashboard/ChoreRepeatMenu.vue';
</script>

<template>
  <router-view />
  <ToastHost />
  <ConfirmDialog />
  <ChoreRepeatMenu />
</template>
