// Coin economy — the earn side the prototype never had (it just seeded each screen
// with a fixed balance). Calibrated against the real shop price bands so each rarity
// "feels" like its intent. Single authoritative wallet + ledger lives in the store;
// this file is the pure earn/price math.

import type { Priority, Rarity } from './types';

// ---- Earning ----
export const COINS_BASE_TASK = 10;
export const PRIORITY_BONUS: Record<Priority, number> = { low: 0, medium: 5, high: 15 };
export const PERFECT_DAY_BONUS = 25;      // all of today's tasks completed
export const STREAK_COIN_PER_DAY = 2;     // +2 per consecutive day...
export const STREAK_COIN_CAP = 40;        // ...capped at +40/day

export function coinsForTask(priority: Priority): number {
  return COINS_BASE_TASK + PRIORITY_BONUS[priority];
}

export function streakCoinBonus(streakDays: number): number {
  return Math.min(STREAK_COIN_CAP, Math.max(0, streakDays) * STREAK_COIN_PER_DAY);
}

// ---- Prices ----
// Real bands read from Rewards.dc.html. Legendary ceiling lowered from 200k -> 75k
// (decision: unreachable otherwise; single-player app, tune freely).
export const LEGENDARY_PRICE_CEILING = 75_000;

export const PRICE_BANDS: Record<Rarity, { min: number; max: number }> = {
  Common: { min: 80, max: 350 },
  Uncommon: { min: 350, max: 950 },
  Rare: { min: 1_000, max: 8_500 },
  Epic: { min: 10_000, max: 37_500 },
  Legendary: { min: 40_000, max: LEGENDARY_PRICE_CEILING },
};

// Apply the rescaled ceiling to any seed price coming from the mock's shop data.
export function normalizePrice(rawPrice: number): number {
  return Math.min(rawPrice, LEGENDARY_PRICE_CEILING);
}
