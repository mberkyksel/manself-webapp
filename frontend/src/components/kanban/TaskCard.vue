<script setup>
import { computed, ref } from 'vue';
import { Check, CalendarDays, CalendarSync, X } from '@lucide/vue';
import { usePointerDrag } from '../../composables/usePointerDrag.js';
import { createGhost, moveGhost, removeGhost, findDropTarget } from '../../utils/dragGhost.js';
import { useKanbanDrag } from '../../composables/useKanbanDrag.js';
import { describeDueDate } from '../../utils/dueDate.js';
import { useTaskStore } from '../../stores/taskStore.js';

const props = defineProps({
  task: { type: Object, required: true },
  eventCount: { type: Number, default: 0 },
  // 'lg' is the roomier card used in the focus ("Now") lane.
  size: { type: String, default: 'md' },
});

const emit = defineEmits([
  'dragstart',
  'dragend',
  'remove',
  'complete',
  'reopen',
  'update-due-date',
  'sync-due-date',
]);

const { resolveDrop } = useKanbanDrag();

const isDone = computed(() => props.task.status === 'done');
const due = computed(() => describeDueDate(props.task.dueDate));
const isOverdue = computed(() => !isDone.value && due.value.tone === 'overdue');

// The DONE stamp lands with a thump the moment a task is finished (by tick,
// drag or the todo list), then rests as a small stamp. Cards that load already
// done just show the resting stamp.
const taskStore = useTaskStore();
const stamping = computed(() => taskStore.justCompletedId === props.task.id);

// The date lives in a hidden native input so the browser's own picker does the
// work; the chip on the card is just its face.
const dateInput = ref(null);
function openDatePicker() {
  const input = dateInput.value;
  if (!input) return;
  if (typeof input.showPicker === 'function') input.showPicker();
  else input.click();
}

let ghost = null;
let grabOffset = { x: 0, y: 0 };
let lastHoverEl = null;

function clearHover() {
  lastHoverEl?.classList.remove('kanban-drop-target');
  lastHoverEl = null;
}

const { onPointerDown, isDragging } = usePointerDrag({
  shouldIgnore: (event) => event.target.closest('input, button'),
  onDragStart(event, { sourceElement }) {
    emit('dragstart');
    const created = createGhost(sourceElement);
    ghost = created.ghost;
    grabOffset = { x: event.clientX - created.rect.left, y: event.clientY - created.rect.top };
    moveGhost(ghost, created.rect.left, created.rect.top);
  },
  onDragMove(event) {
    moveGhost(ghost, event.clientX - grabOffset.x, event.clientY - grabOffset.y);
    const target = findDropTarget(event.clientX, event.clientY, '[data-task-id], [data-column-status]');
    if (target !== lastHoverEl) {
      clearHover();
      target?.classList.add('kanban-drop-target');
      lastHoverEl = target;
    }
  },
  onDragEnd(event) {
    resolveDrop(event.clientX, event.clientY, props.task.id);
    cleanup();
  },
  onDragCancel() {
    cleanup();
  },
});

function cleanup() {
  removeGhost(ghost);
  ghost = null;
  clearHover();
  emit('dragend');
}
</script>

<template>
  <div
    :data-task-id="task.id"
    class="task-card group"
    :class="[
      isDone ? 'task-card--done' : `task-card--${size}`,
      { 'task-card--overdue': isOverdue, 'task-card--dragging': isDragging },
    ]"
    @pointerdown="onPointerDown"
  >
    <!-- Finished: one quiet line with the stamp -->
    <template v-if="isDone">
      <button type="button" class="task-card__check task-card__check--done" aria-label="Reopen task" title="Reopen" @click="emit('reopen')">
        <Check :size="12" aria-hidden="true" />
      </button>
      <p class="task-card__title task-card__title--done">{{ task.title }}</p>
      <span class="task-card__done-meta">
        <span class="task-card__stamp" :class="{ 'task-card__stamp--slam': stamping }" aria-hidden="true">Done</span>
        <button type="button" class="task-card__delete task-card__delete--reveal" aria-label="Delete task" @click="emit('remove')">
          <X :size="14" aria-hidden="true" />
        </button>
      </span>
    </template>

    <!-- Open: title, optional note, and what matters (priority, when) -->
    <template v-else>
      <div class="task-card__header">
        <button type="button" class="task-card__check" aria-label="Mark as done" title="Mark as done" @click="emit('complete')">
          <Check :size="12" aria-hidden="true" />
        </button>
        <p class="task-card__title">{{ task.title }}</p>
        <button type="button" class="task-card__delete" aria-label="Delete task" @click="emit('remove')">
          <X :size="14" aria-hidden="true" />
        </button>
      </div>

      <p v-if="task.description" class="task-card__description">{{ task.description }}</p>

      <div class="task-card__footer">
        <span :class="['task-card__priority', `task-card__priority--${task.priority}`]">{{ task.priority }}</span>

        <span class="task-card__due-wrap">
          <button
            type="button"
            :class="['task-card__due', `task-card__due--${due.tone}`]"
            :title="task.dueDate ? 'Change due date' : 'Set a due date'"
            @click="openDatePicker"
          >
            <CalendarDays :size="12" aria-hidden="true" />
            {{ due.text }}
          </button>
          <input
            ref="dateInput"
            type="date"
            class="task-card__date-input"
            tabindex="-1"
            aria-label="Due date"
            :value="task.dueDate || ''"
            @change="emit('update-due-date', $event.target.value || null)"
          />
        </span>

        <span
          v-if="eventCount"
          class="task-card__event-badge"
          :title="`${eventCount} linked calendar event${eventCount > 1 ? 's' : ''}`"
        >
          <CalendarDays :size="11" aria-hidden="true" />
          {{ eventCount }}
        </span>

        <button
          v-if="task.dueDate"
          type="button"
          title="Sync due date to calendar"
          aria-label="Sync due date to calendar"
          class="task-card__sync"
          @click="emit('sync-due-date')"
        >
          <CalendarSync :size="13" aria-hidden="true" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.task-card {
  @apply relative cursor-grab rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow active:cursor-grabbing;
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}
.task-card:hover {
  @apply shadow-md;
}
.task-card--md {
  @apply p-3;
}
.task-card--lg {
  @apply p-4;
}
.task-card--lg .task-card__title {
  @apply text-base;
}
.task-card--overdue {
  @apply border-rose-200 bg-rose-50/40;
}
.task-card--dragging {
  @apply opacity-50;
}

