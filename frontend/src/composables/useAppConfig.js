import { ref } from 'vue';
import { configService } from '../services/configService.js';

// Server-side feature flags needed before login (e.g. whether to show "Try
// the demo"). Fetched once and shared across every caller; a failed request
// just leaves the flags off rather than breaking the page.
const demoEnabled = ref(false);
let request = null;

export function useAppConfig() {
  if (!request) {
    request = configService
      .get()
      .then((config) => {
        demoEnabled.value = Boolean(config.demoEnabled);
      })
      .catch(() => {});
  }
  return { demoEnabled };
}
