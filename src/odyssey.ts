// Odyssey — Tasks & Calendar.
// Markup/styles transcribed VERBATIM from the "Tasks & Calendar" Claude Design
// handoff (light-mode iOS). Do not restyle; only data is wired to the real store.

import type { CategoryKey, Priority, Task } from './core';
import { occursOn } from './core';
import { getState, isDone } from './store';
import { asset, esc, todayISO } from './util';

export const AC = '#007AFF';
export const AC_RGB = '0,122,255';
export const AC_GLOW = `rgba(${AC_RGB},0.4)`;
const COMPLETED_OPACITY = 0.5;

// design catFallback (name -> tile rgb + art)
export const CAT_STYLE: Record<CategoryKey, { bg: string; img: string; label: string }> = {
  work: { bg: '92,164,235', img: asset('assets/shop/business.png'), label: 'Work' },
  health: { bg: '41,179,107', img: asset('assets/areas/biology.png'), label: 'Health' },
  finance: { bg: '253,188,111', img: asset('assets/subjects/economics.png'), label: 'Finance' },
  personal: { bg: '251,109,134', img: asset('assets/areas/psychology.png'), label: 'Personal' },
  learning: { bg: '109,140,219', img: asset('assets/shop/philosophy.png'), label: 'Learning' },
};
// design catDefs
const CAT_DEFS: [string, string, string][] = [
  ['all', 'All', '#8E8E93'], ['work', 'Work', '#5B8DEF'], ['health', 'Health', '#3FCF86'],
  ['personal', 'Personal', '#FF6FB0'], ['finance', 'Finance', '#F5C24B'], ['learning', 'Learning', '#9B7BFF'],
];
export const CAT_COLOR: Record<CategoryKey, string> = {
  work: '#5B8DEF', health: '#3FCF86', personal: '#FF6FB0', finance: '#F5C24B', learning: '#9B7BFF',
};
// design pri
const PRI: Record<Priority, { icon: string; color: string }> = {
  low: { icon: 'spa', color: '#5BE0A0' },
  medium: { icon: 'flag', color: '#FFB340' },
  high: { icon: 'priority_high', color: '#FF6B6F' },
};

