import { ref, onUnmounted } from 'vue';

const DEFAULT_THRESHOLD = 8;

// Unifies mouse/touch/pen drag handling behind one Pointer Events based
// state machine, with a movement threshold so a plain tap/click still works
// on anything that's also a drag source (e.g. a chore icon that both cycles
// state on click and starts a schedule-drag).
//
// Deliberately uses window-level move/up/cancel listeners instead of
// element.setPointerCapture - capture has known retargeting inconsistencies
// on iOS Safari, and StickyNote.vue already proved this exact pattern works
// for mouse-only dragging in this app.
export function usePointerDrag({
  threshold = DEFAULT_THRESHOLD,
  shouldIgnore,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
} = {}) {
  const isDragging = ref(false);

  let activePointerId = null;
  let sourceElement = null;
  let startX = 0;
  let startY = 0;

  function ctx() {
    return { sourceElement, startX, startY };
  }

  // Installed only once a real drag is detected, so a plain tap never pays
  // this cost and never risks swallowing its own click handler.
  function suppressTrailingClick() {
    function onClick(event) {
      event.stopPropagation();
      event.preventDefault();
      sourceElement?.removeEventListener('click', onClick, true);
    }
    sourceElement?.addEventListener('click', onClick, true);
  }

  function attachWindowListeners() {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function detachWindowListeners() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function reset() {
    activePointerId = null;
    sourceElement = null;
    isDragging.value = false;
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !event.isPrimary) return;
    if (activePointerId != null) return;
    if (shouldIgnore?.(event)) return;

    activePointerId = event.pointerId;
    sourceElement = event.currentTarget;
    startX = event.clientX;
    startY = event.clientY;
    isDragging.value = false;

    attachWindowListeners();
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId) return;

    if (!isDragging.value) {
      const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
      if (distance < threshold) return;
      isDragging.value = true;
      suppressTrailingClick();
      onDragStart?.(event, ctx());
    }

    event.preventDefault();
    onDragMove?.(event, ctx());
  }

  function onPointerUp(event) {
    if (event.pointerId !== activePointerId) return;

    detachWindowListeners();
    const wasDragging = isDragging.value;
    const finishedCtx = ctx();
    reset();

    if (wasDragging) {
      onDragEnd?.(event, finishedCtx);
    }
  }

  function onPointerCancel(event) {
    if (event.pointerId !== activePointerId) return;

    detachWindowListeners();
    const wasDragging = isDragging.value;
    const finishedCtx = ctx();
    reset();

    if (wasDragging) {
      onDragCancel?.(event, finishedCtx);
    }
  }

  // iOS Safari doesn't reliably fire pointercancel when the app is
  // backgrounded mid-drag (e.g. swiping up to the app switcher) - this is
  // the belt-and-suspenders fallback so a ghost element never gets stuck.
  function onVisibilityChange() {
    if (document.hidden && isDragging.value) {
      onPointerCancel({ pointerId: activePointerId, clientX: startX, clientY: startY });
    }
  }

  onUnmounted(() => {
    if (activePointerId != null) {
      onPointerCancel({ pointerId: activePointerId, clientX: startX, clientY: startY });
    }
  });

  return { onPointerDown, isDragging };
}
