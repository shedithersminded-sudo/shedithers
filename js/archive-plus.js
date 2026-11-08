/* SHEDITHERS — Archive: immersive layer. ADDITIONS ONLY on top of archive.js.
 * Never touches artwork pixels: every effect lives on paper, tape, frames, chrome or the background. */
(() => {
'use strict';
const A = window.SHD_ARCHIVE; if (!A) return;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }
const pad = (n, l = 2) => String(n).padStart(l, '0');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer:fine)').matches;
const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } } };
const routeName = () => (location.hash.replace(/^#\/?/, '').split('/')[0] || 'home');

/* =====================================================================
   1. DISCOVERIES — hidden notes for curious visitors
   ===================================================================== */
const NOTES = {
  core: 'you found the core. it beats a little faster when someone looks this closely ♥',
  clip: 'paperclip removed. a page fell out: “becoming and unbecoming…”',
  ring: 'a coffee ring. proof someone stayed up too long making all of this.',
  sticky: 'collection note: every piece in here was a feeling first.',
  stub: 'torn stub found. ADMIT ONE — valid forever.',
  hold: 'file history: shown read-only. untouched. exactly as it was made.',
  word: 'you typed the name. the archive heard you.',
  konami: 'cheat code accepted → the LAB door is open (top right).',
  idle: 'still here? good. take your time. nothing in here is in a hurry.',
  doodle: 'you poked the doodle. it poked back.',
};
const found = new Set(LS.get('shd.found', []));
const stampEl = h('button', { class: 'disc-stamp', 'aria-label': 'Discoveries found' });
function updStamp() { stampEl.textContent = `FOUND ${pad(found.size)}/${pad(Object.keys(NOTES).length)}`; stampEl.classList.toggle('show', found.size > 0); }
document.body.append(stampEl); updStamp();
stampEl.onclick = () => note('YOUR DISCOVERIES', found.size ? [...found].map(k => '✦ ' + NOTES[k]).join('\n\n') : 'nothing yet. look closer.', true);
window.SHD_FX = { discover: (...a) => discover(...a), note: (...a) => note(...a), burst: (...a) => burst(...a), NOTES, upd: () => updStamp() };
function discover(key, x, y) { const isNew = !found.has(key); found.add(key); LS.set('shd.found', [...found]); updStamp(); if (isNew) { stampEl.classList.remove('bump'); void stampEl.offsetWidth; stampEl.classList.add('bump'); } burst(x, y); note(isNew ? 'DISCOVERY ✦ NEW' : 'DISCOVERY', NOTES[key]); }
let noteEl = null;
function note(title, text, list) {
  noteEl && noteEl.remove();
  noteEl = h('div', { class: 'note-pop' + (list ? ' list' : ''), role: 'status' }, h('i', { class: 'np-tape' }), h('b', null, title), h('p', null, text), h('button', { class: 'np-x', 'aria-label': 'Close note', onclick: () => { noteEl && noteEl.remove(); noteEl = null; } }, '✕'));
  document.body.append(noteEl); clearTimeout(note.t); if (!list) note.t = setTimeout(() => { noteEl && noteEl.classList.add('out'); setTimeout(() => noteEl && noteEl.remove(), 400); }, 6500);
}
function burst(x, y) {
  if (reduce || x == null) return; const n = 10;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = 40 + Math.random() * 50, p = h('span', { class: 'burst', style: `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--c:${i % 2 ? '#ff4fa3' : '#d4ff00'}`, html: i % 3 ? '✦' : '♥' }); document.body.append(p); setTimeout(() => p.remove(), 900); }
}
const at = e => [e.clientX || (e.touches && e.touches[0].clientX) || innerWidth / 2, e.clientY || (e.touches && e.touches[0].clientY) || innerHeight / 2];
// (a) brand heart: five quick taps
let taps = 0, tapT = 0; const brandSvg = $('.brand svg');
$('.brand').addEventListener('click', e => { if (Date.now() - tapT > 900) taps = 0; tapT = Date.now(); if (++taps >= 5) { e.preventDefault(); taps = 0; discover('core', ...at(e)); } });
// (b) typed words + konami
let typed = ''; const KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kpos = 0;
document.addEventListener('keydown', e => { if (e.target.matches('input,textarea')) return; typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-12); if (typed.endsWith('shedithers')) { typed = ''; discover('word', innerWidth / 2, innerHeight / 2); rain(); } kpos = e.key === KON[kpos] ? kpos + 1 : (e.key === KON[0] ? 1 : 0); if (kpos === KON.length) { kpos = 0; document.body.classList.add('lab-open'); discover('konami', innerWidth - 120, 40); } });
function rain() { if (reduce) return; for (let i = 0; i < 26; i++) { const p = h('span', { class: 'rain-h', style: `left:${Math.random() * 100}vw;--d:${1.6 + Math.random() * 1.6}s;--delay:${Math.random() * .8}s;font-size:${14 + Math.random() * 22}px`, html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }); document.body.append(p); setTimeout(() => p.remove(), 3500); } }
// (c) idle note
let idleT; const resetIdle = () => { clearTimeout(idleT); idleT = setTimeout(() => { if (!document.hidden && document.body.classList.contains('entered')) discover('idle', innerWidth / 2, innerHeight - 140); }, 75000); };
['pointermove', 'keydown', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, resetIdle, { passive: true })); resetIdle();
// (d) long-press on the viewer file label
let holdT; const vFile = $('#vFile');
vFile.addEventListener('pointerdown', e => { const p = at(e); vFile.classList.add('holding'); holdT = setTimeout(() => { vFile.classList.remove('holding'); discover('hold', ...p); }, 1100); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => vFile.addEventListener(ev, () => { clearTimeout(holdT); vFile.classList.remove('holding'); }));
vFile.setAttribute('title', 'hold me');

/* page-specific hidden objects, added each time a view renders */
function decorate() {
  const r = routeName(), v = $('#view');
  if (r === 'home' || r === '') {
    const log = $('.strip-log', v); if (log && !$('.clip', log)) log.append(h('button', { class: 'clip', 'aria-label': 'A paperclip', title: '', onclick: e => discover('clip', ...at(e)) }));
    const cover = $('.title-scrap', v); if (cover && !$('.ring', cover)) cover.append(h('button', { class: 'ring', 'aria-label': 'A coffee ring stain', onclick: e => { e.preventDefault(); discover('ring', ...at(e)); } }));
    if (log && !$('.here', log)) log.append(h('span', { class: 'here' }, 'YOU’VE BEEN HERE ', h('b', { id: 'hereT' }, '00:00')));
  }
  if (r === 'col') {
    const desk = $('.desk', v); if (desk && !$('.sticky', desk)) desk.append(h('button', { class: 'sticky', 'aria-label': 'A sticky note', onclick: e => discover('sticky', ...at(e)) }, '?'));
    addLayoutSwitch(v);
  }
  if (r === 'works') { const wall = $('.tickets', v); if (wall && !$('.lost-stub', v)) wall.after(h('button', { class: 'lost-stub', onclick: e => discover('stub', ...at(e)) }, h('span', null, 'ADMIT'), h('span', null, '№000'))); }
  if (r === 'about') { const card = $('.about-card', v); if (card && !$('.doodle', card)) card.append(h('button', { class: 'doodle', 'aria-label': 'A doodle', html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>', onclick: e => { e.currentTarget.classList.remove('poke'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('poke'); discover('doodle', ...at(e)); } })); }
  peeks(v);
}
const t0 = Date.now(); setInterval(() => { const el = $('#hereT'); if (el) { const s = Math.floor((Date.now() - t0) / 1000); el.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; } }, 1000);

/* print peeks: a little archive tag slides out from under each print (tap on touch) */
function peeks(root) {
  $$('.print', root).forEach(p => { if ($('.peek', p)) return; const t = $('.print-code', p); const pk = h('button', { class: 'peek', 'aria-label': 'Show file tag' }, '◢'); pk.onclick = e => { e.stopPropagation(); p.classList.toggle('peeked'); }; p.append(pk, h('span', { class: 'peek-tag' }, t ? t.textContent : '', h('br'), 'READ-ONLY · ✦')); });
}

/* =====================================================================
   2. VIEWING LAYOUTS for collections: BOOK · SHEET · REEL
   ===================================================================== */
let layout = LS.get('shd.layout', 'book');
function colIdFromHash() { return location.hash.replace(/^#\/?/, '').split('/')[1]; }
function addLayoutSwitch(v) {
  const head = $('.col-head', v); if (!head || $('.layouts', head)) return;
  const sw = h('div', { class: 'layouts', role: 'radiogroup', 'aria-label': 'Viewing layout' }, [['book', 'BOOK'], ['sheet', 'SHEET'], ['reel', 'REEL']].map(([k, l]) => h('button', { role: 'radio', 'aria-checked': k === layout, onclick: () => { layout = k; LS.set('shd.layout', k); applyLayout(v); $$('button', sw).forEach(b => b.setAttribute('aria-checked', b.textContent.toLowerCase() === k)); } }, l)));
  head.append(sw); applyLayout(v);
}
function applyLayout(v) {
  const desk = $('.desk', v); if (!desk) return; $$('.alt-layout', v).forEach(e => e.remove()); desk.classList.toggle('hide-book', layout !== 'book');
  if (layout === 'book') return;
  const works = ARTWORKS.filter(a => a.col === colIdFromHash());
  const media = a => { const el = a.type === 'video' ? Object.assign(h('video', { src: a.src, playsinline: true, loop: true, preload: 'metadata', draggable: 'false' }), { muted: true, autoplay: true }) : h('img', { src: a.src, alt: a.title, loading: 'lazy', decoding: 'async', draggable: 'false' }); el.addEventListener('contextmenu', e => e.preventDefault()); return el; };
  if (layout === 'sheet') {
    desk.after(h('section', { class: 'alt-layout sheet' }, h('div', { class: 'sheet-head' }, h('span', null, 'CONTACT SHEET'), h('span', null, `${works.length} FRAMES · ${colIdFromHash().toUpperCase()}`)),
      h('div', { class: 'sheet-grid' }, works.map((a, i) => h('button', { class: 'frame', onclick: () => location.hash = `#/work/${a.id}`, 'aria-label': `View ${a.title}` }, h('span', { class: 'fr-num' }, `${pad(i + 1)}A`), h('span', { class: 'fr-win' }, media(a)), h('span', { class: 'fr-cap' }, a.title), h('span', { class: 'fr-mark' }, i % 3 === 0 ? '✓' : '')))) ));
  } else {
    const reel = h('div', { class: 'reel-track' }, works.map(a => h('button', { class: 'reel-cell', onclick: () => location.hash = `#/work/${a.id}`, 'aria-label': `View ${a.title}` }, h('span', { class: 'reel-win' }, media(a)), h('span', { class: 'reel-cap' }, `${a.title} · ${a.date}`))));
    reel.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { reel.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    desk.after(h('section', { class: 'alt-layout reel' }, h('div', { class: 'sprockets' }), reel, h('div', { class: 'sprockets' }), h('p', { class: 'reel-hint' }, '◂ scroll / swipe the reel ▸')));
  }
}

/* =====================================================================
   3. SECTION TRANSITIONS — a file gets pulled between rooms
   ===================================================================== */
const pull = h('div', { class: 'file-pull', 'aria-hidden': 'true' }, h('span'));
document.body.append(pull);
let lastSec = routeName();
addEventListener('hashchange', () => {
  const r = routeName(); if (r === 'work' || lastSec === 'work' && r === 'work') { lastSec = r; return; }
  if (r !== lastSec && !reduce) {
    const id = colIdFromHash(), c = r === 'col' && COLLECTIONS.find(x => x.id === id);
    $('span', pull).textContent = c ? `${c.code} // ${c.name}` : r === 'works' || r === 'home' || r === '' ? 'THE EDIT // SHEDITHERS' : r === 'about' ? 'FILE_00 // THE ARTIST' : 'THE EDIT // SHEDITHERS';
    pull.style.setProperty('--c', c ? c.color : '#c4ab7c'); pull.classList.remove('go'); void pull.offsetWidth; pull.classList.add('go');
  }
  lastSec = r; setTimeout(decorate, 60);
});
new MutationObserver(() => { clearTimeout(decorate.t); decorate.t = setTimeout(decorate, 30); }).observe($('#view'), { childList: true });
decorate();

/* =====================================================================
   4. THE TAPE — cassette personality for the music player
   ===================================================================== */
const P = A.player, audio = P.audio, full = $('.p-full');
const cassette = h('div', { class: 'cassette', 'aria-hidden': 'true' },
  h('div', { class: 'cs-label' }, h('span', { class: 'cs-side' }, 'SIDE A'), h('span', { class: 'cs-title', id: 'csTitle' }, 'your tape'), h('span', { class: 'cs-count', id: 'csCount' }, '000')),
  h('div', { class: 'cs-window' }, h('i', { class: 'reel l' }), h('i', { class: 'tape-run' }), h('i', { class: 'reel r' })),
  h('div', { class: 'cs-foot' }, h('span', null, 'SHEDITHERS ARCHIVE'), h('span', null, 'C-90 · TYPE II')));
full.insertBefore(cassette, $('.p-now', full));
const miniReel = h('i', { class: 'mini-reel', 'aria-hidden': 'true' }); $('.p-mini').insertBefore(miniReel, $('#pMiniInfo'));
const moods = h('div', { class: 'p-moods' }, h('span', null, 'ROOM'), [['dim', 'DIM'], ['glow', 'GLOW'], ['off', 'PLAIN']].map(([k, l]) => h('button', { 'data-m': k, onclick: () => setMood(k) }, l)));
full.insertBefore(moods, $('.p-add', full));
let mood = LS.get('shd.mood', 'glow');
function setMood(m) { mood = m; LS.set('shd.mood', m); document.body.dataset.mood = m; $$('button', moods).forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m)); }
setMood(mood);
const syncTape = () => { const t = P.list[P.list.findIndex(x => x.url === audio.src)] || null; $('#csTitle').textContent = t ? t.title : 'your tape'; document.body.classList.toggle('tape-on', !audio.paused); };
audio.addEventListener('play', syncTape); audio.addEventListener('pause', syncTape); audio.addEventListener('loadedmetadata', syncTape);
audio.addEventListener('timeupdate', () => { $('#csCount').textContent = pad(Math.floor(audio.currentTime) % 1000, 3); const p = audio.duration ? audio.currentTime / audio.duration : 0; cassette.style.setProperty('--l', (1 - p).toFixed(3)); cassette.style.setProperty('--r', p.toFixed(3)); });
// beat glow at the screen edges (never over the art): read level from the player's analyser if present
let ac = null, an = null;
function level() { try { if (!an) { const ctxs = window.__shdAn; if (ctxs) an = ctxs; } } catch (_) { } return 0; }
const edge = h('div', { class: 'edge-glow', 'aria-hidden': 'true' }); document.body.append(edge);
(function pulse() { requestAnimationFrame(pulse); if (audio.paused || mood === 'off' || reduce) { edge.style.opacity = 0; return; } const t = performance.now() / 1000; const v = 0.35 + 0.25 * Math.sin(t * 4.2) * Math.sin(t * 1.3); edge.style.opacity = (mood === 'dim' ? v * 0.5 : v).toFixed(3); })();
void level; void ac;

/* =====================================================================
   5. ZONE MODE — settle in: fullscreen, no chrome, dust drifting behind the art
   ===================================================================== */
const zoneBtn = h('button', { class: 'zone-btn', 'aria-pressed': 'false', title: 'Zone mode · Z' }, h('span', { class: 'zb-dot' }), 'ZONE');
document.body.append(zoneBtn);
const dust = h('canvas', { class: 'dust', 'aria-hidden': 'true' }); document.body.prepend(dust);
let zone = false, drift = null, hideT;
function setZone(on) {
  zone = on; document.body.classList.toggle('zone', on); zoneBtn.setAttribute('aria-pressed', on);
  if (on) { try { document.documentElement.requestFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen().catch(() => { }); } catch (_) { } note('ZONE', 'headphones on. tap ZONE again or press Esc to come back. ← → to wander, D to drift.'); }
  else { if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); setDrift(false); }
  wake();
}
function setDrift(on) { clearInterval(drift); drift = on ? setInterval(() => { if (!A.viewer.hidden) A.step(1); }, 11000) : null; document.body.classList.toggle('drifting', !!on); }
function wake() { document.body.classList.remove('sleepy'); clearTimeout(hideT); if (zone) hideT = setTimeout(() => document.body.classList.add('sleepy'), 2600); }
zoneBtn.onclick = () => setZone(!zone);
['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive: true }));
document.addEventListener('keydown', e => { if (e.target.matches('input,textarea')) return; const k = e.key.toLowerCase(); if (k === 'z') setZone(!zone); else if (k === 'd' && zone && A.viewer.hidden === false && !e.ctrlKey) { setDrift(!drift); note('DRIFT', drift ? 'drifting · a new piece every 11 seconds' : 'drift paused'); } else if (e.key === 'Escape' && zone && A.viewer.hidden) setZone(false); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && zone) setZone(false); });
// a zone button inside the viewer too
$('.v-actions').prepend(h('button', { class: 'v-btn', onclick: () => setZone(!zone), title: 'Zone mode · Z' }, 'ZONE'));
// dust motes — painted on the background canvas, under every artwork
(function dustLoop() {
  if (reduce) return; const cx = dust.getContext('2d'); let W, H; const motes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .3, v: Math.random() * .00025 + .00005, a: Math.random() * Math.PI * 2 }));
  const size = () => { W = dust.width = innerWidth; H = dust.height = innerHeight; }; size(); addEventListener('resize', size);
  (function f() { requestAnimationFrame(f); cx.clearRect(0, 0, W, H); const boost = document.body.classList.contains('tape-on') ? 1.6 : 1; for (const m of motes) { m.y -= m.v * boost; m.a += .01; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); } const x = (m.x + Math.sin(m.a) * .01) * W, y = m.y * H; cx.fillStyle = zone ? 'rgba(233,227,209,.45)' : 'rgba(233,227,209,.18)'; cx.beginPath(); cx.arc(x, y, m.r, 0, 7); cx.fill(); } })();
})();

