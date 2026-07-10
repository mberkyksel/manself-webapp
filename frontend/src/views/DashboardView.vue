<script setup>
import WelcomeBanner from '../components/dashboard/WelcomeBanner.vue';
import WeatherWidget from '../components/dashboard/WeatherWidget.vue';
import ClockWidget from '../components/dashboard/ClockWidget.vue';
import CalendarView from '../components/calendar/CalendarView.vue';
import KanbanBoard from '../components/kanban/KanbanBoard.vue';
import StickyNotesManager from '../components/dashboard/StickyNotesManager.vue';
</script>

<template>
  <main class="dashboard-view">
    <div class="dashboard-view__calendar">
      <CalendarView />
    </div>

    <div class="dashboard-view__widgets">
      <div class="dashboard-view__blob dashboard-view__blob--1" aria-hidden="true"></div>
      <div class="dashboard-view__blob dashboard-view__blob--2" aria-hidden="true"></div>
      <div class="dashboard-view__blob dashboard-view__blob--3" aria-hidden="true"></div>

      <WelcomeBanner />
      <WeatherWidget />
      <ClockWidget />
    </div>

    <div class="dashboard-view__board">
      <KanbanBoard />
    </div>

    <StickyNotesManager />
  </main>
</template>

<style scoped>
.dashboard-view {
  @apply min-h-screen bg-slate-100 px-6 py-8;
}
.dashboard-view__calendar {
  @apply mx-auto max-w-5xl;
}
.dashboard-view__widgets {
  @apply relative mx-auto mt-8 flex max-w-5xl flex-col gap-5 overflow-hidden rounded-3xl p-7 sm:flex-row sm:items-stretch;
}
.dashboard-view__blob {
  @apply pointer-events-none absolute rounded-full opacity-50 blur-2xl;
}
.dashboard-view__blob--1 {
  @apply -top-16 -left-6 h-64 w-64 bg-indigo-400;
  animation: dashboard-drift-a 16s ease-in-out infinite;
}
.dashboard-view__blob--2 {
  @apply -bottom-16 left-56 h-56 w-56 bg-sky-400;
  animation: dashboard-drift-b 18s ease-in-out infinite;
}
.dashboard-view__blob--3 {
  @apply -top-14 right-10 h-52 w-52 bg-purple-400;
  animation: dashboard-drift-a 20s ease-in-out infinite reverse;
}
@keyframes dashboard-drift-a {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(24px, 18px); }
}
@keyframes dashboard-drift-b {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, -14px); }
}
@media (prefers-reduced-motion: reduce) {
  .dashboard-view__blob {
    animation: none;
  }
}
.dashboard-view__board {
  @apply mx-auto mt-8 max-w-5xl;
}
</style>
