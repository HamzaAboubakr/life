// Odyssey — Tasks & Calendar.
// Markup/styles transcribed VERBATIM from the "Tasks & Calendar" Claude Design
// handoff (light-mode iOS). Do not restyle; only data is wired to the real store.

import type { Priority, Task } from './core';
import { occursOn } from './core';
import { getState, isDone } from './store';
import { asset, esc, todayISO } from './util';

export const AC = '#007AFF';
export const AC_RGB = '0,122,255';
export const AC_GLOW = `rgba(${AC_RGB},0.4)`;
const COMPLETED_OPACITY = 0.5;

// tag palette (shared with the sheet; the tag creator appends to this)
export const TAGS: { name: string; hex: string }[] = [
  { name: 'Appt', hex: '#34CEE9' }, { name: 'Study', hex: '#3FCF86' }, { name: 'Report', hex: '#9B7BFF' },
  { name: 'Bills', hex: '#F5C24B' }, { name: 'Family', hex: '#E95AA8' }, { name: 'Life', hex: '#8CD647' },
  { name: 'Workout', hex: '#FF6B5C' }, { name: 'Meeting', hex: '#5B8DEF' },
];
export const tagHexOf = (name: string) => TAGS.find((t) => t.name === name)?.hex ?? '#8E8E93';

// category cards come from the store (user can add/edit/delete them)
export interface CardStyle { bg: string; img: string; label: string }
export function cardFor(name: string): CardStyle {
  const cards = getState().cards;
  const c = cards.find((x) => x.name === name);
  // unknown category (e.g. its card was deleted): show it neutrally, never as another card
  return c ? { bg: c.rgb, img: asset(c.img), label: c.name } : { bg: '142,142,147', img: '', label: name };
}
export const cardColor = (name: string) => `rgb(${cardFor(name).bg})`;

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
let listMode: 'stagger' | 'swap' = 'stagger';
export const getTab = () => tab;
export const setTab = (t: 'tasks' | 'calendar') => { tab = t; catTick++; listMode = 'stagger'; clearLingering(); };
export const setCat = (c: string) => { cat = c; catTick++; listMode = 'swap'; };
export const setSel = (d: string) => { sel = d; listMode = 'swap'; };
export const getSel = () => sel;

const stagger = (i: number) =>
  listMode === 'swap' ? 'none'
    : `${(catTick % 2) ? 'listInB' : 'listInA'} .44s cubic-bezier(.22,.9,.25,1) ${Math.min(i * 45, 340)}ms both`;
// wraps the list when swapping filters/days so the whole set moves as one
const listWrap = () => (listMode === 'swap' ? 'animation:listSwap .24s cubic-bezier(.22,.9,.25,1);' : '');

