// BottomNav — markup + sliding-pill logic transcribed from Home.dc.html.

export const NAV = [
  { href: '#/', route: '/', icon: 'home' },
  { href: '#/calendar', route: '/calendar', icon: 'calendar_month' },
  { href: '#/tasks', route: '/tasks', icon: 'checklist' },
  { href: '#/rewards', route: '/rewards', icon: 'storefront' },
  { href: '#/profile', route: '/profile', icon: 'bar_chart' },
];

export function navIndexForRoute(route: string): number {
  const i = NAV.findIndex((n) => n.route === route);
  return i < 0 ? 0 : i;
}

export function renderNav(active: number): string {
  const links = NAV.map((n, i) => {
    const color = i === active ? '#34CEE9' : '#9A9AA2';
    return `<a href="${n.href}" style="flex:1; height:48px; border-radius:19px; display:flex; align-items:center; justify-content:center; position:relative; z-index:1;"><span class="ms" style="font-size:26px; color:${color}; transition:color 0.3s ease;">${n.icon}</span></a>`;
  }).join('');
  return `
    <div data-nav data-active="${active}" style="position:absolute; left:16px; right:16px; bottom:20px; height:64px; z-index:40; padding:8px 10px; display:flex; align-items:center; gap:5px; border-radius:32px; background:rgba(38,38,44,0.42); backdrop-filter:blur(32px) saturate(180%); -webkit-backdrop-filter:blur(32px) saturate(180%); border:1px solid rgba(255,255,255,0.16); box-shadow:inset 0 1px 0.5px rgba(255,255,255,0.4), inset 0 -10px 20px rgba(255,255,255,0.04), 0 16px 44px rgba(0,0,0,0.55);">
      <div class="nav-pill"></div>
      ${links}
    </div>`;
}

// Position the frosted pill under the active tab. `animate=false` snaps it (first paint).
export function placePill(animate: boolean) {
  const bar = document.querySelector('[data-nav]') as HTMLElement | null;
  if (!bar) return;
  const pill = bar.querySelector('.nav-pill') as HTMLElement | null;
  const links = bar.querySelectorAll('a');
  if (!pill || links.length < 2) return;
  const active = parseInt(bar.getAttribute('data-active') || '0', 10) || 0;
  const c = links[active] as HTMLElement;
  if (!c || !c.offsetWidth) return;
  if (!animate) pill.style.transition = 'none';
  pill.style.left = c.offsetLeft + 'px';
  pill.style.top = c.offsetTop + 'px';
  pill.style.width = c.offsetWidth + 'px';
  pill.style.height = c.offsetHeight + 'px';
  if (!animate) { pill.getBoundingClientRect(); requestAnimationFrame(() => { pill.style.transition = ''; }); }
}
