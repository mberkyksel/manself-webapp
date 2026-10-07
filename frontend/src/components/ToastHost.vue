<script setup>
import { CircleCheck, CircleAlert, Info, X } from '@lucide/vue';
import { useToast } from '../composables/useToast.js';

const { toasts, dismiss } = useToast();

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

function runAction(toast) {
  toast.action.onClick();
  dismiss(toast.id);
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          :role="toast.type === 'error' ? 'alert' : 'status'"
        >
          <component :is="ICONS[toast.type]" :size="18" class="toast__icon" aria-hidden="true" />
          <p class="toast__message">{{ toast.message }}</p>
          <button v-if="toast.action" type="button" class="toast__action" @click="runAction(toast)">
            {{ toast.action.label }}
          </button>
          <button type="button" class="toast__close" aria-label="Dismiss" @click="dismiss(toast.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Above the sticky-note layer (z-40) and side menu (z-50), below the
   confirm dialog and confetti. On phones it sits higher so it clears the
   floating "Notes" button in the bottom-right corner. */
.toast-host {
  @apply pointer-events-none fixed inset-x-0 bottom-20 z-[9990] flex flex-col items-center gap-2 px-4 sm:bottom-6;
}
.toast {
  @apply pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-white/70 bg-white/95 py-3 pl-4 pr-3 text-sm text-slate-700 shadow-[0_12px_40px_-10px_rgba(30,41,59,0.4)] backdrop-blur-xl;
}
.toast__icon {
  @apply shrink-0;
}
.toast--success .toast__icon {
  @apply text-emerald-500;
}
.toast--error .toast__icon {
  @apply text-rose-500;
}
.toast--info .toast__icon {
  @apply text-indigo-500;
}
.toast__message {
  @apply min-w-0 flex-1;
}
.toast__action {
  @apply shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-50;
}
.toast__close {
  @apply shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.96);
}
.toast-leave-active {
  position: absolute;
}
</style>
