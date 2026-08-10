<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import { useChoreStore } from '../../stores/choreStore.js';
import { useConfetti } from '../../composables/useConfetti.js';

const choreStore = useChoreStore();
const { burst } = useConfetti();

const TOAST_DURATION_MS = 3000;
const showToast = ref(false);
let hideTimer = null;

function todayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const allChoresDoneToday = computed(() => {
  const chores = choreStore.choresByDate[todayDateKey()] || [];
  return chores.length > 0 && chores.every((c) => c.isDone);
});

// Fires only on the false -> true transition (not on mount/reload with
// chores already done, and not on every re-render while they stay done),
// so marking the last chore off and back on again re-triggers it, but
// sitting on an already-finished day doesn't replay it endlessly.
watch(allChoresDoneToday, (isDone, wasDone) => {
  if (!isDone || wasDone) return;

  burst();
  showToast.value = true;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    showToast.value = false;
  }, TOAST_DURATION_MS);
});

onUnmounted(() => clearTimeout(hideTimer));
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 scale-90 -translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showToast" class="chores-celebration">
        <span class="chores-celebration__emoji" aria-hidden="true">🎉</span>
        <span class="chores-celebration__text">Well done! All chores complete for today.</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chores-celebration {
  @apply fixed left-1/2 top-20 z-[9998] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/90 px-5 py-3 text-sm font-medium text-slate-800 shadow-[0_12px_40px_-10px_rgba(30,41,59,0.4)] backdrop-blur-xl backdrop-saturate-150;
}
.chores-celebration__emoji {
  @apply text-lg;
}
</style>
