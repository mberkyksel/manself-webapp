import { defineStore } from 'pinia';
import { noteService } from '../services/noteService.js';
import { useToast } from '../composables/useToast.js';

const MAX_NOTES = 5;
const NOTE_SIZE = 200;

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    loading: false,
    error: null,
  }),

  getters: {
    canAddNote: (state) => state.notes.length < MAX_NOTES,
  },

  actions: {
    async fetchNotes() {
      this.loading = true;
      this.error = null;
      try {
        this.notes = await noteService.list();
      } catch (err) {
        this.error = 'Could not load notes. Is the backend running?';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async addNote() {
      if (!this.canAddNote) return;

      // Cascade new notes diagonally so they don't stack exactly on top of
      // each other, wrapping back to the top-left once space runs out.
      const step = 32;
      const maxOffsetX = Math.max(window.innerWidth - NOTE_SIZE - 40, step);
      const maxOffsetY = Math.max(window.innerHeight - NOTE_SIZE - 40, step);
      const offset = this.notes.length * step;

      try {
        const note = await noteService.create({
          text: '',
          color: 'yellow',
          positionX: 40 + (offset % maxOffsetX),
          positionY: 40 + (offset % maxOffsetY),
        });
        this.notes.push(note);
        return note;
      } catch (err) {
        console.error(err);
        useToast().error("Couldn't add a note. Please try again.", { key: 'note-add-failed' });
        return null;
      }
    },

    async updateNote(id, payload) {
      const note = this.notes.find((n) => n.id === id);
      if (!note) return;

      const previous = { ...note };
      Object.assign(note, payload);

      try {
        await noteService.update(id, payload);
      } catch (err) {
        Object.assign(note, previous);
        console.error(err);
        useToast().error("Couldn't save the note, so the change was reverted.", { key: 'note-save-failed' });
      }
    },

    // Bumps the note above all its siblings. No-ops (and skips the network
    // call) if it's already on top, so clicking the topmost note repeatedly
    // doesn't spam PATCH requests.
    bringToFront(id) {
      const note = this.notes.find((n) => n.id === id);
      if (!note) return;

      const maxZ = Math.max(0, ...this.notes.map((n) => n.zIndex));
      if (note.zIndex === maxZ && this.notes.filter((n) => n.zIndex === maxZ).length === 1) return;

      this.updateNote(id, { zIndex: maxZ + 1 });
    },

    async removeNote(id) {
      const previous = this.notes;
      this.notes = this.notes.filter((note) => note.id !== id);
      try {
        await noteService.remove(id);
        useToast().success('Note deleted.');
      } catch (err) {
        this.notes = previous;
        console.error(err);
        useToast().error("Couldn't delete the note, so it was put back.", { key: 'note-delete-failed' });
      }
    },
  },
});
