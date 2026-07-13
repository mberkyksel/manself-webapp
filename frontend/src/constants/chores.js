import {
  WashingMachine,
  ShoppingCart,
  BrushCleaning,
  PaintBucket,
  Trash2,
  Sprout,
  CookingPot,
  Bed,
  Cog,
} from '@lucide/vue';

export const CHORE_TYPES = {
  LAUNDRY: 'laundry',
  GROCERIES: 'groceries',
  SWEEP: 'sweep',
  MOP: 'mop',
  TRASH: 'trash',
  PLANTS: 'plants',
  MEALS: 'meals',
  BED_LINEN: 'bedLinen',
  WASHER_CLEAN: 'washerClean',
  DISHWASHER: 'dishwasher',
};

// Chores with click-to-cycle sub-states.
export const LAUNDRY_STATES = ['white', 'colors', 'darks'];
export const TRASH_STATES = ['grey', 'yellow', 'blue', 'brown'];
export const MEAL_STATES = ['home', 'prep'];

const ICONS = {
  [CHORE_TYPES.LAUNDRY]: WashingMachine,
  [CHORE_TYPES.GROCERIES]: ShoppingCart,
  [CHORE_TYPES.SWEEP]: BrushCleaning,
  [CHORE_TYPES.MOP]: PaintBucket,
  [CHORE_TYPES.TRASH]: Trash2,
  [CHORE_TYPES.PLANTS]: Sprout,
  [CHORE_TYPES.MEALS]: CookingPot,
  [CHORE_TYPES.BED_LINEN]: Bed,
  [CHORE_TYPES.WASHER_CLEAN]: WashingMachine,
  [CHORE_TYPES.DISHWASHER]: Cog,
};

const LAUNDRY_STATE_CLASSES = {
  white: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
  colors: 'bg-blue-500 text-white',
  darks: 'bg-slate-900 text-white',
};

// Berlin household waste colors: Restmüll / Gelber Sack / Altpapier / Biomüll.
const TRASH_STATE_CLASSES = {
  grey: 'bg-slate-600 text-white',
  yellow: 'bg-yellow-400 text-slate-900',
  blue: 'bg-blue-500 text-white',
  brown: 'bg-amber-800 text-white',
};

const MEAL_STATE_CLASSES = {
  home: 'bg-orange-500 text-white',
  prep: 'bg-emerald-600 text-white',
};

const CHORE_CLASSES = {
  [CHORE_TYPES.GROCERIES]: 'bg-emerald-500 text-white',
  [CHORE_TYPES.SWEEP]: 'bg-amber-500 text-white',
  [CHORE_TYPES.MOP]: 'bg-cyan-500 text-white',
  [CHORE_TYPES.PLANTS]: 'bg-lime-600 text-white',
  [CHORE_TYPES.BED_LINEN]: 'bg-indigo-500 text-white',
  // Distinct violet keeps this visually separate from the Laundry icon,
  // which reuses the same WashingMachine glyph for a different chore.
  [CHORE_TYPES.WASHER_CLEAN]: 'bg-violet-600 text-white',
  [CHORE_TYPES.DISHWASHER]: 'bg-teal-600 text-white',
};

const LAUNDRY_STATE_LABELS = {
  white: 'Whites',
  colors: 'Colors',
  darks: 'Darks',
};

const TRASH_STATE_LABELS = {
  grey: 'Restmüll',
  yellow: 'Gelber Sack',
  blue: 'Altpapier',
  brown: 'Biomüll',
};

const MEAL_STATE_LABELS = {
  home: 'Home Cooking',
  prep: 'Weekly Meal Prep',
};

const CHORE_LABELS = {
  [CHORE_TYPES.GROCERIES]: 'Groceries',
  [CHORE_TYPES.SWEEP]: 'Sweeping',
  [CHORE_TYPES.MOP]: 'Mopping',
  [CHORE_TYPES.PLANTS]: 'Plant Care',
  [CHORE_TYPES.BED_LINEN]: 'Change Bed Linen',
  [CHORE_TYPES.WASHER_CLEAN]: 'Washing Machine Self-Clean',
  [CHORE_TYPES.DISHWASHER]: 'Dishwasher Maintenance',
};

export function choreIcon(type) {
  return ICONS[type];
}

export function choreColorClass({ type, state }) {
  if (type === CHORE_TYPES.LAUNDRY) return LAUNDRY_STATE_CLASSES[state] ?? LAUNDRY_STATE_CLASSES.white;
  if (type === CHORE_TYPES.TRASH) return TRASH_STATE_CLASSES[state] ?? TRASH_STATE_CLASSES.grey;
  if (type === CHORE_TYPES.MEALS) return MEAL_STATE_CLASSES[state] ?? MEAL_STATE_CLASSES.home;
  return CHORE_CLASSES[type] ?? 'bg-slate-500 text-white';
}

export function choreLabel({ type, state }) {
  if (type === CHORE_TYPES.LAUNDRY) return `Laundry – ${LAUNDRY_STATE_LABELS[state] ?? 'Whites'}`;
  if (type === CHORE_TYPES.TRASH) return `Trash – ${TRASH_STATE_LABELS[state] ?? 'Restmüll'}`;
  if (type === CHORE_TYPES.MEALS) return `Meals – ${MEAL_STATE_LABELS[state] ?? 'Home Cooking'}`;
  return CHORE_LABELS[type] ?? type;
}
