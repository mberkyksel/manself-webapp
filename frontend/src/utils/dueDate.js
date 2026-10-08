// Turns a task's 'YYYY-MM-DD' due date into the short label and urgency shown
// on its card ("Today", "2 days overdue", "Sat", "Oct 12").
//
// Days are compared as calendar dates (UTC components of the local date), so a
// daylight-saving change never turns "tomorrow" into "in 2 days".

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 24 * 60 * 60 * 1000;

export function todayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDayNumber(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

// tone: 'overdue' | 'today' | 'soon' (within the week) | 'later' | 'none'
export function describeDueDate(dueDate, now = new Date()) {
  if (!dueDate) return { text: 'Add date', tone: 'none', daysFromToday: null };

  const days = toDayNumber(dueDate) - toDayNumber(todayKey(now));
  const [y, m, d] = dueDate.split('-').map(Number);

  if (days < 0) {
    const text = days === -1 ? '1 day overdue' : `${-days} days overdue`;
    return { text, tone: 'overdue', daysFromToday: days };
  }
  if (days === 0) return { text: 'Today', tone: 'today', daysFromToday: 0 };
  if (days === 1) return { text: 'Tomorrow', tone: 'soon', daysFromToday: 1 };
  if (days < 7) {
    return { text: WEEKDAYS[new Date(y, m - 1, d).getDay()], tone: 'soon', daysFromToday: days };
  }

  const sameYear = y === now.getFullYear();
  const text = `${MONTHS[m - 1]} ${d}${sameYear ? '' : `, ${y}`}`;
  return { text, tone: 'later', daysFromToday: days };
}
