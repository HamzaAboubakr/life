// Achievements — the full catalog (83), transcribed verbatim from Home.dc.html
// rawAch (exact names + descriptions + categories). Each maps to a metric + target;
// an achievement fires when metric >= target. Metrics we don't yet track resolve to
// 'unavailable' (always 0) so they display correctly but stay locked until wired.

export type AchievementCategory =
  | 'Streaks' | 'Tasks' | 'Calendar' | 'XP' | 'Ranks' | 'Coins' | 'Cosmetics' | 'Special';

export type Metric =
  | 'tasksCompleted' | 'streakDays' | 'freezersUsed' | 'streakRepairs'
  | 'perfectDays' | 'perfectWeeks' | 'perfectMonths' | 'level'
  | 'rankIndexReached' | 'prestigeCount' | 'coinsEarnedTotal' | 'coinsHeld'
  | 'coinsSpentTotal' | 'purchases' | 'chipsOwned' | 'tagsOwned'
  | 'emblemsOwned' | 'legendariesOwned' | 'xpTotal' | 'unavailable';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  category: AchievementCategory;
  metric: Metric;
  target: number;
}

const slug = (n: string) => n.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const a = (name: string, desc: string, category: AchievementCategory, metric: Metric, target: number): Achievement =>
  ({ id: slug(name), name, desc, category, metric, target });

