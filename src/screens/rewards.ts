// Rewards / "Shop" — transcribed from Rewards.dc.html: coin pill, rarity filter,
// shop cards (chips / tags / power-ups / emblems), buy modal, purchase toast.
// Catalog data ported verbatim; prices run through normalizePrice (75k ceiling).
// Wallet/ownership are real (store.purchase).

import { normalizePrice, type Rarity } from '../core';
import { getState, purchase } from '../store';
import { asset, esc } from '../util';

// ---- shared meta ----
const rarMeta: Record<Rarity, [string, string]> = {
  Common: ['#8E8E93', '#ffffff'], Uncommon: ['#5FCB4A', '#06230A'], Rare: ['#3B82F6', '#ffffff'],
  Epic: ['#A855F7', '#ffffff'], Legendary: ['#F5C24B', '#3A2400'],
};

interface ShopItem {
  id: string; name: string; priceN: number; rarity: Rarity;
  kind: 'chip' | 'tag' | 'power' | 'emblem';
  tint: string; title: string; bgImg: string; bgPos: string;
  // chip/tag swatch paint
  bg?: string; color?: string; border?: string; shadow?: string; bgSize?: string; anim?: string;
  nameColor?: string; nameGrad?: string | null;
  // power
  desc?: string; longDesc?: string; icon?: string; iconColor?: string;
  // emblem
  embStyle?: string; embStyleLg?: string; embText?: string;
}

