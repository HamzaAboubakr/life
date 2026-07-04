// Rank/color paint helpers — ported 1:1 from Home.dc.html renderVals so paints match
// exactly. In a browser, gradient text (background-clip) and filter:blur glow work
// natively, so these reproduce the design precisely.

import { RANK_COLORS, step, type RankName, type Tier } from './core';
import { asset, roman } from './util';

export const rgb = (hex: string): string => {
  const n = hex.replace('#', '');
  return `${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)}`;
};

const h2r = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const r2h = (a: number[]) => '#' + a.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
export const mix = (c1: string, c2: string, t: number) => r2h(h2r(c1).map((v, i) => v + (h2r(c2)[i] - v) * t));

// Gradient ranks (CSS gradient strings, exactly as in the mock).
export const TEXTGRAD: Record<string, string> = {
  Champion: 'linear-gradient(90deg,#FF5F6D,#FFC371,#F5C24B,#3FE0C5,#4BA8FF,#B16BFF,#FF6FA5)',
  Master: 'linear-gradient(90deg,#FBEFCB,#E0BC72)',
  Elite: 'linear-gradient(90deg,#C41F3A,#D9A066)',
  Mythic: 'linear-gradient(90deg,#9B4DE0,#D64FB0)',
  Prestige: 'linear-gradient(100deg,#B8C6FF,#E9D5FF,#FFD6E8,#C6F6FF)',
};

export const rankIcon = (name: string) =>
  asset(name === 'Prestige' ? 'assets/ranks/prestige.png' : `assets/ranks/${name.toLowerCase()}.png`);
export const rankHex = (name: string) => (name === 'Prestige' ? '#FFFFFF' : RANK_COLORS[name as RankName]);

// CSS for a rank's text: gradient clip for top ranks, else flat color.
export function tcCss(name: string): string {
  return TEXTGRAD[name]
    ? `background-image:${TEXTGRAD[name]}; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent;`
    : `color:${rankHex(name)};`;
}

export interface LadderInfo {
  name: string; tier: number; isPrestige: boolean; icon: string; color: string; label: string; labelTC: string;
}
export function stepInfo(rank: RankName, tier: Tier, offset: number): LadderInfo {
  const s = step(rank, tier, offset);
  const name = s.rank;
  const label = s.isPrestige ? 'PRESTIGE' : `${name} ${roman[s.tier - 1]}`.toUpperCase();
  const labelTC = s.isPrestige ? 'Prestige' : `${name} ${roman[s.tier - 1]}`;
  return { name, tier: s.tier, isPrestige: s.isPrestige, icon: rankIcon(name), color: rankHex(name), label, labelTC };
}

const sampleGrad = (cols: string[], k: number) =>
  Array.from({ length: k }, (_, i) => {
    const seg = (i / (k - 1)) * (cols.length - 1);
    const lo = Math.min(cols.length - 1, Math.floor(seg));
    return mix(cols[lo], cols[Math.min(cols.length - 1, lo + 1)], seg - lo);
  });

// 6 stops across the tier bar (rank light->deep, or the gradient rank's colors).
export function tierStops(rank: RankName): string[] {
  const g = TEXTGRAD[rank];
  const cols = g ? (g.match(/#[0-9A-Fa-f]{6}/g) as string[]) : [mix(rankHex(rank), '#ffffff', 0.28), rankHex(rank), mix(rankHex(rank), '#000000', 0.24)];
  return sampleGrad(cols, 6);
}
