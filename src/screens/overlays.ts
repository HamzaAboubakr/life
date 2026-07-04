// Celebration overlays: achievement-unlock toast (top, auto-dismiss) and the
// rank-up center overlay (adapted from Home.dc.html CelebrateOverlay + Rank Up).

import type { AchievementCategory, RankName, Tier } from '../core';
import { rankHex, rankIcon, tcCss } from '../paint';
import { esc, roman } from '../util';

const CAT_COLOR: Record<AchievementCategory, string> = {
  Streaks: '#C0763C', Tasks: '#2E96D8', Calendar: '#3D74D6', XP: '#7C46C0',
  Ranks: '#E0952C', Coins: '#2AA55F', Cosmetics: '#E15586', Special: '#6E52C8',
};

export function renderAchToast(name: string, category: AchievementCategory): string {
  const c = CAT_COLOR[category] || '#2E96D8';
  return `
    <div style="position:absolute; left:20px; right:20px; top:60px; z-index:80; display:flex; justify-content:center; pointer-events:none;">
      <div style="display:inline-flex; align-items:center; gap:12px; padding:12px 18px 12px 12px; border-radius:18px; background:rgba(20,20,24,0.92); backdrop-filter:blur(20px) saturate(160%); -webkit-backdrop-filter:blur(20px) saturate(160%); border:1px solid ${c}66; box-shadow:0 16px 44px rgba(0,0,0,0.55); animation:toastIn 0.42s cubic-bezier(.2,.9,.3,1.15);">
        <div style="flex:0 0 auto; width:42px; height:42px; border-radius:13px; background:${c}22; border:1px solid ${c}55; display:flex; align-items:center; justify-content:center;"><span class="ms fill" style="font-size:23px; color:${c};">emoji_events</span></div>
        <div>
          <div style="font-size:10px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:${c};">Achievement Unlocked</div>
          <div style="font-size:16px; font-weight:800; color:#fff; margin-top:1px;">${esc(name)}</div>
        </div>
      </div>
    </div>`;
}

export function renderRankUp(rank: RankName, tier: Tier): string {
  return `
    <div data-action="ov-dismiss" style="position:absolute; inset:0; z-index:85; background:rgba(6,6,10,0.86); backdrop-filter:blur(11px); -webkit-backdrop-filter:blur(11px); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:34px;">
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; animation:ccPop 0.55s cubic-bezier(.2,.9,.3,1.25);">
        <div style="position:absolute; top:-34px; width:290px; height:290px; border-radius:50%; background:radial-gradient(circle, ${rankHex(rank)}59, ${rankHex(rank)}00 64%); animation:ccGlow 2.4s ease-in-out infinite;"></div>
        <div style="position:relative; width:152px; height:152px; background:center/contain no-repeat url('${rankIcon(rank)}');"></div>
        <div style="position:relative; margin-top:22px; font-size:12px; font-weight:900; letter-spacing:2.5px; color:#9A9AA0;">RANK UP</div>
        <div style="position:relative; margin-top:6px; font-size:36px; font-weight:900; letter-spacing:-0.6px; ${tcCss(rank)}">${rank} ${roman[tier - 1]}</div>
        <div data-action="ov-dismiss" style="position:relative; margin-top:28px; padding:15px 44px; border-radius:16px; background:#fff; color:#0B0B0C; font-size:16px; font-weight:900; cursor:pointer;">Continue</div>
      </div>
    </div>`;
}
