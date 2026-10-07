<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import StickyNote from './StickyNote.vue';
import { useNoteStore } from '../../stores/noteStore.js';
import { useConfirm } from '../../composables/useConfirm.js';

const noteStore = useNoteStore();
const { confirm } = useConfirm();

// Free-floating positioned notes don't fit a phone screen - below Tailwind's
// sm breakpoint (640px, unmodified default) notes render as a stacked list
// in a bottom sheet instead (see StickyNote.vue's `stacked` prop).
const isMobile = ref(false);
const panelOpen = ref(false);
let mql = null;

function updateIsMobile(event) {
  isMobile.value = event.matches;
}

// An empty note has nothing to lose, so it goes without asking.
async function requestRemoveNote(note) {
  const hasText = note.text?.trim().length > 0;
  const confirmed =
    !hasText ||
    (await confirm({
      title: 'Delete this note?',
      message: 'The note and what you wrote on it will be permanently deleted.',
      confirmLabel: 'Delete note',
    }));
  if (confirmed) noteStore.removeNote(note.id);
}

onMounted(() => {
  noteStore.fetchNotes();
  mql = window.matchMedia('(max-width: 639.98px)');
  isMobile.value = mql.matches;
  mql.addEventListener('change', updateIsMobile);
});

onUnmounted(() => mql?.removeEventListener('change', updateIsMobile));
</script>

<template>
  <Teleport to="body">
    <!-- Desktop/tablet: free-floating, draggable notes -->
    <div v-if="!isMobile" class="sticky-notes-layer">
      <button
        type="button"
        class="sticky-notes-layer__add"
        :disabled="!noteStore.canAddNote"
        :title="noteStore.canAddNote ? 'Add a sticky note' : 'Note limit reached (5 max)'"
        @click="noteStore.addNote"
      >
        + Note ({{ noteStore.notes.length }}/5)
      </button>

      <StickyNote
        v-for="note in noteStore.notes"
        :key="note.id"
        :note="note"
        @focus="noteStore.bringToFront(note.id)"
        @move="({ x, y }) => noteStore.updateNote(note.id, { positionX: x, positionY: y })"
        @update-text="(text) => noteStore.updateNote(note.id, { text })"
        @update-color="(color) => noteStore.updateNote(note.id, { color })"
        @delete="requestRemoveNote(note)"
      />
    </div>

    <!-- Mobile: stacked bottom sheet, no free positioning/dragging -->
    <template v-else>
      <button type="button" class="sticky-notes-toggle" @click="panelOpen = !panelOpen">
        🗒️ Notes ({{ noteStore.notes.length }}/5)
      </button>

      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="panelOpen" class="sticky-notes-scrim" @click="panelOpen = false"></div>
      </Transition>

      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
      >
        <div v-if="panelOpen" class="sticky-notes-sheet">
          <div class="sticky-notes-sheet__header">
            <span class="sticky-notes-sheet__title">Sticky notes</span>
            <button type="button" class="sticky-notes-sheet__close" title="Close" @click="panelOpen = false">
              &times;
            </button>
          </div>

          <button
            type="button"
            class="sticky-notes-sheet__add"
            :disabled="!noteStore.canAddNote"
            :title="noteStore.canAddNote ? 'Add a sticky note' : 'Note limit reached (5 max)'"
            @click="noteStore.addNote"
          >
            + Add note
          </button>

          <p v-if="!noteStore.notes.length" class="sticky-notes-sheet__empty">No notes yet.</p>

          <div v-else class="sticky-notes-sheet__list">
            <StickyNote
              v-for="note in noteStore.notes"
              :key="note.id"
              :note="note"
              stacked
              @update-text="(text) => noteStore.updateNote(note.id, { text })"
              @update-color="(color) => noteStore.updateNote(note.id, { color })"
              @delete="requestRemoveNote(note)"
            />
          </div>
        </div>
      </Transition>
    </template>
  </Teleport>
</template>

<style scoped>
.sticky-notes-layer {
  @apply pointer-events-none fixed inset-0 z-40;
}
.sticky-notes-layer__add {
  @apply pointer-events-auto fixed bottom-6 right-6 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300;
}

.sticky-notes-toggle {
  @apply fixed bottom-6 right-6 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-slate-700;
}
.sticky-notes-scrim {
  @apply fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm;
}
.sticky-notes-sheet {
  @apply fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white p-4 shadow-[0_-8px_30px_-10px_rgba(30,41,59,0.35)];
}
.sticky-notes-sheet__header {
  @apply flex items-center justify-between;
}
.sticky-notes-sheet__title {
  @apply text-xs font-semibold uppercase tracking-wide text-slate-500;
}
.sticky-notes-sheet__close {
  @apply flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-700;
}
.sticky-notes-sheet__add {
  @apply mt-3 shrink-0 rounded-lg bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300;
}
.sticky-notes-sheet__empty {
  @apply mt-4 text-center text-sm text-slate-400;
}
.sticky-notes-sheet__list {
  @apply mt-3 flex-1 overflow-y-auto;
}
</style>
