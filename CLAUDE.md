# Odyssey — project handoff

A personal **Tasks & Calendar** iPhone app. Installed PWA, light-mode iOS design.

- **Live:** https://hamzaaboubakr.github.io/life/
- **Repo:** `HamzaAboubakr/life` (public) — every push to `main` auto-deploys via GitHub Actions
- **Source of truth for the design:** `~/Downloads/newlfeapp/design_handoff_tasks_calendar/Tasks & Calendar.dc.html`

## Ground rules (from the design handoff — do not violate)

**Ship the design as-is. Do not redesign, restyle, or "improve" it.** Markup, inline
styles, colors, spacing and animations are transcribed **verbatim** from the design
file. The only permitted changes are wiring real data in and fixing bugs. If something
seems wrong, ask the owner — don't reinterpret it.

## Stack

Vite + vanilla TypeScript. No framework. Screens are functions returning HTML strings,
re-rendered into layers; interactions go through delegated `data-action` handlers in
`src/main.ts`. State lives in `localStorage` (single-device; no server, no accounts).

```
src/
  main.ts      app shell, layers (#scroll #nav #search #sheet), delegated actions,
               sheet drag-to-dismiss, iOS rubber-band guard
  odyssey.ts   Tasks + Calendar + task card + category chips + nav + search + skeleton
  sheet.ts     create/edit sheet + card / tag / link / month / wheel-time pickers,
               category builder (design picker + naming + chip styles)
  store.ts     persisted state: tasks, completions, cards (categories)
  demo.ts      one-time sample data (only seeds when the app is empty)
  core/        framework-agnostic rules (recurrence, dates, types)
  style.css    the design's verbatim CSS + keyframes, press feedback, safe areas
```

## Conventions that matter

- **Never hardcode device offsets** (56/66/94/30px). Use `env(safe-area-inset-*)` —
  the app runs full-screen with `.frame { position: fixed; inset: 0 }` on mobile.
- **The device draws its own chrome.** No simulated status bar, Dynamic Island or
  home indicator — the design mock's versions were removed.
- **Entrance animations must only play on open**, never on re-render, or surfaces
  flash transparent. See the `sheetAnimPending` / `pickerAnimPending` flags.
- **Don't re-render mid-gesture.** The time wheels patch label `textContent` in
  place; re-rendering fought the scroll momentum.
- `completeTask()` commits synchronously and triggers a re-render, so mark UI state
  (e.g. `noteCompleted`) *before* calling it.
- Checked tasks linger struck-through until you leave the page, then move behind the
  **Done** filter pill.
- Categories are user-definable "cards" stored in state; `Task.category` is the card
  **name** (a string, not an enum).

## Working loop

Verify in the browser preview before deploying (`.claude/launch.json` → port 5173),
then `npm run build` and push. Touch/iOS behaviour (drag-to-dismiss, wheel feel,
backdrop flicker) can only be confirmed on the device — ask the owner to check those.

Deploy note: `actions/deploy-pages` intermittently fails on rapid successive pushes —
wait ~40s and re-run the workflow; the build itself is fine.
