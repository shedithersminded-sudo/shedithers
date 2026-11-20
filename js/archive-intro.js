/* SHEDITHERS — the way in (v3.6.0). Replaces the walk + door check.
 * The artist's pieces keep morphing behind (the dithered blob screen, js/blob-screen.js, the part the artist loves).
 * In front: the SHEDITHERS logo. Grab it and throw it any direction. A dithered trail follows it, and when you let go
 * far enough the screen dithers shut in that direction and opens again on the archive.
 * Keyboard: arrow keys throw it, Enter throws it up. Reduced motion: no throw, it just opens. */
(() => {
'use strict';
const gate = document.getElementById('gate'); if (!gate) { document.documentElement.classList.remove('dg-pre'); return; }
let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1'; } catch (_) { }
if (seen || /^#\/work\//.test(location.hash)) return;
window.SHD_DRAGINTRO = true; // archive-walk.js skips the old walk when this is set
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const RED = '#e0182b', LIME = '#d4ff00', INK = '#0b0a09', PAPER = '#e9e3d1';

const root = document.createElement('div'); root.className = 'dg'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'SHEDITHERS. Drag the logo any direction to go in.');
root.innerHTML = `
  <div class="dg-bg"></div><i class="dg-vig"></i>
  <canvas class="dg-trail" aria-hidden="true"></canvas>
  <div class="dg-top" aria-hidden="true"><span>SHEDITHERS</span><span>ARCHIVE_01 · VIEW ONLY</span></div>
  <div class="dg-ring" aria-hidden="true"><svg viewBox="0 0 200 200"><circle class="dg-r1" cx="100" cy="100" r="96"/><circle class="dg-prog" cx="100" cy="100" r="96" pathLength="100"/></svg>${'<i></i>'.repeat(8)}</div>
  <button class="dg-logo" type="button" aria-label="Drag me any direction to go in"><img src="assets/ui/logo-paper.png" alt="" draggable="false"></button>
  <p class="dg-hint" aria-hidden="true"><b>drag me anywhere</b><small>not ordinary. not in my nature.</small></p>
  <div class="dg-bot" aria-hidden="true"><span class="dg-xy">X 000 · Y 000</span><span>NO IDENTITY CONTROL VIRUS</span></div>
  <button class="dg-skip" type="button">skip ▸</button>
  <canvas class="dg-wipe" aria-hidden="true"></canvas>`;
document.body.append(root); document.body.classList.add('dg-on');

/* ---- sound, made right here with Web Audio (no files): a low bass buzz that calls you to the logo,
 * glitter sparkles while you drag it, a rising shimmer when you throw it. Browsers only allow sound after a touch,
 * so the buzz tries once on arrival and plays for sure on the first press. ---- */
const SFX = (() => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return { buzz() { }, sparkle() { }, rise() { }, unlock() { } };
  let ctx = null, out = null, lastSp = 0;
  const NOTES = [1318.5, 1568, 1760, 2093, 2349.3, 2637, 3136, 3520]; // a bright pentatonic for the glitter
  function init() { if (ctx) return ctx; ctx = new AC(); out = ctx.createGain(); out.gain.value = .55; const comp = ctx.createDynamicsCompressor(); out.connect(comp); comp.connect(ctx.destination); return ctx; }
  function unlock() { init(); if (ctx.state === 'suspended') ctx.resume().catch(() => { }); }
  function buzz() {
    init(); if (ctx.state !== 'running') return; const t = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 55; o2.type = 'square'; o2.frequency.value = 55.6;
    f.type = 'lowpass'; f.frequency.value = 180; f.Q.value = 6;
    lfo.frequency.value = 9; lg.gain.value = 60; lfo.connect(lg); lg.connect(f.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .7);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(out);
    [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + .75); });
  }
  function ping(freq, when, vol, len) {
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 1.004, t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.0008, t + len);
    o.connect(g); if (pan) { pan.pan.value = Math.random() * 1.6 - .8; g.connect(pan); pan.connect(out); } else g.connect(out);
    o.start(t); o.stop(t + len + .02);
  }
  function shimmer(when, len, from, to, vol) {
    const t = ctx.currentTime + when, n = Math.floor(ctx.sampleRate * len), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = b; f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
    src.connect(f); f.connect(g); g.connect(out); src.start(t);
  }
  function sparkle(speed) {
    if (!ctx || ctx.state !== 'running') return; const now = performance.now(), gap = Math.max(45, 140 - speed * 60); if (now - lastSp < gap) return; lastSp = now;
    const k = 1 + Math.min(2, speed | 0);
    for (let i = 0; i < k; i++) ping(NOTES[Math.random() * NOTES.length | 0] * (Math.random() < .3 ? 2 : 1), i * .03, .07, .18 + Math.random() * .2);
    if (Math.random() < .35) shimmer(0, .12, 6000, 9000, .025);
  }
  function rise() {
    if (!ctx || ctx.state !== 'running') return;
    NOTES.concat(NOTES.map(n => n * 2)).forEach((n, i) => ping(n, i * .045, .06, .5));
    shimmer(0, 1.1, 1500, 11000, .06);
  }
  return { buzz, sparkle, rise, unlock };
})();
const $ = s => root.querySelector(s);
const logo = $('.dg-logo'), ring = $('.dg-ring'), prog = $('.dg-prog'), xy = $('.dg-xy'), bg = $('.dg-bg');
let scr = null; if (window.SHD_BLOBSCREEN) scr = window.SHD_BLOBSCREEN(bg, { beatsPer: 4 });

