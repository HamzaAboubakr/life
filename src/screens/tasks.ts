// Tasks — list view transcribed from Tasks.dc.html (header, category filter chips,
// grouped task cards with checkbox/title/time/category chip/priority+overdue badges/
// background art/tag pill), wired to the real store. Create/edit sheet comes next.

import { getState, isDone } from '../store';
import type { CategoryKey, Priority, Task } from '../core';
import { occursOn } from '../core';
import { asset, esc, todayISO } from '../util';

const AC = '#34CEE9';

export const catStyle: Record<CategoryKey, { bg: string; img: string }> = {
  work: { bg: '92,164,235', img: asset('assets/shop/business.png') },
  health: { bg: '41,179,107', img: asset('assets/areas/biology.png') },
  finance: { bg: '165,110,80', img: asset('assets/areas/history.png') },
  personal: { bg: '251,109,134', img: asset('assets/areas/psychology.png') },
  learning: { bg: '110,94,253', img: asset('assets/areas/chemistry.png') },
};
export const catLabel: Record<CategoryKey, string> = {
  work: 'Work', health: 'Health', finance: 'Finance', personal: 'Personal', learning: 'Learning',
};
export const CATEGORY_HEX: Record<CategoryKey, string> = {
  work: '#5B8DEF', health: '#3FCF86', personal: '#FF6FB0', finance: '#F5C24B', learning: '#9B7BFF',
};
const pri: Record<'low' | 'med' | 'high', { icon: string; color: string }> = {
  low: { icon: 'spa', color: '#5BE0A0' },
  med: { icon: 'flag', color: '#F5A93B' },
  high: { icon: 'warning', color: '#FF6B6F' },
};
const priKey = (p: Priority): 'low' | 'med' | 'high' => (p === 'medium' ? 'med' : p);

const CAT_DEFS: [string, string, string][] = [
  ['all', 'All', '#9A9AA0'], ['work', 'Work', '#5B8DEF'], ['health', 'Health', '#3FCF86'],
  ['personal', 'Personal', '#FF6FB0'], ['finance', 'Finance', '#F5C24B'], ['learning', 'Learning', '#9B7BFF'],
];

let filter = 'all';
export const setTaskFilter = (c: string) => { filter = c; };
export const getTaskFilter = () => filter;