export const ACHIEVEMENTS: Achievement[] = [
  // ── Streaks ──
  a('First Spark', 'Reached a 3-day streak.', 'Streaks', 'streakDays', 3),
  a('Relentless', 'Reached a 7-day streak without missing a day.', 'Streaks', 'streakDays', 7),
  a('Fortnight', 'Keep a streak alive for 14 days.', 'Streaks', 'streakDays', 14),
  a('Streak Master', 'Reach a 30-day streak.', 'Streaks', 'streakDays', 30),
  a('Unbreakable', 'Reach a 60-day streak.', 'Streaks', 'streakDays', 60),
  a('Century Flame', 'Reach a 100-day streak.', 'Streaks', 'streakDays', 100),
  a('Half a Year', 'Hold a streak for 180 days.', 'Streaks', 'streakDays', 180),
  a('Year of Fire', 'Reach a 365-day streak.', 'Streaks', 'streakDays', 365),
  a('Cold Storage', 'Used a Streak Freezer for the first time.', 'Streaks', 'freezersUsed', 1),
  a('Ice Age', 'Hold 5 Streak Freezers at once.', 'Streaks', 'freezersUsed', 5),
  a('Back from the Dead', 'Restored a lost streak with a Streak Repair.', 'Streaks', 'streakRepairs', 1),
  a('Comeback Kid', 'Restore a streak two separate times.', 'Streaks', 'streakRepairs', 2),
  // ── Tasks ──
  a('First Step', 'Completed your very first task.', 'Tasks', 'tasksCompleted', 1),
  a('Getting Going', 'Completed 10 tasks total.', 'Tasks', 'tasksCompleted', 10),
  a('Centurion', 'Completed 100 tasks all-time.', 'Tasks', 'tasksCompleted', 100),
  a('Half-K Hero', 'Complete 500 tasks all-time.', 'Tasks', 'tasksCompleted', 500),
  a('Thousandaire', 'Complete 1,000 tasks all-time.', 'Tasks', 'tasksCompleted', 1000),
  a('Perfect Day', 'Cleared every task scheduled for a day.', 'Tasks', 'perfectDays', 1),
  a('Perfect Week', 'Cleared every task for a full week.', 'Tasks', 'perfectWeeks', 1),
  a('Perfect Month', 'Clear every task for an entire month.', 'Tasks', 'perfectMonths', 1),
  a('Midnight Oil', 'Completed a task after midnight.', 'Tasks', 'unavailable', 1),
  a('Overachiever', 'Beat your own daily task record.', 'Tasks', 'unavailable', 1),
  a('Zero Overdue', 'Have no overdue tasks for a full week.', 'Tasks', 'unavailable', 1),
  a('Priority One', 'Complete 25 high-priority tasks.', 'Tasks', 'unavailable', 25),
  a('Chain Reaction', 'Complete 5 linked tasks in a row.', 'Tasks', 'unavailable', 5),
  a('Category King', 'Complete tasks across 10 different categories.', 'Tasks', 'unavailable', 10),
  a('Organized', 'Created your first custom category.', 'Tasks', 'unavailable', 1),
  a('Weekend Warrior', 'Complete 15 tasks over a weekend.', 'Tasks', 'unavailable', 15),
  a('Monday Motivation', 'Complete 10 tasks on a Monday.', 'Tasks', 'unavailable', 10),
  // ── Calendar ──
  a('Booked Solid', 'Had a task scheduled every day of a week.', 'Calendar', 'unavailable', 1),
  a('Look Ahead', 'Scheduled a task a month in advance.', 'Calendar', 'unavailable', 1),
  // ── XP & Levels ──
  a('Level Up', 'Reached Level 10.', 'XP', 'level', 10),
  a('Rising Star', 'Reach Level 25.', 'XP', 'level', 25),
  a('Platinum', 'Reach Level 50.', 'XP', 'level', 50),
  a('Centennial', 'Reach Level 100.', 'XP', 'level', 100),
  a('Boosted', 'Used an XP Boost for the first time.', 'XP', 'unavailable', 1),
  a('Double Time', 'Completed a task with a 2× boost active.', 'XP', 'unavailable', 1),
  a('Triple Threat', 'Complete a task with a 3× boost active.', 'XP', 'unavailable', 1),
  a('Fivefold', 'Use a 5× XP Boost.', 'XP', 'unavailable', 1),
  a('Boost Stacker', 'Have a week-long XP Boost running.', 'XP', 'unavailable', 1),
  // ── Ranks & Prestige ──
  a('Bronze Age', 'Climbed to Bronze rank.', 'Ranks', 'rankIndexReached', 0),
  a('Silver Lining', 'Climbed to Silver rank.', 'Ranks', 'rankIndexReached', 1),
  a('Golden Touch', 'Climbed to Gold rank.', 'Ranks', 'rankIndexReached', 2),
  a('Diamond Hands', 'Climb to Diamond rank.', 'Ranks', 'rankIndexReached', 3),
  a('Titan Fall', 'Climb to Titan rank.', 'Ranks', 'rankIndexReached', 4),
  a('Living Legend', 'Climb to Legend rank.', 'Ranks', 'rankIndexReached', 5),
  a('Mythic Being', 'Climb to Mythic rank.', 'Ranks', 'rankIndexReached', 6),
  a('Grandmaster', 'Climb to Master rank.', 'Ranks', 'rankIndexReached', 7),
  a('Elite Status', 'Climb to Elite rank.', 'Ranks', 'rankIndexReached', 8),
  a('Champion', 'Climb to Champion rank.', 'Ranks', 'rankIndexReached', 9),
  a('The Long Climb', 'Reach Champion V, the top of the ladder.', 'Ranks', 'rankIndexReached', 9),
  a('First Prestige', 'Prestige for the very first time.', 'Ranks', 'prestigeCount', 1),
  a('Star Collector', 'Earn 3 Prestige stars.', 'Ranks', 'prestigeCount', 3),
  a('Five Stars', 'Earn all 5 Prestige stars.', 'Ranks', 'prestigeCount', 5),
  a('Reborn', 'Prestige, then climb back to Gold.', 'Ranks', 'unavailable', 1),
  // ── Coins & Shop ──
  a('Piggy Bank', 'Earned your first 100 coins.', 'Coins', 'coinsEarnedTotal', 100),
  a('Gold Reserve', 'Earn 10,000 coins all-time.', 'Coins', 'coinsEarnedTotal', 10000),
  a('Fort Knox', 'Earn 100,000 coins all-time.', 'Coins', 'coinsEarnedTotal', 100000),
  a('First Purchase', 'Bought your first item from the Shop.', 'Coins', 'purchases', 1),
  a('Big Spender', 'Spend 1,000 coins in the Shop.', 'Coins', 'coinsSpentTotal', 1000),
  a('Shopaholic', 'Buy 10 items from the Shop.', 'Coins', 'purchases', 10),
  a('Window Shopper', 'Open 25 different Shop items.', 'Coins', 'unavailable', 25),
  a('Treat Yourself', 'Buy a Legendary-rarity item.', 'Coins', 'legendariesOwned', 1),
  a('Frugal', 'Bank 50,000 coins without spending.', 'Coins', 'unavailable', 1),
  // ── Cosmetics ──
  a('First Color', 'Equipped your first Chip.', 'Cosmetics', 'chipsOwned', 1),
  a('Chip Collector', 'Own 10 different Chips.', 'Cosmetics', 'chipsOwned', 10),
  a('Chip Hoarder', 'Own 25 different Chips.', 'Cosmetics', 'chipsOwned', 25),
  a('Full Palette', 'Own every Common Chip.', 'Cosmetics', 'chipsOwned', 12),
  a('Tag Team', 'Equipped your first Tag.', 'Cosmetics', 'tagsOwned', 1),
  a('Tag Collector', 'Own 10 different Tags.', 'Cosmetics', 'tagsOwned', 10),
  a('Rarity Hunter', 'Own a cosmetic of every rarity.', 'Cosmetics', 'unavailable', 5),
  a('Legendary Look', 'Equip a Legendary Chip.', 'Cosmetics', 'legendariesOwned', 1),
  a('Trendsetter', 'Change your equipped Chip 10 times.', 'Cosmetics', 'unavailable', 10),
  a('Flair Up', 'Equip your first Emblem.', 'Cosmetics', 'emblemsOwned', 1),
  a('Emblem Collector', 'Own 5 different Emblems.', 'Cosmetics', 'emblemsOwned', 5),
  a('Emblem Hoarder', 'Own 15 different Emblems.', 'Cosmetics', 'emblemsOwned', 15),
  a('Big Flex', 'Equip a Legendary Emblem.', 'Cosmetics', 'legendariesOwned', 1),
  a('Certified CEO', 'Own the CEO of Productivity Emblem.', 'Cosmetics', 'unavailable', 1),
  a('Completionist', 'Own every cosmetic in the Shop.', 'Cosmetics', 'unavailable', 1),
  // ── Special ──
  a('Dedicated', 'Open the app on 100 separate days.', 'Special', 'unavailable', 100),
  a('Well Rounded', 'Earn an achievement in every category.', 'Special', 'unavailable', 8),
  a('Overachiever+', 'Unlock 50 achievements.', 'Special', 'unavailable', 50),
  a('Perfectionist', 'Unlock every other achievement.', 'Special', 'unavailable', 82),
];

// Given the player's metric counters, which achievements are unlocked?
export function evaluate(metrics: Partial<Record<Metric, number>>): Set<string> {
  const unlocked = new Set<string>();
  for (const ach of ACHIEVEMENTS) {
    if ((metrics[ach.metric] ?? 0) >= ach.target) unlocked.add(ach.id);
  }
  return unlocked;
}
