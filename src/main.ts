import './style.css';
import {
  STATUS_BAR, renderNav, renderTasks, renderCalendar, renderSearch, renderSkeleton,
  getTab, setTab, setCat, setSel, getSel, noteCompleted, clearLingering,
  openSearch, closeSearch, setSearchQuery, isSearchOpen,
} from './odyssey';
import {
  openCreate, openEdit, openMonthFor, renderSheet, handleSheetAction, wireSheet, isSheetOpen,
} from './sheet';
import { completeTask, uncompleteTask, isDone, subscribe } from './store';
import { seedDemoIfEmpty } from './demo';
import {
  renderExportButton, renderExportPanel, shareExport, exportJSON,
  openExportPanel, closeExportPanel, toast,
} from './export';

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
      <div id="scroll" class="cc-scroll" style="position:absolute; inset:0; overflow-y:auto; padding:calc(env(safe-area-inset-top, 0px) + 6px) 0 calc(env(safe-area-inset-bottom, 0px) + 104px);"></div>
      <div id="nav"></div>
      <div id="search"></div>
      <div id="sheet"></div>
      <div id="export"></div>
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
  // The export block is a temporary migration tool bolted onto the Tasks list,
  // not part of the design — kept out of odyssey.ts so removing it is one delete.
  if (sc) sc.innerHTML = getTab() === 'tasks'
    ? renderTasks() + `<div style="padding:0 20px;">${renderExportButton()}</div>`
    : renderCalendar();
  const nav = app.querySelector('#nav') as HTMLElement | null;
  if (nav) nav.innerHTML = renderNav();
}

function renderExportLayer() {
  const layer = app.querySelector('#export') as HTMLElement | null;
  if (layer) layer.innerHTML = renderExportPanel();
}

function fitSearchPane() {
  const pane = document.getElementById('searchpane');
  const vv = window.visualViewport;
  if (pane && vv) pane.style.height = `${vv.height}px`;
}
window.visualViewport?.addEventListener('resize', fitSearchPane);
window.visualViewport?.addEventListener('scroll', fitSearchPane);

function renderSearchLayer() {
  const layer = app.querySelector('#search') as HTMLElement | null;
  if (!layer) return;
  const wasFocused = (document.activeElement as HTMLElement | null)?.dataset?.action === 'search-input';
  layer.innerHTML = renderSearch();
  const input = layer.querySelector('[data-action="search-input"]') as HTMLInputElement | null;
  if (input) { input.focus(); if (wasFocused) input.setSelectionRange(input.value.length, input.value.length); }
  fitSearchPane();
}

function renderSheetLayer() {
  const layer = app.querySelector('#sheet') as HTMLElement | null;
  if (!layer) return;
  layer.innerHTML = renderSheet(getSel());
  wireSheet(layer, renderSheetLayer);
  wireSheetDrag(layer);
}

// Bottom sheets follow your finger downward and dismiss on a decisive drag/flick.
function wireSheetDrag(layer: HTMLElement) {
  layer.querySelectorAll('.picker-box').forEach((n) => {
    const box = n as HTMLElement;
    let y0 = 0, dy = 0, t0 = 0, dragging = false;
    box.addEventListener('touchstart', (e) => {
      const inner = (e.target as HTMLElement).closest('.cc-scroll, .wheel') as HTMLElement | null;
      if (inner && inner.scrollTop > 0) return;   // let the inner list scroll first
      dragging = true; dy = 0; y0 = e.touches[0].clientY; t0 = Date.now();
      box.style.transition = 'none';
    }, { passive: true });
    box.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      dy = e.touches[0].clientY - y0;
      const shift = dy < 0 ? dy * 0.22 : dy;      // resistance when pulling up
      box.style.transform = `translateY(${shift}px)`;
    }, { passive: true });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      const flick = dy / Math.max(1, Date.now() - t0) > 0.6;
      box.style.transition = 'transform .3s cubic-bezier(.22,.9,.25,1)';
      if (dy > 110 || (flick && dy > 40)) {
        box.style.transform = 'translateY(110%)';
        setTimeout(() => { if (handleSheetAction('sh-picker-close', box, sheetCtx)) renderSheetLayer(); }, 210);
      } else {
        box.style.transform = '';
      }
    };
    box.addEventListener('touchend', end, { passive: true });
    box.addEventListener('touchcancel', end, { passive: true });
  });
}

