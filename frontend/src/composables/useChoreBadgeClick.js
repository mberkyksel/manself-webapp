// A native dblclick always fires a full click, click, dblclick sequence, so a
// naive @click handler would toggle "done" right before the delete fires.
// Delay the toggle by ~250ms and let the dblclick handler cancel it if it
// lands first.
const DELAY_MS = 250;

export function useChoreBadgeClick({ onToggle, onDelete }) {
  let timer = null;

  function onBadgeClick() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onToggle();
    }, DELAY_MS);
  }

  function onBadgeDoubleClick() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    onDelete();
  }

  return { onBadgeClick, onBadgeDoubleClick };
}