.task-card__header {
  @apply flex items-start gap-2;
}
.task-card__title {
  @apply min-w-0 flex-1 text-sm font-medium text-slate-800;
}
.task-card__check {
  @apply mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-transparent transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600;
  touch-action: manipulation;
}
.task-card--lg .task-card__check {
  @apply mt-1;
}
.task-card__delete {
  @apply shrink-0 text-slate-300 hover:text-rose-500;
  touch-action: manipulation;
}
.task-card__description {
  @apply mt-1.5 line-clamp-2 pl-6 text-xs text-slate-500;
}

.task-card__footer {
  @apply mt-3 flex flex-wrap items-center gap-1.5 pl-6;
}
.task-card__priority {
  @apply rounded-full px-2 py-0.5 text-[11px] font-medium;
}
.task-card__priority--low {
  @apply bg-slate-100 text-slate-600;
}
.task-card__priority--medium {
  @apply bg-amber-100 text-amber-700;
}
.task-card__priority--high {
  @apply bg-rose-100 text-rose-700;
}
.task-card__due-wrap {
  @apply relative inline-flex;
}
.task-card__due {
  @apply inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium;
  touch-action: manipulation;
}
.task-card__due--none {
  @apply text-slate-400 hover:bg-slate-100;
}
.task-card__due--later,
.task-card__due--soon {
  @apply bg-slate-100 text-slate-600 hover:bg-slate-200;
}
.task-card__due--today {
  @apply bg-amber-100 text-amber-700 hover:bg-amber-200;
}
.task-card__due--overdue {
  @apply bg-rose-100 text-rose-700 hover:bg-rose-200;
}
.task-card__date-input {
  @apply pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0;
}
.task-card__event-badge {
  @apply inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600;
}
.task-card__sync {
  @apply shrink-0 text-slate-300 hover:text-indigo-600;
  touch-action: manipulation;
}

/* Finished */
.task-card--done {
  @apply flex flex-wrap items-center gap-x-2 gap-y-1 border-slate-200 bg-white/70 px-3 py-2 shadow-none;
}
.task-card--done:hover {
  @apply shadow-none;
}
.task-card__check--done {
  @apply mt-0 border-emerald-500 bg-emerald-500 text-white hover:border-slate-300 hover:bg-white hover:text-slate-400;
}
.task-card__title--done {
  @apply line-clamp-2 basis-32 text-slate-400 line-through;
}
/* The stamp (and delete) drop to their own line when the lane is too narrow
   to share one with the title, and sit beside it when there is room. */
.task-card__done-meta {
  @apply ml-auto flex items-center gap-1.5;
}
.task-card__stamp {
  @apply shrink-0 rounded border-2 border-emerald-600/70 px-1.5 text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-emerald-700/80;
  transform: rotate(-7deg);
}
.task-card__stamp--slam {
  animation: stamp-slam 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.task-card__delete--reveal {
  @apply opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100;
}
@media (hover: none) {
  .task-card__delete--reveal {
    @apply opacity-100;
  }
}

@keyframes stamp-slam {
  0% {
    opacity: 0;
    transform: rotate(-7deg) scale(2.6);
  }
  60% {
    opacity: 1;
    transform: rotate(-7deg) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: rotate(-7deg) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .task-card__stamp--slam {
    animation: none;
  }
}
</style>
