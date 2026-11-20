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
  cols = Array.from({ length: n }, (_, i) => ({ x: i * step + 4, y: Math.random() * H * 1.5 - H * .5, v: 90 + Math.random() * 80, len: 8 + (Math.random() * 14 | 0), off: Math.random() * 10 | 0, on: Math.random() < .55 }));
}
function draw(t) {
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
  g.clearRect(0, 0, W, H); g.font = `500 ${fs}px "JetBrains Mono", monospace`; g.textBaseline = 'top';
  const lh = fs * 1.2;
  for (const c of cols) {
    if (!c.on) { if (Math.random() < .004) c.on = true; continue; }
    c.y += c.v * dt; // smooth, sub-pixel fall (no row snapping)
    for (let k = 0; k < c.len; k++) {
      const y = c.y - k * lh; if (y < -lh || y > H) continue;
      // each trail carries its own letters, so it always reads s-h-e-d-i-t-h-e-r-s top to bottom
      const ch = WORD[((c.off - k) % 10 + 10) % 10];
      const a = k === 0 ? 1 : (1 - k / c.len) * .7;
      g.fillStyle = k === 0 ? `rgba(233,255,170,${a})` : `rgba(212,255,0,${a * .75})`;
      g.fillText(ch, c.x, y);
    }
    if (c.y - c.len * lh > H) { c.len = 8 + (Math.random() * 14 | 0); c.y = -Math.random() * H * .4; c.v = 90 + Math.random() * 80; c.on = Math.random() < .75; }
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
const HUES = ['#ff2338', '#2f7dff']; // the artist asked for a real glow: red or blue, alternating
function edges() {
  const P = document.querySelector('.portal'); if (!P) return;
  [...P.children].forEach((m, i) => {
    if (!m.classList.contains('p-mod') || m.querySelector(':scope > .rm-edge')) return;
    const e = document.createElement('i'); e.className = 'rm-edge'; e.setAttribute('aria-hidden', 'true');
    const c1 = HUES[i % 2], c2 = i % 2 ? '#7fb2ff' : '#ff7a5c'; e.style.setProperty('--c1', c1); e.style.setProperty('--c2', c2); m.style.setProperty('--rm-g', c1);
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

/* ---------- 4. collections showcase: the left side of the panel crossfades through each collection's pieces ---------- */
function showcase() {
  const S = document.querySelector('.portal > .p-strips'); if (!S || S.querySelector('.rm-show') || typeof ARTWORKS === 'undefined') return;
  const rowEls = [...S.querySelectorAll(':scope > .ps-row')]; if (!rowEls.length) return;
  const rows = h('div', 'rm-rows'); rowEls.forEach(r => rows.append(r));
  const show = document.createElement('a'); show.className = 'rm-show';
  const code = h('span', 'rs-code'), count = h('span', 'rs-count'), txt = h('span', 'rs-txt'), bar = h('i', 'rs-bar');
  const name = h('b', 'rs-name'), sub = h('span', 'rs-sub'), words = h('span', 'rs-words'); txt.append(name, sub, words);
  const cols = (typeof COLLECTIONS !== 'undefined' ? COLLECTIONS : []).map(c => ({ c, w: ARTWORKS.filter(a => a.col === c.id && a.type !== 'video').slice(0, 6) })).filter(x => x.w.length);
  if (!cols.length) return;
  const layers = [h('i'), h('i')]; show.append(...layers, code, count, txt, bar);
  S.append(show, rows);
  // each row lights up its collection
  const rowOf = cols.map(x => rowEls.find(r => (r.querySelector('.ps-label')?.getAttribute('href') || '').endsWith('/' + x.c.id)));
  const T = 3400; let ci = 0, pi = 0, top = 0, pinned = false, timer = 0;
  show.style.setProperty('--rs-t', T + 'ms');
  function paint(newCol) {
    const { c, w } = cols[ci], a = w[pi % w.length];
    const L = layers[top = 1 - top]; L.style.backgroundImage = `url('${a.src}')`;
    L.classList.add('on'); layers[1 - top].classList.remove('on');
    const set = () => { code.textContent = c.code || ''; name.textContent = c.name; sub.textContent = c.sub || ''; };
    if (newCol) { show.classList.add('swap'); setTimeout(() => { set(); words.textContent = a.words || a.title.toLowerCase(); show.classList.remove('swap'); }, 350); }
    else { set(); words.textContent = a.words || a.title.toLowerCase(); }
    count.textContent = String(pi % w.length + 1).padStart(2, '0') + ' / ' + String(w.length).padStart(2, '0');
    show.href = `#/col/${c.id}`; show.setAttribute('aria-label', `Open the ${c.name} collection`);
    rowOf.forEach((r, i) => r && r.classList.toggle('rm-on', i === ci));
    show.classList.remove('run'); void show.offsetWidth; if (!reduce) show.classList.add('run');
  }
  function tick() {
    if (!S.isConnected) return clearInterval(timer);
    if (document.hidden) return;
    pi++;
    if (!pinned && pi >= cols[ci].w.length) { ci = (ci + 1) % cols.length; pi = 0; paint(true); } else paint(false);
  }
  function pick(i) { if (i === ci) return; ci = i; pi = 0; paint(true); clearInterval(timer); timer = setInterval(tick, T); }
  rowOf.forEach((r, i) => { if (!r) return;
    r.addEventListener('pointerenter', () => { pinned = true; pick(i); });
    r.addEventListener('focusin', () => { pinned = true; pick(i); });
    r.addEventListener('pointerleave', () => { pinned = false; });
    r.addEventListener('focusout', () => { pinned = false; });
  });
  paint(false);
  timer = setInterval(tick, reduce ? T * 2 : T);
}
function h(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; if (tag === 'i') e.setAttribute('aria-hidden', 'true'); return e; }

/* ---------- 5. WHERE TO FIND ME: the peek always holds a piece (the first stop's art), never an empty frame ---------- */
function peekDefault() {
  const p = document.querySelector('.p-collab .fm-peek'); if (!p || p.dataset.rm) return; p.dataset.rm = '1';
  const s = document.querySelector('.p-collab .fm-stop.here') || document.querySelector('.p-collab .fm-stop'); if (!s) return;
  s.dispatchEvent(new Event('pointerenter')); p.classList.remove('on');
}
function homeBits() { showcase(); peekDefault(); }
if (view) new MutationObserver(homeBits).observe(view, { childList: true, subtree: true });
homeBits();

/* ---------- 6. WANNA COLLAB: the letters break by word, never mid-word ---------- */
function collabTitle() {
  const t = document.querySelector('.p-collab .cl-title'); if (!t || t.dataset.rm) return; t.dataset.rm = '1';
  const kids = [...t.childNodes]; t.textContent = ''; let w = null;
  for (const k of kids) {
    const sp = k.nodeType === 1 && (k.classList.contains('sp') || !k.textContent.trim());
    if (sp) { w = null; t.append(k); continue; }
    if (!w) { w = document.createElement('span'); w.className = 'cl-word'; t.append(w); }
    w.append(k);
  }
}

/* ---------- 7. music: the player stays tucked away by default, behind one clear music button ---------- */
function musicBtn() {
  const pl = document.getElementById('player'); if (!pl || !pl.dataset.tuck) return;
  const tab = [...document.querySelectorAll('.tuck-tab')].find(b => /music/i.test(b.getAttribute('aria-label') || '')); if (!tab || tab.dataset.rm) return;
  tab.dataset.rm = '1'; tab.classList.add('rm-music');
  tab.innerHTML = '<span class="rmm-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>music</b>';
  tab.setAttribute('aria-label', 'Open the music player'); tab.title = 'music';
  // first visit: start tucked (after that, the visitor's own choice is remembered by tuck.js)
  let first = false; try { first = !localStorage.getItem('shd.rm.music'); localStorage.setItem('shd.rm.music', '1'); } catch (_) { }
  if (first && !pl.classList.contains('is-tucked')) { const x = pl.querySelector(':scope > .tuck-x'); if (x) x.click(); }
  // the ♪ MUSIC shortcut in the hint bar brings the player back too
  document.addEventListener('click', e => { const b = e.target.closest('#hint *'); if (b && /music/i.test(b.textContent) && pl.classList.contains('is-tucked')) tab.click(); }, true);
  // the bars move while something is playing
  const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player, a = P && P.audio;
  if (a) { const on = () => tab.classList.toggle('playing', !a.paused); a.addEventListener('play', on); a.addEventListener('pause', on); a.addEventListener('ended', on); on(); }
}
function bits2() { collabTitle(); musicBtn(); }
if (view) new MutationObserver(bits2).observe(view, { childList: true, subtree: true });
bits2(); setTimeout(bits2, 600); setTimeout(bits2, 2000);

/* ---------- 8. discovery notes wear a strip of the artist's art; the bottom-of-the-page note says something new ---------- */
if (window.SHD_FX && window.SHD_FX.NOTES) window.SHD_FX.NOTES.bottom = 'this is the bottom. i kept going anyway. so did you.';
const NOTE_ART = (typeof ARTWORKS !== 'undefined' ? ARTWORKS : []).filter(a => a.type !== 'video');
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) {
  if (n.nodeType !== 1 || !n.classList.contains('note-pop') || n.querySelector('.np-art') || !NOTE_ART.length) continue;
  const a = NOTE_ART[Math.random() * NOTE_ART.length | 0], strip = document.createElement('i');
  strip.className = 'np-art'; strip.setAttribute('aria-hidden', 'true'); strip.style.setProperty('--na', `url('${new URL(a.src, location.href).href}')`);
  n.prepend(strip);
} }).observe(document.body, { childList: true });
})();
