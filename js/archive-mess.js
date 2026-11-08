/* SHEDITHERS — Archive: messy + interactive layer. The wall lives BEHIND all content, so nothing here ever
 * sits on top of the artwork. Visitors can drag scraps, shuffle quotes and make their own mess. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }
const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } } };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const routeKey = () => (location.hash.replace(/^#\/?/, '').split('/').slice(0, 2).join('/') || 'home');
function rng(seed) { let a = 0; for (const c of seed) a = (a * 31 + c.charCodeAt(0)) | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const QUOTES = ['don’t try', 'just look ♥', 'I don’t want ordinary', 'not in my nature', 'becoming + unbecoming', 'are we alive yet?', 'error: no identity', 'dreams aren’t dreams', 'who will you be?', 'I look prettier in fragments', 'stop asking me about my future', 'all signs point to yes', 'click to be saved', 'you keep forgetting', 'shedithers loves you', 'I stand alone', 'when you rain you pour'];
const INKS = ['#c3141c', '#e9e3d1', '#e9e3d1', '#ff3b3b', '#c3141c'];
const HEART = '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.3 6.1 20l1.7-6.7L2.5 8.9l6.9-.5z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const SCR = ['M5 40 C 30 5, 60 70, 90 25 S 140 10, 160 45', 'M10 30 c 20 -30 40 30 60 0 s 40 30 60 0 s 40 -30 50 0', 'M20 40 c 30 -40 60 40 20 20 c -30 -15 10 -40 40 -20 c 30 20 60 -10 70 0'];
const scr = i => `<svg viewBox="0 0 170 70"><path d="${SCR[i % SCR.length]}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
const BARB = '<svg viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 20 Q100 10 200 22 T400 18" fill="none" stroke="currentColor" stroke-width="2"/><g stroke="currentColor" stroke-width="2"><path d="M60 8l16 24M76 8L60 32M160 10l16 24M176 10l-16 24M260 8l16 24M276 8l-16 24M350 10l14 22M364 10l-14 22"/></g></svg>';

/* ---------- the wall ---------- */
const wall = h('div', { class: 'wall', 'aria-hidden': 'true' }); document.body.prepend(wall);
const moved = LS.get('shd.wallpos', {});
function spawn(kind, x, y, r, extra) {
  const ink = extra && extra.ink || INKS[Math.floor(Math.random() * INKS.length)];
  let el;
  switch (kind) {
    case 'scrap': el = h('span', { class: 'w scrap', style: `--bg:${extra.bg}` }, h('i', { class: 'w-tape' }), h('span', { class: 'q' }, extra.q)); break;
    case 'quote': el = h('span', { class: 'w quote', style: `color:${ink};font-size:${extra.size}px` }, extra.q); break;
    case 'star': el = h('span', { class: 'w star', style: `color:${ink};width:${extra.size}px`, html: STAR }); break;
    case 'heart': el = h('span', { class: 'w heart', style: `color:${ink};width:${extra.size}px`, html: HEART }); break;
    case 'splat': el = h('span', { class: 'w splat', style: `--ink:${ink};width:${extra.size}px;height:${extra.size}px` }); break;
    case 'barb': el = h('span', { class: 'w barb', style: `color:#cfc9b5;width:${extra.size}px`, html: BARB }); break;
    case 'scrib': el = h('span', { class: 'w scrib', style: `color:${ink};width:${extra.size}px`, html: scr(extra.n || 0) }); break;
    case 'tape': el = h('span', { class: 'w tapebit', style: `width:${extra.size}px` }); break;
    case 'arrow': el = h('span', { class: 'w arrow', style: `color:${ink}` }, extra.q || '→ look'); break;
    case 'num': el = h('span', { class: 'w num' }, extra.q); break;
    case 'monitor': { const v = Object.assign(h('video', { src: UI_HANDS, playsinline: true, loop: true, preload: 'metadata' }), { muted: true, autoplay: true }); v.addEventListener('contextmenu', e => e.preventDefault()); el = h('span', { class: 'w monitor' }, v, h('i', { class: 'w-tape' }), h('b', null, '● LIVE // HANDS')); break; }
    case 'tag': el = h('span', { class: 'w tag', style: `color:${ink}` }, extra.q); break;
  }
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.setProperty('--r', r + 'deg'); el.dataset.kind = kind; return el;
}
function buildWall() {
  const key = routeKey(), R = rng(key + ':' + Math.round(innerWidth / 200)), W = innerWidth, H = Math.max(innerHeight, document.documentElement.scrollHeight);
  wall.querySelectorAll('.w:not(.stamp)').forEach(e => e.remove()); wall.style.height = H + 'px';
  const n = Math.round(Math.min(64, 14 + W * H / 55000)), gut = Math.max(0, (W - 1240) / 2), kinds = ['scrap', 'quote', 'quote', 'star', 'heart', 'splat', 'scrib', 'tape', 'barb', 'arrow', 'num', 'scrap'];
  for (let i = 0; i < n; i++) {
    const k = kinds[Math.floor(R() * kinds.length)], inGut = gut > 70 && R() < 0.7, x = inGut ? (R() < 0.5 ? R() * (gut - 40) : W - gut + R() * (gut - 60)) : R() * (W - 120), y = 70 + R() * (H - 160), r = (R() - 0.5) * 34;
    const extra = { q: QUOTES[Math.floor(R() * QUOTES.length)], size: k === 'quote' ? 18 + R() * 26 : k === 'barb' ? 220 + R() * 260 : k === 'splat' ? 60 + R() * 120 : k === 'tape' ? 70 + R() * 70 : 26 + R() * 50, bg: ['#e9e3d1', '#c4ab7c', '#e9e3d1', '#e6ff8a', '#cfd8dc'][Math.floor(R() * 5)], n: i, ink: INKS[Math.floor(R() * INKS.length)] };
    if (k === 'num') extra.q = '0x' + String(Math.floor(R() * 99)).padStart(2, '0');
    if (k === 'arrow') extra.q = ['→ look', '← here', '↓ keep going', '?', '✕ ✕ ✕'][Math.floor(R() * 5)];
    const el = spawn(k, x, y, r, extra); el.dataset.id = key + ':' + i; const m = moved[el.dataset.id]; if (m) { el.style.left = m[0] + 'px'; el.style.top = m[1] + 'px'; }
    wall.append(el);
  }
  // the hands monitor (UI video) — one per page, tucked at an edge
  const mon = spawn('monitor', R() < 0.5 ? 10 + R() * 40 : W - 250 - R() * 40, 180 + R() * Math.max(100, Math.min(H, 1600) - 420), (R() - 0.5) * 10, {});
  mon.dataset.id = key + ':mon'; const m = moved[mon.dataset.id]; if (m) { mon.style.left = m[0] + 'px'; mon.style.top = m[1] + 'px'; } wall.append(mon);
  drawStamps();
}

