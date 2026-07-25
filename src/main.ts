import './style.css';
import {
  STATUS_BAR, renderNav, renderTasks, renderCalendar, renderSearch, renderSkeleton,
  getTab, setTab, setCat, setSel, getSel,
  openSearch, closeSearch, setSearchQuery, isSearchOpen,
} from './odyssey';
import {
  openCreate, openEdit, openMonthFor, renderSheet, handleSheetAction, wireSheet, isSheetOpen,
} from './sheet';
import { completeTask, subscribe } from './store';

const app = document.getElementById('app')!;

// Kill iOS standalone rubber-band: allow a touch-drag only when it's inside a
// scroll container that can actually scroll; block it everywhere else.
document.addEventListener('touchmove', (e) => {
  let el = e.target as HTMLElement | null;
  while (el && el !== document.body) {
    if ((el.classList?.contains('cc-scroll') || el.classList?.contains('wheel')) &&
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
      <div id="scroll" class="cc-scroll" style="position:absolute; inset:0; overflow-y:auto; padding:calc(env(safe-area-inset-top, 0px) + 14px) 0 calc(env(safe-area-inset-bottom, 0px) + 108px);"></div>
      <div id="nav"></div>
      <div id="search"></div>
      <div id="sheet"></div>
      ${renderSkeleton()}
    </div>`;
  // skeleton fades out once the first paint settles (design: skFade)
  setTimeout(() => {
    const s = app.querySelector('#skel') as HTMLElement | null;
    if (!s) return;
    s.style.animation = 'skFade .35s ease forwards';
    setTimeout(() => s.remove(), 380);
  }, 550);
  const sc = app.querySelector('#scroll') as HTMLElement;
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

function renderSearchLayer() {
  const layer = app.querySelector('#search') as HTMLElement | null;
  if (!layer) return;
  const wasFocused = (document.activeElement as HTMLElement | null)?.dataset?.action === 'search-input';
  layer.innerHTML = renderSearch();
  const input = layer.querySelector('[data-action="search-input"]') as HTMLInputElement | null;
  if (input) { input.focus(); if (wasFocused) input.setSelectionRange(input.value.length, input.value.length); }
}

function renderSheetLayer() {
  const layer = app.querySelector('#sheet') as HTMLElement | null;
  if (!layer) return;
  layer.innerHTML = renderSheet(getSel());
  wireSheet(layer, renderSheetLayer);
}

function render() {
  if (!built) buildShell();
  renderScreen();
  renderSearchLayer();
  renderSheetLayer();
}

subscribe(() => { renderScreen(); if (isSearchOpen()) renderSearchLayer(); });

const sheetCtx = { setSel: (d: string) => { setSel(d); renderScreen(); } };

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  const { action, cat, id, date } = el.dataset;
  if (!action) return;

  if (action.startsWith('sh-')) {
    if (handleSheetAction(action, el, sheetCtx)) {
      renderSheetLayer();
      if (!isSheetOpen()) renderScreen();
    }
    return;
  }
  switch (action) {
    case 'tab-tasks': setTab('tasks'); renderScreen(); break;
    case 'tab-calendar': setTab('calendar'); renderScreen(); break;
    case 'cat': if (cat) { setCat(cat); renderScreen(); } break;
    case 'cal-day': if (date) { setSel(date); renderScreen(); } break;
    case 'toggle': if (id) completeTask(id, date); break;
    case 'open': if (id) { if (isSearchOpen()) { closeSearch(); renderSearchLayer(); } openEdit(id); renderSheetLayer(); } break;
    case 'add': openCreate(getTab() === 'calendar' ? getSel() : undefined); renderSheetLayer(); break;
    case 'month-open': openMonthFor('sel', getSel().slice(0, 7)); renderSheetLayer(); break;
    case 'search-open': openSearch(); renderSearchLayer(); break;
    case 'search-close': closeSearch(); renderSearchLayer(); break;
  }
});

// keep typed text in the draft as you type (textareas/inputs re-render on other taps)
app.addEventListener('input', (e) => {
  const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  const a = el?.dataset.action;
  if (!a || !el) return;
  if (a.startsWith('sh-')) handleSheetAction(a, el, sheetCtx);
  else if (a === 'search-input') { setSearchQuery((el as HTMLInputElement).value); renderSearchLayer(); }
});

render();
