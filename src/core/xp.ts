// XP curve. Replaces the prototype's flat 3200/tier. Gentle start (Bronze falls in
// days), steep end (Champion V takes weeks) so the top is "hard but not too hard."
//
// There are 50 tiers total (10 ranks x 5). Global tier index 0..49.
// xpNeeded(i) = round(BASE * GROWTH^i).
// Tunable — the exact constants get finalized during play-testing.

import { RANKS, toIndex } from './ranks';
import type { RankName, Tier } from './types';

export const XP_BASE = 150;
export const XP_GROWTH = 1.1;
export const MAX_TIER_INDEX = RANKS.length * 5 - 1; // 49

// XP required to advance FROM this global tier index to the next.
export function xpNeeded(globalTierIndex: number): number {
  const i = Math.max(0, Math.min(MAX_TIER_INDEX, globalTierIndex));
  return Math.round(XP_BASE * Math.pow(XP_GROWTH, i));
}

export function xpNeededFor(rank: RankName, tier: Tier): number {
  return xpNeeded(toIndex(rank, tier));
}

// Cumulative XP to reach a given tier from Bronze I (index 0).
export function cumulativeXpTo(globalTierIndex: number): number {
  let total = 0;
  for (let i = 0; i < globalTierIndex; i++) total += xpNeeded(i);
  return total;
}

// Total XP for the entire ladder (Bronze I -> Champion V). ~for pacing sanity checks.
export const XP_TOTAL_LADDER = cumulativeXpTo(MAX_TIER_INDEX + 1);

// XP granted per task completion (mirrors coins earn side; see economy.ts).
export const XP_PER_TASK = 15;