// ---- date helpers ----
function parseISO(d: string): Date { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd); }
function addDaysISO(iso: string, n: number): string {
  const d = parseISO(iso); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtMinutes(m: number): string {
  const h = Math.floor(m / 60), min = m % 60, ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ap}`;
}
export function cardTime(t: Task, occ: string): string {
  const d = parseISO(occ);
  const base = `${WD[d.getDay()]}, ${MO[d.getMonth()]} ${d.getDate()}`;
  if (t.time) {
    const start = fmtMinutes(t.time.startMinutes);
    return t.time.endMinutes != null ? `${base} · ${start} – ${fmtMinutes(t.time.endMinutes)}` : `${base} at ${start}`;
  }
  return `${base} · All day`;
}

export interface CardRow { task: Task; occ: string; group: 'overdue' | 'today' | 'tomorrow'; done: boolean }

function buildGroups(): CardRow[] {
  const s = getState();
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const rows: CardRow[] = [];
  for (const t of s.tasks) {
    if (filter !== 'all' && t.category !== filter) continue;
    let occ: string | null = null;
    let group: CardRow['group'] | null = null;
    if (t.recurrence) {
      if (occursOn(t.recurrence, t.date, today)) { occ = today; group = 'today'; }
      else if (occursOn(t.recurrence, t.date, tomorrow)) { occ = tomorrow; group = 'tomorrow'; }
    } else if (t.date < today && !isDone(t.id, t.date)) { occ = t.date; group = 'overdue'; }
    else if (t.date === today) { occ = today; group = 'today'; }
    else if (t.date === tomorrow) { occ = tomorrow; group = 'tomorrow'; }
    if (!occ || !group) continue;
    rows.push({ task: t, occ, group, done: isDone(t.id, occ) });
  }
  const order = { overdue: 0, today: 1, tomorrow: 2 };
  rows.sort((a, b) => order[a.group] - order[b.group] || Number(a.done) - Number(b.done));
  return rows;
}

export function taskCard(row: CardRow): string {
  const t = row.task;
  const cs = catStyle[t.category];
  const p = pri[priKey(t.priority)];
  const done = row.done;
  const opacity = done ? '0.45' : '1';
  const overdue = row.group === 'overdue';
  const chip = `<span style="padding:3px 9px; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; background:#EDEDF0; color:#0B1014; white-space:nowrap; max-width:104px; overflow:hidden; text-overflow:ellipsis;">${esc(catLabel[t.category])}</span>`;
  const badge = overdue
    ? `<span style="position:absolute; bottom:11px; right:12px; z-index:4; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; padding:4px 10px; border-radius:7px; background:#FF3B41; color:#fff; white-space:nowrap; box-shadow:0 3px 10px rgba(255,59,65,0.45);">Overdue</span>`
    : `<div style="position:absolute; bottom:11px; right:12px; z-index:4; width:30px; height:30px; border-radius:50%; background:rgba(16,18,24,0.62); backdrop-filter:blur(8px) saturate(140%); -webkit-backdrop-filter:blur(8px) saturate(140%); border:1px solid rgba(255,255,255,0.3); box-shadow:inset 0 1px 0.5px rgba(255,255,255,0.35); display:flex; align-items:center; justify-content:center;"><span class="ms fill" style="font-size:18px; color:${p.color}; transform:${priKey(t.priority) === 'med' ? 'translateX(1.5px)' : 'none'};">${p.icon}</span></div>`;
  const check = done ? `<span class="ms fill" style="font-size:18px; color:#06181f;">check</span>` : '';
  return `
    <div style="position:relative; margin-bottom:14px;">
      <div style="position:relative; display:flex; align-items:stretch; min-height:88px; border-radius:18px; overflow:hidden; background-color:rgb(${cs.bg}); opacity:${opacity}; box-shadow:inset 0 0 0 1.5px rgba(255,255,255,0.06);">
        <div style="position:absolute; top:0; bottom:0; right:-4px; width:48%; max-width:150px;">
          <div style="position:relative; height:100%; width:100%;">
            <img src="${cs.img}" alt="" loading="lazy" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
            <div style="position:absolute; top:0; bottom:0; left:0; width:78%; background:linear-gradient(to right, rgb(${cs.bg}) 0%, rgba(${cs.bg}, 0) 100%);"></div>
          </div>
        </div>
        <div style="position:absolute; top:11px; right:12px; z-index:4; display:flex; align-items:stretch; border-radius:6px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.28);">${chip}</div>
        ${badge}
        <div data-action="open" data-id="${t.id}" style="position:relative; z-index:2; flex:1; min-width:0; display:flex; align-items:center; gap:13px; padding:16px; cursor:pointer;">
          <div data-action="toggle" data-id="${t.id}" data-date="${row.occ}" style="flex:0 0 26px; height:26px; border-radius:8px; border:2px solid ${done ? '#fff' : 'rgba(255,255,255,0.7)'}; background:${done ? '#fff' : 'rgba(255,255,255,0.14)'}; display:flex; align-items:center; justify-content:center;">${check}</div>
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div style="height:21px;"></div>
            <div style="max-width:100%; padding-right:78px; font-size:17px; font-weight:800; letter-spacing:-0.2px; line-height:1.22; overflow-wrap:anywhere; word-break:break-word; color:#fff; text-decoration:${done ? 'line-through' : 'none'}; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden;">${esc(t.title)}</div>
            <div style="margin-top:4px; padding-right:${overdue ? '78px' : '48px'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12.5px; line-height:17px; font-weight:700; color:rgba(255,255,255,0.8);">${esc(cardTime(t, row.occ))}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// Category chip row — shared verbatim with Calendar (only the action name differs).
export function categoryChips(current: string, action: string): string {
  return CAT_DEFS.map(([k, l, c]) => {
    const on = current === k;
    const fill = k === 'all' ? '#FFFFFF' : c;
    const dot = on ? (k === 'all' ? '#0B0B0C' : 'rgba(0,0,0,0.5)') : c;
    const bg = on ? fill : '#161618';
    const color = on ? '#0B1014' : '#C2C2C8';
    const border = on ? 'transparent' : 'rgba(255,255,255,0.08)';
    return `<div data-action="${action}" data-cat="${k}" style="flex:0 0 auto; display:flex; align-items:center; gap:7px; padding:9px 15px; border-radius:999px; font-size:13.5px; font-weight:800; background:${bg}; color:${color}; border:1px solid ${border}; cursor:pointer;"><span style="width:8px; height:8px; border-radius:50%; background:${dot}; flex:0 0 auto;"></span>${l}</div>`;
  }).join('');
}

export function renderTasks(): string {
  const rows = buildGroups();
  const cats = categoryChips(filter, 'filter');

  const list = rows.length
    ? rows.map(taskCard).join('')
    : `<div style="padding:64px 20px; text-align:center;">
        <div style="width:72px; height:72px; border-radius:24px; background:#141416; border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          <span class="ms fill" style="font-size:36px; color:#34CEE9;">task_alt</span>
        </div>
        <div style="font-size:18px; font-weight:800;">All clear</div>
        <div style="margin-top:6px; font-size:14px; color:#76767E; font-weight:600;">Nothing in this filter.</div>
      </div>`;

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;">
      <div style="font-size:30px; font-weight:800; letter-spacing:-0.6px;">Tasks</div>
      <div data-action="add" style="width:42px; height:42px; border-radius:14px; background:${AC}; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 18px rgba(52,206,233,0.32); cursor:pointer;">
        <span class="ms fill" style="font-size:25px; color:#06343D;">add</span>
      </div>
    </div>
    <div class="cc-scroll" style="display:flex; gap:9px; overflow-x:auto; margin:0 -20px 16px; padding:8px 20px 10px;">${cats}</div>
    ${list}`;
}
