/* SHEDITHERS — Archive: TikTok TV + cute and hidden animations (interface only). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {}, FX = window.SHD_FX || { discover() { }, note() { }, NOTES: {}, upd() { } };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const at = e => [e.clientX || innerWidth / 2, e.clientY || innerHeight / 2];
Object.assign(FX.NOTES, { eyes: 'the eyes blinked back. they like you.', letters: 'you shook the letters loose. they always find their way home.', night: 'secret night shift unlocked. the archive glows different after hours.', bottom: 'you reached the bottom. there is no bottom. keep looking anyway.', love: 'you typed love. the archive typed it back.' });
FX.upd();

/* =====================================================================
   TIKTOK TV — a little CRT that tunes into the artist's TikTok.
   Nothing loads from TikTok until a visitor switches it on.
   ===================================================================== */
const handle = String(CFG.tiktok || '').replace(/^@/, '').trim();
const vids = (CFG.tiktokVideos || []).map(u => (String(u).match(/(\d{8,})/) || [])[1]).filter(Boolean);
const tv = h('div', { class: 'tv off', 'aria-label': 'TikTok TV' });
const screen = h('div', { class: 'tv-screen' }, h('canvas', { class: 'tv-static', width: 80, height: 60 }), h('span', { class: 'tv-msg' }, 'NO SIGNAL', h('br'), h('small', null, 'tap to tune in ▸')));
const chLabel = h('span', { class: 'tv-ch' }, 'CH 00');
tv.append(h('div', { class: 'tv-ant', 'aria-hidden': 'true' }, h('i'), h('i')), h('div', { class: 'tv-body' }, screen,
  h('div', { class: 'tv-panel' }, chLabel, h('button', { class: 'tv-k', 'aria-label': 'Previous channel', onclick: () => tune(-1) }, '◂'), h('button', { class: 'tv-k', 'aria-label': 'Next channel', onclick: () => tune(1) }, '▸'), h('button', { class: 'tv-k pw', 'aria-label': 'Power', onclick: () => power() }, '⏻'), h('button', { class: 'tv-k', 'aria-label': 'Minimise TV', onclick: () => tv.classList.toggle('min') }, '▾'))),
  h('span', { class: 'tv-tag' }, '♪ TIKTOK TV · @' + (handle || 'shedithers')));
document.body.append(tv);
let on = false, ch = 0, rotate = null;
function staticNoise() { const c = $('.tv-static', tv), x = c.getContext('2d'); const d = x.createImageData(80, 60); (function f() { if (on && !tv.classList.contains('tuning')) return requestAnimationFrame(f); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); setTimeout(() => requestAnimationFrame(f), 70); })(); }
staticNoise();
function frameFor(i) {
  if (vids.length) return h('iframe', { src: `https://www.tiktok.com/player/v1/${vids[i]}?autoplay=1&loop=1&muted=1&controls=1&progress_bar=0&rel=0&description=0&music_info=0&closed_caption=0`, allow: 'autoplay; encrypted-media; fullscreen', allowfullscreen: true, title: 'SHEDITHERS on TikTok', loading: 'lazy' });
  return h('iframe', { src: `https://www.tiktok.com/embed/@${handle}?lang=en`, title: 'SHEDITHERS on TikTok', loading: 'lazy' });
}
function show() { tv.classList.add('tuning'); setTimeout(() => { $$('iframe', screen).forEach(f => f.remove()); screen.append(frameFor(ch)); chLabel.textContent = 'CH ' + String(ch + 1).padStart(2, '0'); tv.classList.remove('tuning'); }, reduce ? 0 : 450); }
function power() {
  on = !on; tv.classList.toggle('off', !on); clearInterval(rotate);
  if (!on) { $$('iframe', screen).forEach(f => f.remove()); staticNoise(); return; }
  if (!handle && !vids.length) return;
  show(); if (vids.length > 1) rotate = setInterval(() => { if (!document.hidden) tune(1); }, 45000);
}
function tune(d) { if (!on) return power(); if (!vids.length) { window.open(`https://www.tiktok.com/@${handle}`, '_blank', 'noopener'); return; } ch = (ch + d + vids.length) % vids.length; show(); }
screen.addEventListener('click', () => { if (!on) power(); });
// the TV wanders a little when ignored ("flashing around"), but never over the centre of the page
let wander = 0; setInterval(() => { if (on || tv.classList.contains('min') || document.body.classList.contains('zone') || reduce) return; wander = (wander + 1) % 3; tv.dataset.spot = wander; }, 20000);

/* =====================================================================
   CUTE THINGS
   ===================================================================== */
