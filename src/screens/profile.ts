// Profile / "Stats" — transcribed from Profile.dc.html: rank ladder (prev/cur/next),
// emblem row, and the four stat sections (Streaks / Experience / Activity / Power-Ups),
// wired to real store data.

import { XP_PER_TASK, cumulativeXpTo, tierBoxes, toIndex, type Tier } from '../core';
import { stepInfo, tcCss, tierStops } from '../paint';
import { getState } from '../store';
import { todayISO } from '../util';

const ico = (icon: string, sz: number) => `width:${sz}px; height:${sz}px; background:center/contain no-repeat url('${icon}');`;

function row(label: string, valueHtml: string, last = false): string {
  return `<div style="display:flex; align-items:center; gap:12px; padding:9px 0;${last ? '' : ' border-bottom:1px solid rgba(255,255,255,0.07);'}"><span style="flex:1; font-size:14.5px; font-weight:700; color:#e6e6ea;">${label}</span>${valueHtml}</div>`;
}
const val = (text: string, color: string, icon?: string, iconColor?: string) =>
  `<span style="display:flex; align-items:center; gap:6px; font-size:18px; font-weight:800; color:${color};">${text}${icon ? `<span class="ms fill" style="font-size:19px; color:${iconColor || color};">${icon}</span>` : ''}</span>`;