/* ---------- interactions: drag anything on the wall; poke things ---------- */
let drag = null;
wall.addEventListener('pointerdown', e => {
  const el = e.target.closest('.w'); if (!el || mess) return; e.preventDefault();
  drag = { el, sx: e.clientX, sy: e.clientY, x0: parseFloat(el.style.left), y0: parseFloat(el.style.top), moved: false }; el.setPointerCapture(e.pointerId); el.classList.add('held');
});
wall.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; drag.el.style.left = (drag.x0 + dx) + 'px'; drag.el.style.top = (drag.y0 + dy) + 'px'; });
wall.addEventListener('pointerup', () => {
  if (!drag) return; const { el } = drag; el.classList.remove('held');
  if (drag.moved) { if (el.dataset.id) { moved[el.dataset.id] = [parseFloat(el.style.left), parseFloat(el.style.top)]; LS.set('shd.wallpos', moved); } el.classList.remove('drop'); void el.offsetWidth; el.classList.add('drop'); }
  else poke(el);
  drag = null;
});
function poke(el) {
  const k = el.dataset.kind; el.classList.remove('poked'); void el.offsetWidth; el.classList.add('poked');
  if (k === 'quote' || k === 'scrap') { const q = el.querySelector('.q') || el; q.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)]; }
  if (k === 'monitor') { const v = el.querySelector('video'); v.paused ? v.play() : v.pause(); }
}

