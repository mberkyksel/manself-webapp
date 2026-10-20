import { describe, expect, it } from 'vitest';
import { describeRule, normalizeRule, occursOn, repeatPresets, sameRule } from '../../src/utils/recurrence.js';

// Wed 7 Oct 2026.
const ANCHOR = '2026-10-07';

describe('normalizeRule', () => {
  it('returns null for no rule, an unknown kind or a bad anchor', () => {
    expect(normalizeRule(null, ANCHOR)).toBeNull();
    expect(normalizeRule({ recurrence: 'none' }, ANCHOR)).toBeNull();
    expect(normalizeRule({ recurrence: 'yearly' }, ANCHOR)).toBeNull();
    expect(normalizeRule({ recurrence: 'daily' }, undefined)).toBeNull();
  });

  it('defaults to every 1, and for weekly to the anchor weekday', () => {
    expect(normalizeRule({ recurrence: 'daily' }, ANCHOR)).toEqual({ recurrence: 'daily', interval: 1 });
    expect(normalizeRule({ recurrence: 'weekly' }, ANCHOR)).toEqual({ recurrence: 'weekly', interval: 1, weekdays: [3] });
  });

  it('cleans up weekdays and intervals', () => {
    expect(normalizeRule({ recurrence: 'weekly', interval: 2, weekdays: [4, 2, 4, 9, 'x'] }, ANCHOR)).toEqual({
      recurrence: 'weekly',
      interval: 2,
      weekdays: [2, 4],
    });
    expect(normalizeRule({ recurrence: 'daily', interval: 0 }, ANCHOR).interval).toBe(1);
    expect(normalizeRule({ recurrence: 'daily', interval: 400 }, ANCHOR).interval).toBe(1);
    expect(normalizeRule({ recurrence: 'daily', interval: 2.5 }, ANCHOR).interval).toBe(1);
  });

  it('drops weekdays from rules that are not weekly', () => {
    expect(normalizeRule({ recurrence: 'monthly', interval: 1, weekdays: [1] }, ANCHOR)).toEqual({ recurrence: 'monthly', interval: 1 });
  });
});

describe('sameRule', () => {
  it('compares kind, interval and weekdays', () => {
    const a = normalizeRule({ recurrence: 'weekly', interval: 1, weekdays: [2, 4] }, ANCHOR);
    expect(sameRule(a, normalizeRule({ recurrence: 'weekly', weekdays: [4, 2] }, ANCHOR))).toBe(true);
    expect(sameRule(a, normalizeRule({ recurrence: 'weekly', weekdays: [2] }, ANCHOR))).toBe(false);
    expect(sameRule(a, normalizeRule({ recurrence: 'weekly', interval: 2, weekdays: [2, 4] }, ANCHOR))).toBe(false);
    expect(sameRule(null, null)).toBe(true);
    expect(sameRule(a, null)).toBe(false);
  });
});

