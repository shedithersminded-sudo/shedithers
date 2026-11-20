/* SHEDITHERS — archive remaster (v3.5.0). Loaded last.
 * 1. code rain: the word "shedithers" falls in columns behind everything, barely there
 * 2. glowing edges on every home panel (a light that slowly travels around the border, brighter on hover)
 * 3. the buy me a drink tab: same art + shape, the cocktail emoji swapped for the artist's own logo figure */
(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. code rain ---------- */
const WORD = 'shedithers';
const cv = document.createElement('canvas'); cv.className = 'rm-rain'; cv.setAttribute('aria-hidden', 'true');
// the background art lives inside #view (as its first layer), so the rain sits right above it, still under every panel
function placeRain() {
  const v = document.getElementById('view'); if (!v) { if (!cv.isConnected) document.body.append(cv); return; }
  const pr = v.querySelector(':scope > .p-render');
  if (pr) { if (cv.previousElementSibling !== pr) pr.after(cv); }
  else if (cv.parentElement !== v) v.prepend(cv);
}
placeRain();
const g = cv.getContext('2d');
let W = 0, H = 0, cols = [], fs = 15, dpr = 1, last = 0;
function size() {
  dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  fs = W < 760 ? 13 : 15; const step = Math.round(fs * 1.35), n = Math.ceil(W / step);
  cols = Array.from({ length: n }, (_, i) => ({ x: i * step + 4, y: Math.random() * H * 1.5 - H * .5, v: 22 + Math.random() * 46, len: 8 + (Math.random() * 14 | 0), off: Math.random() * 10 | 0, on: Math.random() < .55 }));
}
function draw(t) {
  const dt = Math.min(.1, (t - last) / 1000 || 0); last = t;
  g.clearRect(0, 0, W, H); g.font = `500 ${fs}px "JetBrains Mono", monospace`; g.textBaseline = 'top';
  const lh = fs * 1.2;
  for (const c of cols) {
    if (!c.on) { if (Math.random() < .002) c.on = true; continue; }
    c.y += c.v * dt;
    const head = Math.floor(c.y / lh);
    for (let k = 0; k < c.len; k++) {
      const row = head - k; if (row < 0) continue; const y = row * lh; if (y > H) continue;
      // the letters are fixed to the column, so each column always reads s-h-e-d-i-t-h-e-r-s top to bottom
      const ch = WORD[((row + c.off) % 10 + 10) % 10];
      const a = k === 0 ? 1 : (1 - k / c.len) * .7;
      g.fillStyle = k === 0 ? `rgba(233,255,170,${a})` : `rgba(212,255,0,${a * .75})`;
      g.fillText(ch, c.x, y);
    }
    if ((head - c.len) * lh > H) { c.y = -Math.random() * H * .6; c.v = 22 + Math.random() * 46; c.len = 8 + (Math.random() * 14 | 0); c.on = Math.random() < .7; }
  }
  if (!reduce) raf = requestAnimationFrame(draw);
}
let raf = 0;
size(); addEventListener('resize', () => { size(); if (reduce) draw(0); });
if (reduce) { cols.forEach(c => { c.y = Math.random() * H; }); draw(0); }
else {
  raf = requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); } });
}

/* ---------- 2. glowing panel edges ---------- */
const HUES = ['#d4ff00', '#e2682a', '#c3141c', '#f2b234', '#3f7f7a', '#8a4766'];
function edges() {
  const P = document.querySelector('.portal'); if (!P) return;
  [...P.children].forEach((m, i) => {
    if (!m.classList.contains('p-mod') || m.querySelector(':scope > .rm-edge')) return;
    const e = document.createElement('i'); e.className = 'rm-edge'; e.setAttribute('aria-hidden', 'true');
    e.style.setProperty('--c1', HUES[i % HUES.length]); e.style.setProperty('--c2', HUES[(i + 2) % HUES.length]);
    e.style.setProperty('--spd', (9 + (i % 5) * 2) + 's'); e.style.setProperty('--dl', (-i * 1.7) + 's');
    m.append(e);
  });
}
const view = document.getElementById('view');
if (view) { new MutationObserver(() => { edges(); placeRain(); }).observe(view, { childList: true }); new MutationObserver(edges).observe(view, { childList: true, subtree: true }); edges(); }

/* ---------- 3. buy me a drink tab: the artist's logo figure instead of the emoji ---------- */
function drinkTab() {
  const t = document.querySelector('.drink-tab'); if (!t || t.dataset.rm) return; t.dataset.rm = '1';
  const ico = t.querySelector('.dt-ico'); if (ico) ico.remove();
  const fig = document.createElement('img'); fig.className = 'dt-fig'; fig.src = 'assets/ui/logo-paper-sm.png'; fig.alt = ''; fig.draggable = false;
  t.insertBefore(fig, t.querySelector('b'));
  const sm = t.querySelector('small'); if (sm) sm.textContent = 'no pressure';
}
drinkTab(); setTimeout(drinkTab, 800); setTimeout(drinkTab, 2500);
// the little drink links elsewhere lose the emoji too
function deEmoji() { document.querySelectorAll('.ds-foot,.ds-view,.ab-tip-btn').forEach(b => { if (b.textContent.includes('🍹')) b.textContent = b.textContent.replace('🍹', '✦'); }); }
if (view) new MutationObserver(deEmoji).observe(view, { childList: true, subtree: true });
deEmoji();
})();
