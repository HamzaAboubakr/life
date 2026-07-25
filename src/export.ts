// Stage 0 of the SwiftUI rewrite — get the owner's real data off the phone.
//
// localStorage is per-origin AND per-device, so the only copy of these tasks
// lives inside the installed PWA on the iPhone. This serialises everything the
// native app will need and hands it to the iOS share sheet (AirDrop → Mac).
//
// Temporary. Delete this file, its button and its actions once the native app
// has imported the data successfully.

import type { CardDef } from './store';
import { getState } from './store';
import type { Task } from './core';
import { TAGS } from './odyssey';

export const EXPORT_VERSION = 1;

export interface ExportedTag {
  name: string;
  hex: string;
  /** true = colour was lost (see below); the native app should re-pick one. */
  colorLost?: boolean;
}

export interface OdysseyExport {
  version: number;
  exportedAt: string;
  origin: string;
  tasks: Task[];
  /** `${taskId}|${date}` → true. Per-occurrence, so recurring tasks stay independent. */
  completed: Record<string, true>;
  cards: CardDef[];
  tags: ExportedTag[];
}

export function buildExport(): OdysseyExport {
  const s = getState();

  // Custom tags were never persisted — the tag creator pushes onto the TAGS
  // module array, which resets on reload. The *name* survives on the task
  // (task.tagIds holds names), so recover those and flag that the hex is gone.
  const known = new Map(TAGS.map((t) => [t.name, t.hex]));
  const orphans = new Set<string>();
  s.tasks.forEach((t) => t.tagIds?.forEach((n) => { if (!known.has(n)) orphans.add(n); }));

  const tags: ExportedTag[] = [
    ...TAGS.map((t) => ({ name: t.name, hex: t.hex })),
    ...[...orphans].map((name) => ({ name, hex: '#8E8E93', colorLost: true })),
  ];

  // Only the fields the native model actually needs — the gamification state
  // (balance, progression, streak, owned, purchases) is deliberately dropped.
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    origin: location.origin + location.pathname,
    tasks: s.tasks,
    completed: s.completed,
    cards: s.cards,
    tags,
  };
}

export function exportJSON(): string {
  return JSON.stringify(buildExport(), null, 2);
}

export function exportFilename(): string {
  return `odyssey-export-${new Date().toISOString().slice(0, 10)}.json`;
}

export type ShareResult = 'shared' | 'downloaded' | 'unsupported' | 'cancelled';

/**
 * Prefer the iOS share sheet with a real File attached — that gives AirDrop
 * straight to the Mac, which is the whole point. Fall back to a download, and
 * let the caller show the copy-paste panel if neither works.
 */
export async function shareExport(): Promise<ShareResult> {
  const json = exportJSON();
  const name = exportFilename();

  try {
    const file = new File([json], name, { type: 'application/json' });
    // canShare({files}) is the only reliable capability probe on iOS.
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Odyssey export' });
      return 'shared';
    }
  } catch (err) {
    // AbortError = the user dismissed the sheet; that isn't a failure.
    if ((err as Error)?.name === 'AbortError') return 'cancelled';
  }

  try {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  } catch {
    return 'unsupported';
  }
}

// ---- UI -------------------------------------------------------------------

let panelOpen = false;
export const isExportPanelOpen = () => panelOpen;
export const openExportPanel = () => { panelOpen = true; };
export const closeExportPanel = () => { panelOpen = false; };

/** The button that lives at the bottom of the Tasks list. Deliberately plain —
 *  it is a migration tool, not part of the design. */
export function renderExportButton(): string {
  const s = getState();
  const n = s.tasks.length;
  return `
    <div style="margin:26px 0 10px; padding:16px 18px; border-radius:18px; background:rgba(120,120,128,0.06); border:1px dashed rgba(60,60,67,0.18);">
      <div style="font-size:13px; font-weight:800; color:#636366; letter-spacing:-0.2px;">Move to the native app</div>
      <div style="margin-top:4px; font-size:12.5px; font-weight:600; color:#8E8E93; line-height:1.45;">
        ${n} task${n === 1 ? '' : 's'} live only on this phone. Export, then AirDrop the file to your Mac.
      </div>
      <div data-action="export-share" style="margin-top:12px; padding:12px; border-radius:13px; background:#007AFF; color:#fff; font-size:14.5px; font-weight:700; text-align:center; cursor:pointer;">
        Export data
      </div>
      <div data-action="export-show" style="margin-top:8px; padding:10px; border-radius:13px; background:rgba(120,120,128,0.1); color:#3C3C43; font-size:13px; font-weight:700; text-align:center; cursor:pointer;">
        Show as text instead
      </div>
    </div>`;
}

/** Fallback panel: the raw JSON, selectable, with a copy button. Needed because
 *  a standalone PWA has no address bar and downloads are unreliable there. */
export function renderExportPanel(): string {
  if (!panelOpen) return '';
  const json = exportJSON();
  return `
    <div data-action="export-scrim" style="position:absolute; inset:0; z-index:70; background:rgba(0,0,0,0.35); animation:ccScrim .22s ease;"></div>
    <div class="picker-box" style="position:absolute; left:0; right:0; bottom:0; z-index:71; background:#F2F2F7; border-radius:28px 28px 0 0; padding:0 16px calc(env(safe-area-inset-bottom, 0px) + 16px); max-height:82%; display:flex; flex-direction:column; animation:ccModalIn .38s cubic-bezier(.22,.9,.25,1);">
      <div style="width:38px; height:5px; border-radius:3px; background:rgba(60,60,67,0.2); margin:12px auto 14px;"></div>
      <div style="font-size:17px; font-weight:800; text-align:center; margin-bottom:4px;">Export data</div>
      <div style="font-size:12.5px; font-weight:600; color:#8E8E93; text-align:center; margin-bottom:12px;">Select all, copy, and send it to yourself.</div>
      <textarea class="cc-scroll" data-action="export-text" readonly style="flex:1; min-height:220px; width:100%; background:#FFFFFF; border:1px solid rgba(60,60,67,0.1); border-radius:14px; padding:12px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:11px; line-height:1.45; color:#1C1C1E; resize:none; outline:none;">${json.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</textarea>
      <div style="display:flex; gap:10px; margin-top:12px;">
        <div data-action="export-copy" style="flex:1; padding:14px; border-radius:14px; background:#007AFF; color:#fff; font-size:15px; font-weight:700; text-align:center; cursor:pointer;">Copy</div>
        <div data-action="export-close" style="flex:0 0 auto; padding:14px 22px; border-radius:14px; background:rgba(120,120,128,0.12); color:#3C3C43; font-size:15px; font-weight:700; text-align:center; cursor:pointer;">Done</div>
      </div>
    </div>`;
}

/** Small transient confirmation, reusing the design's ccToast-style fade. */
export function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:absolute; left:50%; transform:translateX(-50%); bottom:calc(env(safe-area-inset-bottom, 0px) + 120px); z-index:90; padding:11px 18px; border-radius:999px; background:rgba(28,28,30,0.92); color:#fff; font-size:13.5px; font-weight:700; box-shadow:0 8px 24px rgba(0,0,0,0.25); pointer-events:none; animation:scrFade .22s ease;';
  document.querySelector('.frame')?.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s ease'; el.style.opacity = '0'; }, 1700);
  setTimeout(() => el.remove(), 2050);
}