// 1. eyes peeking through a torn hole in the top bar — they follow the pointer and blink
const eyes = h('button', { class: 'peep', 'aria-label': 'Someone is watching' }, h('i', { class: 'eye' }, h('b')), h('i', { class: 'eye' }, h('b')));
$('.bar').append(eyes);
addEventListener('pointermove', e => { const r = eyes.getBoundingClientRect(); if (!r.width) return; const dx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 300)), dy = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / 300)); eyes.style.setProperty('--ex', (dx * 3).toFixed(1) + 'px'); eyes.style.setProperty('--ey', (dy * 2.5).toFixed(1) + 'px'); }, { passive: true });
setInterval(() => { if (reduce) return; eyes.classList.add('blink'); setTimeout(() => eyes.classList.remove('blink'), 160); }, 4200);
eyes.addEventListener('click', e => { eyes.classList.add('happy'); setTimeout(() => eyes.classList.remove('happy'), 1600); FX.discover('eyes', ...at(e)); });
// 2. tiny hearts float up out of the tape deck while music plays
const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player;
setInterval(() => { if (!P || P.audio.paused || reduce || document.body.classList.contains('zone')) return; const m = $('.p-mini'); if (!m) return; const r = m.getBoundingClientRect(); const s = h('span', { class: 'float-heart', style: `left:${r.left + 30 + Math.random() * (r.width - 60)}px;top:${r.top}px;--dx:${(Math.random() - .5) * 60}px;color:${Math.random() < .5 ? '#ff4fa3' : '#d4ff00'}` }, Math.random() < .7 ? '♥' : '✦'); document.body.append(s); setTimeout(() => s.remove(), 2600); }, 900);
// 3. clicks leave a little sparkle
addEventListener('pointerdown', e => { if (reduce || e.pointerType === 'touch' && Math.random() < .5) return; const s = h('span', { class: 'click-spark', style: `left:${e.clientX}px;top:${e.clientY}px` }); document.body.append(s); setTimeout(() => s.remove(), 500); }, { passive: true });
// 4. sleepy little guy: after a quiet minute the peeking guy dozes (zzz)
let quiet; const doze = () => { clearTimeout(quiet); document.body.classList.remove('dozing'); quiet = setTimeout(() => document.body.classList.add('dozing'), 50000); };
['pointermove', 'keydown', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, doze, { passive: true })); doze();
// 5. twinkle: random wall stars twinkle now and then
setInterval(() => { if (reduce) return; const st = $$('.wall .w.star, .wall .w.heart'); const s = st[Math.floor(Math.random() * st.length)]; if (s) { s.classList.add('twinkle'); setTimeout(() => s.classList.remove('twinkle'), 1200); } }, 1800);

/* =====================================================================
   MORE HIDDEN THINGS
   ===================================================================== */
// triple-tap any big heading → letters scatter and come back
document.addEventListener('click', e => {
  const hd = e.target.closest('.works-head h2, .col-head h2, .about-card h2, .title-scrap h1'); if (!hd || e.detail < 3) return;
  if (!hd.dataset.split) { hd.dataset.split = 1; const txt = hd.textContent; hd.textContent = ''; [...txt].forEach(c => hd.append(h('span', { class: 'ltr' }, c === ' ' ? ' ' : c))); }
  $$('.ltr', hd).forEach(l => { l.style.setProperty('--sx', (Math.random() - .5) * 220 + 'px'); l.style.setProperty('--sy', (Math.random() - .5) * 160 + 'px'); l.style.setProperty('--sr', (Math.random() - .5) * 120 + 'deg'); l.classList.remove('scatter'); void l.offsetWidth; l.classList.add('scatter'); });
  FX.discover('letters', ...at(e));
});
// hold the ZONE button for 2 seconds → secret night shift palette
const zb = $('.zone-btn'); let nightT;
if (zb) { zb.addEventListener('pointerdown', e => { const p = at(e); nightT = setTimeout(() => { document.body.classList.toggle('night'); FX.discover('night', ...p); }, 2000); }); ['pointerup', 'pointerleave'].forEach(ev => zb.addEventListener(ev, () => clearTimeout(nightT))); }
// reach the very bottom of a long page
let bottomDone = false; addEventListener('scroll', () => { if (bottomDone) return; if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && document.documentElement.scrollHeight > innerHeight * 2) { bottomDone = true; FX.discover('bottom', innerWidth / 2, innerHeight - 120); } }, { passive: true });
// type "love"
let typed = ''; document.addEventListener('keydown', e => { if (e.target.matches && e.target.matches('input,textarea')) return; typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-6); if (typed.endsWith('love')) { typed = ''; FX.discover('love', innerWidth / 2, innerHeight / 2); for (let i = 0; i < 18 && !reduce; i++) setTimeout(() => { const s = h('span', { class: 'float-heart big', style: `left:${Math.random() * innerWidth}px;top:${innerHeight - 40}px;--dx:${(Math.random() - .5) * 120}px;color:#ff4fa3` }, '♥'); document.body.append(s); setTimeout(() => s.remove(), 2600); }, i * 70); } });
})();
