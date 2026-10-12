// Repeat rules for chores.
//
// A rule is { recurrence: 'daily' | 'weekly' | 'monthly', interval, weekdays? }
// and lives on a series next to the `anchorDateKey` it counts from:
//   daily    every `interval` days
//   weekly   every `interval` weeks, on each of `weekdays` (0 = Sunday)
//   monthly  every `interval` months, on the anchor's day of the month
//            (a month without that day, like the 31st, uses its last day)
// Series saved before intervals and weekdays existed only have `recurrence`;
// normalizeRule fills in the rest (every 1, and for weekly the anchor's weekday).

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ['daily', 'weekly', 'monthly'];
const MAX_INTERVAL = 52;
const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// The week is shown Monday-first, like the calendar.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function isDateKey(value) {
  return typeof value === 'string' && DATE_KEY.test(value);
}

export function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Whole calendar days since 1970, so daylight-saving changes never skew a count.
function dayNumber(date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

function mondayNumber(date) {
  return dayNumber(date) - ((date.getDay() + 6) % 7);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Returns a clean { recurrence, interval, weekdays? } for a stored rule, or
// null when it doesn't repeat (or holds something this version doesn't know).
export function normalizeRule(rule, anchorDateKey) {
  if (!rule || !KINDS.includes(rule.recurrence) || !isDateKey(anchorDateKey)) return null;

  const interval = Number.isInteger(rule.interval) && rule.interval >= 1 && rule.interval <= MAX_INTERVAL ? rule.interval : 1;
  if (rule.recurrence !== 'weekly') return { recurrence: rule.recurrence, interval };

  const weekdays = [...new Set((Array.isArray(rule.weekdays) ? rule.weekdays : []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(
    (a, b) => a - b
  );
  return { recurrence: 'weekly', interval, weekdays: weekdays.length ? weekdays : [parseDateKey(anchorDateKey).getDay()] };
}

export function sameRule(a, b) {
  if (!a || !b) return a === b;
  return a.recurrence === b.recurrence && a.interval === b.interval && (a.weekdays ?? []).join() === (b.weekdays ?? []).join();
}

// Whether a series with this (normalized) rule has an occurrence on dateKey.
export function occursOn(rule, anchorDateKey, dateKey) {
  const anchor = parseDateKey(anchorDateKey);
  const date = parseDateKey(dateKey);
  if (date < anchor) return false;

  if (rule.recurrence === 'daily') {
    return (dayNumber(date) - dayNumber(anchor)) % rule.interval === 0;
  }
  if (rule.recurrence === 'weekly') {
    const weeks = (mondayNumber(date) - mondayNumber(anchor)) / 7;
    return rule.weekdays.includes(date.getDay()) && weeks % rule.interval === 0;
  }
  const months = (date.getFullYear() - anchor.getFullYear()) * 12 + date.getMonth() - anchor.getMonth();
  return months % rule.interval === 0 && date.getDate() === Math.min(anchor.getDate(), daysInMonth(date));
}

function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}

function weekdayList(weekdays) {
  const ordered = WEEKDAY_ORDER.filter((d) => weekdays.includes(d));
  return ordered.length === 1 ? WEEKDAY_NAMES[ordered[0]] : ordered.map((d) => WEEKDAY_NAMES[d].slice(0, 3)).join(', ');
}

// "Every Tuesday", "Every week on Tue, Thu", "Every 2 weeks on Tuesday",
// "Every month on the 12th". Needs the anchor only for monthly rules.
export function describeRule(rule, anchorDateKey) {
  if (!rule) return "Doesn't repeat";

  const { recurrence, interval } = rule;
  if (recurrence === 'daily') return interval === 1 ? 'Every day' : `Every ${interval} days`;

  if (recurrence === 'weekly') {
    if (interval === 1) {
      return rule.weekdays.length === 1 ? `Every ${weekdayList(rule.weekdays)}` : `Every week on ${weekdayList(rule.weekdays)}`;
    }
    return `Every ${interval} weeks on ${weekdayList(rule.weekdays)}`;
  }

  const day = ordinal(parseDateKey(anchorDateKey).getDate());
  return interval === 1 ? `Every month on the ${day}` : `Every ${interval} months on the ${day}`;
}

// The choices offered for an occurrence on dateKey: "every Tuesday" really
// means the weekday of the badge that was right-clicked.
export function repeatPresets(dateKey) {
  const date = parseDateKey(dateKey);
  const weekly = (interval) => ({ recurrence: 'weekly', interval, weekdays: [date.getDay()] });
  const rules = [
    null,
    { recurrence: 'daily', interval: 1 },
    weekly(1),
    weekly(2),
    { recurrence: 'monthly', interval: 1 },
  ];
  return rules.map((rule) => ({ rule, label: describeRule(rule, dateKey) }));
}

export function weekdayName(day) {
  return WEEKDAY_NAMES[day];
}
