// Create/Edit task sheet — transcribed from Tasks.dc.html CreateTaskSheet/TaskDetailSheet.
// Core fields ported: title, category (card picker), date (month grid), time (wheel
// picker), recurring (+ options), priority (cycle), notes. Advanced sub-features
// (linked-task drag chains, custom category/tag builders, art picker) are deferred.

import type { CategoryKey, Priority, Recurrence } from '../core';
import { addTask, updateTask, getState } from '../store';
import { todayISO } from '../util';
import { CAT_STYLE } from '../odyssey';

const AC = '#34CEE9';
const CATS: CategoryKey[] = ['work', 'health', 'personal', 'finance', 'learning'];
const pri: Record<Priority, { icon: string; color: string; label: string }> = {
  low: { icon: 'spa', color: '#5BE0A0', label: 'Low' },
  medium: { icon: 'flag', color: '#F5A93B', label: 'Medium' },
  high: { icon: 'warning', color: '#FF6B6F', label: 'High' },
};
const cyclePriority = (p: Priority): Priority => (p === 'low' ? 'medium' : p === 'medium' ? 'high' : 'low');

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FDOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Draft {
  id: string | null;
  title: string;
  category: CategoryKey | null;
  date: string;
  timeStart: number | null;
  priority: Priority;
  recurrence: Recurrence | null;
  notes: string;
}

let open = false;
let sub: 'none' | 'date' | 'time' | 'card' = 'none';
let viewYM = todayISO().slice(0, 7);
let draft: Draft | null = null;
// scratch for the time wheel while the picker is open
let wh = 9, wm = 0, wap: 'AM' | 'PM' = 'AM';

export const isSheetOpen = () => open;

export function openCreate() {
  draft = { id: null, title: '', category: null, date: todayISO(), timeStart: null, priority: 'medium', recurrence: null, notes: '' };
  open = true; sub = 'none'; viewYM = draft.date.slice(0, 7);
}
export function openEdit(id: string) {
  const t = getState().tasks.find((x) => x.id === id);
  if (!t) return;
  draft = { id: t.id, title: t.title, category: t.category, date: t.date, timeStart: t.time?.startMinutes ?? null, priority: t.priority, recurrence: t.recurrence ?? null, notes: t.notes ?? '' };
  open = true; sub = 'none'; viewYM = draft.date.slice(0, 7);
}

