import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/main.css';
import App from './App.vue';
import router from './router/index.js';
import { useUserStore } from './stores/userStore.js';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Re-validate a token restored from localStorage before mounting, so the
// router guard's first navigation and the initial render both see correct
// auth state instead of a flash of the wrong screen.
const userStore = useUserStore();
userStore.fetchCurrentUser().finally(() => {
  app.mount('#app');
});