function render() {
  if (!built) buildShell();
  renderScreen();
  renderSearchLayer();
  renderSheetLayer();
  renderExportLayer();
}

subscribe(() => { renderScreen(); if (isSearchOpen()) renderSearchLayer(); });

const sheetCtx = { setSel: (d: string) => { setSel(d); renderScreen(); } };

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  const { action, cat, id, date } = el.dataset;
  if (!action) return;

  if (action === 'sh-unlink') {
    const row = el.closest('[data-drag]') as HTMLElement | null;
    if (row) {
      row.classList.add('lk-out');
      setTimeout(() => { if (handleSheetAction(action, el, sheetCtx)) renderSheetLayer(); }, 200);
      return;
    }
  }
  if (action.startsWith('sh-')) {
    const closesSheet = action === 'sh-cancel' || action === 'sh-save' || action === 'sh-delete';
    const root = app.querySelector('.sheet-layer') as HTMLElement | null;
    const changed = handleSheetAction(action, el, sheetCtx);
    if (!changed) return;
    if (closesSheet && !isSheetOpen() && root) {
      root.style.animation = 'ccSheetOut .3s cubic-bezier(.4,0,.6,1) forwards';
      renderScreen();
      setTimeout(renderSheetLayer, 290);
      return;
    }
    renderSheetLayer();
    if (!isSheetOpen()) renderScreen();
    return;
  }
  switch (action) {
    case 'tab-tasks': setTab('tasks'); renderScreen(); break;
    case 'tab-calendar': setTab('calendar'); renderScreen(); break;
    case 'cat': if (cat) { setCat(cat); renderScreen(); } break;
    case 'cal-day': if (date) { setSel(date); renderScreen(); } break;
    case 'toggle': {
      if (!id) break;
      const day = date || getSel();
      if (isDone(id, day)) uncompleteTask(id, day);          // un-check
      else { noteCompleted(id); completeTask(id, day); }      // mark first: completeTask re-renders synchronously
      break;
    }
    case 'open': if (id) { if (isSearchOpen()) { closeSearch(); renderSearchLayer(); } openEdit(id); renderSheetLayer(); } break;
    case 'add': openCreate(getTab() === 'calendar' ? getSel() : undefined); renderSheetLayer(); break;
    case 'month-open': openMonthFor('sel', getSel().slice(0, 7)); renderSheetLayer(); break;
    case 'search-open': clearLingering(); openSearch(); renderSearchLayer(); break;
    case 'search-close': closeSearch(); renderSearchLayer(); break;

    // ---- temporary: Stage 0 data export (remove with src/export.ts) ----
    case 'export-share':
      shareExport().then((r) => {
        if (r === 'shared') toast('Shared — AirDrop it to your Mac');
        else if (r === 'downloaded') toast('Saved to Files');
        else if (r === 'unsupported') { openExportPanel(); renderExportLayer(); }
      });
      break;
    case 'export-show': openExportPanel(); renderExportLayer(); break;
    case 'export-scrim':
    case 'export-close': closeExportPanel(); renderExportLayer(); break;
    case 'export-copy': {
      const ta = app.querySelector('[data-action="export-text"]') as HTMLTextAreaElement | null;
      const done = () => toast('Copied');
      navigator.clipboard?.writeText(exportJSON()).then(done).catch(() => {
        // iOS Safari denies clipboard writes outside some gestures — fall back
        // to selecting the text so a long-press → Copy works.
        if (ta) { ta.focus(); ta.setSelectionRange(0, ta.value.length); }
      });
      break;
    }
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

seedDemoIfEmpty();
render();
