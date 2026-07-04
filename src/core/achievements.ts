// Achievements. The prototype named ~80 but gave none a real unlock condition.
// The names ARE the conditions, so each maps to a metric + numeric target.
// This is the core set (confident mappings, all 8 categories represented); the
// remaining names follow the same pattern and get filled in incrementally.

import type { Rarity } from './types';

export type AchievementCategory =
  | 'Streaks' | 'Tasks' | 'Calendar' | 'XP' | 'Ranks' | 'Coins' | 'Cosmetics' | 'Special';

// Counters the store tracks; an achievement fires when metric >= target.
export type Metric =
  | 'tasksCompleted' | 'streakDays' | 'perfectDays' | 'perfectWeeks' | 'perfectMonths'
  | 'coinsHeld' | 'coinsSpentTotal' | 'purchases' | 'rankIndexReached' | 'prestigeCount'
  | 'categoriesUsedInDay' | 'colorsOwned' | 'chipsOwned' | 'tagsOwned' | 'emblemsOwned'
  | 'legendariesOwned' | 'overdueCleared' | 'boostsUsed' | 'freezersUsed'
  | 'chainsBuilt' | 'xpTotal' | 'tasksInOneDay' | 'streakRepairs';

export interface Achievement {
  id: string;
  name: string;
  category: AchievementCategory;
  rarity: Rarity;
  metric: Metric;
  target: number;
  coinReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Tasks
  { id: 'first-step', name: 'First Step', category: 'Tasks', rarity: 'Common', metric: 'tasksCompleted', target: 1, coinReward: 100 },
  { id: 'getting-going', name: 'Getting Going', category: 'Tasks', rarity: 'Common', metric: 'tasksCompleted', target: 10, coinReward: 250 },
  { id: 'centurion', name: 'Centurion', category: 'Tasks', rarity: 'Rare', metric: 'tasksCompleted', target: 100, coinReward: 2000 },
  { id: 'completionist', name: 'Completionist', category: 'Tasks', rarity: 'Epic', metric: 'tasksCompleted', target: 500, coinReward: 8000 },
  { id: 'triple-threat', name: 'Triple Threat', category: 'Tasks', rarity: 'Common', metric: 'tasksInOneDay', target: 3, coinReward: 150 },
  { id: 'overachiever', name: 'Overachiever', category: 'Tasks', rarity: 'Uncommon', metric: 'tasksInOneDay', target: 10, coinReward: 500 },

  // Streaks
  { id: 'dedicated', name: 'Dedicated', category: 'Streaks', rarity: 'Common', metric: 'streakDays', target: 3, coinReward: 150 },
  { id: 'fortnight', name: 'Fortnight', category: 'Streaks', rarity: 'Uncommon', metric: 'streakDays', target: 14, coinReward: 600 },
  { id: 'century-flame', name: 'Century Flame', category: 'Streaks', rarity: 'Epic', metric: 'streakDays', target: 100, coinReward: 10000 },
  { id: 'year-of-fire', name: 'Year of Fire', category: 'Streaks', rarity: 'Legendary', metric: 'streakDays', target: 365, coinReward: 50000 },
  { id: 'comeback-kid', name: 'Comeback Kid', category: 'Streaks', rarity: 'Uncommon', metric: 'streakRepairs', target: 1, coinReward: 300 },
  { id: 'cold-storage', name: 'Cold Storage', category: 'Streaks', rarity: 'Rare', metric: 'freezersUsed', target: 5, coinReward: 1000 },

  // Perfect (Tasks/Calendar)
  { id: 'perfect-day', name: 'Perfect Day', category: 'Tasks', rarity: 'Uncommon', metric: 'perfectDays', target: 1, coinReward: 400 },
  { id: 'perfect-week', name: 'Perfect Week', category: 'Tasks', rarity: 'Rare', metric: 'perfectWeeks', target: 1, coinReward: 2500 },
  { id: 'perfect-month', name: 'Perfect Month', category: 'Calendar', rarity: 'Epic', metric: 'perfectMonths', target: 1, coinReward: 12000 },

