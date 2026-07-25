// Create/Edit sheet + pickers — markup transcribed VERBATIM from the Odyssey
// "Tasks & Calendar" design (detail sheet, link picker, card picker, tag picker,
// tag creator, month picker, wheel time picker). Only data is wired to the store.

import type { Task } from './core';
import { addTask, updateTask, removeTask, getState, addCard, updateCard, deleteCard, type CardDef } from './store';
import { AC, AC_RGB, cardFor, TAGS } from './odyssey';
import { asset, esc, todayISO } from './util';

// design library (verbatim from the handoff's designLib)
const DESIGN_LIB: { label: string; rgb: string; img: string }[] = [
  { label: 'Business', rgb: '92,164,235', img: 'assets/shop/business.png' },
  { label: 'Philosophy', rgb: '109,140,219', img: 'assets/shop/philosophy.png' },
  { label: 'Design Tech', rgb: '120,117,242', img: 'assets/shop/design.png' },
  { label: 'Biology', rgb: '41,179,107', img: 'assets/areas/biology.png' },
  { label: 'Chemistry', rgb: '110,94,253', img: 'assets/areas/chemistry.png' },
  { label: 'English', rgb: '97,199,254', img: 'assets/areas/english.png' },
  { label: 'History', rgb: '165,110,80', img: 'assets/areas/history.png' },
  { label: 'Psychology', rgb: '251,109,134', img: 'assets/areas/psychology.png' },
  { label: 'Economics', rgb: '253,188,111', img: 'assets/subjects/economics.png' },
  { label: 'Physics', rgb: '60,150,250', img: 'assets/subjects/physics.png' },
  { label: 'Computer Sci', rgb: '233,90,168', img: 'assets/subjects/computer-science.png' },
  { label: 'Geography', rgb: '81,206,195', img: 'assets/subjects/geography.png' },
];
// chip styles (verbatim subset of the handoff's _chipStylesList)
interface ChipStyle { id: string; name: string; bg: string; color: string; border?: string; shadow?: string; bgSize?: string; anim?: string }
const CHIP_STYLES: ChipStyle[] = [
  { id: 'white', name: 'Classic', bg: '#F4F4F6', color: '#16171B', shadow: '0 2px 7px rgba(0,0,0,0.28)' },
  { id: 'cyan', name: 'Cyan', bg: '#2AD1E5', color: '#04222A' },
  { id: 'green', name: 'Mint', bg: '#34D399', color: '#04231A' },
  { id: 'slate', name: 'Slate', bg: '#64748B', color: '#F1F5F9' },
  { id: 'coral', name: 'Coral', bg: '#FF6B5C', color: '#2E0A06' },
  { id: 'purple', name: 'Violet', bg: '#7C5CFF', color: '#FFFFFF' },
  { id: 'voltage', name: 'Voltage', bg: 'linear-gradient(135deg,#FDE047,#FACC15)', color: '#2E2600', shadow: '0 0 14px rgba(250,204,21,0.85)' },
  { id: 'venom', name: 'Venom', bg: 'linear-gradient(135deg,#A3E635,#4D7C0F)', color: '#0E2600', shadow: '0 0 14px rgba(132,204,22,0.85)' },
  { id: 'fuchsia', name: 'Fuchsia', bg: 'linear-gradient(135deg,#F0509C,#C21A6B)', color: '#FFFFFF', shadow: '0 0 14px rgba(240,80,156,0.85)' },
  { id: 'cobalt', name: 'Cobalt', bg: 'linear-gradient(135deg,#3B82F6,#1E40AF)', color: '#FFFFFF', shadow: '0 0 14px rgba(59,130,246,0.9)' },
  { id: 'pearl', name: 'Pearl', bg: 'linear-gradient(115deg,#f5f3ff,#e0f2fe 30%,#fce7f3 50%,#ede9fe 70%,#f5f3ff)', color: '#6D28D9', bgSize: '200% 100%', anim: 'flow 7s linear infinite' },
  { id: 'prism', name: 'Prism', bg: 'conic-gradient(from 0deg,#ff5c8a,#ffd45c,#5cff9d,#5cc9ff,#b45cff,#ff5c8a)', color: '#141414', anim: 'hue 9s linear infinite' },
];
const chipStyle = (id?: string) => CHIP_STYLES.find((c) => c.id === id) ?? CHIP_STYLES[0];

