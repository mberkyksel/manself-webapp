import { useChoreStore } from '../stores/choreStore.js';
import { useToast } from './useToast.js';
import { choreLabel } from '../constants/chores.js';

// Removing a chore is a double-click, which makes it too easy to do by
// accident but also too frequent to guard with a confirm dialog. So it just
// happens, and a toast offers a quick way back.
export function useChoreRemoval() {
  const choreStore = useChoreStore();
  const toast = useToast();

  function removeChoreWithUndo(dateKey, choreId) {
    const chores = choreStore.choresByDate[dateKey] ?? [];
    const index = chores.findIndex((c) => c.id === choreId);
    if (index === -1) return;
    const chore = chores[index];

    choreStore.removeChore(dateKey, choreId);
    toast.info(`${choreLabel(chore)} removed.`, {
      action: { label: 'Undo', onClick: () => choreStore.restoreChore(dateKey, chore, index) },
    });
  }

  return { removeChoreWithUndo };
}
