<script setup>
import { onMounted } from 'vue';
import StickyNote from './StickyNote.vue';
import { useNoteStore } from '../../stores/noteStore.js';

const noteStore = useNoteStore();

onMounted(() => {
  noteStore.fetchNotes();
});
</script>

<template>
  <Teleport to="body">
    <div class="sticky-notes-layer">
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
        @delete="noteStore.removeNote(note.id)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.sticky-notes-layer {
  @apply pointer-events-none fixed inset-0 z-40;
}
.sticky-notes-layer__add {
  @apply pointer-events-auto fixed bottom-6 right-6 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300;
}
</style>