const parseISO = (k: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtMin = (m: number) => { const h = Math.floor(m / 60), mi = m % 60, ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12; return `${h12}:${String(mi).padStart(2, '0')} ${ap}`; };

function dateLabel(iso: string): string {
  const d = parseISO(iso), t = todayISO();
  if (iso === t) return 'Today';
  const tm = new Date(); tm.setDate(tm.getDate() + 1);
  if (iso === keyOf(tm)) return 'Tomorrow';
  return `${MON[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

const REC_OPTS: { kind: string; label: string }[] = [
  { kind: 'daily', label: 'Daily' }, { kind: 'weekdays', label: 'Weekdays' },
  { kind: 'weekly', label: 'Weekly' }, { kind: 'monthly', label: 'Monthly' }, { kind: 'custom', label: 'Every N days' },
];

// ---- render ----
export function renderSheet(): string {
  if (!open || !draft) return '';
  const d = draft;
  const cs = d.category ? CAT_STYLE[d.category] : null;
  const p = pri[d.priority];
  const topBg = cs ? `rgb(${cs.bg})` : '#141416';
  const dateSubline = `${FDOW[parseISO(d.date).getDay()]}, ${MON[parseISO(d.date).getMonth()]} ${parseISO(d.date).getDate()}` + (d.timeStart != null ? ` · ${fmtMin(d.timeStart)}` : '');

  const topImg = cs ? `
    <div style="position:absolute; top:0; bottom:0; right:-4px; width:46%; max-width:160px;">
      <div style="position:relative; height:100%; width:100%;">
        <img src="${cs.img}" alt="" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
        <div style="position:absolute; top:0; bottom:0; left:0; width:80%; background:linear-gradient(to right, rgb(${cs.bg}) 0%, rgba(${cs.bg},0) 100%);"></div>
      </div>
    </div>
    <div style="position:absolute; top:12px; right:13px; z-index:3; border-radius:6px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.28);"><span style="padding:3px 9px; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; background:#EDEDF0; color:#0B1014;">${CAT_STYLE[d.category!].label}</span></div>
    <div data-action="ts-prio" style="position:absolute; bottom:12px; right:12px; z-index:3; width:31px; height:31px; border-radius:50%; background:rgba(16,18,24,0.62); backdrop-filter:blur(10px) saturate(150%); border:1px solid rgba(255,255,255,0.3); box-shadow:inset 0 1px 0.5px rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span class="ms fill" style="font-size:19px; color:${p.color}; transform:${d.priority === 'medium' ? 'translateX(1.5px)' : 'none'};">${p.icon}</span></div>` : '';

  // recurrence options (shown when recurring is on)
  const recActive = d.recurrence != null;
  const recRow = `
    <div data-action="ts-recur-toggle" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
      <span style="font-size:17px; font-weight:700; color:${recActive ? '#fff' : '#C2C2C8'};">Recurring</span>
      <div style="width:26px; height:26px; border-radius:8px; border:2px solid ${recActive ? AC : 'rgba(255,255,255,0.7)'}; background:${recActive ? AC : 'rgba(255,255,255,0.14)'}; display:flex; align-items:center; justify-content:center;">${recActive ? '<span class="ms fill" style="font-size:18px; color:#06181f;">check</span>' : ''}</div>
    </div>
    ${recActive ? `<div class="cc-scroll" style="display:flex; gap:8px; margin-top:13px; overflow-x:auto;">${REC_OPTS.map((o) => {
    const on = d.recurrence?.kind === o.kind;
    return `<span data-action="ts-recur-set" data-kind="${o.kind}" style="flex:0 0 auto; padding:8px 14px; border-radius:999px; font-size:13px; font-weight:800; cursor:pointer; background:${on ? AC : 'rgba(255,255,255,0.06)'}; color:${on ? '#06343D' : '#C2C2C8'}; border:1px solid ${on ? 'transparent' : 'rgba(255,255,255,0.1)'};">${o.label}</span>`;
  }).join('')}</div>` : ''}`;

  return `
    <div style="position:absolute; inset:0; z-index:60; background:#000; display:flex; flex-direction:column;">
      <div style="height:54px; flex:0 0 auto;"></div>
      <div style="flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:10px 18px 16px;">
        <div data-action="ts-cancel" style="padding:11px 22px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); font-size:16px; font-weight:700; color:#C2C2C8; cursor:pointer;">Cancel</div>
        <div style="font-size:18px; font-weight:800; letter-spacing:-0.2px;">${d.id ? 'Edit' : 'Create'}</div>
        <div data-action="ts-save" style="padding:11px 24px; border-radius:999px; background:${AC}; font-size:16px; font-weight:800; color:#06343D; box-shadow:0 6px 18px rgba(52,206,233,0.3); cursor:pointer;">Save</div>
      </div>

      <div class="cc-scroll" style="flex:1; overflow-y:auto; padding:18px 18px 30px;">
        <div style="position:relative; display:flex; align-items:center; min-height:128px; border-radius:20px; overflow:hidden; background:${topBg}; box-shadow:inset 0 0 0 1.5px rgba(255,255,255,0.06);">
          ${topImg}
          <div style="position:relative; z-index:2; flex:1; display:flex; align-items:center; gap:14px; padding:20px 18px;">
            <span class="ms fill" style="font-size:26px; color:${cs ? '#fff' : '#76767E'};">edit</span>
            <div style="flex:1; min-width:0;">
              <textarea data-action="ts-title" rows="1" maxlength="120" placeholder="Enter task..." style="display:block; width:100%; box-sizing:border-box; background:transparent; border:none; outline:none; resize:none; overflow:hidden; color:#fff; font-family:'Nunito',sans-serif; font-size:17px; font-weight:800; letter-spacing:-0.2px; line-height:1.22; padding:0 78px 0 0;">${d.title.replace(/</g, '&lt;')}</textarea>
              <div style="margin-top:4px; font-size:12.5px; line-height:17px; font-weight:700; color:rgba(255,255,255,0.72);">${dateSubline}</div>
            </div>
          </div>
        </div>

        <div style="font-size:16px; font-weight:800; letter-spacing:-0.2px; margin:26px 4px 13px;">Task Details</div>
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:17px 17px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <span style="font-size:17px; font-weight:700;">Date</span>
            <div style="display:flex; gap:8px;">
              <div data-action="ts-open-date" style="padding:9px 14px; border-radius:12px; background:rgba(255,255,255,0.07); font-size:14.5px; font-weight:700; cursor:pointer;">${dateLabel(d.date)}</div>
              <div data-action="ts-open-time" style="padding:9px 14px; border-radius:12px; background:rgba(255,255,255,0.07); font-size:14.5px; font-weight:700; cursor:pointer;">${d.timeStart != null ? fmtMin(d.timeStart) : 'All day'}</div>
            </div>
          </div>
          <div style="height:1px; background:rgba(255,255,255,0.06); margin:15px 0;"></div>
          ${recRow}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-top:11px;">
          <div data-action="ts-open-card" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:15px 16px; cursor:pointer;">
            <div style="font-size:16px; font-weight:800;">Category</div>
            <div style="margin-top:8px; display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:${d.category ? '#fff' : '#76767E'};">
              ${d.category ? `<span style="width:10px; height:10px; border-radius:50%; background:rgb(${CAT_STYLE[d.category].bg}); flex:0 0 auto;"></span>${CAT_STYLE[d.category].label}` : `<span class="ms" style="font-size:16px; color:#76767E;">layers</span>None`}
            </div>
          </div>
          <div data-action="ts-prio" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:15px 16px; cursor:pointer;">
            <div style="font-size:16px; font-weight:800;">Priority</div>
            <div style="margin-top:8px; display:flex; align-items:center; gap:7px; font-size:14px; font-weight:700; color:${p.color};">
              <span class="ms fill" style="font-size:16px; color:${p.color};">${p.icon}</span>${p.label}
            </div>
          </div>
        </div>

        <div style="font-size:16px; font-weight:800; letter-spacing:-0.2px; margin:26px 4px 13px;">Notes</div>
        <textarea data-action="ts-notes" placeholder="Add a note..." style="width:100%; min-height:104px; resize:none; box-sizing:border-box; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:15px 16px; color:#fff; font-family:'Nunito',sans-serif; font-size:15px; font-weight:600; line-height:1.5; outline:none;">${d.notes.replace(/</g, '&lt;')}</textarea>
      </div>

      ${sub === 'card' ? cardSheet(d) : ''}
      ${sub === 'date' ? dateSheet(d) : ''}
      ${sub === 'time' ? timeSheet() : ''}
    </div>`;
}

function cardSheet(d: Draft): string {
  const cards = CATS.map((c) => {
    const cs = CAT_STYLE[c], on = d.category === c;
    return `<div data-action="ts-pick-card" data-cat="${c}" style="position:relative; min-height:76px; border-radius:16px; overflow:hidden; background:rgb(${cs.bg}); box-shadow:${on ? '0 0 0 2.5px #fff' : 'inset 0 0 0 1.5px rgba(255,255,255,0.08)'}; cursor:pointer; display:flex; align-items:center; padding:0 16px;">
      <div style="position:absolute; top:0; bottom:0; right:-4px; width:46%; max-width:120px;"><img src="${cs.img}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;"><div style="position:absolute; inset:0; background:linear-gradient(to right, rgb(${cs.bg}) 20%, rgba(${cs.bg},0));"></div></div>
      <span style="position:relative; z-index:1; font-size:18px; font-weight:800; color:#fff;">${CAT_STYLE[c].label}</span>
    </div>`;
  }).join('');
  return sheetShell('Category', `<div style="display:flex; flex-direction:column; gap:10px;">${cards}</div>`);
}

function dateSheet(d: Draft): string {
  const y = +viewYM.slice(0, 4), m = +viewYM.slice(5, 7) - 1;
  const blanks = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const cells: string[] = [];
  for (let b = 0; b < blanks; b++) cells.push('<div></div>');
  for (let day = 1; day <= dim; day++) {
    const k = keyOf(new Date(y, m, day));
    const on = k === d.date, td = k === todayISO();
    cells.push(`<div data-action="ts-pick-date" data-date="${k}" style="display:flex; justify-content:center; padding:5px 0; cursor:pointer;"><div style="width:38px; height:26px; border-radius:999px; background:${on ? AC : 'transparent'}; box-shadow:${on ? '0 0 0 2.5px #fff' : 'none'}; display:flex; align-items:center; justify-content:center;"><span style="font-size:16px; font-weight:${on || td ? '800' : '600'}; color:${on ? '#06343D' : td ? AC : '#fff'};">${day}</span></div></div>`);
  }
  const body = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
      <div style="font-size:24px; font-weight:800;">${MON[m]} <span style="color:#34CEE9;">${y}</span></div>
      <div style="display:flex; gap:6px;">
        <div data-action="ts-date-shift" data-dir="-1" style="width:36px; height:36px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span class="ms" style="color:#fff;">chevron_left</span></div>
        <div data-action="ts-date-shift" data-dir="1" style="width:36px; height:36px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span class="ms" style="color:#fff;">chevron_right</span></div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:6px;">${DOW.map((w) => `<div style="text-align:center; font-size:13px; font-weight:800; color:#8A8A92;">${w}</div>`).join('')}</div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); row-gap:4px;">${cells.join('')}</div>`;
  return sheetShell('Pick a date', body);
}

// iOS-style wheel using CSS scroll-snap; the centered row is read on scroll.
function wheelCol(action: string, items: string[], selected: number): string {
  const rows = items.map((v, i) =>
    `<div data-widx="${i}" style="height:40px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; scroll-snap-align:center; color:${i === selected ? '#fff' : 'rgba(255,255,255,0.35)'};">${v}</div>`,
  ).join('');
  return `<div data-wheel="${action}" class="cc-scroll" style="height:200px; overflow-y:auto; scroll-snap-type:y mandatory; flex:1; padding:80px 0;">${rows}</div>`;
}
function timeSheet(): string {
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const body = `
    <div style="position:relative; display:flex; align-items:stretch; border-radius:16px; overflow:hidden; background:rgba(255,255,255,0.03);">
      <div style="position:absolute; left:0; right:0; top:80px; height:40px; background:rgba(52,206,233,0.10); border-top:1px solid rgba(52,206,233,0.4); border-bottom:1px solid rgba(52,206,233,0.4); pointer-events:none;"></div>
      ${wheelCol('h', hours, wh - 1)}
      ${wheelCol('m', mins, wm)}
      ${wheelCol('ap', ['AM', 'PM'], wap === 'AM' ? 0 : 1)}
    </div>
    <div data-action="ts-time-allday" style="margin-top:14px; text-align:center; font-size:14.5px; font-weight:800; color:#76767E; padding:10px; cursor:pointer;">Set to all day</div>`;
  return sheetShell('Time', body, 'ts-time-done');
}

function sheetShell(title: string, body: string, doneAction = 'ts-sub-done'): string {
  return `
    <div data-action="ts-sub-close" style="position:absolute; inset:0; z-index:70; background:rgba(0,0,0,0.55);"></div>
    <div style="position:absolute; left:0; right:0; bottom:0; z-index:71; background:#131316; border-radius:28px 28px 0 0; padding:14px 22px 30px; border-top:1px solid rgba(255,255,255,0.08); box-shadow:0 -22px 60px rgba(0,0,0,0.6);">
      <div style="width:40px; height:5px; border-radius:3px; background:rgba(255,255,255,0.2); margin:0 auto 16px;"></div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <div style="font-size:19px; font-weight:800;">${title}</div>
        <div data-action="${doneAction}" style="padding:8px 18px; border-radius:999px; background:${AC}; color:#06343D; font-size:14px; font-weight:800; cursor:pointer;">Done</div>
      </div>
      ${body}
    </div>`;
}

// ---- actions ----
export function handleSheetAction(action: string, el: HTMLElement): boolean {
  if (!draft) return false;
  const d = draft;
  // Preserve unsaved title/notes across the re-renders that other taps trigger.
  if (action !== 'ts-title' && action !== 'ts-notes') {
    const ti = document.querySelector('[data-action="ts-title"]') as HTMLTextAreaElement | null;
    const no = document.querySelector('[data-action="ts-notes"]') as HTMLTextAreaElement | null;
    if (ti) d.title = ti.value;
    if (no) d.notes = no.value;
  }
  switch (action) {
    case 'ts-cancel': open = false; draft = null; return true;
    case 'ts-title': d.title = (el as HTMLTextAreaElement).value; return false; // don't re-render on each keystroke
    case 'ts-notes': d.notes = (el as HTMLTextAreaElement).value; return false;
    case 'ts-prio': d.priority = cyclePriority(d.priority); return true;
    case 'ts-recur-toggle': d.recurrence = d.recurrence ? null : { kind: 'daily' }; return true;
    case 'ts-recur-set': {
      const k = el.dataset.kind;
      if (k === 'weekly') d.recurrence = { kind: 'weekly', days: [parseISO(d.date).getDay() as 0] };
      else if (k === 'monthly') d.recurrence = { kind: 'monthly', day: parseISO(d.date).getDate() };
      else if (k === 'custom') d.recurrence = { kind: 'custom', everyNDays: 3 };
      else if (k === 'daily' || k === 'weekdays') d.recurrence = { kind: k };
      return true;
    }
    case 'ts-open-card': sub = 'card'; return true;
    case 'ts-open-date': sub = 'date'; viewYM = d.date.slice(0, 7); return true;
    case 'ts-open-time': {
      sub = 'time';
      const m = d.timeStart ?? 540;
      const h = Math.floor(m / 60); wm = m % 60; wap = h < 12 ? 'AM' : 'PM'; wh = h % 12 || 12;
      return true;
    }
    case 'ts-sub-close': case 'ts-sub-done': sub = 'none'; return true;
    case 'ts-pick-card': d.category = (el.dataset.cat as CategoryKey) || null; sub = 'none'; return true;
    case 'ts-pick-date': if (el.dataset.date) d.date = el.dataset.date; sub = 'none'; return true;
    case 'ts-date-shift': {
      const dir = Number(el.dataset.dir || 1);
      const nd = new Date(+viewYM.slice(0, 4), +viewYM.slice(5, 7) - 1 + dir, 1);
      viewYM = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
      return true;
    }
    case 'ts-time-allday': d.timeStart = null; sub = 'none'; return true;
    case 'ts-time-done': {
      const h24 = (wh % 12) + (wap === 'PM' ? 12 : 0);
      d.timeStart = h24 * 60 + wm; sub = 'none'; return true;
    }
    case 'ts-save': {
      // capture latest title/notes from the DOM in case of unflushed input
      const ti = document.querySelector('[data-action="ts-title"]') as HTMLTextAreaElement | null;
      const no = document.querySelector('[data-action="ts-notes"]') as HTMLTextAreaElement | null;
      if (ti) d.title = ti.value;
      if (no) d.notes = no.value;
      if (!d.title.trim()) { (ti)?.focus(); return false; }
      const patch = {
        title: d.title.trim(), category: d.category ?? 'personal', priority: d.priority,
        date: d.date, notes: d.notes.trim() || undefined,
        recurrence: d.recurrence ?? undefined,
        timeStart: d.timeStart ?? undefined,
      };
      if (d.id) updateTask(d.id, { title: patch.title, category: patch.category, priority: patch.priority, date: patch.date, notes: patch.notes, recurrence: patch.recurrence, time: d.timeStart != null ? { startMinutes: d.timeStart } : undefined });
      else addTask({ title: patch.title, category: patch.category, priority: patch.priority, date: patch.date, notes: patch.notes, recurrence: patch.recurrence, timeStart: d.timeStart ?? undefined });
      open = false; draft = null; return true;
    }
  }
  return false;
}

// Called after render so the time wheels scroll to the selected row and report changes.
export function wireSheet(root: HTMLElement) {
  if (sub !== 'time') return;
  root.querySelectorAll('[data-wheel]').forEach((w) => {
    const el = w as HTMLElement;
    const which = el.dataset.wheel!;
    const sel = which === 'h' ? wh - 1 : which === 'm' ? wm : (wap === 'AM' ? 0 : 1);
    // Each row is 40px; the 80px top padding centers row i at scrollTop = i*40.
    el.scrollTop = sel * 40;
    let t: ReturnType<typeof setTimeout>;
    el.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const idx = Math.round(el.scrollTop / 40);
        const clamped = Math.max(0, Math.min(el.children.length - 1, idx));
        if (which === 'h') wh = clamped + 1;
        else if (which === 'm') wm = clamped;
        else wap = clamped === 0 ? 'AM' : 'PM';
        [...el.children].forEach((c, i) => ((c as HTMLElement).style.color = i === clamped ? '#fff' : 'rgba(255,255,255,0.35)'));
      }, 90);
    });
  });
}