// ---- chips (41) ----
function chips(): ShopItem[] {
  type Opt = { border?: string; shadow?: string; bgSize?: string; anim?: string; nameColor?: string; nameGrad?: string; price?: number };
  const mk = (id: string, name: string, bg: string, color: string, o: Opt = {}): ShopItem => ({
    id, name, bg, color, border: o.border || 'none', shadow: o.shadow || 'none', bgSize: o.bgSize || 'auto',
    anim: o.anim || 'none', nameColor: o.nameColor, nameGrad: o.nameGrad || null,
    priceN: 0, rarity: 'Common', kind: 'chip',
    tint: '31,161,152', title: 'Customized Chip', bgImg: asset('assets/subjects/geography.png'), bgPos: 'center 30%',
  });
  const styles = [
    mk('cyan', 'Cyan', '#2AD1E5', '#04222A', { nameColor: '#34CEE9' }),
    mk('green', 'Mint', '#34D399', '#04231A', { nameColor: '#3FCF86' }),
    mk('slate', 'Slate', '#64748B', '#F1F5F9', { nameColor: '#94A3B8' }),
    mk('coral', 'Coral', '#FF6B5C', '#2E0A06', { nameColor: '#FF8A7D' }),
    mk('purple', 'Violet', '#7C5CFF', '#FFFFFF', { nameColor: '#9A8CF0' }),
    mk('voltage', 'Voltage', 'linear-gradient(135deg,#FDE047,#FACC15)', '#2E2600', { shadow: '0 0 14px rgba(250,204,21,0.85), 0 0 5px rgba(253,224,71,0.9)', nameColor: '#FDE047' }),
    mk('venom', 'Venom', 'linear-gradient(135deg,#A3E635,#4D7C0F)', '#0E2600', { shadow: '0 0 14px rgba(132,204,22,0.85), 0 0 5px rgba(163,230,53,0.9)', nameColor: '#A3E635' }),
    mk('fuchsia', 'Fuchsia', 'linear-gradient(135deg,#F0509C,#C21A6B)', '#FFFFFF', { shadow: '0 0 14px rgba(240,80,156,0.85), 0 0 5px rgba(217,26,107,0.9)', nameColor: '#F87CB8' }),
    mk('cobalt', 'Cobalt', 'linear-gradient(135deg,#3B82F6,#1E40AF)', '#FFFFFF', { shadow: '0 0 14px rgba(59,130,246,0.9), 0 0 5px rgba(37,99,235,0.95)', nameColor: '#7CB0FF' }),
    mk('orchid', 'Orchid', 'linear-gradient(135deg,#A78BFA,#6D28D9)', '#FFFFFF', { shadow: '0 0 14px rgba(139,92,246,0.9), 0 0 5px rgba(124,58,237,0.95)', nameColor: '#C4B5FD' }),
    mk('ember', 'Ember', 'linear-gradient(135deg,#FF6B00,#FF2D2D)', '#FFFFFF', { shadow: '0 0 14px rgba(255,90,0,0.8), 0 0 5px rgba(255,60,0,0.9)', nameColor: '#FF8A4D' }),
    mk('ice', 'Ice', 'rgba(186,230,253,0.16)', '#E0F2FE', { border: '1px solid rgba(186,230,253,0.7)', shadow: '0 0 14px rgba(186,230,253,0.75), 0 0 5px rgba(224,242,254,0.85)', nameColor: '#BAE6FD' }),
    mk('halo', 'Halo', '#0A0A0C', '#FFFFFF', { border: '1px solid rgba(255,255,255,0.85)', shadow: '0 0 14px rgba(255,255,255,0.65), 0 0 5px rgba(255,255,255,0.85)', nameColor: '#F4F4F6' }),
    mk('sunset', 'Sunset', 'linear-gradient(135deg,#FF8A5B,#FF3D77)', '#FFFFFF', { nameGrad: 'linear-gradient(95deg,#FF8A5B,#FF3D77)' }),
    mk('ocean', 'Ocean', 'linear-gradient(135deg,#3B82F6,#06B6D4)', '#FFFFFF', { nameGrad: 'linear-gradient(95deg,#5AC8FA,#06B6D4)' }),
    mk('aurora', 'Aurora', 'linear-gradient(135deg,#34D399,#22D3EE 55%,#818CF8)', '#052018', { nameGrad: 'linear-gradient(95deg,#34D399,#22D3EE,#818CF8)' }),
    mk('sunrise', 'Sunrise', 'linear-gradient(135deg,#FBBF24,#FB7185)', '#2E1400', { nameGrad: 'linear-gradient(95deg,#FCD34D,#FB7185)' }),
    mk('bubblegum', 'Bubblegum', 'linear-gradient(135deg,#F472B6,#C084FC)', '#FFFFFF', { nameGrad: 'linear-gradient(95deg,#F9A8D4,#C084FC)' }),
    mk('emerald', 'Emerald', 'linear-gradient(135deg,#10B981,#047857)', '#FFFFFF', { nameGrad: 'linear-gradient(95deg,#34D399,#059669)' }),
    mk('ruby', 'Ruby', 'linear-gradient(135deg,#F43F5E,#9F1239)', '#FFFFFF', { nameGrad: 'linear-gradient(95deg,#FB7185,#E11D48)' }),
    mk('vaporwave', 'Vaporwave', 'linear-gradient(160deg,#ff71ce,#b967ff 45%,#01cdfe)', '#1A0A2E', { nameGrad: 'linear-gradient(95deg,#ff71ce,#b967ff,#01cdfe)' }),
    mk('frost', 'Frost', 'rgba(147,197,253,0.18)', '#DBEAFE', { border: '1px solid rgba(147,197,253,0.55)', shadow: 'inset 0 1px 0 rgba(255,255,255,0.25)', nameColor: '#BFDBFE' }),
    mk('ink', 'Ink', '#0A0A0C', '#FFFFFF', { border: '1px solid rgba(255,255,255,0.5)', nameColor: '#D4D4D8' }),
    mk('carbon', 'Carbon', 'repeating-linear-gradient(45deg,#1a1a1d 0 2px,#2c2c31 2px 4px)', '#E5E7EB', { border: '1px solid rgba(255,255,255,0.12)', nameColor: '#9CA3AF' }),
    mk('woven', 'Woven', 'repeating-linear-gradient(45deg,#4F46E5 0 3px,#3730A3 3px 6px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.12) 0 3px,transparent 3px 6px)', '#FFFFFF', { nameColor: '#A5B4FC' }),
    mk('obsidian', 'Obsidian', 'radial-gradient(circle at 40% 18%,rgba(255,255,255,0.18),transparent 42%),linear-gradient(135deg,#0a0a0c,#1c1c22)', '#E5E7EB', { shadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', nameColor: '#9CA3AF' }),
    mk('pearl', 'Pearl', 'linear-gradient(115deg,#f5f3ff,#e0f2fe 30%,#fce7f3 50%,#ede9fe 70%,#f5f3ff)', '#6D28D9', { bgSize: '200% 100%', anim: 'flow 7s linear infinite', nameGrad: 'linear-gradient(95deg,#c7d2fe,#f5d0fe,#a5f3fc)' }),
    mk('topaz', 'Topaz', 'conic-gradient(from 90deg,#0369a1,#38bdf8,#7dd3fc,#0ea5e9,#0369a1)', '#06283F', { shadow: '0 0 8px rgba(56,189,248,0.45)', nameColor: '#7DD3FC' }),
    mk('tanzanite', 'Tanzanite', 'conic-gradient(from 160deg,#1e3a8a,#4338ca,#6366f1,#3730a3,#1e3a8a)', '#FFFFFF', { shadow: '0 0 8px rgba(99,102,241,0.5)', nameColor: '#818CF8' }),
    mk('iridescent', 'Iridescent', 'linear-gradient(100deg,#a8edea,#fed6e3 35%,#fdcbf1 60%,#e0c3fc)', '#1a1a2e', { nameGrad: 'linear-gradient(95deg,#a8edea,#fdcbf1,#e0c3fc)' }),
    mk('nebula', 'Nebula', 'linear-gradient(135deg,#7C3AED,#DB2777 55%,#2563EB)', '#FFFFFF', { shadow: '0 0 14px rgba(167,139,250,0.6)', nameGrad: 'linear-gradient(95deg,#D8B4FE,#F472B6,#60A5FA)' }),
    mk('void', 'Void', 'radial-gradient(circle at 50% 38%,#2e1065,#0a0a12 76%)', '#C4B5FD', { border: '1px solid rgba(167,139,250,0.55)', shadow: '0 0 14px rgba(139,92,246,0.55)', nameColor: '#A78BFA' }),
    mk('solar', 'Solar', 'radial-gradient(circle at 50% 120%,#FDE68A,#F59E0B 40%,#B45309 82%)', '#3A2400', { shadow: '0 0 14px rgba(245,158,11,0.7)', nameColor: '#FBBF24' }),
    mk('stardust', 'Stardust', 'radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 60% 20%,#a5f3fc,transparent),radial-gradient(1.5px 1.5px at 80% 70%,#fff,transparent),radial-gradient(1px 1px at 35% 80%,#f0abfc,transparent),linear-gradient(135deg,#1e1b4b,#0a0a1a)', '#E0E7FF', { shadow: '0 0 12px rgba(129,140,248,0.5)', nameColor: '#A5B4FC' }),
    mk('quasar', 'Quasar', 'radial-gradient(circle at 30% 30%,#22d3ee,transparent 60%),radial-gradient(circle at 70% 70%,#e879f9,transparent 60%),#0a0a1a', '#FFFFFF', { shadow: '0 0 14px rgba(232,121,249,0.6)', nameColor: '#67E8F9' }),
    mk('cosmos', 'Cosmos', 'radial-gradient(circle at 25% 30%,rgba(124,58,237,0.7),transparent 50%),radial-gradient(circle at 75% 65%,rgba(219,39,119,0.6),transparent 50%),#0d0a24', '#EDE9FE', { shadow: '0 0 14px rgba(124,58,237,0.55)', nameColor: '#C4B5FD' }),
    mk('ion', 'Ion', 'linear-gradient(90deg,#06b6d4,#3b82f6,#8b5cf6,#06b6d4)', '#FFFFFF', { bgSize: '200% 100%', anim: 'flow 6s linear infinite', shadow: '0 0 14px rgba(139,92,246,0.6)', nameGrad: 'linear-gradient(95deg,#67E8F9,#8b5cf6)' }),
    mk('twilight', 'Twilight', 'linear-gradient(180deg,#0f172a,#3b1f6e 42%,#c2410c 80%,#f59e0b)', '#FFE8D6', { shadow: '0 0 12px rgba(124,58,237,0.4)', nameColor: '#FDBA74' }),
    mk('rosegold', 'Rose Gold', 'linear-gradient(115deg,#DFA595 0%,#DFA595 24%,#F3CFC3 42%,#FFF2EC 50%,#F3CFC3 58%,#DFA595 76%,#DFA595 100%)', '#3A1A12', { bgSize: '200% 100%', anim: 'flow 4.5s linear infinite', nameGrad: 'linear-gradient(95deg,#DFA595,#FFF2EC,#DFA595)' }),
    mk('holoflow', 'Holo Flow', 'linear-gradient(100deg,#a1c4fd,#c2e9fb,#f9d5ec,#e0c3fc,#8ec5fc,#a1c4fd)', '#1a1a2e', { bgSize: '200% 100%', anim: 'flow 9s linear infinite', nameGrad: 'linear-gradient(95deg,#a1c4fd,#f9d5ec,#8ec5fc)' }),
    mk('prism', 'Prism', 'conic-gradient(from 0deg,#ff5c8a,#ffd45c,#5cff9d,#5cc9ff,#b45cff,#ff5c8a)', '#141414', { anim: 'hue 9s linear infinite', nameGrad: 'linear-gradient(95deg,#ff5c8a,#ffd45c,#5cff9d,#5cc9ff,#b45cff)' }),
  ];
  const PR: Record<string, [number, Rarity]> = { cyan: [250, 'Common'], green: [250, 'Common'], slate: [300, 'Common'], coral: [450, 'Common'], purple: [500, 'Common'], voltage: [850, 'Uncommon'], venom: [850, 'Uncommon'], orchid: [1250, 'Uncommon'], ember: [1750, 'Uncommon'], emerald: [1800, 'Uncommon'], ruby: [1900, 'Uncommon'], frost: [1950, 'Uncommon'], ink: [2000, 'Uncommon'], obsidian: [2000, 'Uncommon'], fuchsia: [2500, 'Rare'], halo: [5000, 'Rare'], ice: [5250, 'Rare'], cobalt: [3000, 'Rare'], sunset: [4000, 'Rare'], ocean: [5000, 'Rare'], aurora: [7500, 'Rare'], sunrise: [8500, 'Rare'], bubblegum: [9500, 'Rare'], vaporwave: [9750, 'Rare'], carbon: [10000, 'Rare'], topaz: [10000, 'Rare'], tanzanite: [10000, 'Rare'], iridescent: [10000, 'Rare'], rosegold: [6500, 'Rare'], twilight: [5000, 'Rare'], woven: [15000, 'Epic'], pearl: [17500, 'Epic'], nebula: [20000, 'Epic'], quasar: [25000, 'Epic'], cosmos: [25000, 'Epic'], void: [35000, 'Legendary'], solar: [35000, 'Legendary'], stardust: [40000, 'Legendary'], ion: [40000, 'Legendary'], holoflow: [40000, 'Legendary'], prism: [100000, 'Legendary'] };
  styles.forEach((s) => { const pr = PR[s.id]; if (pr) { s.priceN = normalizePrice(pr[0]); s.rarity = pr[1]; } });
  return styles;
}

// ---- tags (23) ----
function tags(): ShopItem[] {
  type Opt = { border?: string; shadow?: string; bgSize?: string; anim?: string; nameColor?: string; nameGrad?: string; price: number; rarity: Rarity };
  const mk = (id: string, name: string, bg: string, o: Opt): ShopItem => ({
    id, name, bg, color: '#fff', border: o.border ?? '1px solid rgba(255,255,255,0.14)', shadow: o.shadow || 'none',
    bgSize: o.bgSize || 'auto', anim: o.anim || 'none', nameColor: o.nameColor || '#E6E6EA', nameGrad: o.nameGrad || null,
    priceN: normalizePrice(o.price), rarity: o.rarity, kind: 'tag',
    tint: '70,58,135', title: 'Customized Tag', bgImg: asset('assets/shop/philosophy.png'), bgPos: 'center 30%',
  });
  return [
    mk('t_cyan', 'Cyan', '#2AD1E5', { nameColor: '#34CEE9', price: 500, rarity: 'Common' }),
    mk('t_cobalt', 'Cobalt', '#3B82F6', { nameColor: '#7CB0FF', price: 800, rarity: 'Common' }),
    mk('t_mint', 'Mint', '#34D399', { nameColor: '#3FCF86', price: 800, rarity: 'Common' }),
    mk('t_emerald', 'Emerald', '#10B981', { nameColor: '#34D399', price: 800, rarity: 'Common' }),
    mk('t_lime', 'Lime', '#A3E635', { nameColor: '#BEF264', price: 950, rarity: 'Common' }),
    mk('t_amber', 'Amber', '#F5A93B', { nameColor: '#F5B85A', price: 1000, rarity: 'Common' }),
    mk('t_coral', 'Coral', '#FF6B5C', { nameColor: '#FF8A7D', price: 1500, rarity: 'Uncommon' }),
    mk('t_rose', 'Rose', '#F65C9A', { nameColor: '#F87AB0', price: 1500, rarity: 'Uncommon' }),
    mk('t_fuchsia', 'Fuchsia', '#E879F9', { nameColor: '#F0ABFC', price: 2000, rarity: 'Uncommon' }),
    mk('t_violet', 'Violet', '#7C5CFF', { nameColor: '#9A8CF0', price: 1500, rarity: 'Uncommon' }),
    mk('t_slate', 'Slate', '#64748B', { nameColor: '#94A3B8', price: 1250, rarity: 'Uncommon' }),
    mk('t_grape', 'Grape', 'linear-gradient(135deg,#A855F7,#6D28D9)', { border: 'none', nameGrad: 'linear-gradient(95deg,#C084FC,#8B5CF6)', nameColor: '#C084FC', price: 7500, rarity: 'Rare' }),
    mk('t_ocean', 'Ocean', 'linear-gradient(135deg,#3B82F6,#06B6D4)', { border: 'none', nameGrad: 'linear-gradient(95deg,#5AC8FA,#06B6D4)', nameColor: '#5AC8FA', price: 10000, rarity: 'Rare' }),
    mk('t_peach', 'Peach', 'linear-gradient(135deg,#FDBA74,#FB7185)', { border: 'none', nameGrad: 'linear-gradient(95deg,#FDBA74,#FB7185)', nameColor: '#FDBA74', price: 10000, rarity: 'Rare' }),
    mk('t_vaporwave', 'Vaporwave', 'linear-gradient(160deg,#ff71ce,#b967ff 45%,#01cdfe)', { border: 'none', nameGrad: 'linear-gradient(95deg,#ff71ce,#b967ff,#01cdfe)', nameColor: '#FF9CE8', price: 17500, rarity: 'Epic' }),
    mk('t_dusk', 'Dusk', 'linear-gradient(135deg,#6366F1,#8B5CF6 50%,#EC4899)', { border: 'none', nameGrad: 'linear-gradient(95deg,#A5B4FC,#C084FC,#F0ABFC)', nameColor: '#A5B4FC', price: 25000, rarity: 'Epic' }),
    mk('t_carbon', 'Carbon', 'repeating-linear-gradient(45deg,#1a1a1d 0 2px,#2c2c31 2px 4px)', { border: '1px solid rgba(255,255,255,0.14)', nameColor: '#9CA3AF', price: 20000, rarity: 'Epic' }),
    mk('t_denim', 'Denim', 'repeating-linear-gradient(45deg,#1e3a8a 0 2px,#2563eb 2px 4px)', { border: 'none', nameColor: '#93C5FD', price: 20000, rarity: 'Epic' }),
    mk('t_lagoon', 'Lagoon', 'linear-gradient(135deg,#06B6D4,#14B8A6)', { border: 'none', nameGrad: 'linear-gradient(95deg,#22D3EE,#2DD4BF)', nameColor: '#2DD4BF', price: 20000, rarity: 'Epic' }),
    mk('t_sunset', 'Sunset', 'linear-gradient(135deg,#FF8A5B,#FF3D77)', { border: 'none', nameGrad: 'linear-gradient(95deg,#FF8A5B,#FF3D77)', nameColor: '#FF7A9C', price: 50000, rarity: 'Legendary' }),
    mk('t_sunrise', 'Sunrise', 'linear-gradient(135deg,#FBBF24,#FB7185)', { border: 'none', nameGrad: 'linear-gradient(95deg,#FCD34D,#FB7185)', nameColor: '#FCD34D', price: 50000, rarity: 'Legendary' }),
    mk('t_holo', 'Holo', 'linear-gradient(100deg,#a1c4fd,#c2e9fb,#f9d5ec,#e0c3fc,#8ec5fc,#a1c4fd)', { border: 'none', bgSize: '200% 100%', anim: 'flow 9s linear infinite', nameGrad: 'linear-gradient(95deg,#a1c4fd,#f9d5ec,#8ec5fc)', nameColor: '#C4B5FD', price: 50000, rarity: 'Legendary' }),
    mk('t_aurora', 'Aurora', 'linear-gradient(135deg,#34D399,#22D3EE 55%,#818CF8)', { border: 'none', nameGrad: 'linear-gradient(95deg,#34D399,#22D3EE,#818CF8)', nameColor: '#5EEAD4', price: 75000, rarity: 'Legendary' }),
  ];
}

// ---- power-ups (9) ----
function powers(): ShopItem[] {
  const mk = (id: string, name: string, desc: string, longDesc: string, icon: string, iconColor: string, price: number, rarity: Rarity): ShopItem => ({
    id, name, desc, longDesc, icon, iconColor, priceN: normalizePrice(price), rarity, kind: 'power',
    tint: '78,88,180', title: name, bgImg: asset('assets/subjects/ess.png'), bgPos: 'center 28%',
  });
  return [
    mk('freezer', 'Streak Freezer', 'Freeze your streak for a day', 'Freeze your streak for one day — skip signing in and completing a task, and your streak stays exactly where it is.', 'ac_unit', '#7DD3FC', 50000, 'Legendary'),
    mk('repair', 'Streak Repair', 'Restore a lost streak', 'Bring a streak back from the dead — instantly restore a streak you already lost, as if you never missed a day.', 'local_fire_department', '#FF7A3C', 30000, 'Legendary'),
    mk('xp15d', '1.5× XP Boost', '1.5× XP for 1 day', 'Earn 1.5× XP on everything you complete for 1 day.', 'bolt', '#8AD46A', 10000, 'Rare'),
    mk('xp15w', '1.5× XP Boost', '1.5× XP for 1 week', 'Earn 1.5× XP on everything you complete for a full week.', 'bolt', '#8AD46A', 50000, 'Rare'),
    mk('xp2d', '2× XP Boost', '2× XP for 1 day', 'Double the XP on everything you complete for 1 day.', 'bolt', '#C084FC', 25000, 'Epic'),
    mk('xp2w', '2× XP Boost', '2× XP for 1 week', 'Double the XP on everything you complete for a full week.', 'bolt', '#C084FC', 125000, 'Epic'),
    mk('xp3d', '3× XP Boost', '3× XP for 1 day', 'Triple the XP on everything you complete for 1 day.', 'bolt', '#F5C24B', 35000, 'Legendary'),
    mk('xp3w', '3× XP Boost', '3× XP for 1 week', 'Triple the XP on everything you complete for a full week.', 'bolt', '#F5C24B', 175000, 'Legendary'),
    mk('xp5d', '5× XP Boost', '5× XP for 1 day', 'A massive 5× XP on everything you complete for 1 day.', 'bolt', '#F5C24B', 50000, 'Legendary'),
  ];
}

// ---- emblems (18) ----
function emblems(): ShopItem[] {
  type D = { n: string; k: string; p: (string | number)[]; extra?: string; price: number; rar: Rarity };
  const mkStyle = (d: D, sz: 'sm' | 'lg'): string => {
    const S = sz === 'lg'
      ? 'display:inline-flex; align-items:center; gap:7px; font-size:17px; font-weight:900; letter-spacing:0.7px; text-transform:uppercase; padding:9px 20px; border-radius:9px; white-space:nowrap;'
      : 'display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:900; letter-spacing:0.7px; text-transform:uppercase; padding:5px 13px; border-radius:7px; white-space:nowrap;';
    const p = d.p, ex = d.extra || '';
    if (d.k === 'grad') return S + `background:linear-gradient(${p[0]}deg,${p[1]},${p[2]}); color:${p[3]};` + ex;
    if (d.k === 'solid') return S + `background:${p[0]}; color:${p[1]};` + ex;
    if (d.k === 'glass') return S + `background:${p[0]}; color:${p[2]}; border:1px solid ${p[1]}; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);`;
    if (d.k === 'outline') return S + `background:transparent; color:${p[3] || p[0]}; border:${p[1]} ${p[2]} ${p[0]};`;
    if (d.k === 'holo') return S + 'background:linear-gradient(100deg,#B8C6FF,#E9D5FF,#FFD6E8,#C6F6FF,#B8C6FF); background-size:220% auto; color:#2a2140; animation:tcHolo 4s linear infinite; box-shadow:0 2px 10px rgba(200,184,255,0.35);';
    if (d.k === 'rainbow') return S + 'background:linear-gradient(100deg,#FF5F6D,#FFC371,#F5C24B,#3FE0C5,#4BA8FF,#B16BFF,#FF6FA5); background-size:260% auto; color:#2a1830; animation:tcHolo 5s linear infinite; box-shadow:0 2px 10px rgba(255,140,180,0.3);';
    return S;
  };
  const D: D[] = [
    { n: 'Smoke', k: 'glass', p: ['rgba(24,24,30,0.6)', 'rgba(255,255,255,0.14)', '#d0d0d8'], price: 850, rar: 'Common' },
    { n: 'Minimalist', k: 'outline', p: ['#cfcfd6', '1px', 'solid'], price: 950, rar: 'Common' },
    { n: 'Gold Trim', k: 'outline', p: ['#F5C24B', '1.5px', 'solid'], price: 3500, rar: 'Uncommon' },
    { n: 'Clear Mind', k: 'glass', p: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.26)', '#ffffff'], price: 5000, rar: 'Uncommon' },
    { n: 'Good Vibes', k: 'solid', p: ['#A7E8D0', '#0d3a2c'], price: 8500, rar: 'Uncommon' },
    { n: 'Sunset Runner', k: 'grad', p: [100, '#FF9A4C', '#FF5F8F', '#3a1020'], price: 15000, rar: 'Rare' },
    { n: 'Task Slayer', k: 'solid', p: ['#FF4D4D', '#ffffff'], price: 15000, rar: 'Rare' },
    { n: 'Ocean Mind', k: 'grad', p: [100, '#34CEE9', '#4BA8FF', '#052a3a'], price: 25000, rar: 'Rare' },
    { n: 'Retrowave', k: 'grad', p: [100, '#FF3CAC', '#2B86C5', '#ffffff'], price: 27500, rar: 'Epic' },
    { n: 'Magma', k: 'grad', p: [100, '#FF5F6D', '#FFC371', '#3a0f14'], price: 30000, rar: 'Epic' },
    { n: 'Unstoppable', k: 'grad', p: [100, '#F5C24B', '#FF7A3C', '#3a2400'], price: 32500, rar: 'Epic' },
    { n: 'Aurora', k: 'grad', p: [100, '#3FE0C5', '#9B7BFF', '#0c2a2a'], price: 35000, rar: 'Epic' },
    { n: 'Cotton Candy', k: 'grad', p: [100, '#FFB3D1', '#9EC8FF', '#40243a'], price: 35000, rar: 'Epic' },
    { n: 'No Days Off', k: 'solid', p: ['#141418', '#ffffff'], extra: 'border:1px solid #34343c;', price: 35000, rar: 'Epic' },
    { n: 'Grindset', k: 'grad', p: [90, '#232526', '#414345', '#ffffff'], price: 37500, rar: 'Epic' },
    { n: 'Prestige', k: 'holo', p: [], price: 50000, rar: 'Legendary' },
    { n: 'Legendary', k: 'rainbow', p: [], price: 100000, rar: 'Legendary' },
    { n: 'CEO of Productivity', k: 'outline', p: ['#F5C24B', '1.5px', 'solid'], price: 200000, rar: 'Legendary' },
  ];
  return D.map((d) => ({
    id: 'em_' + d.n.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: d.n, priceN: normalizePrice(d.price), rarity: d.rar, kind: 'emblem',
    title: 'Emblem', embText: d.n, embStyle: mkStyle(d, 'sm'), embStyleLg: mkStyle(d, 'lg'),
    tint: '124,28,74', bgImg: asset('assets/subjects/global-politics.png'), bgPos: 'center 22%',
  }));
}

export const CATALOG: ShopItem[] = [...chips(), ...tags(), ...powers(), ...emblems()];

// ---- UI state (module-level; content is re-rendered HTML) ----
let fRar: string = 'All';
let selId: string | null = null;
let toastItem: ShopItem | null = null;

// name paint helpers (gradient names use .gname + background-image)
const nameCss = (it: ShopItem, size: number) => {
  const cls = it.nameGrad ? 'gname' : '';
  const color = it.nameGrad ? 'transparent' : (it.nameColor || '#fff');
  const img = it.nameGrad || 'none';
  return { cls, style: `font-size:${size}px; font-weight:900; color:${color}; background-image:${img};` };
};

const chipSwatch = (it: ShopItem, pad: string, fs: number, radius: number) =>
  `<span style="display:inline-flex; align-items:center; padding:${pad}; border-radius:${radius}px; font-size:${fs}px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; background:${it.bg}; background-size:${it.bgSize}; color:${it.color}; border:${it.border}; box-shadow:${it.shadow}; animation:${it.anim}; transform:${it.anim !== 'none' ? 'translateZ(0)' : 'none'};">CHIP</span>`;

const tagSwatch = (it: ShopItem, fs: number) => {
  const n = nameCss(it, fs);
  const sColor = it.nameColor || '#E6E6EA';
  return `<span style="display:inline-flex; align-items:center; gap:5px; padding:4px 11px 4px 9px; border-radius:999px; background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.3); box-shadow:inset 0 1px 0 rgba(255,255,255,0.18);"><span class="ms fill ${n.cls}" style="font-size:${fs + 2}px; color:${it.nameGrad ? 'transparent' : sColor}; background-image:${it.nameGrad || 'none'};">sell</span><span class="${n.cls}" style="font-size:${fs}px; font-weight:800; color:${it.nameGrad ? 'transparent' : sColor}; background-image:${it.nameGrad || 'none'};">Tag</span></span>`;
};

function itemCard(it: ShopItem, owned: boolean): string {
  const [rarBg, rarText] = rarMeta[it.rarity];
  const n = nameCss(it, 14);
  let middle = '';
  if (it.kind === 'chip' || it.kind === 'tag') {
    const swatch = it.kind === 'chip' ? chipSwatch(it, '3px 9px', 10, 5) : tagSwatch(it, 11);
    middle = `<div style="margin-top:10px; display:inline-flex; align-self:flex-start; align-items:center; gap:8px; padding:5px 11px 5px 6px; border-radius:10px; background:rgba(4,16,16,0.34); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); box-shadow:inset 0 0 0 1px rgba(255,255,255,0.08);">${swatch}<span class="${n.cls}" style="${n.style}">${esc(it.name)}</span></div>`;
  } else if (it.kind === 'power') {
    middle = `<div style="margin-top:8px; font-size:13.5px; font-weight:700; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.55);">${esc(it.desc || '')}</div>`;
  } else {
    middle = `<div style="margin-top:11px;"><span style="${it.embStyle}">${esc(it.embText || '')}</span></div>`;
  }
  const priceOrOwned = owned
    ? `<div style="margin-top:13px; display:inline-flex; align-self:flex-start; align-items:center; gap:6px; padding:8px 15px; border-radius:999px; background:rgba(6,26,24,0.62); backdrop-filter:blur(10px) saturate(160%); border:1.5px solid rgba(63,207,134,0.6); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.35); color:#fff; font-weight:800; font-size:14px;"><span class="ms fill" style="font-size:16px; color:#3FCF86;">check_circle</span>Owned</div>`
    : `<div style="margin-top:13px; display:inline-flex; align-self:flex-start; align-items:center; gap:6px; padding:8px 15px; border-radius:999px; background:#F5C24B; color:#3A2400; font-weight:800; font-size:14px; box-shadow:0 5px 16px rgba(0,0,0,0.22);"><span class="ms fill" style="font-size:16px;">paid</span>${it.priceN.toLocaleString()}</div>`;
  return `
    <div data-action="shop-open" data-id="${it.id}" style="position:relative; display:flex; min-height:118px; border-radius:18px; overflow:hidden; margin-bottom:13px; background-color:rgb(${it.tint}); box-shadow:inset 0 0 0 1.5px rgba(255,255,255,0.07); cursor:pointer;">
      <div style="position:absolute; top:12px; right:13px; z-index:11; display:inline-flex; align-items:center; padding:4px 10px; border-radius:6px; font-size:9.5px; font-weight:900; letter-spacing:0.7px; text-transform:uppercase; background:${rarBg}; color:${rarText}; box-shadow:0 2px 8px rgba(0,0,0,0.45);">${it.rarity}</div>
      <div style="position:relative; z-index:10; flex:1; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size:20px; font-weight:800; letter-spacing:-0.3px; color:#fff;">${esc(it.title)}</div>
        ${middle}
        ${priceOrOwned}
      </div>
      <div style="position:absolute; top:0; bottom:0; right:-4px; width:52%; max-width:168px;">
        <div style="position:relative; height:100%; width:100%;">
          <img src="${it.bgImg}" alt="" loading="lazy" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:${it.bgPos};">
          <div style="position:absolute; top:0; bottom:0; left:0; width:78%; z-index:1; background:linear-gradient(to right, rgb(${it.tint}) 0%, rgba(${it.tint}, 0) 100%);"></div>
        </div>
      </div>
    </div>`;
}

function buyModal(it: ShopItem, owned: boolean, balance: number): string {
  const isPow = it.kind === 'power', isTag = it.kind === 'tag', isEmb = it.kind === 'emblem';
  const afford = it.priceN <= balance;
  const mLabel = isPow ? 'POWER-UP' : isTag ? 'CUSTOMIZED TAG' : isEmb ? 'EMBLEM' : 'CUSTOMIZED CHIP';
  const mLabelColor = isPow ? '#7DD3FC' : isTag ? '#A78BFA' : isEmb ? '#EBC46A' : '#2DD4BF';
  const mBorder = isPow ? 'rgba(56,189,248,0.5)' : isTag ? 'rgba(139,92,246,0.5)' : isEmb ? 'rgba(245,194,75,0.5)' : 'rgba(45,212,191,0.5)';
  const mGlow = isPow ? '0 0 40px rgba(56,189,248,0.3)' : isTag ? '0 0 40px rgba(139,92,246,0.32)' : isEmb ? '0 0 40px rgba(245,194,75,0.28)' : '0 0 40px rgba(45,212,191,0.3)';
  const mBuyBg = owned ? 'rgba(255,255,255,0.09)' : afford ? (isPow ? 'linear-gradient(90deg,#38BDF8,#0E7490)' : isTag ? 'linear-gradient(90deg,#8B5CF6,#6D28D9)' : isEmb ? 'linear-gradient(90deg,#F5C24B,#E0972C)' : 'linear-gradient(90deg,#2DD4BF,#0E9488)') : 'rgba(255,255,255,0.07)';
  const mBuyColor = owned ? '#fff' : afford ? (isPow ? '#04222E' : isTag ? '#FFFFFF' : isEmb ? '#3A2400' : '#04231F') : '#7C7C86';
  const mBuyShadow = !owned && afford ? (isPow ? '0 10px 28px rgba(14,116,144,0.5)' : isTag ? '0 10px 28px rgba(109,40,217,0.5)' : isEmb ? '0 10px 28px rgba(224,151,44,0.5)' : '0 10px 28px rgba(14,148,136,0.5)') : 'none';
  const mBuyText = owned ? 'Owned' : afford ? it.priceN.toLocaleString() : 'Not enough coins';
  const buyIcon = !owned && afford ? `<span class="ms fill" style="font-size:19px;">paid</span>` : '';
  const n = nameCss(it, 27);
  let swatch = '';
  if (it.kind === 'chip') swatch = chipSwatch(it, '9px 22px', 19, 11);
  else if (isTag) swatch = tagSwatch(it, 18);
  else if (isEmb) swatch = `<span style="${it.embStyleLg}">${esc(it.embText || '')}</span>`;
  const desc = isPow ? `<div style="margin-top:14px; font-size:14.5px; font-weight:600; color:rgba(255,255,255,0.74); line-height:1.5;">${esc(it.longDesc || '')}</div>` : '';
  return `
    <div data-action="modal-close" style="position:absolute; inset:0; z-index:50; background:rgba(8,6,16,0.5); display:flex; align-items:center; justify-content:center; padding:26px; animation:ccFade 0.18s ease;">
      <div data-action="modal-noop" style="width:100%; max-width:320px; background:rgba(20,30,34,0.55); backdrop-filter:blur(28px) saturate(160%); -webkit-backdrop-filter:blur(28px) saturate(160%); border-radius:28px; border:1.5px solid ${mBorder}; box-shadow:${mGlow}, inset 0 1px 0 rgba(255,255,255,0.2); padding:22px; text-align:center; animation:ccPop 0.22s ease;">
        <div style="width:170px; height:118px; margin:0 auto; border-radius:22px; overflow:hidden; position:relative; box-shadow:0 12px 30px rgba(0,0,0,0.4);">
          <img src="${it.bgImg}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:${it.bgPos};">
        </div>
        <div style="margin-top:18px; font-size:12px; font-weight:900; letter-spacing:2px; color:${mLabelColor};">${mLabel}</div>
        <div class="${n.cls}" style="margin-top:5px; letter-spacing:-0.5px; ${n.style}">${esc(it.name)}</div>
        <div style="margin-top:16px; display:flex; justify-content:center;">${swatch}</div>
        ${desc}
        <div data-action="modal-buy" style="margin-top:20px; padding:16px; border-radius:16px; background:${mBuyBg}; color:${mBuyColor}; font-size:17px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:${mBuyShadow}; cursor:pointer;">${buyIcon}${mBuyText}</div>
      </div>
    </div>`;
}

function purchaseToast(it: ShopItem): string {
  let badge = '';
  if (it.kind === 'chip') badge = chipSwatch(it, '3px 9px', 10, 5);
  else if (it.kind === 'tag') badge = tagSwatch(it, 10.5);
  else if (it.kind === 'power') badge = `<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 11px 3px 8px; border-radius:999px; background:rgba(125,211,252,0.16); border:1px solid rgba(125,211,252,0.4);"><span class="ms fill" style="font-size:12px; color:${it.iconColor};">${it.icon}</span><span style="font-size:10.5px; font-weight:800; color:#BFE0F5;">${esc(it.name)}</span></span>`;
  else badge = `<span style="${it.embStyle}">${esc(it.embText || '')}</span>`;
  return `
    <div style="position:absolute; left:0; right:0; bottom:104px; z-index:55; display:flex; justify-content:center; pointer-events:none;">
      <div style="display:inline-flex; align-items:center; gap:8px; padding:10px 18px 10px 16px; border-radius:999px; background:rgba(20,20,24,0.9); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.14); font-size:14.5px; font-weight:800; animation:ccToast 2.2s ease forwards;"><span class="ms fill" style="font-size:18px; color:#3FCF86;">check_circle</span>Purchased${badge}</div>
    </div>`;
}

export function renderRewards(): string {
  const s = getState();
  const rarities = ['All', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const fChips = rarities.map((l) => {
    const active = l === fRar;
    const cm = l === 'All' ? ['#ffffff', '#111111'] : rarMeta[l as Rarity];
    return `<span data-action="rar" data-rar="${l}" style="flex:0 0 auto; padding:8px 15px; border-radius:999px; font-size:13px; font-weight:800; cursor:pointer; background:${active ? cm[0] : 'rgba(255,255,255,0.08)'}; color:${active ? cm[1] : 'rgba(255,255,255,0.72)'};">${l}</span>`;
  }).join('');

  let list = CATALOG;
  if (fRar !== 'All') list = list.filter((c) => c.rarity === fRar);
  const rows = list
    .map((it) => ({ it, owned: it.kind !== 'power' && !!s.owned[it.id] }))
    .sort((a, b) => Number(a.owned) - Number(b.owned));

  const sel = selId ? CATALOG.find((c) => c.id === selId) : null;
  const modal = sel ? buyModal(sel, sel.kind !== 'power' && !!s.owned[sel.id], s.balance) : '';
  const toast = toastItem ? purchaseToast(toastItem) : '';

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
      <div style="font-size:30px; font-weight:800; letter-spacing:-0.6px;">Shop</div>
      <div style="display:flex; align-items:center; gap:6px; padding:8px 13px; background:rgba(245,194,75,0.13); border:1.5px solid rgba(245,194,75,0.65); border-radius:999px;">
        <span class="ms fill" style="font-size:18px; color:#F5C24B;">paid</span>
        <span style="color:#F5C24B; font-weight:800; font-size:15px;">${s.balance.toLocaleString()}</span>
      </div>
    </div>
    <div style="height:14px;"></div>
    <div class="cc-scroll" style="display:flex; gap:8px; overflow-x:auto; margin:15px -20px 15px; padding:0 20px 2px;">${fChips}</div>
    ${rows.map((r) => itemCard(r.it, r.owned)).join('')}
    ${modal}
    ${toast}`;
}

// Returns true when the screen should re-render (store-driven renders happen via subscribe).
export function handleRewardsAction(action: string, el: HTMLElement, onToastEnd: () => void): boolean {
  if (action === 'rar') { fRar = el.dataset.rar || 'All'; return true; }
  if (action === 'shop-open') { selId = el.dataset.id || null; return true; }
  if (action === 'modal-close') { selId = null; return true; }
  if (action === 'modal-noop') return false;
  if (action === 'modal-buy') {
    const it = selId ? CATALOG.find((c) => c.id === selId) : null;
    if (!it) return false;
    const ok = purchase(it.id, it.priceN, it.kind === 'power');
    if (ok) {
      selId = null;
      toastItem = it;
      setTimeout(() => { toastItem = null; onToastEnd(); }, 2300);
    }
    return true;
  }
  return false;
}
