<script setup>
import { computed } from 'vue';
import { useChoreStore } from '../../stores/choreStore.js';
import ChoreBadge from './ChoreBadge.vue';
import { useChoreRemoval } from '../../composables/useChoreRemoval.js';
import { useChoreRepeatMenu } from '../../composables/useChoreRepeatMenu.js';

const choreStore = useChoreStore();
const { removeChoreWithUndo } = useChoreRemoval();
const repeatMenu = useChoreRepeatMenu();

const todayDateOnly = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
});

const todaysChores = computed(() =>
  (choreStore.choresByDate[todayDateOnly.value] || []).map((chore) => ({
    ...chore,
    repeatLabel: choreStore.repeatLabelOf(chore),
  }))
);
const doneChoresCount = computed(() => todaysChores.value.filter((chore) => chore.isDone).length);
</script>

<template>
  <div class="today-chores">
    <div class="today-chores__header">
      <h2 class="today-chores__title">Today's Chores</h2>
      <span class="today-chores__count">{{ doneChoresCount }}/{{ todaysChores.length }}</span>
    </div>

    <p v-if="todaysChores.length === 0" class="today-chores__empty">
      No chores scheduled today. Drag one from the Home Widget onto a day in the calendar.
    </p>

    <div v-else class="today-chores__row">
      <ChoreBadge
        v-for="chore in todaysChores"
        :key="chore.id"
        :chore="chore"
        size="md"
        @toggle="choreStore.toggleChoreDone(todayDateOnly, $event)"
        @delete="removeChoreWithUndo(todayDateOnly, $event)"
        @repeat-menu="repeatMenu.open({ dateKey: todayDateOnly, ...$event })"
      />
    </div>
  </div>
</template>

<style scoped>
.today-chores {
  @apply card mx-auto mt-8 max-w-5xl bg-white p-5;
}
.today-chores__header {
  @apply mb-3 flex items-center justify-between;
}
.today-chores__title {
  @apply text-sm font-semibold text-slate-600;
}
.today-chores__count {
  @apply text-xs text-slate-400;
}
.today-chores__empty {
  @apply text-sm text-slate-400;
}
.today-chores__row {
  @apply flex flex-wrap items-center gap-2;
}
</style>
