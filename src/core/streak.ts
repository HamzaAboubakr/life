// Streak logic. Rule (locked): completing >=1 task on a day extends the streak;
// missing a full day with no completion resets it to 0. Freezer/Repair power-ups
// from the shop are the escape hatch.

const MS_DAY = 86_400_000;

function parseISO(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
function daysBetween(aISO: string, bISO: string): number {
  return Math.round((parseISO(bISO).getTime() - parseISO(aISO).getTime()) / MS_DAY);
}

export interface StreakState {
  current: number;          // consecutive active days ending at lastActiveDate
  longest: number;
  lastActiveDate: string | null; // ISO date of most recent day with a completion
  freezesAvailable: number; // Streak Freezer inventory — auto-consumed on a gap
}

export const emptyStreak = (): StreakState => ({
  current: 0, longest: 0, lastActiveDate: null, freezesAvailable: 0,
});

// Call when a task is completed on `todayISO`. Returns the updated streak.
export function registerCompletion(s: StreakState, todayISO: string): StreakState {
  if (s.lastActiveDate === todayISO) return s; // already counted today
  const gap = s.lastActiveDate ? daysBetween(s.lastActiveDate, todayISO) : 1;

  let current: number;
  let freezes = s.freezesAvailable;

  if (s.lastActiveDate === null || gap === 1) {
    current = s.current + 1;                    // consecutive day
  } else if (gap > 1) {
    const missed = gap - 1;                     // full days with no completion
    if (freezes >= missed) {                    // freezers cover the gap
      freezes -= missed;
      current = s.current + 1;
    } else {
      current = 1;                              // streak broke -> restart at today
    }
  } else {
    current = s.current;                        // gap <= 0 (out-of-order); ignore
  }

  return {
    current,
    longest: Math.max(s.longest, current),
    lastActiveDate: todayISO,
    freezesAvailable: freezes,
  };
}

// Evaluate on app open: has the streak silently lapsed since lastActiveDate?
export function isBroken(s: StreakState, todayISO: string): boolean {
  if (!s.lastActiveDate || s.current === 0) return false;
  const gap = daysBetween(s.lastActiveDate, todayISO);
  const missed = Math.max(0, gap - 1);
  return missed > s.freezesAvailable;
}

// Streak Repair power-up: restore a just-broken streak to its prior value.
export function repair(s: StreakState, restoreTo: number, todayISO: string): StreakState {
  return { ...s, current: restoreTo, longest: Math.max(s.longest, restoreTo), lastActiveDate: todayISO };
}
