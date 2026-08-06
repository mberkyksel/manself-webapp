import { useTaskStore } from '../stores/taskStore.js';

// Same before/after math KanbanColumn's onDropOnCard/onDropOnColumn used to
// do directly against native drop events - resolved here from a coordinate
// instead, via data-task-id/data-column-status attributes in the DOM.
export function useKanbanDrag() {
  const taskStore = useTaskStore();

  function resolveDrop(x, y, draggedId) {
    const el = document.elementFromPoint(x, y);
    const columnEl = el?.closest('[data-column-status]');
    if (!columnEl) return;

    const status = columnEl.dataset.columnStatus;
    const siblings = taskStore.byStatus(status).filter((t) => t.id !== draggedId);
    const cardEl = el?.closest('[data-task-id]');
    const targetId = cardEl ? Number(cardEl.dataset.taskId) : null;

    if (targetId != null && targetId !== draggedId) {
      const index = siblings.findIndex((t) => t.id === targetId);
      const beforeTask = siblings[index - 1];
      taskStore.moveTask(draggedId, { status, beforeId: beforeTask?.id ?? null, afterId: targetId });
    } else {
      const lastTask = siblings[siblings.length - 1];
      taskStore.moveTask(draggedId, { status, beforeId: lastTask?.id ?? null, afterId: null });
    }
  }

  return { resolveDrop };
}
