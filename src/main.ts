import './style.css';
import { renderHome } from './screens/home';
import { renderCalendar, handleCalendarAction } from './screens/calendar';
import { renderTasks, setTaskFilter } from './screens/tasks';
import { renderProfile } from './screens/profile';
import { renderRewards, handleRewardsAction } from './screens/rewards';
import { renderNav, navIndexForRoute, placePill } from './nav';
import { openCreate, openEdit, renderSheet, handleSheetAction, wireSheet, isSheetOpen } from './screens/task-sheet';
import { renderAchToast, renderRankUp } from './screens/overlays';
import { subscribe, addTask, completeTask, resetState, consumeEvents, type LMEvent } from './store';
import { todayISO } from './util';

const STATUS_BAR = `
  <div style="position:absolute; top:0; left:0; right:0; height:54px; z-index:30; display:flex; align-items:flex-end; justify-content:space-between; padding:0 28px 7px; background:#000;">
    <div style="display:flex; align-items:center; gap:7px;">
      <span style="font-size:16px; font-weight:800; letter-spacing:-0.2px;">1:13</span>
      <svg width="15" height="15" viewBox="0 0 16 16"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8 5.6 5.6 0 1 0 13.2 9.6z" fill="#fff"/></svg>
    </div>
    <div style="display:flex; align-items:center; gap:7px;">
      <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx="1" fill="rgba(255,255,255,0.42)"/><rect x="15" y="0.5" width="3" height="11.5" rx="1" fill="rgba(255,255,255,0.42)"/></svg>
      <span style="font-size:15px; font-weight:800;">5G</span>
      <svg width="28" height="13" viewBox="0 0 28 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="rgba(255,255,255,0.45)"/><rect x="2.2" y="2.2" width="19.6" height="8.6" rx="2.2" fill="#fff"/><rect x="25" y="4" width="1.8" height="5" rx="0.9" fill="rgba(255,255,255,0.45)"/></svg>
    </div>
  </div>`;

const app = document.getElementById('app')!;

function routeName(): string {
  return location.hash.replace(/^#/, '') || '/';
}

function screenFor(route: string): string {
  switch (route) {
    case '/': return renderHome();
    case '/calendar': return renderCalendar();
    case '/tasks': return renderTasks();
    case '/rewards': return renderRewards();
    case '/profile': return renderProfile();
    default: return renderHome();
  }
}

let built = false;
let firstNav = true;

function buildShell() {
  const active = navIndexForRoute(routeName());
  app.innerHTML = `
    <div class="frame">
      ${STATUS_BAR}
      <div class="cc-scroll" style="position:absolute; inset:0; overflow-y:auto; padding:64px 20px 122px;"></div>
      ${renderNav(active)}
      <div id="sheet"></div>
      <div id="overlay"></div>
    </div>`;
  built = true;
}

// ---- celebration overlay queue ----
const ovQueue: LMEvent[] = [];
let ovShowing = false;
function setOverlay(html: string) {
  const l = app.querySelector('#overlay') as HTMLElement | null;
  if (l) l.innerHTML = html;
}
function pumpOverlays() {
  if (ovShowing) return;
  const ev = ovQueue.shift();
  if (!ev) { setOverlay(''); return; }
  ovShowing = true;
  if (ev.type === 'rankup') {
    setOverlay(renderRankUp(ev.rank, ev.tier)); // dismissed by tap (ov-dismiss)
  } else {
    setOverlay(renderAchToast(ev.name, ev.category));
    setTimeout(() => { ovShowing = false; pumpOverlays(); }, 3200);
  }
}
function drainEvents() {
  const evs = consumeEvents();
  if (evs.length) { ovQueue.push(...evs); pumpOverlays(); }
}

function renderScreen() {
  const scroll = app.querySelector('.cc-scroll') as HTMLElement | null;
  if (scroll) scroll.innerHTML = screenFor(routeName());
}

function renderSheetLayer() {
  const layer = app.querySelector('#sheet') as HTMLElement | null;
  if (!layer) return;
  layer.innerHTML = renderSheet();
  wireSheet(layer);
}

function updateNav() {
  const active = navIndexForRoute(routeName());
  const bar = app.querySelector('[data-nav]') as HTMLElement | null;
  if (!bar) return;
  bar.setAttribute('data-active', String(active));
  bar.querySelectorAll('a .ms').forEach((el, i) => {
    (el as HTMLElement).style.color = i === active ? '#34CEE9' : '#9A9AA2';
  });
  requestAnimationFrame(() => placePill(!firstNav));
  firstNav = false;
}

function render() {
  if (!built) buildShell();
  renderScreen();
  updateNav();
  renderSheetLayer();
}

window.addEventListener('hashchange', render);
subscribe(() => { renderScreen(); drainEvents(); }); // state changed -> refresh + fire celebrations

// Delegated interactions (buttons live inside re-rendered HTML strings).
app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  const { action, cat, id, date } = el.dataset;
  if (!action) return;
  if (action === 'ov-dismiss') { ovShowing = false; pumpOverlays(); return; }
  // task create/edit sheet
  if (action === 'add') { openCreate(); renderSheetLayer(); return; }
  if (action === 'open' && id) { openEdit(id); renderSheetLayer(); return; }
  if (action.startsWith('ts-')) {
    const changed = handleSheetAction(action, el);
    if (changed) { renderSheetLayer(); if (!isSheetOpen()) renderScreen(); }
    return;
  }
  if (action.startsWith('shop-') || action.startsWith('modal-') || action === 'rar') {
    if (handleRewardsAction(action, el, renderScreen)) renderScreen();
    return;
  }
  if (action.startsWith('cal-')) {
    if (handleCalendarAction(action, el)) renderScreen();
    return;
  }
  if (action === 'filter' && cat) { setTaskFilter(cat); renderScreen(); }
  else if (action === 'toggle' && id) { completeTask(id, date); }
});

render();

// Temporary dev helpers (console): __demo() completes a task; __seed() populates a varied list.
const dev = window as unknown as { __demo: () => void; __seed: () => void };
dev.__demo = () => {
  const t = addTask({ title: 'Demo task', category: 'health', priority: 'high', date: todayISO() });
  completeTask(t.id);
};
dev.__seed = () => {
  resetState();
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yISO = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  const tm = new Date(); tm.setDate(tm.getDate() + 1);
  const tmISO = `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`;
  addTask({ title: 'Email Dr. Chen about referral', category: 'health', priority: 'high', date: yISO, timeStart: 540 });
  addTask({ title: 'Finish Q3 budget review', category: 'work', priority: 'high', date: todayISO(), timeStart: 840 });
  addTask({ title: 'Morning run · 5k', category: 'health', priority: 'low', date: todayISO(), timeStart: 420 });
  addTask({ title: 'Pay credit card', category: 'finance', priority: 'medium', date: todayISO(), timeStart: 1080 });
  addTask({ title: 'Read 20 pages — Atomic Habits', category: 'learning', priority: 'low', date: todayISO(), timeStart: 1260 });
  addTask({ title: 'Team standup notes', category: 'work', priority: 'low', date: tmISO, timeStart: 570 });
};
