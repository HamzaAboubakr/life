// Calendar — transcribed from Calendar.dc.html: month button, day strip (-2..+12
// around selection), selected-day header, category chips, the SAME task cards as
// Tasks (shared), empty state, and the month picker sheet with dot grid.
// Reads the same store as Tasks — one task list, filtered by date.

import { occursOn } from '../core';
import { getState, isDone } from '../store';
import { todayISO } from '../util';
import { CATEGORY_HEX, categoryChips, taskCard, type CardRow } from './tasks';

const AC = '#34CEE9';
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FDOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---- module UI state ----
let sel = todayISO();
let cat = 'all';
let monthOpen = false;
let viewYM = sel.slice(0, 7);

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (k: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));

function tasksOn(dateISO: string) {
  return getState().tasks.filter((t) => occursOn(t.recurrence, t.date, dateISO));
}

export function renderCalendar(): string {
  const today = todayISO();
  const selDt = parse(sel);

  // ---- day strip ----
  const days: string[] = [];
  for (let i = -2; i <= 12; i++) {
    const dt = new Date(selDt); dt.setDate(selDt.getDate() + i);
    const k = key(dt);
    const on = k === sel, isTd = k === today;
    const dots = tasksOn(k).slice(0, 3).map((t) =>
      `<span style="width:6px; height:6px; border-radius:50%; background:${CATEGORY_HEX[t.category]}; box-shadow:${on ? '0 0 0 1px #fff' : 'none'};"></span>`,
    ).join('');
    days.push(`
      <div data-action="cal-day" data-date="${k}" style="flex:0 0 auto; width:64px; display:flex; flex-direction:column; align-items:center; gap:6px; padding:13px 0 11px; border-radius:21px; background:${on ? AC : isTd ? 'rgba(52,206,233,0.10)' : 'rgba(255,255,255,0.045)'}; border:${on ? '2.5px' : isTd ? '2px' : '1px'} solid ${on ? '#fff' : isTd ? 'rgba(52,206,233,0.85)' : 'rgba(255,255,255,0.08)'}; box-shadow:${on ? '0 8px 22px rgba(52,206,233,0.32), inset 0 1px 0 rgba(255,255,255,0.4)' : 'none'}; cursor:pointer;">
        <span style="font-size:13px; font-weight:800; letter-spacing:0.5px; color:${on ? 'rgba(6,52,61,0.7)' : isTd ? AC : '#76767E'};">${DOW[dt.getDay()]}</span>
        <span style="font-size:26px; font-weight:800; letter-spacing:-0.5px; color:${on ? '#06343D' : '#fff'};">${dt.getDate()}</span>
        <div style="display:flex; gap:3px; height:7px; align-items:center;">${dots}</div>
      </div>`);
  }

  // ---- selected-day list (same store as Tasks) ----
  const selTasks = tasksOn(sel).filter((t) => cat === 'all' || t.category === cat);
  const isTd = sel === today;
  const selHeader = (isTd ? 'Today · ' : '') + `${FDOW[selDt.getDay()]}, ${MON[selDt.getMonth()]} ${selDt.getDate()}`;
  const n = selTasks.length;
  const countLabel = n === 0 ? 'No tasks' : `${n}${n === 1 ? ' task' : ' tasks'}`;

  const rows: CardRow[] = selTasks.map((t) => ({
    task: t, occ: sel,
    group: sel < today && !isDone(t.id, sel) ? 'overdue' : 'today',
    done: isDone(t.id, sel),
  }));
  const list = rows.length
    ? rows.map(taskCard).join('')
    : `<div style="padding:54px 20px; text-align:center;">
        <div style="width:72px; height:72px; border-radius:24px; background:#141416; border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          <span class="ms fill" style="font-size:36px; color:#34CEE9;">event_available</span>
        </div>
        <div style="font-size:18px; font-weight:800;">Nothing scheduled</div>
        <div style="margin-top:6px; font-size:14px; color:#76767E; font-weight:600;">No tasks on this day.</div>
      </div>`;

  // ---- month picker sheet ----
  let sheet = '';
  if (monthOpen) {
    const y = +viewYM.slice(0, 4), m = +viewYM.slice(5, 7) - 1;
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const blanks = first.getDay();
    const cells: string[] = [];
    for (let b = 0; b < blanks; b++) cells.push('<div></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const k = key(new Date(y, m, d));
      const on = k === sel, td = k === today;
      const dots = tasksOn(k).slice(0, 4).map((t) =>
        `<span style="flex:0 0 auto; width:4px; height:4px; border-radius:50%; background:${CATEGORY_HEX[t.category]};"></span>`,
      ).join('');
      cells.push(`
        <div data-action="cal-pick" data-date="${k}" style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:5px 0; cursor:pointer;">
          <div style="width:38px; height:26px; border-radius:999px; background:${on ? AC : 'transparent'}; box-shadow:${on ? '0 0 0 2.5px #fff' : 'none'}; display:flex; align-items:center; justify-content:center;">
            <span style="font-size:16px; line-height:1; font-weight:${on || td ? '800' : '600'}; color:${on ? '#06343D' : td ? AC : '#fff'};">${d}</span>
          </div>
          <div style="display:flex; flex-wrap:wrap; justify-content:center; align-content:flex-start; gap:2px; width:16px; height:10px;">${dots}</div>
        </div>`);
    }
    sheet = `
      <div data-action="cal-month-close" style="position:absolute; inset:0; z-index:50; background:rgba(0,0,0,0.55);"></div>
      <div style="position:absolute; left:0; right:0; bottom:0; z-index:60; background:#131316; border-radius:28px 28px 0 0; padding:12px 22px 34px; border-top:1px solid rgba(255,255,255,0.08); box-shadow:0 -22px 60px rgba(0,0,0,0.6);">
        <div style="width:40px; height:5px; border-radius:3px; background:rgba(255,255,255,0.2); margin:0 auto 18px;"></div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <div style="font-size:28px; font-weight:800; letter-spacing:-0.5px;">${MON[m]} <span style="color:#34CEE9;">${y}</span></div>
          <div style="display:flex; align-items:center; gap:4px;">
            <div data-action="cal-month-shift" data-dir="-1" style="width:36px; height:36px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span class="ms" style="font-size:20px; color:#fff;">chevron_left</span></div>
            <div data-action="cal-month-shift" data-dir="1" style="width:36px; height:36px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span class="ms" style="font-size:20px; color:#fff;">chevron_right</span></div>
            <div data-action="cal-today" style="display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); font-size:13.5px; font-weight:800; color:#fff; white-space:nowrap; cursor:pointer;">Today</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:2px;">
          ${DOW.map((w) => `<div style="text-align:center; font-size:13px; font-weight:800; color:#8A8A92;">${w}</div>`).join('')}
        </div>
        <div style="height:1px; background:rgba(255,255,255,0.09); margin:8px 0 6px;"></div>
        <div style="display:grid; grid-template-columns:repeat(7,1fr); row-gap:7px;">${cells.join('')}</div>
      </div>`;
  }

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; margin:0 0 3px;">
      <div style="font-size:30px; font-weight:800; letter-spacing:-0.6px;">Calendar</div>
      <div data-action="cal-month-open" style="display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:999px; background:${monthOpen ? 'rgba(52,206,233,0.16)' : 'rgba(255,255,255,0.06)'}; border:2.5px solid ${monthOpen ? '#fff' : 'rgba(255,255,255,0.12)'}; font-size:13.5px; font-weight:800; color:${monthOpen ? AC : '#fff'}; white-space:nowrap; cursor:pointer;">
        <span class="ms fill" style="font-size:16px; color:#34CEE9;">event</span>${MON[selDt.getMonth()].slice(0, 3)} ${selDt.getFullYear()}
      </div>
    </div>

    <div class="cc-scroll" style="display:flex; gap:9px; overflow-x:auto; overflow-y:visible; padding:14px 0 30px; margin:0 -20px -18px; padding-left:20px; padding-right:20px;">${days.join('')}</div>

    <div style="height:1px; background:rgba(255,255,255,0.07); margin:10px 0 0;"></div>

    <div style="display:flex; align-items:baseline; justify-content:space-between; padding:18px 0 4px;">
      <div style="font-size:19px; font-weight:800; letter-spacing:-0.3px;">${selHeader}</div>
      <div style="font-size:13px; font-weight:800; color:${n === 0 ? '#76767E' : AC};">${countLabel}</div>
    </div>

    <div class="cc-scroll" style="display:flex; gap:9px; overflow-x:auto; margin:0 -20px 16px; padding:8px 20px 10px;">${categoryChips(cat, 'cal-filter')}</div>

    <div style="display:flex; flex-direction:column; gap:14px;">${list}</div>
    ${sheet}`;
}

export function handleCalendarAction(action: string, el: HTMLElement): boolean {
  const d = el.dataset;
  switch (action) {
    case 'cal-day': if (d.date) { sel = d.date; viewYM = sel.slice(0, 7); } return true;
    case 'cal-filter': cat = d.cat || 'all'; return true;
    case 'cal-month-open': monthOpen = true; viewYM = sel.slice(0, 7); return true;
    case 'cal-month-close': monthOpen = false; return true;
    case 'cal-month-shift': {
      const dir = Number(d.dir || 1);
      const y = +viewYM.slice(0, 4), m = +viewYM.slice(5, 7) - 1 + dir;
      const nd = new Date(y, m, 1);
      viewYM = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
      return true;
    }
    case 'cal-pick': if (d.date) { sel = d.date; monthOpen = false; } return true;
    case 'cal-today': sel = todayISO(); viewYM = sel.slice(0, 7); monthOpen = false; return true;
  }
  return false;
}
