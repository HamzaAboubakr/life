// Home screen — markup transcribed verbatim from Home.dc.html (inline styles copied
// straight across), wired to real store data. Returns the inner scroll content.

import {
  ACHIEVEMENTS, tierBoxes, toIndex,
  type AchievementCategory, type Tier,
} from '../core';
import { rgb, stepInfo, tcCss, tierStops, TEXTGRAD, rankHex } from '../paint';
import { computeMetrics, getState } from '../store';
import { asset, esc } from '../util';

const CAT: Record<AchievementCategory, { color: string; img: string }> = {
  Streaks: { color: '#C0763C', img: asset('assets/areas/history.png') },
  Tasks: { color: '#2E96D8', img: asset('assets/areas/english.png') },
  Calendar: { color: '#3D74D6', img: asset('assets/shop/business.png') },
  XP: { color: '#7C46C0', img: asset('assets/areas/chemistry.png') },
  Ranks: { color: '#E0952C', img: asset('assets/shop/philosophy.png') },
  Coins: { color: '#2AA55F', img: asset('assets/areas/biology.png') },
  Cosmetics: { color: '#E15586', img: asset('assets/areas/psychology.png') },
  Special: { color: '#6E52C8', img: asset('assets/shop/design.png') },
};

export function renderHome(): string {
  const s = getState();
  const p = s.progression;
  const cur = stepInfo(p.rank, p.tier, 0);
  const next = stepInfo(p.rank, p.tier, 1);
  const level = toIndex(p.rank, p.tier) + 1;
  const pct = p.xpNeeded > 0 ? Math.max(0, Math.min(1, p.xpCurrent / p.xpNeeded)) : 0;
  const toGo = Math.max(0, p.xpNeeded - p.xpCurrent).toLocaleString();
  const glowBg = TEXTGRAD[p.rank] || rankHex(p.rank);
  const stops = tierStops(p.rank);

  const rankBoxes = tierBoxes(p.tier as Tier, pct).map((_f, i) => {
    const idx = i + 1;
    const fill = idx < p.tier ? 100 : idx === p.tier ? Math.round(pct * 100) : 0;
    const grad = `linear-gradient(90deg,${stops[i]},${stops[i + 1]})`;
    return `<div style="flex:1; border-radius:5px; background:rgba(255,255,255,0.08); overflow:hidden;"><div style="height:100%; border-radius:5px; background:${grad}; width:${fill}%;"></div></div>`;
  }).join('');

  // metrics snapshot
  const metrics = computeMetrics(s);
  // Earned float above locked; catalog order preserved within each group (like the mock).
  const rows = ACHIEVEMENTS.map((a) => {
    const raw = metrics[a.metric] ?? 0;
    return { a, earned: raw >= a.target, pct: Math.min(1, a.target ? raw / a.target : 0), cur: Math.min(raw, a.target) };
  }).sort((x, y) => Number(y.earned) - Number(x.earned));
  const earnedCount = rows.filter((r) => r.earned).length;

  const ends = (info: typeof cur, badge: string) => `
    <div style="flex:0 0 52px; min-width:0; display:flex; flex-direction:column; align-items:center; gap:3px;">
      <span style="font-size:8px; font-weight:900; letter-spacing:1px; ${tcCss(info.name)}">${badge}</span>
      <div style="width:42px; height:42px; background:center/contain no-repeat url('${info.icon}');"></div>
      <span style="font-size:10px; font-weight:800; letter-spacing:0.5px; white-space:nowrap; ${tcCss(info.name)}">${info.label}</span>
    </div>`;

  const achievementsHtml = rows.map(({ a, earned, pct: apct, cur: acur }) => {
    const meta = CAT[a.category];
    const rgbv = rgb(meta.color);
    const cardBg = earned ? `rgb(${rgbv})` : '#141416';
    const fade = earned ? `rgb(${rgbv})` : '#141416';
    const fade0 = earned ? `rgba(${rgbv},0)` : 'rgba(20,20,22,0)';
    const imgFilter = earned ? 'none' : 'grayscale(1) opacity(0.22)';
    const bar = earned ? '' : `
      <div style="margin-top:12px; max-width:215px;">
        <div style="height:7px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden;">
          <div style="height:100%; width:${Math.round(apct * 100)}%; border-radius:999px; background:rgba(${rgbv},0.7);"></div>
        </div>
        <div style="margin-top:6px; font-size:11.5px; font-weight:700; color:#76767E;">${acur.toLocaleString()} / ${a.target.toLocaleString()}</div>
      </div>`;
    const lock = earned ? '' : `
      <div style="position:absolute; top:13px; right:14px; z-index:3; width:26px; height:26px; border-radius:50%; background:rgba(10,10,11,0.72); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;"><span class="ms fill" style="font-size:15px; color:#8A8A90;">lock</span></div>`;
    return `
      <div style="position:relative; display:flex; min-height:104px; border-radius:18px; overflow:hidden; background:${cardBg}; border:1px solid rgba(255,255,255,0.06);">
        <div style="position:absolute; top:0; bottom:0; right:-4px; width:48%; max-width:155px; z-index:1;">
          <div style="position:relative; height:100%; width:100%;">
            <img src="${meta.img}" alt="" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top; filter:${imgFilter};">
            <div style="position:absolute; top:0; bottom:0; left:0; width:78%; background:linear-gradient(to right, ${fade} 0%, ${fade0} 100%);"></div>
          </div>
        </div>
        <div style="position:relative; z-index:2; flex:1; padding:16px 17px; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:18px; font-weight:800; letter-spacing:-0.3px; color:${earned ? '#fff' : '#8A8A90'};">${esc(a.name)}</div>
          <div style="margin-top:4px; font-size:13px; font-weight:600; line-height:1.35; color:${earned ? 'rgba(255,255,255,0.82)' : '#5C5C63'}; max-width:228px;">${esc(a.desc)}</div>
          ${bar}
        </div>
        ${lock}
      </div>`;
  }).join('');

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px;">
      <div style="display:flex; align-items:center; gap:11px; min-width:0;">
        <img src="${asset('assets/mascot.png')}" alt="" style="width:46px; height:auto; flex:0 0 auto; object-fit:contain; filter:drop-shadow(0 6px 16px rgba(75,210,228,0.4));">
      </div>
      <div style="display:flex; align-items:stretch; background:rgba(255,255,255,0.07); backdrop-filter:blur(20px) saturate(160%); -webkit-backdrop-filter:blur(20px) saturate(160%); border:1px solid rgba(255,255,255,0.14); border-radius:13px; overflow:hidden; flex:0 0 auto; box-shadow:inset 0 1px 0 rgba(255,255,255,0.18);">
        <div style="display:flex; align-items:center; gap:5px; padding:9px 12px;">
          <svg width="15" height="17" viewBox="0 0 24 26" fill="none" style="display:block;"><path d="M13.4 1.2c.4 3.7 3.3 5.4 5.2 8 1.6 2.2 2.4 4.4 2.4 6.9A9 9 0 0 1 3 16.1c0-2 .6-3.6 1.8-5.3.1 1.9 1.1 3.3 2.9 3.9-1-2.8.3-6 2.5-8C12.4 7.9 9.6 10 12 14.4c.3-2.4 1-3.3 1-5.6 0-2.6-.6-5.2.4-7.6Z" fill="#FF7A3C"/><path d="M12.7 13.5c.2 1.9 1.7 2.8 2.6 4.1.8 1.1 1 2.1 1 3.3a3.7 3.7 0 0 1-7.4-.2c0-1 .3-1.8.9-2.6.1.9.6 1.6 1.4 1.9-.5-1.4.1-3 1.2-3.9-.1 1.2.5 2 1.4 2.6-.6-1.5-.6-2.4-.5-3.6.1-1 .1-1.6 0-1.6Z" fill="#FFC24B"/></svg>
          <span style="color:#FF7A3C; font-weight:800; font-size:14.5px;">${s.streak.current}</span>
        </div>
        <div style="width:1px; background:rgba(255,255,255,0.09);"></div>
        <div style="display:flex; align-items:center; gap:5px; padding:9px 12px;">
          <span class="ms fill" style="font-size:20px; color:#F5C24B;">paid</span>
          <span style="color:#F5C24B; font-weight:800; font-size:14.5px;">${s.balance.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:38px; margin-bottom:6px; display:flex; flex-direction:column; align-items:center;">
      <div style="position:relative; width:152px; height:152px;">
        <div style="position:absolute; inset:18px; border-radius:50%; background:${glowBg}; filter:blur(28px); opacity:0.5;"></div>
        <div style="position:relative; width:100%; height:100%; background:center/contain no-repeat url('${cur.icon}');"></div>
      </div>
      <div style="text-align:center; margin-top:4px;">
        <div style="font-size:10px; font-weight:800; letter-spacing:2.5px; color:#86868C;">LEVEL</div>
        <div style="font-size:46px; font-weight:900; line-height:0.92; letter-spacing:-1.5px; ${tcCss(cur.name)}">${level}</div>
        <div style="margin-top:4px; font-size:13px; font-weight:800; letter-spacing:1.6px; display:inline-block; ${tcCss(cur.name)}">${cur.label}</div>
      </div>
      <span style="margin-top:13px; display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:900; letter-spacing:0.7px; text-transform:uppercase; padding:5px 13px; border-radius:7px; white-space:nowrap; background:linear-gradient(180deg,#F0C089,#B87333); color:#3d240c; box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 6px rgba(0,0,0,0.35);">Newcomer</span>
      <div style="align-self:stretch; margin-top:16px; display:flex; flex-direction:column; align-items:center; gap:9px;">
        <div style="width:100%; display:flex; align-items:center; justify-content:center; gap:11px;">
          ${ends(cur, 'CURRENT')}
          <div style="flex:1; display:flex; gap:6px; height:16px;">${rankBoxes}</div>
          ${ends(next, 'NEXT')}
        </div>
        <div style="margin-top:-22px; font-size:13px; font-weight:600; color:#9A9AA0; white-space:nowrap; display:flex; align-items:center; justify-content:center; gap:5px;">
          <span><span style="color:#fff; font-weight:800;">${toGo}</span> <span class="ms fill" style="font-size:15px; color:#9B7BFF; vertical-align:-3px;">bolt</span> to</span>
          <div style="width:20px; height:20px; background:center/contain no-repeat url('${next.icon}');"></div>
          <span style="font-weight:800; ${tcCss(next.name)}">${next.labelTC}</span>
        </div>
      </div>
    </div>

    <div style="display:flex; align-items:center; justify-content:space-between; margin:30px 2px 16px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="ms fill" style="font-size:23px; color:#fff;">emoji_events</span>
        <span style="font-size:21px; font-weight:800; letter-spacing:-0.3px;">Achievements</span>
      </div>
      <div style="font-size:13px; font-weight:800;"><span style="color:#fff;">${earnedCount}</span><span style="color:#9A9AA2;"> / ${ACHIEVEMENTS.length}</span></div>
    </div>
    <div style="display:flex; flex-direction:column; gap:12px;">${achievementsHtml}</div>
  `;
}
