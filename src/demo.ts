// One-time sample data so the app feels lived-in. Runs on launch only when the
// app is still essentially empty, and never again once it has run.

import { addTask, completeTask, getState, markSeeded } from './store';

const iso = (offsetDays: number) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const at = (h: number, m = 0) => h * 60 + m;

type Seed = {
  t: string; c: string; p?: 'low' | 'medium' | 'high'; d: number;
  s?: number; e?: number; tag?: string; done?: boolean; every?: boolean; note?: string;
};

const SEEDS: Seed[] = [
  // ── overdue ──
  { t: 'Email Dr. Chen about referral', c: 'Health', p: 'high', d: -2, s: at(9), tag: 'Appt' },
  { t: 'Renew car insurance', c: 'Finance', p: 'high', d: -1, s: at(11), tag: 'Bills' },

  // ── today ──
  { t: 'Morning run · 5k', c: 'Health', p: 'low', d: 0, s: at(7), tag: 'Workout' },
  { t: 'Team standup', c: 'Work', p: 'medium', d: 0, s: at(9, 30), e: at(9, 45), tag: 'Meeting' },
  { t: 'Finish Q3 budget review', c: 'Work', p: 'high', d: 0, s: at(14), e: at(15, 30), tag: 'Report', note: 'Send to Priya before EOD.' },
  { t: 'Pay credit card', c: 'Finance', p: 'medium', d: 0, s: at(18), tag: 'Bills' },
  { t: 'Read 20 pages — Atomic Habits', c: 'Learning', p: 'low', d: 0, s: at(21), tag: 'Study' },
  { t: 'Water the plants', c: 'Personal', p: 'low', d: 0, done: true },
  { t: 'Stretch · 10 min', c: 'Health', p: 'low', d: 0, done: true, every: true },

  // ── tomorrow ──
  { t: 'Dentist appointment', c: 'Health', p: 'medium', d: 1, s: at(15, 30), tag: 'Appt' },
  { t: 'Design review with Sam', c: 'Work', p: 'medium', d: 1, s: at(11), e: at(12), tag: 'Meeting' },
  { t: 'Grocery run', c: 'Personal', p: 'low', d: 1, s: at(17) },
  { t: 'Spanish practice', c: 'Learning', p: 'low', d: 1, s: at(20), every: true, tag: 'Study' },

  // ── this week ──
  { t: 'Call Mom', c: 'Personal', p: 'medium', d: 2, s: at(19) },
  { t: 'Submit expense report', c: 'Finance', p: 'high', d: 2, s: at(10), tag: 'Report' },
  { t: 'Swim · 1km', c: 'Health', p: 'low', d: 2, s: at(7, 30), tag: 'Workout' },
  { t: 'Draft Q4 roadmap', c: 'Work', p: 'high', d: 3, s: at(13), e: at(15), tag: 'Report' },
  { t: 'Course: module 4', c: 'Learning', p: 'medium', d: 3, s: at(20) },
  { t: 'Deep clean kitchen', c: 'Personal', p: 'low', d: 4 },
  { t: 'Review investment allocations', c: 'Finance', p: 'medium', d: 4, s: at(16), tag: 'Bills' },
  { t: 'Long run · 12k', c: 'Health', p: 'medium', d: 5, s: at(8), tag: 'Workout' },
  { t: 'Coffee with Alex', c: 'Personal', p: 'low', d: 5, s: at(10, 30), e: at(11, 30) },
  { t: 'Prep sprint demo', c: 'Work', p: 'high', d: 6, s: at(9), e: at(10), tag: 'Meeting' },
  { t: 'Finish book club chapter', c: 'Learning', p: 'low', d: 6, s: at(21), tag: 'Study' },
  { t: 'Meal prep for the week', c: 'Personal', p: 'medium', d: 7, s: at(11) },
];

export function seedDemoIfEmpty() {
  const s = getState();
  if (s.seededDemo || s.tasks.length > 2) return;
  for (const x of SEEDS) {
    const t = addTask({
      title: x.t, category: x.c, priority: x.p ?? 'low', date: iso(x.d),
      timeStart: x.s, timeEnd: x.e, notes: x.note,
      tagIds: x.tag ? [x.tag] : [],
      recurrence: x.every ? { kind: 'daily' } : undefined,
    });
    if (x.done) completeTask(t.id, t.date);
  }
  markSeeded();
}
