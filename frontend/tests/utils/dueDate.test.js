import { describe, expect, it } from 'vitest';
import { describeDueDate, todayKey } from '../../src/utils/dueDate.js';

// Wednesday 7 Oct 2026, local noon.
const NOW = new Date(2026, 9, 7, 12, 0, 0);

describe('todayKey', () => {
  it('formats the local date with zero padding', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('describeDueDate', () => {
  it('has a neutral prompt when there is no date', () => {
    expect(describeDueDate(null, NOW)).toEqual({ text: 'Add date', tone: 'none', daysFromToday: null });
  });

  it('flags overdue days, singular and plural', () => {
    expect(describeDueDate('2026-10-06', NOW)).toMatchObject({ text: '1 day overdue', tone: 'overdue' });
    expect(describeDueDate('2026-10-04', NOW)).toMatchObject({ text: '3 days overdue', tone: 'overdue' });
  });

  it('says Today and Tomorrow', () => {
    expect(describeDueDate('2026-10-07', NOW)).toMatchObject({ text: 'Today', tone: 'today' });
    expect(describeDueDate('2026-10-08', NOW)).toMatchObject({ text: 'Tomorrow', tone: 'soon' });
  });

  it('uses the weekday for the rest of the week', () => {
    expect(describeDueDate('2026-10-10', NOW)).toMatchObject({ text: 'Sat', tone: 'soon' });
    expect(describeDueDate('2026-10-13', NOW)).toMatchObject({ text: 'Tue', tone: 'soon' });
  });

  it('switches to a date a week out, adding the year only when it differs', () => {
    expect(describeDueDate('2026-10-14', NOW)).toMatchObject({ text: 'Oct 14', tone: 'later' });
    expect(describeDueDate('2027-01-02', NOW)).toMatchObject({ text: 'Jan 2, 2027', tone: 'later' });
  });

  it('counts calendar days across a daylight-saving change', () => {
    // 25 Oct 2026 is the last Sunday of October, when Europe leaves summer time.
    const beforeShift = new Date(2026, 9, 24, 12);
    expect(describeDueDate('2026-10-25', beforeShift)).toMatchObject({ text: 'Tomorrow' });
    expect(describeDueDate('2026-10-26', beforeShift)).toMatchObject({ text: 'Mon', daysFromToday: 2 });
  });
});
