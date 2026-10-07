import { ref } from 'vue';

// Module-level on purpose: stores, composables and components all push to the
// same list, and <ToastHost /> (mounted once in App.vue) renders it.
const toasts = ref([]);
const timers = new Map();
let nextId = 1;

const DEFAULT_DURATION_MS = { success: 4000, info: 4000, error: 6500 };
const ACTION_DURATION_MS = 8000;

function dismiss(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

function schedule(id, duration) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => dismiss(id), duration));
}

// `key` de-duplicates: showing a toast whose key is already on screen
// refreshes it instead of stacking another copy. That keeps a failing backend
// (every drag/save failing the same way) from burying the screen in errors.
function show(type, message, { key = null, duration, action = null } = {}) {
  const resolvedDuration = duration ?? (action ? ACTION_DURATION_MS : DEFAULT_DURATION_MS[type]);

  const existing = key ? toasts.value.find((toast) => toast.key === key) : null;
  if (existing) {
    existing.type = type;
    existing.message = message;
    existing.action = action;
    schedule(existing.id, resolvedDuration);
    return existing.id;
  }

  const id = nextId++;
  toasts.value = [...toasts.value, { id, type, message, key, action }];
  schedule(id, resolvedDuration);
  return id;
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message, options) => show('success', message, options),
    error: (message, options) => show('error', message, options),
    info: (message, options) => show('info', message, options),
  };
}
