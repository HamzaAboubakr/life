// Recurrence engine. The prototype had a bare on/off checkbox with no schedule;
// this makes recurrence a real, user-selectable rule and answers "does this task
// occur on date D?" — used by Calendar (filter by date) and Tasks (expand groups).

import type { Recurrence, Weekday } from './types';

// Human-facing option set for the picker.
export const RECURRENCE_OPTIONS = [
  { kind: 'daily', label: 'Daily' },
  { kind: 'weekdays', label: 'Weekdays' },
  { kind: 'weekly', label: 'Weekly' },       // + day-of-week multiselect
  { kind: 'monthly', label: 'Monthly' },     // + day-of-month
  { kind: 'custom', label: 'Custom' },       // + every N days
] as const;

const MS_DAY = 86_400_000;

function parseISO(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function daysBetween(aISO: string, bISO: string): number {
  return Math.round((parseISO(bISO).getTime() - parseISO(aISO).getTime()) / MS_DAY);
}

function weekday(dISO: string): Weekday {
  return parseISO(dISO).getUTCDay() as Weekday;
}

// Does a task anchored at `anchorISO` with rule `rule` occur on `dateISO`?
// dateISO must be >= anchor (no occurrences before the task's start date).
export function occursOn(rule: Recurrence | undefined, anchorISO: string, dateISO: string): boolean {
  if (!rule) return dateISO === anchorISO;      // one-off
  const delta = daysBetween(anchorISO, dateISO);
  if (delta < 0) return false;

  switch (rule.kind) {
    case 'daily':
      return true;
    case 'weekdays': {
      const wd = weekday(dateISO);
      return wd >= 1 && wd <= 5;
    }
    case 'weekly':
      return rule.days.includes(weekday(dateISO));
    case 'monthly': {
      const dom = parseISO(dateISO).getUTCDate();
      const lastDom = new Date(Date.UTC(
        parseISO(dateISO).getUTCFullYear(),
        parseISO(dateISO).getUTCMonth() + 1, 0,
      )).getUTCDate();
      return dom === Math.min(rule.day, lastDom); // clamp e.g. 31 -> 30/28
    }
    case 'custom':
      return rule.everyNDays > 0 && delta % rule.everyNDays === 0;
  }
}

export function describe(rule: Recurrence | undefined): string {
  if (!rule) return 'Does not repeat';
  switch (rule.kind) {
    case 'daily': return 'Every day';
    case 'weekdays': return 'Every weekday';
    case 'weekly': return `Weekly on ${rule.days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`;
    case 'monthly': return `Monthly on day ${rule.day}`;
    case 'custom': return `Every ${rule.everyNDays} days`;
  }
}
