<script setup>
import { nextTick, ref, watch } from 'vue';
import { TriangleAlert } from '@lucide/vue';
import { useConfirm } from '../composables/useConfirm.js';

const { pending, answer } = useConfirm();

const cancelButton = ref(null);
const confirmButton = ref(null);
let previouslyFocused = null;

// Focus lands on Cancel (the safe choice for a destructive prompt) and goes
// back to whatever opened the dialog once it closes.
watch(pending, async (current, previous) => {
  if (current && !previous) {
    previouslyFocused = document.activeElement;
    await nextTick();
    cancelButton.value?.focus();
  } else if (!current && previous) {
    previouslyFocused?.focus?.();
    previouslyFocused = null;
  }
});

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    answer(false);
    return;
  }

  // Keep Tab inside the dialog: two buttons, so just flip between them.
  if (event.key === 'Tab') {
    event.preventDefault();
    const target = document.activeElement === cancelButton.value ? confirmButton.value : cancelButton.value;
    target?.focus();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="pending" class="confirm-backdrop" @click.self="answer(false)" @keydown="onKeydown">
        <div
          class="confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          :aria-describedby="pending.message ? 'confirm-message' : undefined"
        >
          <div class="confirm__icon" :class="`confirm__icon--${pending.tone}`" aria-hidden="true">
            <TriangleAlert :size="20" />
          </div>
          <h2 id="confirm-title" class="confirm__title">{{ pending.title }}</h2>
          <p v-if="pending.message" id="confirm-message" class="confirm__message">{{ pending.message }}</p>

          <div class="confirm__actions">
            <button ref="cancelButton" type="button" class="confirm__cancel" @click="answer(false)">
              {{ pending.cancelLabel }}
            </button>
            <button
              ref="confirmButton"
              type="button"
              class="confirm__confirm"
              :class="`confirm__confirm--${pending.tone}`"
              @click="answer(true)"
            >
              {{ pending.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-backdrop {
  @apply fixed inset-0 z-[9995] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm;
}
.confirm {
  @apply w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 text-center shadow-[0_20px_60px_-15px_rgba(30,41,59,0.5)];
}
.confirm__icon {
  @apply mx-auto flex h-11 w-11 items-center justify-center rounded-full;
}
.confirm__icon--danger {
  @apply bg-rose-50 text-rose-600;
}
.confirm__icon--default {
  @apply bg-indigo-50 text-indigo-600;
}
.confirm__title {
  @apply mt-4 text-lg font-semibold text-slate-800;
}
.confirm__message {
  @apply mt-2 text-sm text-slate-500;
}
.confirm__actions {
  @apply mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center;
}
.confirm__cancel {
  @apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:min-w-28;
}
.confirm__confirm {
  @apply rounded-lg px-4 py-2 text-sm font-medium text-white sm:min-w-28;
}
.confirm__confirm--danger {
  @apply bg-rose-600 hover:bg-rose-700;
}
.confirm__confirm--default {
  @apply bg-slate-800 hover:bg-slate-700;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.15s ease;
}
.confirm-enter-active .confirm,
.confirm-leave-active .confirm {
  transition: transform 0.15s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from .confirm,
.confirm-leave-to .confirm {
  transform: scale(0.95);
}
</style>