/* ---- canvases at full device resolution ---- */
const trail = $('.dg-trail'), tg = trail.getContext('2d'), wipe = $('.dg-wipe'), wg = wipe.getContext('2d');
let W = 0, H = 0, dpr = 1;
function size() {
  dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  for (const c of [trail, wipe]) { c.width = W * dpr; c.height = H * dpr; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
}
size(); addEventListener('resize', size);

/* ---- the drag: the logo follows the finger on a spring, leaves a dithered trail ---- */
let dragging = false, sx = 0, sy = 0, tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, done = false, lastP = null, pid = null;
const need = () => Math.min(W, H) * .26; // how far to throw before it counts
const dots = []; // trail stamps
logo.addEventListener('pointerdown', e => {
  if (done) return; dragging = true; pid = e.pointerId; logo.setPointerCapture(pid); SFX.unlock(); SFX.buzz(); root.classList.add('woke');
  sx = e.clientX - tx; sy = e.clientY - ty; root.classList.add('grab'); lastP = { x: e.clientX, y: e.clientY, t: performance.now() };
});
logo.addEventListener('pointermove', e => {
  if (!dragging || e.pointerId !== pid) return;
  tx = e.clientX - sx; ty = e.clientY - sy;
  const now = performance.now(), dt = Math.max(8, now - lastP.t);
  const sp = Math.hypot(e.clientX - lastP.x, e.clientY - lastP.y) / dt;
  dots.push({ x: W / 2 + tx, y: H / 2 + ty, r: 26 + Math.min(70, sp * 40), life: 1, hue: dots.length % 3 });
  SFX.sparkle(sp);
  lastP = { x: e.clientX, y: e.clientY, t: now, vx: (e.clientX - lastP.x) / dt, vy: (e.clientY - lastP.y) / dt };
});
const release = e => {
  if (!dragging || (e && e.pointerId !== pid)) return; dragging = false; root.classList.remove('grab');
  const d = Math.hypot(tx, ty), fling = lastP && lastP.vx != null ? Math.hypot(lastP.vx, lastP.vy) : 0;
  if (d > need() || (fling > 1.1 && d > need() * .35)) go(tx || (lastP && lastP.vx) || 0, ty || (lastP && lastP.vy) || -1);
  else { tx = 0; ty = 0; } // springs home
};
logo.addEventListener('pointerup', release); logo.addEventListener('pointercancel', release);
// a tap without a drag: the logo nudges to show it moves
logo.addEventListener('click', () => { if (done || Math.hypot(x, y) > 6) return; root.classList.remove('nudge'); void root.offsetWidth; root.classList.add('nudge'); });
root.addEventListener('keydown', e => {
  const k = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], Enter: [0, -1] }[e.key];
  if (k && !e.target.closest('.dg-skip')) { e.preventDefault(); go(k[0], k[1]); }
});
$('.dg-skip').addEventListener('click', () => go(0, -1));

