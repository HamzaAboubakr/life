// Unified domain types — the single source of truth the prototype never had.
// Tasks.dc.html and Calendar.dc.html each invented their own task shape; this is the merge.

export type RankName =
  | 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Titan'
  | 'Legend' | 'Mythic' | 'Master' | 'Elite' | 'Champion';

export type Tier = 1 | 2 | 3 | 4 | 5;

export type CategoryKey = 'work' | 'health' | 'personal' | 'finance' | 'learning';

export type Priority = 'low' | 'medium' | 'high';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

// One canonical task. Dates are ISO (YYYY-MM-DD); time is a structured object,
// never the prose strings ("Sunday, June 28 at 9:00 AM") the mock used.
export interface Task {
  id: string;
  title: string;
  category: string;          // card name (user-definable)
  priority: Priority;
  notes?: string;
  date: string;                 // ISO date the task is scheduled for
  time?: TimeSpec;              // optional; absent = all-day
  recurrence?: Recurrence;      // absent = one-off
  tagIds: string[];            // real first-class tags, not category-inferred
  linkedChainId?: string;      // membership in an ordered linked-task chain
  linkedIds?: string[];        // ordered linked-task chain (design: Linked Tasks)
  createdAt: string;           // ISO timestamp
}

export interface TimeSpec {
  startMinutes: number;         // minutes from midnight, 0–1439
  endMinutes?: number;          // optional range end
}

// Completion is per-occurrence (keyed by task + date) so recurring tasks
// track each day independently — the prototype's flat lm_done map could not.
export interface Completion {
  taskId: string;
  date: string;                 // ISO date of the occurrence completed
  completedAt: string;          // ISO timestamp
  coinsAwarded: number;
  xpAwarded: number;
}

export interface Tag {
  id: string;
  name: string;
  hex: string;
}

// An ordered chain of tasks ("do these in sequence"). Referential integrity is
// enforced in the store: deleting a task removes it from any chain it's in.
export interface LinkedChain {
  id: string;
  taskIds: string[];            // ordered, max 10
}

// ---- Recurrence (user-selectable — see recurrence.ts) ----
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export type Recurrence =
  | { kind: 'daily' }
  | { kind: 'weekdays' }                       // Mon–Fri
  | { kind: 'weekly'; days: Weekday[] }        // specific days of week
  | { kind: 'monthly'; day: number }           // 1–31 (clamped to month length)
  | { kind: 'custom'; everyNDays: number };    // every N days from anchor