// ---- the task card (verbatim; shared by Tasks / Calendar / Search) ----
export function taskCard(t: Task, occ: string, i: number): string {
  const cs = cardFor(t.category);
  const done = isDone(t.id, occ);
  const p = PRI[t.priority];
  const overdue = occ < todayISO() && !done;
  const opacity = done ? String(COMPLETED_OPACITY) : '1';
  const prioShift = t.priority === 'medium' ? 'translateX(1.5px)' : 'none';
  const tag = t.tagIds?.[0];
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
          <div data-action="toggle" data-id="${t.id}" data-date="${occ}" style="flex:0 0 27px; height:27px; border-radius:50%; border:2px solid ${done ? '#FFFFFF' : 'rgba(255,255,255,0.85)'}; background:${done ? '#FFFFFF' : 'rgba(255,255,255,0.18)'}; display:flex; align-items:center; justify-content:center; transition:background .22s ease, border-color .22s ease;">
            ${done ? `<span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1,'wght' 600; font-size:17px; line-height:1; color:#0B0B0C; animation:ckPop .28s ease;">check</span>` : ''}
          </div>
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div style="height:21px;"></div>
            <div style="max-width:100%; padding-right:78px; font-size:17px; font-weight:700; letter-spacing:-0.3px; line-height:1.22; overflow-wrap:anywhere; word-break:break-word; color:#fff; text-decoration:${done ? 'line-through' : 'none'}; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden;">${esc(t.title)}</div>
            <div style="margin-top:4px; padding-right:${overdue ? '78px' : '48px'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12.5px; line-height:17px; font-weight:600; color:rgba(255,255,255,0.82);">${esc(cardTime(t, occ))}</div>
          </div>
        </div>
      </div>
      ${tag ? `<div style="position:absolute; top:-7px; left:-5px; z-index:5; opacity:${opacity}; display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px; background:rgba(255,255,255,0.32); backdrop-filter:blur(16px) saturate(180%); -webkit-backdrop-filter:blur(16px) saturate(180%); border:1px solid rgba(255,255,255,0.6); box-shadow:0 4px 12px rgba(30,30,40,0.2); font-size:11.5px; font-weight:800; color:#0B0B0C;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:13px; line-height:1; color:${tagHexOf(tag)};">sell</span>${esc(tag)}</div>` : ''}
    </div>`;
}

// category filter chips (verbatim markup, driven by the store's cards)
function catChips(): string {
  const defs: [string, string, string][] = [['all', 'All', '#8E8E93'],
    ...getState().cards.map((c) => [c.name, c.name, `rgb(${c.rgb})`] as [string, string, string])];
  return defs.map(([k, l, c]) => {
    const on = cat === k;
    const cr = c.startsWith('rgb(') ? c.slice(4, -1) : hexRgb(c);
    return `<div data-action="cat" data-cat="${esc(k)}" style="flex:0 0 auto; display:flex; align-items:center; gap:7px; padding:9px 15px; border-radius:999px; font-size:13.5px; font-weight:700; background:${on ? `rgba(${cr},0.16)` : '#FFFFFF'}; color:${on ? '#1C1C1E' : '#3C3C43'}; border:1px solid ${on ? 'transparent' : 'rgba(60,60,67,0.1)'}; transition:background .25s ease, color .25s ease, border-color .25s ease; cursor:pointer;"><span style="width:8px; height:8px; border-radius:50%; background:${c}; flex:0 0 auto;"></span>${esc(l)}</div>`;
  }).join('') + donePill();
}

// Done pill — same shape as the category chips, with a check instead of a dot
function donePill(): string {
  const on = cat === DONE_FILTER;
  const green = '#34C759';
  return `<div data-action="cat" data-cat="${DONE_FILTER}" style="flex:0 0 auto; display:flex; align-items:center; gap:6px; padding:9px 15px; border-radius:999px; font-size:13.5px; font-weight:700; background:${on ? 'rgba(52,199,89,0.16)' : '#FFFFFF'}; color:${on ? '#1C1C1E' : '#3C3C43'}; border:1px solid ${on ? 'transparent' : 'rgba(60,60,67,0.1)'}; transition:background .25s ease, color .25s ease, border-color .25s ease; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:15px; line-height:1; color:${green};">check_circle</span>Done</div>`;
}

export const DONE_FILTER = '__done';
// A card checked on this page stays put (struck through) until you navigate away.
const lingering = new Set<string>();
export const noteCompleted = (id: string) => lingering.add(id);
export const clearLingering = () => lingering.clear();
const catMatch = (t: Task) => cat === 'all' || t.category === cat;
// completed tasks leave the main list and live behind the Done pill
const showsDone = () => cat === DONE_FILTER;
const passes = (t: Task, occ: string) => {
  const done = isDone(t.id, occ), held = lingering.has(t.id);
  return showsDone() ? (done && !held) : ((!done || held) && catMatch(t));
};

// ---- Tasks screen (verbatim) ----
export function renderTasks(): string {
  const today = todayISO();
  const all = getState().tasks.filter((t) => passes(t, t.date));
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
      <div style="font-size:19px; font-weight:800;">${showsDone() ? 'Nothing done yet' : 'All clear'}</div>
      <div style="margin-top:5px; font-size:14px; color:#8E8E93; font-weight:600;">${showsDone() ? 'Completed tasks show up here.' : 'Nothing in this filter.'}</div>
    </div>` : '';
  return `
    <div style="animation:scrFade .3s ease;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; padding:2px 20px 4px;">
        <div>
          <div style="font-size:32px; font-weight:800; letter-spacing:-0.9px; line-height:1.05;">Tasks</div>
          <div style="margin-top:3px; font-size:14px; font-weight:600; color:#8E8E93;">${todayLabel}</div>
        </div>
        <div data-action="search-open" style="width:46px; height:46px; margin:-4px -4px 0 0; border-radius:50%; background:#FFFFFF; border:1px solid rgba(60,60,67,0.09); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(30,30,40,0.05); cursor:pointer;">
          <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'wght' 500; font-size:24px; color:#636366;">search</span>
        </div>
      </div>
      <div class="cc-scroll" style="display:flex; gap:8px; overflow-x:auto; margin:12px 0 18px; padding:6px 20px 8px;">${catChips()}</div>
      <div style="padding:0 20px; ${listWrap()}">${cards}${empty}</div>
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
      `<span style="width:6px; height:6px; border-radius:50%; background:${cardColor(t.category)}; box-shadow:${on ? '0 0 0 1px #fff' : 'none'};"></span>`).join('');
    days.push(`
      <div data-action="cal-day" data-date="${k}" style="flex:0 0 auto; width:62px; display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 0 10px; border-radius:22px; background:${on ? AC : isTd ? `rgba(${AC_RGB},0.1)` : '#FFFFFF'}; border:${on ? '2px' : isTd ? '2px' : '1px'} solid ${on ? AC : isTd ? AC : 'rgba(60,60,67,0.1)'}; box-shadow:${on ? `0 8px 20px ${AC_GLOW}` : '0 2px 6px rgba(30,30,40,0.05)'}; transition:background .25s ease, border-color .25s ease, box-shadow .25s ease; cursor:pointer;">
        <span style="font-size:12.5px; font-weight:700; letter-spacing:0.5px; color:${on ? 'rgba(255,255,255,0.85)' : isTd ? AC : '#8E8E93'};">${DOW[dt.getDay()]}</span>
        <span style="font-size:24px; font-weight:800; letter-spacing:-0.6px; color:${on ? '#FFFFFF' : isTd ? AC : '#1C1C1E'};">${dt.getDate()}</span>
        <div style="display:flex; gap:3px; height:7px; align-items:center;">${dots}</div>
      </div>`);
  }

  const selTasks = tasksOn(sel).filter((t) => passes(t, sel));
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
      <div style="padding:0 20px; ${listWrap()}">${events}${empty}</div>
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
      <div style="height:calc(env(safe-area-inset-top, 0px) + 12px); flex:0 0 auto;"></div>
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
// Only the scroll-blur remains; the real device draws the status bar / Dynamic
// Island / home indicator, so the design's simulated ones are omitted.
export const STATUS_BAR = `
  <div id="topblur" style="position:absolute; top:0; left:0; right:0; height:calc(env(safe-area-inset-top, 0px) + 44px); z-index:37; background:transparent; backdrop-filter:blur(22px) saturate(150%); -webkit-backdrop-filter:blur(22px) saturate(150%); -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent 100%); mask-image:linear-gradient(180deg,#000 55%,transparent 100%); opacity:1; pointer-events:none;"></div>`;

// ---- bottom nav (verbatim) ----
export function renderNav(): string {
  const tasksOn = tab === 'tasks', calOn = tab === 'calendar';
  return `
    <div style="position:absolute; left:0; right:0; bottom:0; z-index:40; padding:12px 30px max(calc(env(safe-area-inset-bottom, 0px) - 8px), 8px); display:flex; align-items:flex-start; justify-content:space-between; background:rgba(248,248,250,0.78); backdrop-filter:blur(30px) saturate(180%); -webkit-backdrop-filter:blur(30px) saturate(180%); border-top:1px solid rgba(255,255,255,0.8); box-shadow:0 -1px 0 rgba(60,60,67,0.08), 0 -8px 28px rgba(30,30,40,0.06);">
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
`;
}
