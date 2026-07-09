<script setup>
import WelcomeBanner from '../components/dashboard/WelcomeBanner.vue';
import ClockWidget from '../components/dashboard/ClockWidget.vue';
import CalendarView from '../components/calendar/CalendarView.vue';
import KanbanBoard from '../components/kanban/KanbanBoard.vue';
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-6 py-8">
    <div class="mx-auto max-w-5xl">
      <CalendarView />
    </div>

    <div class="mx-auto mt-8 flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <WelcomeBanner />
      <ClockWidget />
    </div>

    <div class="mx-auto mt-8 max-w-5xl">
      <KanbanBoard />
    </div>
  </main>
</template>
