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

const todayProgress = computed(() => {
  const chores = choreStore.choresByDate[todayDateKey()] || [];
  const done = chores.filter((c) => c.isDone).length;
  return { done, total: chores.length };
});

// Celebrates only when the user ticks off the last open chore: today goes
// from not-all-done to all-done, one more chore is done, and the total is
// unchanged. Removing the last unfinished chore (or undoing a removal)
// changes the total instead, so it doesn't count as finishing the day, and
// loading an already-finished day doesn't replay it either.
watch(todayProgress, (now, before) => {
  const isAllDone = now.total > 0 && now.done === now.total;
  const wasAllDone = before.total > 0 && before.done === before.total;
  if (!isAllDone || wasAllDone) return;
  if (now.total !== before.total || now.done <= before.done) return;

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
