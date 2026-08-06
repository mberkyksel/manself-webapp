// Plain DOM helpers for a "clone follows the pointer, then hit-test what's
// underneath" drag visual. No Vue reactivity - pointermove can fire 60+
// times/sec and driving that through refs would be wasteful for something
// purely cosmetic.

export function createGhost(sourceEl, { className } = {}) {
  const rect = sourceEl.getBoundingClientRect();
  const ghost = sourceEl.cloneNode(true);
  ghost.classList.add('drag-ghost');
  if (className) ghost.classList.add(className);
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);
  return { ghost, rect };
}

export function moveGhost(ghost, x, y) {
  // translate3d over left/top: GPU-friendly, no layout reflow per frame.
  ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

export function removeGhost(ghost) {
  ghost?.remove();
}

// pointer-events:none on the ghost (set via the .drag-ghost class) is what
// lets elementFromPoint see through it to the real drop target underneath.
export function findDropTarget(x, y, selector) {
  return document.elementFromPoint(x, y)?.closest(selector) ?? null;
}