const hexRgb = (h: string) => { const n = h.replace('#', ''); return `${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)}`; };
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FDOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseISO = (k: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtMin = (m: number) => { const h = Math.floor(m / 60), mi = m % 60, ap = h < 12 ? 'AM' : 'PM'; return `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${ap}`; };
function cardTime(t: Task, occ: string): string {
  const d = parseISO(occ);
  const base = `${FDOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
  if (!t.time) return `${base} · All day`;
  const start = fmtMin(t.time.startMinutes);
  return t.time.endMinutes != null ? `${base} · ${start} – ${fmtMin(t.time.endMinutes)}` : `${base} at ${start}`;
}

// ---- UI state ----
let tab: 'tasks' | 'calendar' = 'tasks';
let cat = 'all';
let sel = todayISO();
let catTick = 0;
export const getTab = () => tab;
export const setTab = (t: 'tasks' | 'calendar') => { tab = t; catTick++; };
export const setCat = (c: string) => { cat = c; catTick++; };
export const setSel = (d: string) => { sel = d; };
export const getSel = () => sel;

const stagger = (i: number) => `${(catTick % 2) ? 'listInB' : 'listInA'} .44s cubic-bezier(.22,.9,.25,1) ${Math.min(i * 45, 340)}ms both`;

// ---- the task card (verbatim; shared by Tasks / Calendar / Search) ----
export function taskCard(t: Task, occ: string, i: number): string {
  const cs = CAT_STYLE[t.category];
  const done = isDone(t.id, occ);
  const p = PRI[t.priority];
  const overdue = occ < todayISO() && !done;
  const opacity = done ? String(COMPLETED_OPACITY) : '1';
  const prioShift = t.priority === 'medium' ? 'translateX(1.5px)' : 'none';
  return `
    <div style="position:relative; margin-bottom:13px; animation:${stagger(i)};">
      <div style="position:relative; display:flex; align-items:stretch; min-height:88px; border-radius:20px; overflow:hidden; background-color:rgb(${cs.bg}); opacity:${opacity}; box-shadow:0 10px 24px rgba(30,30,40,0.10), inset 0 0 0 1px rgba(255,255,255,0.12); transition:opacity .25s ease;">
        <div style="position:absolute; top:0; bottom:0; right:-4px; width:48%; max-width:150px;">
          <div style="position:relative; height:100%; width:100%;">
            <img src="${cs.img}" alt="" loading="lazy" decoding="async" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
            <div style="position:absolute; top:0; bottom:0; left:0; width:78%; background:linear-gradient(to right, rgb(${cs.bg}) 0%, rgba(${cs.bg}, 0) 100%);"></div>
          </div>
        </div>
        <div style="position:absolute; top:11px; right:12px; z-index:4; display:flex; align-items:stretch; border-radius:6px; overflow:hidden; box-shadow:0 2px 8px rgba(30,30,40,0.18);">
          <span style="padding:3px 9px; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; background:#FFFFFF; color:#1C1C1E; white-space:nowrap; max-width:104px; overflow:hidden; text-overflow:ellipsis;">${cs.label}</span>
        </div>
        ${overdue
      ? `<span style="position:absolute; bottom:11px; right:12px; z-index:4; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:#FF3B30; color:#fff; white-space:nowrap; box-shadow:0 3px 10px rgba(255,59,48,0.45);">Overdue</span>`
      : `<div style="position:absolute; bottom:11px; right:12px; z-index:4; width:30px; height:30px; border-radius:50%; background:rgba(16,18,24,0.5); backdrop-filter:blur(8px) saturate(140%); -webkit-backdrop-filter:blur(8px) saturate(140%); border:1px solid rgba(255,255,255,0.35); box-shadow:inset 0 1px 0.5px rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:18px; line-height:1; color:${p.color}; display:inline-block; transform:${prioShift};">${p.icon}</span></div>`}
        <div data-action="open" data-id="${t.id}" style="position:relative; z-index:2; flex:1; min-width:0; display:flex; align-items:center; gap:13px; padding:16px; cursor:pointer;">
          <div data-action="toggle" data-id="${t.id}" data-date="${occ}" style="flex:0 0 27px; height:27px; border-radius:50%; border:2px solid ${done ? '#FFFFFF' : 'rgba(255,255,255,0.85)'}; background:${done ? '#FFFFFF' : 'rgba(255,255,255,0.18)'}; display:flex; align-items:center; justify-content:center;">
            ${done ? `<span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1,'wght' 600; font-size:17px; line-height:1; color:#0B0B0C; animation:ckPop .28s ease;">check</span>` : ''}
          </div>
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div style="height:21px;"></div>
            <div style="max-width:100%; padding-right:78px; font-size:17px; font-weight:700; letter-spacing:-0.3px; line-height:1.22; overflow-wrap:anywhere; word-break:break-word; color:#fff; text-decoration:${done ? 'line-through' : 'none'}; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden;">${esc(t.title)}</div>
            <div style="margin-top:4px; padding-right:${overdue ? '78px' : '48px'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12.5px; line-height:17px; font-weight:600; color:rgba(255,255,255,0.82);">${esc(cardTime(t, occ))}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// category filter chips (verbatim)
function catChips(): string {
  return CAT_DEFS.map(([k, l, c]) => {
    const on = cat === k, cr = hexRgb(c);
    return `<div data-action="cat" data-cat="${k}" style="flex:0 0 auto; display:flex; align-items:center; gap:7px; padding:9px 15px; border-radius:999px; font-size:13.5px; font-weight:700; background:${on ? `rgba(${cr},0.16)` : '#FFFFFF'}; color:${on ? '#1C1C1E' : '#3C3C43'}; border:1px solid ${on ? 'transparent' : 'rgba(60,60,67,0.1)'}; transition:background .25s ease, color .25s ease, border-color .25s ease; cursor:pointer;"><span style="width:8px; height:8px; border-radius:50%; background:${c}; flex:0 0 auto;"></span>${l}</div>`;
  }).join('');
}

const catMatch = (t: Task) => cat === 'all' || t.category === cat;

// ---- Tasks screen (verbatim) ----
export function renderTasks(): string {
  const today = todayISO();
  const all = getState().tasks.filter(catMatch);
  const order: Record<string, number> = { overdue: 0, today: 1, tomorrow: 2, later: 3 };
  const tmr = keyOf(new Date(parseISO(today).getTime() + 86400000));
  const grpOf = (t: Task) => (t.date < today ? 'overdue' : t.date === today ? 'today' : t.date === tmr ? 'tomorrow' : 'later');
  const visible = all.slice().sort((a, b) => {
    const ga = order[grpOf(a)], gb = order[grpOf(b)];
    if (ga !== gb) return ga - gb;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
  const d = parseISO(today);
  const todayLabel = `${FDOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
  const cards = visible.map((t, i) => taskCard(t, t.date, i)).join('');
  const empty = visible.length === 0 ? `
    <div style="padding:70px 20px; text-align:center;">
      <div style="width:76px; height:76px; border-radius:26px; background:#FFFFFF; border:1px solid rgba(60,60,67,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; box-shadow:0 6px 18px rgba(30,30,40,0.06);">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:38px; line-height:1; color:${AC};">task_alt</span>
      </div>
      <div style="font-size:19px; font-weight:800;">All clear</div>
      <div style="margin-top:5px; font-size:14px; color:#8E8E93; font-weight:600;">Nothing in this filter.</div>
    </div>` : '';
  return `
    <div style="animation:scrFade .3s ease;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; padding:2px 20px 4px;">
        <div>
          <div style="font-size:32px; font-weight:800; letter-spacing:-0.9px; line-height:1.05;">Tasks</div>
          <div style="margin-top:3px; font-size:14px; font-weight:600; color:#8E8E93;">${todayLabel}</div>
        </div>
        <div data-action="search-open" style="width:38px; height:38px; border-radius:50%; background:#FFFFFF; border:1px solid rgba(60,60,67,0.09); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(30,30,40,0.05); cursor:pointer;">
          <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'wght' 500; font-size:21px; color:#636366;">search</span>
        </div>
      </div>
      <div class="cc-scroll" style="display:flex; gap:8px; overflow-x:auto; margin:12px 0 18px; padding:6px 20px 8px;">${catChips()}</div>
      <div style="padding:0 20px;">${cards}${empty}</div>
    </div>`;
}

// ---- Calendar screen (verbatim) ----
export function renderCalendar(): string {
  const today = todayISO();
  const selDt = parseISO(sel);
  const tasksOn = (k: string) => getState().tasks.filter((t) => occursOn(t.recurrence, t.date, k));

  const days: string[] = [];
  for (let i = -2; i <= 12; i++) {
    const dt = new Date(selDt); dt.setDate(selDt.getDate() + i);
    const k = keyOf(dt);
    const on = k === sel, isTd = k === today;
    const dots = tasksOn(k).slice(0, 3).map((t) =>
      `<span style="width:6px; height:6px; border-radius:50%; background:${CAT_COLOR[t.category]}; box-shadow:${on ? '0 0 0 1px #fff' : 'none'};"></span>`).join('');
    days.push(`
      <div data-action="cal-day" data-date="${k}" style="flex:0 0 auto; width:62px; display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 0 10px; border-radius:22px; background:${on ? AC : isTd ? `rgba(${AC_RGB},0.1)` : '#FFFFFF'}; border:${on ? '2px' : isTd ? '2px' : '1px'} solid ${on ? AC : isTd ? AC : 'rgba(60,60,67,0.1)'}; box-shadow:${on ? `0 8px 20px ${AC_GLOW}` : '0 2px 6px rgba(30,30,40,0.05)'}; transition:background .25s ease, border-color .25s ease, box-shadow .25s ease; cursor:pointer;">
        <span style="font-size:12.5px; font-weight:700; letter-spacing:0.5px; color:${on ? 'rgba(255,255,255,0.85)' : isTd ? AC : '#8E8E93'};">${DOW[dt.getDay()]}</span>
        <span style="font-size:24px; font-weight:800; letter-spacing:-0.6px; color:${on ? '#FFFFFF' : isTd ? AC : '#1C1C1E'};">${dt.getDate()}</span>
        <div style="display:flex; gap:3px; height:7px; align-items:center;">${dots}</div>
      </div>`);
  }

  const selTasks = tasksOn(sel).filter(catMatch);
  const isTd = sel === today;
  const selHeader = (isTd ? 'Today · ' : '') + `${FDOW[selDt.getDay()]}, ${MON[selDt.getMonth()]} ${selDt.getDate()}`;
  const n = selTasks.length;
  const countLabel = n === 0 ? 'No tasks' : `${n}${n === 1 ? ' task' : ' tasks'}`;
  const events = selTasks.map((t, i) => taskCard(t, sel, i)).join('');
  const empty = n === 0 ? `
    <div style="padding:52px 20px; text-align:center;">
      <div style="width:76px; height:76px; border-radius:26px; background:#FFFFFF; border:1px solid rgba(60,60,67,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; box-shadow:0 6px 18px rgba(30,30,40,0.06);">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:38px; line-height:1; color:${AC};">event_available</span>
      </div>
      <div style="font-size:19px; font-weight:800;">Nothing scheduled</div>
      <div style="margin-top:5px; font-size:14px; color:#8E8E93; font-weight:600;">No tasks on this day.</div>
    </div>` : '';

  return `
    <div style="animation:scrFade .3s ease;">
      <div style="display:flex; align-items:center; justify-content:space-between; padding:2px 20px 0;">
        <div style="font-size:32px; font-weight:800; letter-spacing:-0.9px;">Calendar</div>
        <div data-action="month-open" style="display:flex; align-items:center; gap:5px; padding:9px 15px; border-radius:999px; background:#FFFFFF; border:1px solid rgba(60,60,67,0.1); font-size:13.5px; font-weight:700; color:#1C1C1E; white-space:nowrap; cursor:pointer;">
          <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:16px; line-height:1; color:${AC};">event</span>${MON[selDt.getMonth()].slice(0, 3)} ${selDt.getFullYear()}
        </div>
      </div>
      <div class="cc-scroll" style="display:flex; gap:9px; overflow-x:auto; overflow-y:visible; padding:16px 20px 22px; margin:0 0 -14px;">${days.join('')}</div>
      <div style="height:1px; background:rgba(60,60,67,0.1); margin:8px 20px 0;"></div>
      <div style="display:flex; align-items:baseline; justify-content:space-between; padding:18px 20px 4px;">
        <div style="font-size:19px; font-weight:800; letter-spacing:-0.4px;">${selHeader}</div>
        <div style="font-size:13px; font-weight:700; color:${n === 0 ? '#8E8E93' : AC};">${countLabel}</div>
      </div>
      <div class="cc-scroll" style="display:flex; gap:8px; overflow-x:auto; margin:0 0 14px; padding:8px 20px 8px;">${catChips()}</div>
      <div style="padding:0 20px;">${events}${empty}</div>
    </div>`;
}

// ---- search overlay (verbatim) ----
let searchOpen = false;
let searchQuery = '';
export const isSearchOpen = () => searchOpen;
export const openSearch = () => { searchOpen = true; searchQuery = ''; };
export const closeSearch = () => { searchOpen = false; searchQuery = ''; };
export const setSearchQuery = (q: string) => { searchQuery = q; };

export function renderSearch(): string {
  if (!searchOpen) return '';
  const q = searchQuery.trim().toLowerCase();
  const results = q ? getState().tasks.filter((t) => t.title.toLowerCase().includes(q)) : [];
  const cards = results.map((t, i) => taskCard(t, t.date, i)).join('');
  const empty = q && results.length === 0 ? `
    <div style="padding:60px 20px; text-align:center;">
      <div style="width:76px; height:76px; border-radius:26px; background:#FFFFFF; border:1px solid rgba(60,60,67,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; box-shadow:0 6px 18px rgba(30,30,40,0.06);">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:36px; line-height:1; color:#C7C7CC;">search_off</span>
      </div>
      <div style="font-size:18px; font-weight:800;">No results</div>
      <div style="margin-top:5px; font-size:14px; color:#8E8E93; font-weight:600;">Try a different search.</div>
    </div>` : '';
  return `
    <div style="position:absolute; inset:0; z-index:86; background:#F2F2F7; display:flex; flex-direction:column; animation:ccSheetIn .3s cubic-bezier(.22,.9,.25,1);">
      <div style="height:56px; flex:0 0 auto;"></div>
      <div style="flex:0 0 auto; display:flex; align-items:center; gap:11px; padding:6px 18px 12px;">
        <div style="flex:1; display:flex; align-items:center; gap:8px; padding:11px 14px; border-radius:13px; background:rgba(120,120,128,0.14);">
          <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'wght' 500; font-size:20px; line-height:1; color:#8E8E93;">search</span>
          <input class="sheet-input" data-action="search-input" type="text" placeholder="Search tasks" value="${esc(searchQuery)}" style="flex:1; min-width:0; background:transparent; border:none; outline:none; color:#1C1C1E; font-family:-apple-system,system-ui,sans-serif; font-size:16px; font-weight:500;">
        </div>
        <div data-action="search-close" style="font-size:16px; font-weight:500; color:${AC}; cursor:pointer; white-space:nowrap;">Cancel</div>
      </div>
      <div class="cc-scroll" style="flex:1; overflow-y:auto; padding:8px 20px 30px;">${cards}${empty}</div>
    </div>`;
}

// ---- loading skeleton (verbatim) ----
const shim = 'background:linear-gradient(90deg,#E5E5EA 25%,#F1F1F4 50%,#E5E5EA 75%); background-size:600px 100%; animation:shimmer 1.3s linear infinite;';
export function renderSkeleton(): string {
  return `
    <div id="skel" style="position:absolute; top:59px; left:0; right:0; bottom:0; z-index:22; background:#F2F2F7; padding:8px 20px 0; overflow:hidden;">
      <div style="width:132px; height:34px; border-radius:10px; ${shim}"></div>
      <div style="width:98px; height:14px; border-radius:6px; margin-top:10px; ${shim}"></div>
      <div style="display:flex; gap:9px; margin:22px 0 24px;">
        <div style="width:70px; height:38px; border-radius:999px; ${shim}"></div>
        <div style="width:86px; height:38px; border-radius:999px; ${shim}"></div>
        <div style="width:86px; height:38px; border-radius:999px; ${shim}"></div>
      </div>
      ${Array.from({ length: 5 }, () => `<div style="height:88px; border-radius:20px; margin-bottom:13px; ${shim}"></div>`).join('')}
    </div>`;
}

// ---- shell: status bar + dynamic island + top blur (verbatim) ----
export const STATUS_BAR = `
  <div style="position:absolute; top:0; left:0; right:0; height:59px; z-index:38; display:flex; align-items:center; justify-content:space-between; padding:14px 34px 0; pointer-events:none;">
    <span style="font-size:16px; font-weight:600; letter-spacing:-0.2px; color:#1C1C1E;">9:41</span>
    <div style="display:flex; align-items:center; gap:7px;">
      <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1" fill="#1C1C1E"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#1C1C1E"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#1C1C1E"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#1C1C1E"/></svg>
      <svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 2.5c2.3 0 4.4.9 6 2.4l1.1-1.2A10.3 10.3 0 0 0 8.5.8 10.3 10.3 0 0 0 1.4 3.7L2.5 4.9A8.6 8.6 0 0 1 8.5 2.5z" fill="#1C1C1E"/><path d="M8.5 6c1.3 0 2.6.5 3.5 1.5l1.2-1.2a6.7 6.7 0 0 0-9.4 0L5 7.5C5.9 6.5 7.2 6 8.5 6z" fill="#1C1C1E"/><circle cx="8.5" cy="10.1" r="1.7" fill="#1C1C1E"/></svg>
      <svg width="28" height="13" viewBox="0 0 28 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="rgba(28,28,30,0.4)"/><rect x="2.2" y="2.2" width="19.6" height="8.6" rx="2.2" fill="#1C1C1E"/><rect x="25" y="4" width="1.8" height="5" rx="0.9" fill="rgba(28,28,30,0.4)"/></svg>
    </div>
  </div>
  <div style="position:absolute; top:11px; left:50%; transform:translateX(-50%); width:125px; height:37px; border-radius:20px; background:#000; z-index:39;"></div>
  <div id="topblur" style="position:absolute; top:0; left:0; right:0; height:70px; z-index:37; background:transparent; backdrop-filter:blur(22px) saturate(150%); -webkit-backdrop-filter:blur(22px) saturate(150%); -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent 100%); mask-image:linear-gradient(180deg,#000 55%,transparent 100%); opacity:0; transition:opacity .22s ease; pointer-events:none;"></div>`;

// ---- bottom nav (verbatim) ----
export function renderNav(): string {
  const tasksOn = tab === 'tasks', calOn = tab === 'calendar';
  return `
    <div style="position:absolute; left:0; right:0; bottom:0; z-index:40; height:94px; padding:12px 30px 30px; display:flex; align-items:flex-start; justify-content:space-between; background:rgba(248,248,250,0.78); backdrop-filter:blur(30px) saturate(180%); -webkit-backdrop-filter:blur(30px) saturate(180%); border-top:1px solid rgba(255,255,255,0.8); box-shadow:0 -1px 0 rgba(60,60,67,0.08), 0 -8px 28px rgba(30,30,40,0.06);">
      <div data-action="tab-tasks" style="flex:1; height:50px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer;">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' ${tasksOn ? 1 : 0},'wght' 500; font-size:25px; line-height:1; color:${tasksOn ? AC : '#8E8E93'}; transition:color .25s ease;">checklist</span>
        <span style="font-size:10.5px; font-weight:700; color:${tasksOn ? AC : '#8E8E93'}; transition:color .25s ease;">Tasks</span>
      </div>
      <div data-action="add" style="flex:0 0 auto; width:56px; height:56px; margin:-4px 22px 0; border-radius:20px; background:${AC}; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 20px ${AC_GLOW}, inset 0 1px 0 rgba(255,255,255,0.35);">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'wght' 500; font-size:30px; line-height:1; color:#fff;">add</span>
      </div>
      <div data-action="tab-calendar" style="flex:1; height:50px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer;">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' ${calOn ? 1 : 0},'wght' 500; font-size:25px; line-height:1; color:${calOn ? AC : '#8E8E93'}; transition:color .25s ease;">calendar_month</span>
        <span style="font-size:10.5px; font-weight:700; color:${calOn ? AC : '#8E8E93'}; transition:color .25s ease;">Calendar</span>
      </div>
    </div>
    <div style="position:absolute; left:50%; transform:translateX(-50%); bottom:8px; z-index:44; width:134px; height:5px; border-radius:3px; background:#1C1C1E; opacity:0.28;"></div>`;
}
