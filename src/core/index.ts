// Barrel for the framework-agnostic domain logic — one source of truth for the
// rules, shared by the store and the UI.
//
// The gamification modules (ranks, xp, economy, streak, achievements) were
// removed when Odyssey dropped the game layer; it is a plain tasks/calendar app.
export * from './types';
export * from './recurrence';
