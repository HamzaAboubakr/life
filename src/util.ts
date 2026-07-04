// Small helpers shared across the web app.

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let counter = 0;
export function makeId(prefix = 't'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export const roman = ['I', 'II', 'III', 'IV', 'V'];

// Prefix a public asset path with the Vite base URL so images resolve correctly
// when hosted under a sub-path (e.g. GitHub Pages: you.github.io/life/).
export const asset = (p: string): string => import.meta.env.BASE_URL + p.replace(/^\//, '');

// escape untrusted text before injecting into HTML strings
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}