  // Calendar
  { id: 'zero-overdue', name: 'Zero Overdue', category: 'Calendar', rarity: 'Uncommon', metric: 'overdueCleared', target: 1, coinReward: 500 },

  // Ranks
  { id: 'gold', name: 'Gold', category: 'Ranks', rarity: 'Uncommon', metric: 'rankIndexReached', target: 2, coinReward: 800 },
  { id: 'diamond', name: 'Diamond', category: 'Ranks', rarity: 'Rare', metric: 'rankIndexReached', target: 3, coinReward: 2500 },
  { id: 'champion', name: 'Champion', category: 'Ranks', rarity: 'Legendary', metric: 'rankIndexReached', target: 9, coinReward: 40000 },
  { id: 'the-long-climb', name: 'The Long Climb', category: 'Ranks', rarity: 'Epic', metric: 'rankIndexReached', target: 7, coinReward: 15000 },

  // Prestige
  { id: 'first-prestige', name: 'First Prestige', category: 'Ranks', rarity: 'Epic', metric: 'prestigeCount', target: 1, coinReward: 10000 },
  { id: 'five-stars', name: 'Five Stars', category: 'Ranks', rarity: 'Legendary', metric: 'prestigeCount', target: 5, coinReward: 60000 },

  // Coins
  { id: 'first-purchase', name: 'First Purchase', category: 'Coins', rarity: 'Common', metric: 'purchases', target: 1, coinReward: 100 },
  { id: 'thousandaire', name: 'Thousandaire', category: 'Coins', rarity: 'Uncommon', metric: 'coinsHeld', target: 1000, coinReward: 300 },
  { id: 'big-spender', name: 'Big Spender', category: 'Coins', rarity: 'Rare', metric: 'coinsSpentTotal', target: 25000, coinReward: 2000 },
  { id: 'shopaholic', name: 'Shopaholic', category: 'Coins', rarity: 'Uncommon', metric: 'purchases', target: 10, coinReward: 600 },

  // Cosmetics
  { id: 'first-color', name: 'First Color', category: 'Cosmetics', rarity: 'Common', metric: 'colorsOwned', target: 1, coinReward: 100 },
  { id: 'full-palette', name: 'Full Palette', category: 'Cosmetics', rarity: 'Rare', metric: 'colorsOwned', target: 5, coinReward: 2000 },
  { id: 'emblem-collector', name: 'Emblem Collector', category: 'Cosmetics', rarity: 'Epic', metric: 'emblemsOwned', target: 10, coinReward: 8000 },
  { id: 'legendary-look', name: 'Legendary Look', category: 'Cosmetics', rarity: 'Legendary', metric: 'legendariesOwned', target: 1, coinReward: 40000 },

  // XP
  { id: 'level-up', name: 'Level Up', category: 'XP', rarity: 'Common', metric: 'xpTotal', target: 500, coinReward: 150 },
  { id: 'big-flex', name: 'Big Flex', category: 'XP', rarity: 'Epic', metric: 'xpTotal', target: 50000, coinReward: 8000 },

  // Special
  { id: 'chain-reaction', name: 'Chain Reaction', category: 'Special', rarity: 'Uncommon', metric: 'chainsBuilt', target: 1, coinReward: 400 },
  { id: 'well-rounded', name: 'Well Rounded', category: 'Special', rarity: 'Rare', metric: 'categoriesUsedInDay', target: 5, coinReward: 1500 },
  { id: 'boost-stacker', name: 'Boost Stacker', category: 'Special', rarity: 'Rare', metric: 'boostsUsed', target: 10, coinReward: 1500 },
];

// Given a snapshot of the player's metric counters, which achievements are unlocked?
export function evaluate(metrics: Partial<Record<Metric, number>>): Set<string> {
  const unlocked = new Set<string>();
  for (const a of ACHIEVEMENTS) {
    if ((metrics[a.metric] ?? 0) >= a.target) unlocked.add(a.id);
  }
  return unlocked;
}