/* ---- main loop: spring, ring progress, trail ---- */
let raf = 0, t0 = performance.now();
function frame(t) {
  const k = dragging ? .38 : .12, damp = dragging ? .55 : .74;
  vx = (vx + (tx - x) * k) * damp; vy = (vy + (ty - y) * k) * damp; x += vx; y += vy;
  const d = Math.hypot(x, y), p = Math.min(1, d / need()), ang = Math.atan2(y, x);
  logo.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  logo.style.rotate = `${(vx * .6).toFixed(2)}deg`;
  logo.style.scale = (1 + p * .08).toFixed(3);
  root.style.setProperty('--p', p.toFixed(3));
  prog.style.strokeDashoffset = (100 - p * 100).toFixed(1);
  ring.style.rotate = (ang * 180 / Math.PI + 90).toFixed(1) + 'deg';
  // the art leans away from the logo a little
  bg.style.translate = `${(-x * .04).toFixed(1)}px ${(-y * .04).toFixed(1)}px`;
  xy.textContent = `X ${String(Math.round(Math.abs(x))).padStart(3, '0')} · Y ${String(Math.round(Math.abs(y))).padStart(3, '0')}`;
  drawTrail(t);
  if (!done || dots.length) raf = requestAnimationFrame(frame);
}
/* the trail is drawn as ordered dither: each stamp is a soft circle, thresholded through a 4x4 Bayer grid on big
 * pixels, so it reads as dithered ink in red + lime, crisp at any screen density */
const CELL = 5;
function drawTrail(t) {
  tg.clearRect(0, 0, W, H);
  if (!dots.length) return;
  for (let i = dots.length - 1; i >= 0; i--) { dots[i].life -= .022; if (dots[i].life <= 0) dots.splice(i, 1); }
  if (dots.length > 140) dots.splice(0, dots.length - 140);
  // bounding box of all stamps, then threshold cell by cell
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of dots) { x0 = Math.min(x0, s.x - s.r); y0 = Math.min(y0, s.y - s.r); x1 = Math.max(x1, s.x + s.r); y1 = Math.max(y1, s.y + s.r); }
  x0 = Math.max(0, Math.floor(x0 / CELL)); y0 = Math.max(0, Math.floor(y0 / CELL)); x1 = Math.min(Math.ceil(W / CELL), Math.ceil(x1 / CELL)); y1 = Math.min(Math.ceil(H / CELL), Math.ceil(y1 / CELL));
  const wob = t * .002;
  for (let cy = y0; cy < y1; cy++) for (let cx = x0; cx < x1; cx++) {
    const px = cx * CELL + CELL / 2, py = cy * CELL + CELL / 2; let v = 0, hue = 0;
    for (const s of dots) {
      const dx = px - s.x, dy = py - s.y, rr = s.r * s.r, d2 = dx * dx + dy * dy; if (d2 > rr) continue;
      const a = (1 - d2 / rr) * s.life; if (a > v) { v = a; hue = s.hue; }
    }
    if (v <= 0) continue;
    const th = BAYER[(cy & 3) * 4 + (cx & 3)];
    if (v * 1.15 > th) {
      tg.fillStyle = v > .72 ? PAPER : (hue === 1 ? LIME : RED);
      tg.globalAlpha = Math.min(1, .35 + v);
      const s = CELL - 1.2 + Math.sin(wob + cx * .3 + cy * .2) * .4;
      tg.fillRect(cx * CELL, cy * CELL, s, s);
    }
  }
  tg.globalAlpha = 1;
}
raf = requestAnimationFrame(frame);
let calls = 0; const call = setInterval(() => { if (done || root.classList.contains('woke') || calls++ > 6) return clearInterval(call); try { SFX.unlock(); SFX.buzz(); } catch (_) { } root.classList.remove('buzz'); void root.offsetWidth; root.classList.add('buzz'); }, 2800);
setTimeout(() => { try { logo.focus({ preventScroll: true }); } catch (_) { } }, 400);