describe('occursOn', () => {
  const rule = (r) => normalizeRule(r, ANCHOR);

  it('never occurs before the anchor', () => {
    expect(occursOn(rule({ recurrence: 'daily' }), ANCHOR, '2026-10-06')).toBe(false);
    expect(occursOn(rule({ recurrence: 'daily' }), ANCHOR, ANCHOR)).toBe(true);
  });

  it('counts every N days from the anchor', () => {
    const every3 = rule({ recurrence: 'daily', interval: 3 });
    expect(['2026-10-07', '2026-10-10', '2026-10-13'].every((d) => occursOn(every3, ANCHOR, d))).toBe(true);
    expect(['2026-10-08', '2026-10-09', '2026-10-11'].some((d) => occursOn(every3, ANCHOR, d))).toBe(false);
  });

  it('counts across a daylight-saving change', () => {
    // Berlin clocks go back on Sun 25 Oct 2026.
    const every2 = rule({ recurrence: 'daily', interval: 2 });
    expect(occursOn(every2, ANCHOR, '2026-10-25')).toBe(true);
    expect(occursOn(every2, ANCHOR, '2026-10-26')).toBe(false);
  });

  it('matches chosen weekdays every week', () => {
    const tueThu = rule({ recurrence: 'weekly', weekdays: [2, 4] });
    expect(occursOn(tueThu, ANCHOR, '2026-10-08')).toBe(true); // Thu
    expect(occursOn(tueThu, ANCHOR, '2026-10-13')).toBe(true); // Tue
    expect(occursOn(tueThu, ANCHOR, '2026-10-14')).toBe(false); // Wed
  });

  it('counts fortnights by calendar week (Monday to Sunday), not by days', () => {
    // Anchor Wed 7 Oct is in the week of Mon 5 Oct. Mon + Sun of the same week
    // are in week 0, Mon 12 Oct starts week 1, Mon 19 Oct week 2.
    const fortnightly = rule({ recurrence: 'weekly', interval: 2, weekdays: [1, 3, 0] });
    expect(occursOn(fortnightly, ANCHOR, '2026-10-07')).toBe(true);
    expect(occursOn(fortnightly, ANCHOR, '2026-10-11')).toBe(true); // Sunday of week 0
    expect(occursOn(fortnightly, ANCHOR, '2026-10-12')).toBe(false); // Monday of week 1
    expect(occursOn(fortnightly, ANCHOR, '2026-10-19')).toBe(true); // Monday of week 2
    expect(occursOn(fortnightly, ANCHOR, '2026-10-21')).toBe(true);
    expect(occursOn(fortnightly, ANCHOR, '2026-10-14')).toBe(false);
  });

  it('repeats monthly on the day of the month, using the last day of shorter months', () => {
    const monthly = normalizeRule({ recurrence: 'monthly' }, '2026-01-31');
    expect(occursOn(monthly, '2026-01-31', '2026-02-28')).toBe(true);
    expect(occursOn(monthly, '2026-01-31', '2026-02-27')).toBe(false);
    expect(occursOn(monthly, '2026-01-31', '2026-03-31')).toBe(true);
    expect(occursOn(monthly, '2026-01-31', '2026-04-30')).toBe(true);
    expect(occursOn(monthly, '2026-01-31', '2026-04-29')).toBe(false);
  });

  it('repeats every few months across a year boundary', () => {
    const quarterly = normalizeRule({ recurrence: 'monthly', interval: 3 }, '2026-11-15');
    expect(occursOn(quarterly, '2026-11-15', '2027-02-15')).toBe(true);
    expect(occursOn(quarterly, '2026-11-15', '2027-01-15')).toBe(false);
  });
});

describe('describeRule', () => {
  const describe_ = (rule, anchor = ANCHOR) => describeRule(normalizeRule(rule, anchor), anchor);

  it('words each kind of rule', () => {
    expect(describeRule(null)).toBe("Doesn't repeat");
    expect(describe_({ recurrence: 'daily' })).toBe('Every day');
    expect(describe_({ recurrence: 'daily', interval: 3 })).toBe('Every 3 days');
    expect(describe_({ recurrence: 'weekly', weekdays: [2] })).toBe('Every Tuesday');
    expect(describe_({ recurrence: 'weekly', weekdays: [0, 4, 2] })).toBe('Every week on Tue, Thu, Sun');
    expect(describe_({ recurrence: 'weekly', interval: 2, weekdays: [2] })).toBe('Every 2 weeks on Tuesday');
    expect(describe_({ recurrence: 'monthly' })).toBe('Every month on the 7th');
    expect(describe_({ recurrence: 'monthly', interval: 3 }, '2026-10-22')).toBe('Every 3 months on the 22nd');
  });

  it('uses the right ordinal suffixes', () => {
    const day = (d) => describe_({ recurrence: 'monthly' }, `2026-10-${String(d).padStart(2, '0')}`);
    expect([day(1), day(3), day(11), day(12), day(13), day(21), day(23), day(30)]).toEqual([
      'Every month on the 1st',
      'Every month on the 3rd',
      'Every month on the 11th',
      'Every month on the 12th',
      'Every month on the 13th',
      'Every month on the 21st',
      'Every month on the 23rd',
      'Every month on the 30th',
    ]);
  });
});

describe('repeatPresets', () => {
  it('offers the usual choices for the day of the badge', () => {
    expect(repeatPresets('2026-10-13').map((p) => p.label)).toEqual([
      "Doesn't repeat",
      'Every day',
      'Every Tuesday',
      'Every 2 weeks on Tuesday',
      'Every month on the 13th',
    ]);
  });
});