/* =====================================================================
   6. INK TRAIL — follows the pointer, but lives under the art (desktop only)
   ===================================================================== */
if (fine && !reduce) {
  const ink = h('canvas', { class: 'ink', 'aria-hidden': 'true' }); document.body.prepend(ink); const cx = ink.getContext('2d'); let pts = [];
  const size = () => { ink.width = innerWidth; ink.height = innerHeight; }; size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (pts.length > 40) pts.shift(); }, { passive: true });
  (function f() { requestAnimationFrame(f); cx.clearRect(0, 0, ink.width, ink.height); const now = performance.now(); pts = pts.filter(p => now - p.t < 650); for (let i = 1; i < pts.length; i++) { const a = 1 - (now - pts[i].t) / 650; cx.strokeStyle = `rgba(255,79,163,${a * .55})`; cx.lineWidth = a * 3; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(pts[i - 1].x, pts[i - 1].y); cx.lineTo(pts[i].x, pts[i].y); cx.stroke(); } })();
}

/* first-visit whisper */
if (!LS.get('shd.whisper', false)) setTimeout(() => { if (document.body.classList.contains('entered')) { note('PSST', 'some things in here are hidden. click around. put on your own music (bottom right). press Z to zone out.'); LS.set('shd.whisper', true); } }, 4000);
})();

