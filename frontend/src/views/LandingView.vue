<script setup>
import { CalendarDays, SquareKanban, House, ListChecks, StickyNote, CloudSun } from '@lucide/vue';
import { useUserStore } from '../stores/userStore.js';
import DemoLoginButton from '../components/DemoLoginButton.vue';

const userStore = useUserStore();

const features = [
  {
    icon: CalendarDays,
    title: 'Calendar',
    text: 'See the next ten days at a glance or open the full month, and link events to the tasks they belong to.',
  },
  {
    icon: SquareKanban,
    title: 'Kanban board',
    text: 'Drag tasks between To Do, In Progress and Done, with priorities and due dates on every card.',
  },
  {
    icon: House,
    title: 'House chores',
    text: "Drag chores onto a day, repeat them daily or weekly, and get a little confetti when today's list is done.",
  },
  {
    icon: ListChecks,
    title: "Today's todos",
    text: 'Everything due today plus anything overdue, one tick away from done.',
  },
  {
    icon: StickyNote,
    title: 'Sticky notes',
    text: 'Pin quick thoughts anywhere on screen. On a phone they tuck away into a tidy bottom sheet.',
  },
  {
    icon: CloudSun,
    title: 'Weather & clock',
    text: 'Local weather and the time in your own time zone, right on the dashboard.',
  },
];

const stack = ['Vue 3', 'Pinia', 'Tailwind CSS', 'Express', 'PostgreSQL', 'Docker'];
</script>

<template>
  <div class="landing">
    <section class="landing__hero">
      <div class="landing__blob landing__blob--1" aria-hidden="true"></div>
      <div class="landing__blob landing__blob--2" aria-hidden="true"></div>
      <div class="landing__blob landing__blob--3" aria-hidden="true"></div>

      <div class="landing__hero-inner">
        <p class="landing__eyebrow">A personal household dashboard</p>
        <h1 class="landing__title">Your whole day, in one calm dashboard.</h1>
        <p class="landing__lead">
          Calendar, tasks, house chores and sticky notes together, so nothing has to live in five different apps.
        </p>

        <div class="landing__actions">
          <router-link v-if="userStore.isAuthenticated" :to="{ name: 'dashboard' }" class="landing__primary">
            Open your dashboard
          </router-link>
          <template v-else>
            <DemoLoginButton variant="hero" />
            <router-link :to="{ name: 'register' }" class="landing__secondary">Create an account</router-link>
          </template>
        </div>
        <p v-if="!userStore.isAuthenticated" class="landing__hint">
          Already have an account? <router-link :to="{ name: 'login' }" class="landing__link">Log in</router-link>
        </p>
      </div>
    </section>

    <section class="landing__section" aria-labelledby="features-heading">
      <h2 id="features-heading" class="landing__heading">Everything for the day, in one place</h2>
      <div class="landing__grid">
        <article v-for="feature in features" :key="feature.title" class="landing__card">
          <span class="landing__icon"><component :is="feature.icon" :size="20" /></span>
          <h3 class="landing__card-title">{{ feature.title }}</h3>
          <p class="landing__card-text">{{ feature.text }}</p>
        </article>
      </div>
    </section>

    <section class="landing__section landing__section--stack" aria-labelledby="stack-heading">
      <h2 id="stack-heading" class="landing__stack-heading">Built with</h2>
      <ul class="landing__stack">
        <li v-for="item in stack" :key="item" class="landing__pill">{{ item }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.landing {
  @apply flex-1;
}
.landing__hero {
  @apply relative overflow-hidden px-5 pb-16 pt-10 sm:pb-24 sm:pt-16;
}
.landing__blob {
  @apply pointer-events-none absolute rounded-full opacity-40 blur-3xl;
}
.landing__blob--1 {
  @apply -left-20 -top-10 h-72 w-72 bg-indigo-400;
}
.landing__blob--2 {
  @apply -top-16 right-0 h-64 w-64 bg-purple-400;
}
.landing__blob--3 {
  @apply -bottom-10 left-1/3 h-60 w-60 bg-sky-400;
}
.landing__hero-inner {
  @apply relative mx-auto flex max-w-3xl flex-col items-center text-center;
}
.landing__eyebrow {
  @apply rounded-full border border-white/70 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-indigo-600 backdrop-blur;
}
.landing__title {
  @apply mt-5 text-4xl leading-tight text-slate-900 sm:text-5xl;
  font-family: 'Fredoka', system-ui, sans-serif;
  font-weight: 700;
}
.landing__lead {
  @apply mt-5 max-w-xl text-lg text-slate-600;
}
.landing__actions {
  @apply mt-8 flex flex-col items-center gap-3 sm:flex-row;
}
.landing__primary {
  @apply rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500;
}
.landing__secondary {
  @apply rounded-lg border border-slate-300 bg-white/80 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-white;
}
.landing__hint {
  @apply mt-5 text-sm text-slate-500;
}
.landing__link {
  @apply font-medium text-slate-700 hover:underline;
}

.landing__section {
  @apply mx-auto max-w-6xl px-5 py-12;
}
.landing__heading {
  @apply text-center text-2xl font-semibold text-slate-800;
}
.landing__grid {
  @apply mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3;
}
.landing__card {
  @apply rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm;
}
.landing__icon {
  @apply flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600;
}
.landing__card-title {
  @apply mt-4 text-base font-semibold text-slate-800;
}
.landing__card-text {
  @apply mt-1 text-sm leading-relaxed text-slate-500;
}
.landing__section--stack {
  @apply pb-16 text-center;
}
.landing__stack-heading {
  @apply text-xs font-semibold uppercase tracking-wide text-slate-400;
}
.landing__stack {
  @apply mt-4 flex flex-wrap items-center justify-center gap-2;
}
.landing__pill {
  @apply rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600;
}
</style>