export function renderProfile(): string {
  const s = getState();
  const p = s.progression;
  const prev = stepInfo(p.rank, p.tier, -1);
  const cur = stepInfo(p.rank, p.tier, 0);
  const next = stepInfo(p.rank, p.tier, 1);
  const pct = p.xpNeeded > 0 ? Math.max(0, Math.min(1, p.xpCurrent / p.xpNeeded)) : 0;
  const stops = tierStops(p.rank);
  const boxes = tierBoxes(p.tier as Tier, pct).map((_f, i) => {
    const idx = i + 1;
    const fill = idx < p.tier ? 100 : idx === p.tier ? Math.round(pct * 100) : 0;
    return `<div style="flex:1; height:11px; border-radius:6px; background:rgba(255,255,255,0.08); overflow:hidden;"><div style="height:100%; border-radius:6px; background:linear-gradient(90deg,${stops[i]},${stops[i + 1]}); width:${fill}%;"></div></div>`;
  }).join('');

  // ---- real stats ----
  const today = todayISO();
  const wa = new Date(); wa.setDate(wa.getDate() - 6);
  const weekAgo = `${wa.getFullYear()}-${String(wa.getMonth() + 1).padStart(2, '0')}-${String(wa.getDate()).padStart(2, '0')}`;
  const doneKeys = Object.keys(s.completed);
  const weekTasks = doneKeys.filter((k) => { const d = k.split('|')[1]; return d >= weekAgo && d <= today; }).length;
  const weekXp = weekTasks * XP_PER_TASK;
  const totalXp = cumulativeXpTo(toIndex(p.rank, p.tier)) + p.xpCurrent;
  const coinsEarned = s.balance + s.spentTotal;
  const fmt = (n: number) => n.toLocaleString();

  const emblemChip = `<span style="display:inline-flex; align-items:center; font-size:11px; font-weight:900; letter-spacing:0.7px; text-transform:uppercase; padding:5px 13px; border-radius:7px; white-space:nowrap; background:linear-gradient(180deg,#F0C089,#B87333); color:#3d240c; box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 6px rgba(0,0,0,0.35);">Newcomer</span>`;
  const pstar = `<span class="ms fill" style="font-size:20px; background-image:linear-gradient(100deg,#B8C6FF,#E9D5FF,#FFD6E8,#C6F6FF); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;">star</span>`;

  return `
    <div style="font-size:30px; font-weight:800; letter-spacing:-0.6px; margin-bottom:4px;">Stats</div>

    <div style="margin-top:20px;">
      <div style="display:flex; align-items:flex-end; justify-content:space-between; padding:0 6px;">
        <div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:4px; opacity:0.5;"><div style="${ico(prev.icon, 58)}"></div><span style="font-size:11px; font-weight:800; letter-spacing:0.5px; color:#9AA3B0;">${prev.label}</span></div>
        <div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:4px;"><div style="${ico(cur.icon, 108)}"></div><span style="font-size:14px; font-weight:900; letter-spacing:0.5px; display:inline-block; ${tcCss(cur.name)}">${cur.label}</span></div>
        <div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:3px;"><span style="font-size:10px; font-weight:900; letter-spacing:1px; color:${next.color};">NEXT</span><div style="${ico(next.icon, 58)}"></div><span style="font-size:11px; font-weight:800; letter-spacing:0.5px; ${tcCss(next.name)}">${next.label}</span></div>
      </div>
      <div style="display:flex; gap:5px; margin-top:18px;">${boxes}</div>
      <div style="text-align:center; margin-top:13px; font-size:15px; font-weight:600; color:#9A9AA0; white-space:nowrap; display:flex; align-items:center; justify-content:center; gap:6px;"><span><span style="color:#fff; font-weight:800;">${fmt(p.xpCurrent)}</span> / ${fmt(p.xpNeeded)}</span><span class="ms fill" style="font-size:18px; color:#9B7BFF;">bolt</span><span>to</span><div style="${ico(next.icon, 22)}"></div><span style="font-weight:800; ${tcCss(next.name)}">${next.labelTC}</span></div>
    </div>

    <div style="margin-top:22px; display:flex; align-items:center; gap:12px; padding:13px 15px; border-radius:16px; background:rgba(255,255,255,0.045); border:1px solid rgba(255,255,255,0.08);">
      <span class="ms fill" style="font-size:20px; color:#F5C24B;">sell</span>
      <span style="font-size:10.5px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#76767E;">Emblem</span>
      <div style="flex:1; display:flex; justify-content:center;">${emblemChip}</div>
      <span class="ms" style="font-size:22px; color:#9A9AA2;">chevron_right</span>
    </div>
    <div style="height:1px; background:rgba(255,255,255,0.08); margin:22px 0;"></div>

    <div style="border-left:3px solid #FF7A3C; padding:2px 0 2px 16px; margin-bottom:14px;">
      <div style="font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#FF9763; margin-bottom:2px;">Streaks</div>
      ${row('Day Streak', val(String(s.streak.current), '#FF7A3C', 'local_fire_department', '#FF7A3C'))}
      ${row('Longest Streak', val(String(s.streak.longest), '#F5C24B', 'emoji_events', '#F5C24B'), true)}
    </div>
    <div style="border-left:3px solid #3FCF86; padding:2px 0 2px 16px; margin-bottom:14px;">
      <div style="font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#7DE2AE; margin-bottom:2px;">Experience</div>
      ${row('This Week', val(`+${fmt(weekXp)} XP`, '#3FCF86'))}
      ${row('Total XP', val(`${fmt(totalXp)} XP`, '#fff'))}
      ${row('Prestige', `<span style="display:flex; align-items:center; gap:6px; font-size:18px; font-weight:800; color:#fff;">${p.prestigeStars}${pstar}</span>`, true)}
    </div>
    <div style="border-left:3px solid #34CEE9; padding:2px 0 2px 16px;">
      <div style="font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#6FDDF0; margin-bottom:2px;">Activity</div>
      ${row('Tasks Done', val(fmt(doneKeys.length), '#34CEE9'))}
      ${row('Coins Earned', val(fmt(coinsEarned), '#F5C24B', 'paid', '#F5C24B'))}
      ${row('Coins Spent', val(fmt(s.spentTotal), '#F5C24B', 'paid', '#F5C24B'))}
      ${row('Items Bought', val(fmt(s.purchases), '#34CEE9', 'shopping_bag', '#34CEE9'), true)}
    </div>
    <div style="border-left:3px solid #9B7BFF; padding:2px 0 2px 16px; margin-top:14px;">
      <div style="font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#B9A6FF; margin-bottom:2px;">Power-Ups</div>
      ${row('XP Boost', `<span style="font-size:14.5px; font-weight:800; color:#76767E;">None active</span>`)}
      ${row('Streak Freezers', val(String(s.streak.freezesAvailable), '#7DD3FC', 'ac_unit', '#7DD3FC'))}
      ${row('Streak Repairs', val('0', '#FF7A3C', 'build', '#FF7A3C'), true)}
    </div>
  `;
}
