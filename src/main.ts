import './style.css';
import {
  STATUS_BAR, renderNav, renderTasks, renderCalendar,
  getTab, setTab, setCat, setSel,
} from './odyssey';
import { openCreate, openEdit, renderSheet, handleSheetAction, wireSheet, isSheetOpen } from './screens/task-sheet';
import { completeTask, subscribe } from './store';

const app = document.getElementById('app')!;

// Kill iOS standalone rubber-band: allow a touch-drag only when it's inside a
// scroll container (.cc-scroll) that can actually scroll; block it everywhere else.
document.addEventListener('touchmove', (e) => {
  let el = e.target as HTMLElement | null;
  while (el && el !== document.body) {
    if (el.classList?.contains('cc-scroll') &&
        (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) return;
    el = el.parentElement;
  }
  if (e.cancelable) e.preventDefault();
}, { passive: false });

let built = false;

function buildShell() {
  app.innerHTML = `
    <div class="frame">
      ${STATUS_BAR}
      <div id="scroll" class="cc-scroll" style="position:absolute; inset:0; overflow-y:auto; padding:66px 0 128px;"></div>
      <div id="nav"></div>
      <div id="sheet"></div>
    </div>`;
  const sc = app.querySelector('#scroll') as HTMLElement;
  // top blur fades in once scrolled (design behavior)
  sc.addEventListener('scroll', () => {
    const b = app.querySelector('#topblur') as HTMLElement | null;
    if (b) b.style.opacity = sc.scrollTop > 6 ? '1' : '0';
  }, { passive: true });
  built = true;
}

function renderScreen() {
  const sc = app.querySelector('#scroll') as HTMLElement | null;
  if (sc) sc.innerHTML = getTab() === 'tasks' ? renderTasks() : renderCalendar();
  const nav = app.querySelector('#nav') as HTMLElement | null;
  if (nav) nav.innerHTML = renderNav();
}

function renderSheetLayer() {
  const layer = app.querySelector('#sheet') as HTMLElement | null;
  if (!layer) return;
  layer.innerHTML = renderSheet();
  wireSheet(layer);
}

function render() {
  if (!built) buildShell();
  renderScreen();
  renderSheetLayer();
}

subscribe(() => renderScreen());

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  const { action, cat, id, date } = el.dataset;
  if (!action) return;

  if (action.startsWith('ts-')) {
    const changed = handleSheetAction(action, el);
    if (changed) { renderSheetLayer(); if (!isSheetOpen()) renderScreen(); }
    return;
  }
  switch (action) {
    case 'tab-tasks': setTab('tasks'); renderScreen(); break;
    case 'tab-calendar': setTab('calendar'); renderScreen(); break;
    case 'cat': if (cat) { setCat(cat); renderScreen(); } break;
    case 'cal-day': if (date) { setSel(date); renderScreen(); } break;
    case 'toggle': if (id) completeTask(id, date); break;
    case 'open': if (id) { openEdit(id); renderSheetLayer(); } break;
    case 'add': openCreate(); renderSheetLayer(); break;
    // 'search-open' / 'month-open' land in the next pass (design sheets)
  }
});

render();