/* ---- going in: the logo flies off, the screen dithers shut along the throw, the archive opens, it dithers open ---- */
function go(dx, dy) {
  if (done) return; done = true; dragging = false; root.classList.add('out'); SFX.unlock(); SFX.rise();
  const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  tx = ux * Math.max(W, H) * 1.3; ty = uy * Math.max(W, H) * 1.3;
  try { sessionStorage.setItem('shd.walked', '1'); } catch (_) { }
  if (reduce) { openArchive(); finish(); return; }
  const C = Math.max(10, Math.round(Math.min(W, H) / 60)), cols = Math.ceil(W / C), rows = Math.ceil(H / C);
  // each cell's turn: how far along the throw direction it sits, mixed with its Bayer value so the edge is dithered
  const proj = (cx, cy) => { const px = cx * C - W / 2, py = cy * C - H / 2; return (px * ux + py * uy) / (Math.abs(W * ux) + Math.abs(H * uy)) + .5; };
  const order = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) order[cy * cols + cx] = proj(cx, cy) * .62 + BAYER[(cy & 3) * 4 + (cx & 3)] * .38;
  const IN = 640, HOLD = 260, OUT = 820, start = performance.now(); let opened = false;
  function step(t) {
    const e = t - start; wg.clearRect(0, 0, W, H);
    let a, b; // a: covered up to, b: uncovered up to
    if (e < IN) { a = ease(e / IN); b = -1; }
    else if (e < IN + HOLD) { a = 1.01; b = -1; if (!opened) { opened = true; openArchive(); } }
    else { a = 1.01; b = ease(Math.min(1, (e - IN - HOLD) / OUT)); if (!opened) { opened = true; openArchive(); } }
    for (let i = 0; i < order.length; i++) {
      const o = order[i]; if (o > a || o <= b) continue;
      const cx = i % cols, cy = (i / cols) | 0, edgeIn = a - o < .06 && a < 1, edgeOut = o - b < .05 && b > 0;
      wg.fillStyle = edgeIn ? (i % 3 ? RED : LIME) : edgeOut ? (i % 2 ? RED : PAPER) : INK;
      wg.fillRect(cx * C, cy * C, C - (edgeIn || edgeOut ? 2 : 0), C - (edgeIn || edgeOut ? 2 : 0));
    }
    if (e > IN + 120) { bg.style.visibility = 'hidden'; root.classList.add('clear'); }
    if (e < IN + HOLD + OUT) requestAnimationFrame(step); else { if (!opened) openArchive(); finish(); }
  }
  requestAnimationFrame(step);
  // safety: if animation frames stall (hidden tab, slow device), still open the archive
  setTimeout(() => { if (!root.isConnected) return; if (!opened) { opened = true; openArchive(); } finish(); }, IN + HOLD + OUT + 900);
}
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function openArchive() { const b = document.getElementById('enter'); if (b) b.click(); else { gate.remove(); document.body.classList.add('entered'); } }
function finish() {
  if (!root.isConnected) return;
  document.documentElement.classList.remove('dg-pre');
  cancelAnimationFrame(raf); removeEventListener('resize', size);
  if (scr) scr.stop();
  root.remove(); document.body.classList.remove('dg-on');
  const v = document.getElementById('view'); if (v) try { v.focus({ preventScroll: true }); } catch (_) { }
}
})();