/* ---------- MAKE A MESS ---------- */
let mess = false; const stamps = LS.get('shd.mess', []);
const messBtn = h('button', { class: 'mess-btn', 'aria-pressed': 'false', title: 'Make a mess' }, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M9 7h6v3H9zM8 10h8v11H8zM11 3h2v4h-2zM17 5l3-1M18 8l3 1M17 2l2-1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' }), h('b', null, 'MAKE A MESS'));
const cleanBtn = h('button', { class: 'clean-btn', title: 'Clean up your mess' }, 'CLEAN UP');
document.body.append(messBtn, cleanBtn);
const STAMP_KINDS = ['splat', 'splat', 'heart', 'star', 'tag', 'tape', 'scrib'];
const TAGS = ['♥ wuz here', 'SHEDITHERS', 'x x x', 'not ordinary', 'me too', '!!!', 'lol', '☆'];
function setMess(on) { mess = on; document.body.classList.toggle('messing', on); messBtn.setAttribute('aria-pressed', on); messBtn.querySelector('b').textContent = on ? 'TAP TO SPRAY · DONE' : 'MAKE A MESS'; }
messBtn.onclick = () => setMess(!mess);
cleanBtn.onclick = () => { stamps.length = 0; LS.set('shd.mess', stamps); drawStamps(); };
const blocked = '.obj,.print,.ticket,.frame,.reel-cell,.v-mat,.viewer,a,button,input,.player,.note-pop,.tickets img,.win,.about-card,.title-scrap,.strip-log,.hint,.bar,.chips';
document.addEventListener('pointerdown', e => {
  if (!mess || e.button > 0 || e.target.closest(blocked) || !e.target.closest('#view, .wall, body')) return;
  const y = e.clientY + scrollY, x = e.clientX, k = STAMP_KINDS[Math.floor(Math.random() * STAMP_KINDS.length)];
  const s = { k, x, y, r: (Math.random() - 0.5) * 50, ink: INKS[Math.floor(Math.random() * INKS.length)], size: k === 'splat' ? 50 + Math.random() * 90 : k === 'tape' ? 80 : 30 + Math.random() * 30, q: TAGS[Math.floor(Math.random() * TAGS.length)], n: Math.floor(Math.random() * 3), page: routeKey() };
  stamps.push(s); if (stamps.length > 80) stamps.shift(); LS.set('shd.mess', stamps); addStamp(s, true);
});
function addStamp(s, fresh) { const el = spawn(s.k, s.x - s.size / 2, s.y - s.size / 2, s.r, s); el.classList.add('stamp'); if (fresh && !reduce) el.classList.add('sprayed'); wall.append(el); }
function drawStamps() { wall.querySelectorAll('.stamp').forEach(e => e.remove()); stamps.filter(s => s.page === routeKey()).forEach(s => addStamp(s)); }

/* ---------- gate: the hands play behind the entrance folder ---------- */
const gate = $('#gate');
if (gate) { const v = Object.assign(h('video', { class: 'gate-hands', src: UI_HANDS, playsinline: true, loop: true, preload: 'auto', 'aria-hidden': 'true' }), { muted: true, autoplay: true }); gate.prepend(v); }

/* ---------- rebuild on navigation / resize ---------- */
let t; const rebuild = () => { clearTimeout(t); t = setTimeout(buildWall, 120); };
addEventListener('hashchange', rebuild); addEventListener('resize', rebuild);
new MutationObserver(rebuild).observe($('#view'), { childList: true });
buildWall();
})();
