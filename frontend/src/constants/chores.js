import { WashingMachine, ShoppingCart, BrushCleaning, PaintBucket } from '@lucide/vue';

export const CHORE_TYPES = {
  LAUNDRY: 'laundry',
  GROCERIES: 'groceries',
  SWEEP: 'sweep',
  MOP: 'mop',
};

// Laundry is the only chore with sub-states (wash load color).
export const LAUNDRY_STATES = ['white', 'colors', 'darks'];

const ICONS = {
  [CHORE_TYPES.LAUNDRY]: WashingMachine,
  [CHORE_TYPES.GROCERIES]: ShoppingCart,
  [CHORE_TYPES.SWEEP]: BrushCleaning,
  [CHORE_TYPES.MOP]: PaintBucket,
};

const LAUNDRY_STATE_CLASSES = {
  white: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
  colors: 'bg-blue-500 text-white',
  darks: 'bg-slate-900 text-white',
};

const CHORE_CLASSES = {
  [CHORE_TYPES.GROCERIES]: 'bg-emerald-500 text-white',
  [CHORE_TYPES.SWEEP]: 'bg-amber-500 text-white',
  [CHORE_TYPES.MOP]: 'bg-cyan-500 text-white',
};

const LAUNDRY_STATE_LABELS = {
  white: 'Whites',
  colors: 'Colors',
  darks: 'Darks',
};

const CHORE_LABELS = {
  [CHORE_TYPES.GROCERIES]: 'Groceries',
  [CHORE_TYPES.SWEEP]: 'Sweeping',
  [CHORE_TYPES.MOP]: 'Mopping',
};

export function choreIcon(type) {
  return ICONS[type];
}

export function choreColorClass({ type, state }) {
  if (type === CHORE_TYPES.LAUNDRY) return LAUNDRY_STATE_CLASSES[state] ?? LAUNDRY_STATE_CLASSES.white;
  return CHORE_CLASSES[type] ?? 'bg-slate-500 text-white';
}

export function choreLabel({ type, state }) {
  if (type === CHORE_TYPES.LAUNDRY) return `Laundry – ${LAUNDRY_STATE_LABELS[state] ?? 'Whites'}`;
  return CHORE_LABELS[type] ?? type;
}
