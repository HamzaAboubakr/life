// App store — the single source of truth, persisted to localStorage. Ported from
// the RN zustand store; all game math still comes from ./core (unchanged).

import {
  coinsForTask, streakCoinBonus, PERFECT_DAY_BONUS,
  XP_PER_TASK, xpNeededFor, next as nextLadder, isTopOfLadder,
  registerCompletion, emptyStreak, occursOn,
  ACHIEVEMENTS, evaluate, cumulativeXpTo, toIndex, RANKS,
  type Task, type RankName, type Tier, type StreakState,
  type Recurrence, type Priority, type Metric, type AchievementCategory,
} from './core';
import { makeId, todayISO } from './util';

// Celebration events emitted by completeTask, drained by the UI.
export type LMEvent =
  | { type: 'rankup'; rank: RankName; tier: Tier }
  | { type: 'achievement'; id: string; name: string; category: AchievementCategory };
let events: LMEvent[] = [];
export function consumeEvents(): LMEvent[] { const e = events; events = []; return e; }

export function computeMetrics(s: State): Partial<Record<Metric, number>> {
  const ownedIds = Object.keys(s.owned);
  return {
    tasksCompleted: Object.keys(s.completed).length,
    streakDays: Math.max(s.streak.current, s.streak.longest),
    freezersUsed: 0, streakRepairs: 0,
    level: toIndex(s.progression.rank, s.progression.tier) + 1,
    coinsHeld: s.balance,
    coinsEarnedTotal: s.balance + s.spentTotal,
    coinsSpentTotal: s.spentTotal,
    purchases: s.purchases,
    rankIndexReached: RANKS.indexOf(s.progression.rank),
    prestigeCount: s.progression.prestigeStars,
    xpTotal: cumulativeXpTo(toIndex(s.progression.rank, s.progression.tier)) + s.progression.xpCurrent,
    chipsOwned: ownedIds.filter((k) => !k.startsWith('t_') && !k.startsWith('em_')).length,
    tagsOwned: ownedIds.filter((k) => k.startsWith('t_')).length,
    emblemsOwned: ownedIds.filter((k) => k.startsWith('em_')).length,
  };
}
const metricsOf = computeMetrics;

export interface Progression {
  rank: RankName; tier: Tier; xpCurrent: number; xpNeeded: number; prestigeStars: number;
}

export interface CardDef { name: string; rgb: string; img: string; styleId?: string }

export const DEFAULT_CARDS: CardDef[] = [
  { name: 'Work', rgb: '92,164,235', img: 'assets/shop/business.png' },
  { name: 'Health', rgb: '41,179,107', img: 'assets/areas/biology.png' },
  { name: 'Personal', rgb: '251,109,134', img: 'assets/areas/psychology.png' },
  { name: 'Finance', rgb: '253,188,111', img: 'assets/subjects/economics.png' },
  { name: 'Learning', rgb: '109,140,219', img: 'assets/shop/philosophy.png' },
];

export interface State {
  balance: number;
  spentTotal: number;
  progression: Progression;
  streak: StreakState;
  tasks: Task[];
  completed: Record<string, true>; // `${taskId}|${date}`
  owned: Record<string, true>;     // purchased cosmetic ids (chips/tags/emblems)
  purchases: number;               // total shop purchases (incl. consumables)
  cards: CardDef[];                // category cards (seeded, user can add/edit/delete)
}

export interface NewTaskInput {
  title: string; priority?: Priority; date: string;
  category: string;
  timeStart?: number; timeEnd?: number; recurrence?: Recurrence; tagIds?: string[]; notes?: string; linkedIds?: string[];
}

const KEY = 'lm_web_state_v1';
const doneKey = (taskId: string, date: string) => `${taskId}|${date}`;

