// App store — the single source of truth, persisted to localStorage.
//
// The gamification layer (coins, XP, ranks, streak, shop) was removed with the
// Odyssey rewrite. Completing a task now only records the completion.

import {
  occursOn,
  type Task, type Recurrence, type Priority,
} from './core';
import { makeId, todayISO } from './util';

export interface CardDef { name: string; rgb: string; img: string; styleId?: string }

export const DEFAULT_CARDS: CardDef[] = [
  { name: 'Work', rgb: '92,164,235', img: 'assets/shop/business.png' },
  { name: 'Health', rgb: '41,179,107', img: 'assets/areas/biology.png' },
  { name: 'Personal', rgb: '251,109,134', img: 'assets/areas/psychology.png' },
  { name: 'Finance', rgb: '253,188,111', img: 'assets/subjects/economics.png' },
  { name: 'Learning', rgb: '109,140,219', img: 'assets/shop/philosophy.png' },
];

export interface State {
  tasks: Task[];
  completed: Record<string, true>; // `${taskId}|${date}` — per occurrence
  cards: CardDef[];                // category cards (seeded, user can add/edit/delete)
  seededDemo?: boolean;            // sample data has been laid down once
}

export interface NewTaskInput {
  title: string; priority?: Priority; date: string;
  category: string;
  timeStart?: number; timeEnd?: number; recurrence?: Recurrence; tagIds?: string[]; notes?: string; linkedIds?: string[];
}

const KEY = 'lm_web_state_v1';
const doneKey = (taskId: string, date: string) => `${taskId}|${date}`;

function initial(): State {
  return { tasks: [], completed: {}, cards: DEFAULT_CARDS.map((c) => ({ ...c })) };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const s = JSON.parse(raw) as Partial<State>;
    // Pick only the fields that still exist — this drops the persisted
    // gamification state (balance/progression/streak/owned/purchases) on the
    // next commit rather than carrying it around forever.
    const merged: State = {
      tasks: s.tasks ?? [],
      completed: s.completed ?? {},
      cards: s.cards ?? [],
      seededDemo: s.seededDemo,
    };
    if (!merged.cards.length) merged.cards = DEFAULT_CARDS.map((c) => ({ ...c }));
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

export function markSeeded() { state = { ...state, seededDemo: true }; commit(); }

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
  if (!state.tasks.some((t) => t.id === taskId)) return;
  state = { ...state, completed: { ...state.completed, [doneKey(taskId, dateISO)]: true } };
  commit();
}

export function uncompleteTask(taskId: string, dateISO = todayISO()) {
  const k = doneKey(taskId, dateISO);
  if (!state.completed[k]) return;
  const completed = { ...state.completed }; delete completed[k];
  state = { ...state, completed };
  commit();
}

export function resetState() { state = initial(); commit(); }
