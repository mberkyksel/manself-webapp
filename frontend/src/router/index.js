import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';
import AppLayout from '../layouts/AppLayout.vue';
import LandingView from '../views/LandingView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import DashboardView from '../views/DashboardView.vue';
import SettingsView from '../views/SettingsView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import { useUserStore } from '../stores/userStore.js';

const routes = [
  // Public marketing pages share a header/footer layout.
  {
    path: '/',
    component: PublicLayout,
    children: [{ path: '', name: 'landing', component: LandingView, meta: { title: 'Your whole day in one calm dashboard' } }],
  },

  // Login/register are full-page forms that only make sense logged out.
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true, title: 'Log in' } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true, title: 'Create account' } },

  // Everything behind login lives under /app and shares the app shell
  // (side menu + footer). New signed-in pages go here as children.
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
      { path: 'settings', name: 'settings', component: SettingsView, meta: { title: 'Settings' } },
    ],
  },

  // Anything unmatched, including unknown paths under /app.
  {
    path: '/:pathMatch(.*)*',
    component: PublicLayout,
    children: [{ path: '', name: 'not-found', component: NotFoundView, meta: { title: 'Page not found' } }],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.meta.guestOnly && userStore.isAuthenticated) {
    return { name: 'dashboard' };
  }
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · manself` : 'manself';
});

export default router;
