// Rank ladder — ported verbatim from the prototype's verified flatten-to-index math
// (Home.dc.html / Profile.dc.html rStep). This is the one piece of real logic that
// transfers directly. 10 ranks x 5 tiers, climbed low -> high; past the top = Prestige.

import type { RankName, Tier } from './types';

export const RANKS: RankName[] = [
  'Bronze', 'Silver', 'Gold', 'Diamond', 'Titan',
  'Legend', 'Mythic', 'Master', 'Elite', 'Champion',
];

export const RANK_COLORS: Record<RankName, string> = {
  Bronze: '#C8855A', Silver: '#B7C0CC', Gold: '#F5C24B', Diamond: '#4BA8FF',
  Titan: '#CE2029', Legend: '#8E5FD6', Mythic: '#C455B0', Master: '#B16BFF',
  Elite: '#CF6050', Champion: '#FF6060',
};

// Top ranks paint label/bars with a gradient instead of a flat color.
export const RANK_GRADIENTS: Partial<Record<RankName | 'Prestige', string[]>> = {
  Mythic: ['#C455B0', '#FF6FB0'],                          // purple -> magenta
  Master: ['#F5C24B', '#FFE08A'],                          // gold
  Elite: ['#CF6050', '#F5C24B'],                           // red -> gold
  Champion: ['#FF5F6D', '#FFC371', '#3FCF86', '#4BA8FF', '#9B7BFF'], // rainbow
  Prestige: ['#8EE3F5', '#C9A7FF', '#FFB3D9', '#B6F5C9'],  // iridescent
};

const MAX_INDEX = RANKS.length * 5 - 1; // 49

export interface LadderPos {
  rank: RankName | 'Prestige';
  tier: Tier;
  isPrestige: boolean;
}

// Flatten rank+tier to a single ladder index. tier is 1-based.
export function toIndex(rank: RankName, tier: Tier): number {
  return RANKS.indexOf(rank) * 5 + (tier - 1);
}

// Walk the flat ladder by `offset` (+1 = next, -1 = previous). Rolls across rank
// boundaries automatically (Gold V -> Diamond I). Past the top returns Prestige.
export function step(rank: RankName, tier: Tier, offset: number): LadderPos {
  const abs = toIndex(rank, tier) + offset;
  if (abs > MAX_INDEX) return { rank: 'Prestige', tier: 1, isPrestige: true };
  const clamped = Math.max(0, Math.min(MAX_INDEX, abs));
  return {
    rank: RANKS[Math.floor(clamped / 5)],
    tier: ((clamped % 5) + 1) as Tier,
    isPrestige: false,
  };
}

export function next(rank: RankName, tier: Tier): LadderPos { return step(rank, tier, +1); }
export function prev(rank: RankName, tier: Tier): LadderPos { return step(rank, tier, -1); }

export const isTopOfLadder = (rank: RankName, tier: Tier) =>
  toIndex(rank, tier) === MAX_INDEX; // Champion V — only Prestige remains

// 5-segment tier bar fill: boxes below current tier are full, current fills by
// xp%, higher boxes empty. Returns 5 fractions in [0,1].
export function tierBoxes(tier: Tier, xpFraction: number): number[] {
  return [0, 1, 2, 3, 4].map((i) =>
    i < tier - 1 ? 1 : i === tier - 1 ? Math.max(0, Math.min(1, xpFraction)) : 0,
  );
}