function initial(): State {
  return {
    balance: 0, spentTotal: 0,
    progression: { rank: 'Bronze', tier: 1, xpCurrent: 0, xpNeeded: xpNeededFor('Bronze', 1), prestigeStars: 0 },
    streak: emptyStreak(), tasks: [], completed: {}, owned: {}, purchases: 0,
    cards: DEFAULT_CARDS.map((c) => ({ ...c })),
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const s = JSON.parse(raw) as State;
    // recompute derived xpNeeded in case the curve changed
    s.progression.xpNeeded = xpNeededFor(s.progression.rank, s.progression.tier);
    const merged = { ...initial(), ...s };
    if (!merged.cards || !merged.cards.length) merged.cards = DEFAULT_CARDS.map((c) => ({ ...c }));
    // migrate legacy lowercase category keys ('work') to card names ('Work')
    const byLower = new Map(merged.cards.map((c) => [c.name.toLowerCase(), c.name]));
    merged.tasks = merged.tasks.map((t) =>
      byLower.has(t.category) ? { ...t, category: byLower.get(t.category)! } : t);
    return merged;
  } catch {
    return initial();
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

export const getState = (): State => state;
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const tasksForDate = (dateISO: string): Task[] =>
  state.tasks.filter((t) => occursOn(t.recurrence, t.date, dateISO));

export const isDone = (taskId: string, dateISO: string): boolean =>
  !!state.completed[doneKey(taskId, dateISO)];

// Advance progression by XP, rolling across tier/rank boundaries.
function advanceXp(p: Progression, gain: number): Progression {
  let { rank, tier, xpCurrent } = p;
  let xpNeeded = xpNeededFor(rank, tier);
  xpCurrent += gain;
  while (xpCurrent >= xpNeeded) {
    if (isTopOfLadder(rank, tier)) { xpCurrent = xpNeeded; break; }
    xpCurrent -= xpNeeded;
    const nx = nextLadder(rank, tier);
    rank = nx.rank as RankName; tier = nx.tier;
    xpNeeded = xpNeededFor(rank, tier);
  }
  return { ...p, rank, tier, xpCurrent, xpNeeded };
}

export function addTask(input: NewTaskInput): Task {
  const task: Task = {
    id: makeId(), title: input.title, category: input.category,
    priority: input.priority ?? 'medium', notes: input.notes, date: input.date,
    time: input.timeStart != null ? { startMinutes: input.timeStart, endMinutes: input.timeEnd } : undefined,
    recurrence: input.recurrence, tagIds: input.tagIds ?? [], linkedIds: input.linkedIds ?? [], createdAt: new Date().toISOString(),
  };
  state = { ...state, tasks: [...state.tasks, task] };
  commit();
  return task;
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) {
  state = { ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
  commit();
}

export function addCard(c: CardDef) { state = { ...state, cards: [...state.cards, c] }; commit(); }
export function updateCard(idx: number, c: CardDef) {
  state = { ...state, cards: state.cards.map((x, i) => (i === idx ? c : x)) }; commit();
}
export function deleteCard(idx: number) {
  state = { ...state, cards: state.cards.filter((_, i) => i !== idx) }; commit();
}

export function removeTask(id: string) {
  const completed = { ...state.completed };
  for (const k of Object.keys(completed)) if (k.startsWith(`${id}|`)) delete completed[k];
  state = { ...state, tasks: state.tasks.filter((t) => t.id !== id), completed };
  commit();
}

export function completeTask(taskId: string, dateISO = todayISO()) {
  if (isDone(taskId, dateISO)) return;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const newStreak: StreakState = registerCompletion(state.streak, dateISO);
  let coins = coinsForTask(task.priority) + streakCoinBonus(newStreak.current);

  const scheduled = tasksForDate(dateISO);
  const remaining = scheduled.filter((t) => t.id !== taskId && !isDone(t.id, dateISO));
  if (scheduled.length > 0 && remaining.length === 0) coins += PERFECT_DAY_BONUS;

  const progression = advanceXp(state.progression, XP_PER_TASK);

  // snapshot for celebration events
  const prevEarned = evaluate(metricsOf(state));
  const prevIdx = toIndex(state.progression.rank, state.progression.tier);

  state = {
    ...state,
    balance: state.balance + coins,
    streak: newStreak,
    progression,
    completed: { ...state.completed, [doneKey(taskId, dateISO)]: true },
  };

  // emit rank-up first, then any newly-unlocked achievements
  const newIdx = toIndex(progression.rank, progression.tier);
  if (newIdx > prevIdx) events.push({ type: 'rankup', rank: progression.rank, tier: progression.tier });
  const nowEarned = evaluate(metricsOf(state));
  for (const id of nowEarned) {
    if (!prevEarned.has(id)) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) events.push({ type: 'achievement', id, name: a.name, category: a.category });
    }
  }
  commit();
}

export function spend(amount: number, _reason: string): boolean {
  if (amount > state.balance) return false;
  state = { ...state, balance: state.balance - amount, spentTotal: state.spentTotal + amount };
  commit();
  return true;
}

// Buy a shop item. Cosmetics are one-time (recorded in `owned`); consumables
// (power-ups) can be re-bought. The Streak Freezer grants a real freeze.
export function purchase(id: string, price: number, consumable: boolean): boolean {
  if (!consumable && state.owned[id]) return false;
  if (price > state.balance) return false;
  const owned: Record<string, true> = consumable ? state.owned : { ...state.owned, [id]: true as const };
  const streak = id === 'freezer'
    ? { ...state.streak, freezesAvailable: state.streak.freezesAvailable + 1 }
    : state.streak;
  state = {
    ...state,
    balance: state.balance - price,
    spentTotal: state.spentTotal + price,
    owned, streak,
    purchases: state.purchases + 1,
  };
  commit();
  return true;
}

export function resetState() { state = initial(); commit(); }