const AC_TINT = `rgba(${AC_RGB},0.1)`;
const PRIOS = [
  { label: 'Low', icon: 'spa', color: '#34B36B' },
  { label: 'Medium', icon: 'flag', color: '#F59E0B' },
  { label: 'High', icon: 'priority_high', color: '#FF3B30' },
];
const SWATCHES = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#34CEE9', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93', '#A2845E'];

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOWS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FDOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseISO = (k: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface TimeSpec { mode: 'single' | 'range' | 'allday'; sh: number; sm: number; sap: 'AM' | 'PM'; eh: number; em: number; eap: 'AM' | 'PM' }
interface Draft {
  id: string | null; title: string; category: string | null; tag: string | null;
  priority: number; recurring: boolean; date: string; time: TimeSpec; notes: string; linkedIds: string[];
}

let open = false;
let isCreate = false;
let picker: null | 'card' | 'tag' | 'tagCreate' | 'link' | 'month' | 'time' | 'design' | 'naming' = null;
// category builder scratch
let pendingDesign: { label: string; rgb: string; img: string } | null = null;
let nameDraft = '';
let chipDraft = 'white';
let editingCardIdx: number | null = null;
let draft: Draft | null = null;
let viewYM = todayISO().slice(0, 7);
let monthTarget: 'sel' | 'dt' = 'dt';
let timeSide: 'start' | 'end' = 'start';
let tagDraftName = '', tagDraftHex = SWATCHES[0];
let dragFrom: number | null = null;
// entrance animations must play only when a surface first opens, not on every re-render
let sheetAnimPending = false;
let pickerAnimPending = false;
const sheetAnim = () => { const a = sheetAnimPending ? 'animation:ccSheetIn .34s cubic-bezier(.22,.9,.25,1);' : ''; sheetAnimPending = false; return a; };
const pickAnim = () => (pickerAnimPending ? 'animation:ccModalIn .38s cubic-bezier(.22,.9,.25,1);' : '');
const scrimAnim = () => (pickerAnimPending ? 'animation:ccScrim .22s ease;' : '');
const consumePicker = () => { pickerAnimPending = false; };

export const isSheetOpen = () => open;
export const isMonthOnly = () => open === false && picker === 'month';

const to12 = (mins: number) => { const h = Math.floor(mins / 60), m = mins % 60; return { h: h % 12 || 12, m, ap: (h < 12 ? 'AM' : 'PM') as 'AM' | 'PM' }; };
const to24 = (h: number, ap: 'AM' | 'PM') => (h % 12) + (ap === 'PM' ? 12 : 0);
const fmt = (h: number, m: number, ap: string) => `${h}:${String(m).padStart(2, '0')} ${ap}`;

function draftFrom(t?: Task): Draft {
  if (!t) return { id: null, title: '', category: null, tag: null, priority: 0, recurring: false, date: todayISO(), time: { mode: 'single', sh: 9, sm: 0, sap: 'AM', eh: 10, em: 0, eap: 'AM' }, notes: '', linkedIds: [] };
  const s = t.time ? to12(t.time.startMinutes) : null;
  const e = t.time?.endMinutes != null ? to12(t.time.endMinutes) : null;
  return {
    id: t.id, title: t.title, category: t.category, tag: t.tagIds[0] ?? null,
    priority: t.priority === 'high' ? 2 : t.priority === 'medium' ? 1 : 0,
    recurring: !!t.recurrence, date: t.date, notes: t.notes ?? '',
    linkedIds: (t as Task & { linkedIds?: string[] }).linkedIds ?? [],
    time: t.time
      ? { mode: e ? 'range' : 'single', sh: s!.h, sm: s!.m, sap: s!.ap, eh: e?.h ?? 10, em: e?.m ?? 0, eap: e?.ap ?? 'AM' }
      : { mode: 'allday', sh: 9, sm: 0, sap: 'AM', eh: 10, em: 0, eap: 'AM' },
  };
}

export function openCreate(date?: string) { draft = draftFrom(); if (date) draft.date = date; open = true; isCreate = true; picker = null; sheetAnimPending = true; }
export function openEdit(id: string) {
  const t = getState().tasks.find((x) => x.id === id);
  if (!t) return; draft = draftFrom(t); open = true; isCreate = false; picker = null; sheetAnimPending = true;
}
export function openMonthFor(target: 'sel' | 'dt', ym: string) { monthTarget = target; viewYM = ym; picker = 'month'; pickerAnimPending = true; }

// ---------- render ----------
export function renderSheet(selDate: string): string {
  if (picker === 'month' && !open) return monthPicker(selDate);
  if (!open || !draft) return '';
  const d = draft;
  const cs = d.category ? cardFor(d.category) : null;
  const p = PRIOS[d.priority];
  const dt = parseISO(d.date);
  const tagHex = TAGS.find((t) => t.name === d.tag)?.hex ?? '#8E8E93';
  const rangeText = `${fmt(d.time.sh, d.time.sm, d.time.sap)} – ${fmt(d.time.eh, d.time.em, d.time.eap)}`;
  // the Date row pill just reads "Range"; the card subline still shows the times
  const timeLabel = d.time.mode === 'allday' ? 'All day' : d.time.mode === 'range' ? 'Range' : fmt(d.time.sh, d.time.sm, d.time.sap);
  const sublineTime = d.time.mode === 'range' ? rangeText : timeLabel;
  const dateLabel = `${MON[dt.getMonth()].slice(0, 3)} ${dt.getDate()}, ${dt.getFullYear()}`;
  const subline = `${FDOW[dt.getDay()]}, ${MON[dt.getMonth()]} ${dt.getDate()}` + (d.time.mode !== 'allday' ? ` · ${sublineTime}` : '');

  const linked = d.linkedIds.map((id) => getState().tasks.find((t) => t.id === id)).filter(Boolean) as Task[];
  const linkMembers = linked.map((t, i) => {
    const c = cardFor(t.category);
    return `<div draggable="true" data-drag="${i}" style="position:relative; display:flex; align-items:center; gap:9px; min-height:58px; border-radius:16px; overflow:hidden; background:rgb(${c.bg}); box-shadow:0 4px 12px rgba(30,30,40,0.1); animation:lkInA .34s cubic-bezier(.22,.9,.25,1) ${i * 40}ms both; transition:box-shadow .2s ease, opacity .2s ease;">
      <span style="flex:0 0 auto; padding-left:9px; font-family:'Material Symbols Rounded'; font-size:20px; line-height:1; color:rgba(255,255,255,0.75); cursor:grab;">drag_indicator</span>
      <span style="flex:0 0 auto; display:inline-flex; align-items:center; gap:2px; padding:3px 8px; border-radius:999px; background:rgba(10,12,16,0.5); color:#fff; font-size:11px; font-weight:900;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:13px; line-height:1;">link</span>${i + 1}</span>
      <div style="flex:1; min-width:0;">
        <div style="font-size:14px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(t.title)}</div>
        <div style="margin-top:2px; font-size:11.5px; font-weight:600; color:rgba(255,255,255,0.84); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(cardFor(t.category).label)}</div>
      </div>
      <div data-action="sh-unlink" data-id="${t.id}" style="flex:0 0 auto; margin-right:7px; margin-left:2px; width:36px; height:36px; border-radius:50%; background:rgba(0,0,0,0.28); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-size:20px; line-height:1; color:#fff;">close</span></div>
    </div>`;
  }).join('');

  return `
    <div class="sheet-layer" style="position:absolute; inset:0; z-index:60; background:#F2F2F7; display:flex; flex-direction:column; ${sheetAnim()}">
      <div style="height:calc(env(safe-area-inset-top, 0px) + 12px); flex:0 0 auto;"></div>
      <div style="flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:6px 18px 14px;">
        ${isCreate
      ? `<div data-action="sh-cancel" style="font-size:17px; font-weight:500; color:${AC}; padding:6px 4px; cursor:pointer;">Cancel</div>`
      : `<div data-action="sh-delete" style="width:42px; height:42px; border-radius:999px; background:rgba(255,59,48,0.1); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:21px; line-height:1; color:#FF3B30;">delete</span></div>`}
        <div style="font-size:17px; font-weight:700; letter-spacing:-0.3px;">${isCreate ? 'New Task' : 'Edit Task'}</div>
        <div data-action="sh-save" style="padding:6px 4px; font-size:17px; font-weight:700; color:${AC}; cursor:pointer;">${isCreate ? 'Add' : 'Done'}</div>
      </div>

      <div class="cc-scroll" style="flex:1; overflow-y:auto; padding:14px 18px 40px;">
        <div style="position:relative;">
          ${d.tag ? `<div style="position:absolute; top:-7px; left:-5px; z-index:5; display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px; background:rgba(255,255,255,0.7); backdrop-filter:blur(16px) saturate(180%); -webkit-backdrop-filter:blur(16px) saturate(180%); border:1px solid rgba(255,255,255,0.9); box-shadow:0 4px 12px rgba(30,30,40,0.18); font-size:11.5px; font-weight:800; color:#1C1C1E;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:13px; line-height:1; color:${tagHex};">sell</span>${esc(d.tag)}</div>` : ''}
          <div style="position:relative; display:flex; align-items:center; min-height:128px; border-radius:22px; overflow:hidden; background:${cs ? `rgb(${cs.bg})` : '#FFFFFF'}; box-shadow:${cs ? '0 10px 24px rgba(30,30,40,0.14)' : '0 1px 3px rgba(30,30,40,0.06), inset 0 0 0 1px rgba(60,60,67,0.08)'};">
            ${cs ? `<div style="position:absolute; top:0; bottom:0; right:-4px; width:46%; max-width:160px;">
              <div style="position:relative; height:100%; width:100%;">
                <img src="${cs.img}" alt="" loading="lazy" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
                <div style="position:absolute; top:0; bottom:0; left:0; width:80%; background:linear-gradient(to right, rgb(${cs.bg}) 0%, rgba(${cs.bg},0) 100%);"></div>
              </div>
            </div>
            <div style="position:absolute; top:12px; right:13px; z-index:3; display:flex; align-items:stretch; border-radius:6px; overflow:hidden; box-shadow:0 2px 8px rgba(30,30,40,0.18);">
              <span style="padding:3px 9px; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; background:#FFFFFF; color:#1C1C1E; white-space:nowrap;">${cs.label}</span>
            </div>
            <div data-action="sh-prio" style="position:absolute; bottom:12px; right:12px; z-index:3; width:31px; height:31px; border-radius:50%; background:rgba(16,18,24,0.5); backdrop-filter:blur(10px) saturate(150%); -webkit-backdrop-filter:blur(10px) saturate(150%); border:1px solid rgba(255,255,255,0.35); box-shadow:inset 0 1px 0.5px rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:19px; line-height:1; color:${p.color}; display:inline-block; transform:${d.priority === 1 ? 'translateX(1.5px)' : 'none'};">${p.icon}</span>
            </div>` : ''}
            <div style="position:relative; z-index:2; flex:1; display:flex; align-items:center; gap:14px; padding:20px 18px;">
              <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:24px; line-height:1; color:${cs ? 'rgba(255,255,255,0.9)' : '#C7C7CC'};">edit</span>
              <div style="flex:1; min-width:0;">
                <textarea class="nt-input" data-action="sh-title" rows="1" maxlength="120" placeholder="Enter task..." style="display:block; width:100%; box-sizing:border-box; background:transparent; border:none; outline:none; resize:none; overflow:hidden; overflow-wrap:anywhere; word-break:break-word; white-space:pre-wrap; color:${cs ? '#FFFFFF' : '#1C1C1E'}; font-family:-apple-system,system-ui,sans-serif; font-size:18px; font-weight:700; letter-spacing:-0.3px; line-height:1.22; max-height:44px; padding:0 78px 0 0;">${esc(d.title)}</textarea>
                <div style="margin-top:4px; font-size:12.5px; line-height:17px; font-weight:600; color:${cs ? 'rgba(255,255,255,0.85)' : '#8E8E93'};">${subline}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin:26px 4px 12px;">
          <div style="font-size:17px; font-weight:800; letter-spacing:-0.3px;">Linked Tasks <span style="color:#B0B0B5;">(${linked.length})</span></div>
          <div data-action="sh-link-open" style="display:flex; align-items:center; gap:4px; font-size:15px; font-weight:700; color:${AC}; cursor:pointer;">Add <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:19px; line-height:1;">add</span></div>
        </div>
        ${linked.length
      ? `<div id="linklist" style="display:flex; flex-direction:column; gap:9px;">${linkMembers}</div>`
      : `<div style="background:#FFFFFF; border:1.5px dashed rgba(60,60,67,0.2); border-radius:16px; padding:22px 20px; display:flex; flex-direction:column; align-items:center; gap:9px;">
          <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:26px; line-height:1; color:#C7C7CC;">link</span>
          <div style="font-size:13.5px; font-weight:600; color:#8E8E93; text-align:center;">No linked tasks yet</div>
        </div>`}

        <div style="font-size:17px; font-weight:800; letter-spacing:-0.3px; margin:26px 4px 12px;">Task Details</div>
        <div style="background:#FFFFFF; border:1px solid rgba(60,60,67,0.07); border-radius:18px; padding:17px; box-shadow:0 1px 3px rgba(30,30,40,0.04);">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <span style="font-size:16px; font-weight:600;">Date</span>
            <div style="display:flex; gap:8px;">
              <div data-action="sh-date" style="padding:9px 14px; border-radius:12px; background:rgba(120,120,128,0.12); font-size:14.5px; font-weight:600; cursor:pointer;">${dateLabel}</div>
              <div data-action="sh-time" style="padding:9px 14px; border-radius:12px; background:rgba(120,120,128,0.12); font-size:14.5px; font-weight:600; cursor:pointer;">${timeLabel}</div>
            </div>
          </div>
          <div style="height:1px; background:rgba(60,60,67,0.09); margin:15px 0;"></div>
          <div data-action="sh-recur" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
            <span style="font-size:16px; font-weight:600; color:${d.recurring ? '#1C1C1E' : '#8E8E93'};">Recurring</span>
            <div style="width:52px; height:31px; border-radius:999px; background:${d.recurring ? '#34C759' : 'rgba(120,120,128,0.16)'}; position:relative; transition:background .2s ease;">
              <div style="position:absolute; top:2px; left:${d.recurring ? '23px' : '2px'}; width:27px; height:27px; border-radius:50%; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:left .2s ease;"></div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-top:11px;">
          <div data-action="sh-card-open" style="background:#FFFFFF; border:1px solid rgba(60,60,67,0.07); border-radius:16px; padding:15px 16px; cursor:pointer; box-shadow:0 1px 3px rgba(30,30,40,0.04);">
            <div style="font-size:15px; font-weight:800;">Card</div>
            <div style="margin-top:8px; display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:${cs ? '#1C1C1E' : '#8E8E93'};">
              ${cs ? `<span style="width:10px; height:10px; border-radius:50%; background:rgb(${cs.bg}); flex:0 0 auto;"></span>${cs.label}`
      : `<span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:16px; line-height:1; color:#8E8E93;">layers</span>None`}
            </div>
          </div>
          <div data-action="sh-tag-open" style="background:#FFFFFF; border:1px solid rgba(60,60,67,0.07); border-radius:16px; padding:15px 16px; cursor:pointer; box-shadow:0 1px 3px rgba(30,30,40,0.04);">
            <div style="font-size:15px; font-weight:800;">Tag</div>
            <div style="margin-top:8px; display:flex; align-items:center; gap:7px; font-size:14px; font-weight:600; color:${d.tag ? '#1C1C1E' : '#8E8E93'};">
              <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:16px; line-height:1; color:${d.tag ? tagHex : '#8E8E93'};">sell</span>${d.tag ? esc(d.tag) : 'None'}
            </div>
          </div>
        </div>

        <div data-action="sh-prio" style="margin-top:11px; background:#FFFFFF; border:1px solid rgba(60,60,67,0.07); border-radius:16px; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; box-shadow:0 1px 3px rgba(30,30,40,0.04);">
          <div style="font-size:15px; font-weight:800;">Priority</div>
          <div style="display:flex; align-items:center; gap:7px; font-size:15px; font-weight:800; color:${p.color};">
            <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:18px; line-height:1; color:${p.color};">${p.icon}</span>${p.label}
          </div>
        </div>

        <div style="font-size:17px; font-weight:800; letter-spacing:-0.3px; margin:26px 4px 12px;">Notes</div>
        <textarea data-action="sh-notes" placeholder="Add a note..." style="width:100%; min-height:104px; resize:none; box-sizing:border-box; background:#FFFFFF; border:1px solid rgba(60,60,67,0.07); border-radius:16px; padding:15px 16px; color:#1C1C1E; font-family:-apple-system,system-ui,sans-serif; font-size:15px; font-weight:500; line-height:1.5; outline:none; box-shadow:0 1px 3px rgba(30,30,40,0.04);">${esc(d.notes)}</textarea>
      </div>
    </div>
    ${picker === 'card' ? cardPicker(d) : ''}
    ${picker === 'design' ? designPicker() : ''}
    ${picker === 'naming' ? namingSheet() : ''}
    ${picker === 'tag' ? tagPicker(d) : ''}
    ${picker === 'tagCreate' ? tagCreate() : ''}
    ${picker === 'link' ? linkPicker(d) : ''}
    ${picker === 'month' ? monthPicker(d.date) : ''}
    ${picker === 'time' ? timePicker(d) : ''}`;
}

const scrim = (z: number, inner: string) => `
  <div data-action="sh-picker-close" style="position:absolute; inset:0; z-index:${z}; background:rgba(0,0,0,0.35); ${scrimAnim()} display:flex; flex-direction:column; justify-content:flex-end;">${inner}</div>`;
const sheetBox = (inner: string, pad = '') =>
  `<div data-action="sh-noop" class="picker-box" style="background:#FFFFFF; border-top-left-radius:28px; border-top-right-radius:28px; max-height:82%; display:flex; flex-direction:column; ${pad} ${pickAnim()}">${inner}</div>`;
const grabber = `<div style="width:38px; height:5px; border-radius:3px; background:rgba(60,60,67,0.2); margin:12px auto 0;"></div>`;

function cardPicker(d: Draft): string {
  const cards = getState().cards.map((c, i) => {
    const on = d.category === c.name;
    const cst = chipStyle(c.styleId);
    return `<div data-action="sh-pick-card" data-cat="${esc(c.name)}" style="position:relative; display:flex; align-items:center; min-height:84px; border-radius:18px; overflow:hidden; background:rgb(${c.rgb}); box-shadow:0 6px 16px rgba(30,30,40,0.1); cursor:pointer;">
      <div data-action="sh-card-edit" data-idx="${i}" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); z-index:6; width:34px; height:34px; border-radius:50%; background:rgba(0,0,0,0.3); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:18px; line-height:1; color:#fff;">edit</span></div>
      <div style="position:absolute; top:0; bottom:0; right:-4px; width:46%; max-width:150px;">
        <div style="position:relative; height:100%; width:100%;">
          <img src="${asset(c.img)}" alt="" loading="lazy" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
          <div style="position:absolute; top:0; bottom:0; left:0; width:80%; background:linear-gradient(to right, rgb(${c.rgb}) 0%, rgba(${c.rgb},0) 100%);"></div>
        </div>
      </div>
      <span style="position:absolute; top:11px; right:12px; z-index:4; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; padding:3px 9px; border-radius:6px; background:${cst.bg}; background-size:${cst.bgSize ?? 'auto'}; color:${cst.color}; border:${cst.border ?? 'none'}; box-shadow:${cst.shadow ?? 'none'}; animation:${cst.anim ?? 'none'}; white-space:nowrap; max-width:104px; overflow:hidden; text-overflow:ellipsis;">${esc(c.name)}</span>
      ${on ? `<div style="position:absolute; inset:0; border-radius:18px; box-shadow:inset 0 0 0 3px #fff; z-index:3; pointer-events:none;"></div>
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:4; width:27px; height:27px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 9px rgba(0,0,0,0.4);"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:18px; line-height:1; color:#111;">check</span></div>` : ''}
    </div>`;
  }).join('');
  return scrim(70, sheetBox(`${grabber}
    <div style="padding:14px 20px 12px;"><div style="font-size:20px; font-weight:800; letter-spacing:-0.4px;">Choose a Card</div></div>
    <div class="cc-scroll" style="overflow-y:auto; padding:4px 18px 28px; display:flex; flex-direction:column; gap:11px;">${cards}
      <div data-action="sh-new-category" style="margin-top:3px; display:flex; align-items:center; justify-content:center; gap:8px; padding:17px; border-radius:16px; border:1.5px dashed rgba(60,60,67,0.25); color:#636366; font-weight:700; font-size:15px; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:20px; line-height:1;">add</span>New Category</div>
    </div>`));
}

function designPicker(): string {
  const cards = DESIGN_LIB.map((t, i) => `<div data-action="sh-pick-design" data-idx="${i}" style="position:relative; height:80px; border-radius:16px; overflow:hidden; background:rgb(${t.rgb}); box-shadow:0 4px 12px rgba(30,30,40,0.1); cursor:pointer;">
      <div style="position:absolute; top:0; bottom:0; right:-4px; width:52%;">
        <div style="position:relative; height:100%; width:100%;">
          <img src="${asset(t.img)}" alt="" loading="lazy" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
          <div style="position:absolute; top:0; bottom:0; left:0; width:82%; background:linear-gradient(to right, rgb(${t.rgb}) 0%, rgba(${t.rgb},0) 100%);"></div>
        </div>
      </div>
    </div>`).join('');
  return scrim(76, sheetBox(`
    <div style="padding:18px 20px 6px;">
      <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px;">Pick a design</div>
      <div style="margin-top:3px; font-size:13px; font-weight:500; color:#8E8E93;">Choose a card design for your new category.</div>
    </div>
    <div class="cc-scroll" style="overflow-y:auto; padding:12px 18px 28px; display:grid; grid-template-columns:1fr 1fr; gap:11px;">${cards}</div>`));
}

function namingSheet(): string {
  const pd = pendingDesign;
  if (!pd) return '';
  const cst = chipStyle(chipDraft);
  const grid = CHIP_STYLES.map((c) => {
    const on = chipDraft === c.id;
    return `<div data-action="sh-chip-style" data-id="${c.id}" style="position:relative; display:flex; align-items:center; gap:8px; padding:9px 11px; border-radius:12px; background:${on ? 'rgba(0,122,255,0.08)' : 'rgba(120,120,128,0.08)'}; box-shadow:${on ? 'inset 0 0 0 2px ' + AC : 'inset 0 0 0 1px rgba(60,60,67,0.1)'}; transition:background .2s ease, box-shadow .2s ease; cursor:pointer;">
      <span style="flex:0 0 auto; display:inline-flex; align-items:center; padding:3px 8px; border-radius:5px; font-size:9.5px; font-weight:900; letter-spacing:0.5px; background:${c.bg}; background-size:${c.bgSize ?? 'auto'}; color:${c.color}; border:${c.border ?? 'none'}; box-shadow:${c.shadow ?? 'none'}; animation:${c.anim ?? 'none'};">CHIP</span>
      <div style="flex:1 1 auto; min-width:0; font-size:12.5px; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#1C1C1E;">${c.name}</div>
      ${on ? `<span style="flex:0 0 auto; margin-left:auto; display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:${AC};"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:12px; color:#fff;">check</span></span>`
      : `<span style="flex:0 0 auto; margin-left:auto; display:inline-flex; width:18px; height:18px; border-radius:50%; border:1.5px solid rgba(60,60,67,0.22);"></span>`}
    </div>`;
  }).join('');
  return scrim(80, `<div data-action="sh-noop" class="picker-box" style="background:#FFFFFF; border-top-left-radius:28px; border-top-right-radius:28px; display:flex; flex-direction:column; ${pickAnim()} padding:18px 18px 30px; max-height:90vh; overflow-y:auto;">
    <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px; margin:0 2px 14px;">${editingCardIdx != null ? 'Edit Category' : 'Name your category'}</div>
    <div style="position:relative; display:flex; align-items:center; min-height:96px; border-radius:18px; overflow:hidden; background:rgb(${pd.rgb}); box-shadow:0 6px 16px rgba(30,30,40,0.1);">
      <div style="position:absolute; top:0; bottom:0; right:-4px; width:46%; max-width:150px;">
        <div style="position:relative; height:100%; width:100%;">
          <img src="${asset(pd.img)}" alt="" loading="lazy" style="position:absolute; inset:0; height:100%; width:100%; object-fit:cover; object-position:center top;">
          <div style="position:absolute; top:0; bottom:0; left:0; width:80%; background:linear-gradient(to right, rgb(${pd.rgb}) 0%, rgba(${pd.rgb},0) 100%);"></div>
        </div>
      </div>
      <div style="position:relative; z-index:2; flex:1; padding:18px;"></div>
      ${nameDraft.trim() ? `<span style="position:absolute; top:11px; right:12px; z-index:4; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase; padding:3px 9px; border-radius:6px; background:${cst.bg}; background-size:${cst.bgSize ?? 'auto'}; color:${cst.color}; border:${cst.border ?? 'none'}; box-shadow:${cst.shadow ?? 'none'}; animation:${cst.anim ?? 'none'}; white-space:nowrap; max-width:104px; overflow:hidden; text-overflow:ellipsis;">${esc(nameDraft)}</span>` : ''}
      <div data-action="sh-change-design" style="position:absolute; left:12px; bottom:12px; z-index:5; display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:999px; background:rgba(0,0,0,0.4); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.28); font-size:12px; font-weight:700; color:#fff; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:15px; line-height:1;">cached</span>Change design</div>
    </div>
    <input class="sheet-input" data-action="sh-name-input" type="text" placeholder="Enter Category..." value="${esc(nameDraft)}" style="margin-top:14px; width:100%; background:rgba(120,120,128,0.1); border:1px solid rgba(60,60,67,0.1); border-radius:14px; padding:14px 16px; color:#1C1C1E; font-family:-apple-system,system-ui,sans-serif; font-size:16px; font-weight:600; outline:none;">
    <div style="margin-top:16px; font-size:11px; font-weight:800; letter-spacing:1px; color:#8E8E93; text-transform:uppercase;">Chip Style</div>
    <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:9px;">${grid}</div>
    <div style="display:flex; gap:11px; margin-top:18px;">
      ${editingCardIdx != null ? `<div data-action="sh-card-delete" style="flex:0 0 auto; width:52px; display:flex; align-items:center; justify-content:center; border-radius:14px; background:rgba(255,59,48,0.1); cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:20px; line-height:1; color:#FF3B30;">delete</span></div>` : ''}
      <div data-action="sh-name-confirm" style="flex:1; padding:14px; border-radius:14px; background:${AC}; color:#fff; font-size:15px; font-weight:700; text-align:center; cursor:pointer;">${editingCardIdx != null ? 'Save Category' : 'Create Category'}</div>
    </div>
  </div>`);
}

function tagPicker(d: Draft): string {
  const pills = TAGS.map((t) => {
    const on = d.tag === t.name;
    return `<div data-action="sh-pick-tag" data-tag="${esc(t.name)}" style="position:relative; display:inline-flex; align-items:center; gap:5px; padding:9px 15px; border-radius:999px; background:${on ? `rgba(${parseInt(t.hex.slice(1, 3), 16)},${parseInt(t.hex.slice(3, 5), 16)},${parseInt(t.hex.slice(5, 7), 16)},0.16)` : 'rgba(120,120,128,0.08)'}; border:1px solid ${on ? t.hex : 'rgba(60,60,67,0.1)'}; font-size:14px; font-weight:700; color:#1C1C1E; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:14px; line-height:1; color:${t.hex};">sell</span>${esc(t.name)}</div>`;
  }).join('');
  return scrim(70, sheetBox(`${grabber}
    <div style="padding:14px 20px 12px; display:flex; align-items:center; justify-content:space-between;">
      <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px;">Choose a tag</div>
      <div data-action="sh-clear-tag" style="display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:999px; background:rgba(120,120,128,0.12); font-size:13.5px; font-weight:700; color:#1C1C1E; white-space:nowrap; cursor:pointer;">No Tag</div>
    </div>
    <div class="cc-scroll" style="overflow-y:auto; padding:4px 18px 30px;">
      <div style="display:flex; flex-wrap:wrap; gap:9px;">${pills}
        <div data-action="sh-tag-create" style="display:inline-flex; align-items:center; justify-content:center; width:44px; height:38px; border-radius:999px; background:rgba(120,120,128,0.08); border:1.5px dashed rgba(60,60,67,0.25); cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 0; font-size:20px; line-height:1; color:#636366;">add</span></div>
      </div>
    </div>`));
}

function tagCreate(): string {
  const sw = SWATCHES.map((h) => `<div data-action="sh-tag-swatch" data-hex="${h}" style="position:relative; aspect-ratio:1; border-radius:50%; background:${h}; box-shadow:${tagDraftHex === h ? '0 0 0 3px #fff, 0 0 0 5px ' + h : 'none'}; display:flex; align-items:center; justify-content:center; cursor:pointer;">${tagDraftHex === h ? `<span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:17px; line-height:1; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.4);">check</span>` : ''}</div>`).join('');
  return scrim(78, `<div data-action="sh-noop" class="picker-box" style="background:#FFFFFF; border-top-left-radius:28px; border-top-right-radius:28px; display:flex; flex-direction:column; ${pickAnim()} padding:18px 18px 30px;">
    <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px; margin:0 2px 14px;">New Tag</div>
    <div style="display:flex; justify-content:center; margin-bottom:16px;">
      <div style="display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:999px; background:rgba(120,120,128,0.1); border:1px solid ${tagDraftHex};"><span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:15px; line-height:1; color:${tagDraftHex};">sell</span><span style="font-size:14.5px; font-weight:800; color:#1C1C1E;">${esc(tagDraftName || 'Tag name')}</span></div>
    </div>
    <input class="sheet-input" data-action="sh-tag-name" type="text" maxlength="16" placeholder="Tag name…" value="${esc(tagDraftName)}" style="width:100%; background:rgba(120,120,128,0.1); border:1px solid rgba(60,60,67,0.1); border-radius:14px; padding:14px 16px; color:#1C1C1E; font-family:-apple-system,system-ui,sans-serif; font-size:16px; font-weight:600; outline:none;">
    <div style="margin-top:16px; font-size:11px; font-weight:800; letter-spacing:1px; color:#8E8E93; text-transform:uppercase;">Color</div>
    <div style="margin-top:10px; display:grid; grid-template-columns:repeat(6,1fr); gap:10px;">${sw}</div>
    <div style="display:flex; gap:11px; margin-top:20px;">
      <div data-action="sh-tag-confirm" style="flex:1; padding:14px; border-radius:14px; background:${AC}; color:#fff; font-size:15px; font-weight:700; text-align:center; cursor:pointer;">Create Tag</div>
    </div>
  </div>`);
}

function linkPicker(d: Draft): string {
  const cands = getState().tasks.filter((t) => t.id !== d.id && !d.linkedIds.includes(t.id));
  const rows = cands.map((t) => `<div data-action="sh-link-add" data-id="${t.id}" style="display:flex; align-items:center; gap:11px; padding:12px 13px; border-radius:14px; background:#F7F7F9; border:1px solid rgba(60,60,67,0.07); cursor:pointer;">
      <span style="flex:0 0 auto; width:11px; height:11px; border-radius:50%; background:rgb(${cardFor(t.category).bg});"></span>
      <div style="flex:1; min-width:0;">
        <div style="font-size:14.5px; font-weight:700; color:#1C1C1E; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(t.title)}</div>
        <div style="margin-top:2px; font-size:11.5px; font-weight:600; color:#8E8E93; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cardFor(t.category).label}</div>
      </div>
    </div>`).join('');
  return scrim(74, `<div data-action="sh-noop" class="picker-box" style="background:#FFFFFF; border-top-left-radius:28px; border-top-right-radius:28px; max-height:82%; display:flex; flex-direction:column; padding:20px 18px 0; ${pickAnim()}">
    <div style="display:flex; align-items:center; justify-content:space-between; margin:0 2px 15px;">
      <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px;">Add Linked Task</div>
      <div data-action="sh-picker-close" style="width:32px; height:32px; border-radius:50%; background:rgba(120,120,128,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-size:19px; line-height:1; color:#636366;">close</span></div>
    </div>
    <div style="margin:8px 2px 11px; font-size:11px; font-weight:800; letter-spacing:1px; color:#8E8E93; text-transform:uppercase;">Pick existing</div>
    <div class="cc-scroll fade-b" style="overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-bottom:38px;">${rows || '<div style="padding:20px; text-align:center; font-size:14px; color:#8E8E93; font-weight:600;">No other tasks yet.</div>'}</div>
  </div>`);
}

function monthPicker(dateISO: string): string {
  const y = +viewYM.slice(0, 4), m = +viewYM.slice(5, 7) - 1;
  const blanks = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
  const byDate = new Map<string, string[]>();
  for (const t of getState().tasks) {
    const arr = byDate.get(t.date) ?? []; arr.push(`rgb(${cardFor(t.category).bg})`); byDate.set(t.date, arr);
  }
  const cells: string[] = [];
  for (let b = 0; b < blanks; b++) cells.push('<div></div>');
  for (let day = 1; day <= dim; day++) {
    const k = keyOf(new Date(y, m, day));
    const on = k === dateISO, td = k === todayISO();
    const dots = (byDate.get(k) ?? []).slice(0, 4).map((c) => `<span style="flex:0 0 auto; width:4px; height:4px; border-radius:50%; background:${c};"></span>`).join('');
    cells.push(`<div data-action="sh-pick-date" data-date="${k}" style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:5px 0; cursor:pointer;">
      <div style="width:38px; height:26px; border-radius:999px; background:${on ? AC : 'transparent'}; box-shadow:${on ? 'none' : 'none'}; display:flex; align-items:center; justify-content:center;">
        <span style="font-size:16px; line-height:1; font-weight:${on || td ? '800' : '500'}; color:${on ? '#FFFFFF' : td ? AC : '#1C1C1E'};">${day}</span>
      </div>
      <div style="display:flex; flex-wrap:wrap; justify-content:center; align-content:flex-start; gap:2px; width:16px; height:10px;">${dots}</div>
    </div>`);
  }
  return scrim(82, `<div data-action="sh-noop" class="picker-box" style="background:#FFFFFF; border-top-left-radius:28px; border-top-right-radius:28px; padding:12px 22px 34px; ${pickAnim()}">
    ${grabber.replace('margin:12px auto 0', 'margin:0 auto 18px')}
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div style="font-size:28px; font-weight:800; letter-spacing:-0.6px;">${MON[m]} <span style="color:${AC};">${y}</span></div>
      <div style="display:flex; align-items:center; gap:6px;">
        <div data-action="sh-month-shift" data-dir="-1" style="width:34px; height:34px; border-radius:999px; background:rgba(120,120,128,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-size:19px; color:#636366;">chevron_left</span></div>
        <div data-action="sh-month-shift" data-dir="1" style="width:34px; height:34px; border-radius:999px; background:rgba(120,120,128,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;"><span style="font-family:'Material Symbols Rounded'; font-size:19px; color:#636366;">chevron_right</span></div>
        <div data-action="sh-month-today" style="display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:999px; background:rgba(120,120,128,0.12); font-size:13.5px; font-weight:700; color:#1C1C1E; white-space:nowrap; cursor:pointer;">Today</div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:2px;">${DOWS.map((w) => `<div style="text-align:center; font-size:13px; font-weight:700; color:#8E8E93;">${w}</div>`).join('')}</div>
    <div style="height:1px; background:rgba(60,60,67,0.1); margin:8px 0 6px;"></div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); row-gap:7px;">${cells.join('')}</div>
  </div>`);
}

function timePicker(d: Draft): string {
  const modes = [['allday', 'All-day'], ['single', 'Time'], ['range', 'Range']];
  const seg = modes.map(([k, l]) => {
    const on = d.time.mode === k;
    return `<div data-action="sh-time-mode" data-mode="${k}" class="seg" style="flex:1; text-align:center; padding:10px 4px; border-radius:9px; font-size:14px; font-weight:700; color:${on ? '#1C1C1E' : '#8E8E93'}; background:${on ? '#FFFFFF' : 'transparent'}; box-shadow:${on ? '0 1px 3px rgba(30,30,40,0.14)' : 'none'}; cursor:pointer;">${l}</div>`;
  }).join('');
  const side = timeSide;
  const cur = side === 'start' ? { h: d.time.sh, m: d.time.sm, ap: d.time.sap } : { h: d.time.eh, m: d.time.em, ap: d.time.eap };
  const col = (key: string, items: string[], selIdx: number) =>
    `<div class="wheel" data-twheel="${key}" data-sel="${selIdx}" style="height:210px; width:74px; overflow-y:scroll; scroll-snap-type:y mandatory;">
      <div style="height:84px;"></div>
      ${items.map((it) => `<div style="height:42px; scroll-snap-align:center; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; color:#1C1C1E;">${it}</div>`).join('')}
      <div style="height:84px;"></div>
    </div>`;
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const mins = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  const body = d.time.mode === 'allday'
    ? `<div style="height:200px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;">
        <span style="font-family:'Material Symbols Rounded'; font-variation-settings:'FILL' 1; font-size:50px; line-height:1; color:${AC};">wb_sunny</span>
        <div style="font-size:18px; font-weight:800;">All-day task</div>
        <div style="font-size:13px; font-weight:500; color:#8E8E93;">No specific time</div>
      </div>`
    : `${d.time.mode === 'range' ? `<div style="display:flex; gap:8px; margin-bottom:14px;">
        <div data-action="sh-time-side" data-side="start" class="tside" style="flex:1; text-align:center; padding:11px; border-radius:13px; background:${side === 'start' ? AC_TINT : 'rgba(120,120,128,0.1)'}; border:1.5px solid ${side === 'start' ? AC : 'transparent'}; cursor:pointer;">
          <div style="font-size:11px; font-weight:800; letter-spacing:0.5px; color:${side === 'start' ? AC : '#8E8E93'};">START</div>
          <div data-time-start style="font-size:16px; font-weight:800; color:#1C1C1E; margin-top:2px;">${fmt(d.time.sh, d.time.sm, d.time.sap)}</div>
        </div>
        <div data-action="sh-time-side" data-side="end" class="tside" style="flex:1; text-align:center; padding:11px; border-radius:13px; background:${side === 'end' ? AC_TINT : 'rgba(120,120,128,0.1)'}; border:1.5px solid ${side === 'end' ? AC : 'transparent'}; cursor:pointer;">
          <div style="font-size:11px; font-weight:800; letter-spacing:0.5px; color:${side === 'end' ? AC : '#8E8E93'};">END</div>
          <div data-time-end style="font-size:16px; font-weight:800; color:#1C1C1E; margin-top:2px;">${fmt(d.time.eh, d.time.em, d.time.eap)}</div>
        </div>
      </div>` : ''}
      <div style="position:relative;">
        <div style="position:absolute; top:84px; left:0; right:0; height:42px; background:rgba(120,120,128,0.14); border-top:1px solid rgba(60,60,67,0.12); border-bottom:1px solid rgba(60,60,67,0.12); border-radius:10px; pointer-events:none;"></div>
        <div style="display:flex; justify-content:center; align-items:center;">
          ${col('th', hours, cur.h - 1)}${col('tm', mins, Math.round(cur.m / 5) % 12)}${col('tap', ['AM', 'PM'], cur.ap === 'AM' ? 0 : 1)}
        </div>
      </div>`;
  return scrim(84, `<div data-action="sh-noop" class="picker-box" style="background:#FFFFFF; border-top-left-radius:28px; border-top-right-radius:28px; padding:14px 20px 32px; ${pickAnim()}">
    ${grabber.replace('margin:12px auto 0', 'margin:0 auto 14px')}
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px;">When</div>
      <div data-action="sh-picker-close" style="font-size:16px; font-weight:700; color:${AC}; padding:4px 6px; cursor:pointer;">Done</div>
    </div>
    <div style="display:flex; gap:4px; background:rgba(120,120,128,0.12); border-radius:12px; padding:3px; margin-bottom:18px;">${seg}</div>
    ${body}
  </div>`);
}

// ---------- wiring ----------
export function wireSheet(root: HTMLElement, rerender: () => void) {
  consumePicker();
  // time wheels: 42px rows, centered by the 84px spacer
  root.querySelectorAll('[data-twheel]').forEach((w) => {
    const el = w as HTMLElement;
    const key = el.dataset.twheel!;
    el.scrollTop = Number(el.dataset.sel || 0) * 42;
    let t: ReturnType<typeof setTimeout>;
    el.addEventListener('scroll', () => {
      clearTimeout(t);
      // Patch the labels in place — re-rendering mid-scroll rebuilt the DOM and
      // fought the momentum, which is what made the wheels feel sticky.
      t = setTimeout(() => {
        if (!draft) return;
        const idx = Math.max(0, Math.round(el.scrollTop / 42));
        const S = timeSide === 'start';
        if (key === 'th') { const v = Math.min(11, idx) + 1; S ? (draft.time.sh = v) : (draft.time.eh = v); }
        else if (key === 'tm') { const v = Math.min(11, idx) * 5; S ? (draft.time.sm = v) : (draft.time.em = v); }
        else { const v = idx === 0 ? 'AM' : 'PM'; S ? (draft.time.sap = v as 'AM') : (draft.time.eap = v as 'AM'); }
        const st = root.querySelector('[data-time-start]');
        if (st) st.textContent = fmt(draft.time.sh, draft.time.sm, draft.time.sap);
        const en = root.querySelector('[data-time-end]');
        if (en) en.textContent = fmt(draft.time.eh, draft.time.em, draft.time.eap);
      }, 90);
    }, { passive: true });
  });
  // linked-task drag reorder
  root.querySelectorAll('[data-drag]').forEach((n) => {
    const el = n as HTMLElement;
    el.addEventListener('dragstart', () => { dragFrom = Number(el.dataset.drag); el.style.opacity = '0.5'; });
    el.addEventListener('dragend', () => { el.style.opacity = '1'; dragFrom = null; });
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draft || dragFrom == null) return;
      const to = Number(el.dataset.drag);
      const arr = draft.linkedIds;
      const [moved] = arr.splice(dragFrom, 1); arr.splice(to, 0, moved);
      dragFrom = null; rerender();
    });
  });
}

function syncInputs() {
  const ti = document.querySelector('[data-action="sh-title"]') as HTMLTextAreaElement | null;
  const no = document.querySelector('[data-action="sh-notes"]') as HTMLTextAreaElement | null;
  const tn = document.querySelector('[data-action="sh-tag-name"]') as HTMLInputElement | null;
  if (draft && ti) draft.title = ti.value;
  if (draft && no) draft.notes = no.value;
  if (tn) tagDraftName = tn.value;
}

// returns true when the caller should re-render
export function handleSheetAction(action: string, el: HTMLElement, ctx: { setSel: (d: string) => void }): boolean {
  if (action === 'sh-noop') return false;
  if (action === 'sh-title' || action === 'sh-notes' || action === 'sh-tag-name') { syncInputs(); return false; }
  if (action === 'sh-name-input') { nameDraft = (el as HTMLInputElement).value; return false; }
  syncInputs();
  const d = draft;
  if (['sh-card-open','sh-tag-open','sh-tag-create','sh-link-open','sh-date','sh-time','sh-new-category','sh-pick-design','sh-card-edit','sh-change-design'].includes(action)) pickerAnimPending = true;
  switch (action) {
    case 'sh-cancel': open = false; picker = null; draft = null; return true;
    case 'sh-picker-close': picker = null; return true;
    case 'sh-prio': if (d) d.priority = (d.priority + 1) % 3; return true;
    case 'sh-recur': if (d) d.recurring = !d.recurring; return true;
    case 'sh-card-open': picker = 'card'; return true;
    case 'sh-tag-open': picker = 'tag'; return true;
    case 'sh-tag-create': tagDraftName = ''; tagDraftHex = SWATCHES[0]; picker = 'tagCreate'; return true;
    case 'sh-tag-swatch': tagDraftHex = el.dataset.hex || SWATCHES[0]; return true;
    case 'sh-tag-confirm': {
      const name = tagDraftName.trim();
      if (name) { if (!TAGS.some((t) => t.name === name)) TAGS.push({ name, hex: tagDraftHex }); if (d) d.tag = name; }
      picker = 'tag'; return true;
    }
    case 'sh-link-open': picker = 'link'; return true;
    case 'sh-new-category': pendingDesign = null; nameDraft = ''; chipDraft = 'white'; editingCardIdx = null; picker = 'design'; return true;
    case 'sh-change-design': picker = 'design'; return true;
    case 'sh-pick-design': {
      const i = Number(el.dataset.idx || 0);
      pendingDesign = DESIGN_LIB[i]; picker = 'naming'; return true;
    }
    case 'sh-name-input': nameDraft = (el as HTMLInputElement).value; return false;
    case 'sh-chip-style': chipDraft = el.dataset.id || 'white'; return true;
    case 'sh-card-edit': {
      const i = Number(el.dataset.idx || 0);
      const c = getState().cards[i]; if (!c) return false;
      editingCardIdx = i; pendingDesign = { label: c.name, rgb: c.rgb, img: c.img };
      nameDraft = c.name; chipDraft = c.styleId || 'white'; picker = 'naming'; return true;
    }
    case 'sh-card-delete': {
      if (editingCardIdx == null) return false;
      deleteCard(editingCardIdx); editingCardIdx = null; pendingDesign = null; picker = 'card'; return true;
    }
    case 'sh-name-confirm': {
      const nm = (document.querySelector('[data-action="sh-name-input"]') as HTMLInputElement | null)?.value ?? nameDraft;
      const name = nm.trim() || 'New Category';
      if (!pendingDesign) return false;
      const card: CardDef = { name, rgb: pendingDesign.rgb, img: pendingDesign.img, styleId: chipDraft };
      if (editingCardIdx != null) {
        const prev = getState().cards[editingCardIdx];
        updateCard(editingCardIdx, card);
        if (prev && prev.name !== name) {
          for (const t of getState().tasks) if (t.category === prev.name) updateTask(t.id, { category: name });
        }
        if (d && d.category === prev?.name) d.category = name;
      } else {
        addCard(card);
        if (d) d.category = name;
      }
      editingCardIdx = null; pendingDesign = null; picker = 'card'; return true;
    }
    case 'sh-link-add': if (d && el.dataset.id) { d.linkedIds.push(el.dataset.id); picker = null; } return true;
    case 'sh-unlink': if (d && el.dataset.id) d.linkedIds = d.linkedIds.filter((x) => x !== el.dataset.id); return true;
    case 'sh-pick-card': if (d) d.category = el.dataset.cat || null; picker = null; return true;
    case 'sh-pick-tag': if (d) d.tag = el.dataset.tag || null; picker = null; return true;
    case 'sh-clear-tag': if (d) d.tag = null; picker = null; return true;
    case 'sh-date': monthTarget = 'dt'; viewYM = (d?.date ?? todayISO()).slice(0, 7); picker = 'month'; return true;
    case 'sh-time': timeSide = 'start'; picker = 'time'; return true;
    case 'sh-time-mode': if (d) d.time.mode = (el.dataset.mode as TimeSpec['mode']) || 'single'; return true;
    case 'sh-time-side': timeSide = (el.dataset.side as 'start' | 'end') || 'start'; return true;
    case 'sh-month-shift': {
      const dir = Number(el.dataset.dir || 1);
      const nd = new Date(+viewYM.slice(0, 4), +viewYM.slice(5, 7) - 1 + dir, 1);
      viewYM = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`; return true;
    }
    case 'sh-month-today': {
      const t = todayISO(); viewYM = t.slice(0, 7);
      if (monthTarget === 'dt' && d) d.date = t; else ctx.setSel(t);
      picker = null; return true;
    }
    case 'sh-pick-date': {
      const k = el.dataset.date; if (!k) return false;
      if (monthTarget === 'dt' && d) d.date = k; else ctx.setSel(k);
      picker = null; return true;
    }
    case 'sh-delete': if (d?.id) removeTask(d.id); open = false; picker = null; draft = null; return true;
    case 'sh-save': {
      if (!d) return false;
      if (!d.title.trim()) { (document.querySelector('[data-action="sh-title"]') as HTMLTextAreaElement | null)?.focus(); return false; }
      const prio = (['low', 'medium', 'high'] as const)[d.priority];
      const time = d.time.mode === 'allday' ? undefined
        : { startMinutes: to24(d.time.sh, d.time.sap) * 60 + d.time.sm, ...(d.time.mode === 'range' ? { endMinutes: to24(d.time.eh, d.time.eap) * 60 + d.time.em } : {}) };
      const base = {
        title: d.title.trim(), category: d.category ?? 'personal', priority: prio, date: d.date,
        notes: d.notes.trim() || undefined, recurrence: d.recurring ? ({ kind: 'daily' } as const) : undefined,
      };
      if (d.id) updateTask(d.id, { ...base, time, tagIds: d.tag ? [d.tag] : [], linkedIds: d.linkedIds } as Partial<Task>);
      else addTask({ ...base, timeStart: time?.startMinutes, timeEnd: time?.endMinutes, tagIds: d.tag ? [d.tag] : [], linkedIds: d.linkedIds } as never);
      open = false; picker = null; draft = null; return true;
    }
  }
  return false;
}