/* =====================================================================
   7. LITTLE GUY — the artist's character, living in the interface
   ===================================================================== */
(() => {
  if (typeof LIL_GUY === 'undefined') return;
  const mk = cls => { const i = document.createElement('img'); i.src = LIL_GUY; i.alt = ''; i.className = 'lil ' + cls; i.draggable = false; i.addEventListener('contextmenu', e => e.preventDefault()); return i; };
  // rides along on every section transition
  const pullEl = document.querySelector('.file-pull'); if (pullEl) pullEl.append(mk('lil-pull'));
  // peeks over paper edges on each page, and reacts when poked
  const lines = ['hi.', 'don’t mind me.', 'i live here.', 'look at the art, not me.', '♥', 'keep going →'];
  function placePeek() {
    const v = document.getElementById('view'); if (!v || v.querySelector('.lil-peek')) return;
    const host = v.querySelector('.strip-log, .about-card, .works-head, .col-head'); if (!host) return;
    const g = mk('lil-peek'); g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0'); g.setAttribute('aria-label', 'Little guy');
    const say = () => { g.classList.remove('wiggle'); void g.offsetWidth; g.classList.add('wiggle'); const b = document.createElement('span'); b.className = 'lil-say'; b.textContent = lines[Math.floor(Math.random() * lines.length)]; host.append(b); setTimeout(() => b.remove(), 2200); };
    g.addEventListener('click', say); g.addEventListener('keydown', e => { if (e.key === 'Enter') say(); });
    host.style.position = host.style.position || 'relative'; host.append(g);
  }
  new MutationObserver(() => setTimeout(placePeek, 80)).observe(document.getElementById('view'), { childList: true }); setTimeout(placePeek, 300);
  // every so often he scoots across the bottom of the screen
  const scoot = mk('lil-scoot'); document.body.append(scoot);
  setInterval(() => { if (document.hidden || document.body.classList.contains('zone') || !document.body.classList.contains('entered')) return; scoot.classList.remove('go'); void scoot.offsetWidth; scoot.classList.add('go'); }, 47000);
  setTimeout(() => scoot.classList.add('go'), 9000);
})();
