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

/* ---- sound, made right here with Web Audio (no files). v4.3.2: breakcore, no sparkles.
 * a low buzz calls you to the logo. dragging it plays a chopped amen-style break at 172bpm over a soft,
 * dreamy chord in a big reverb. the faster you drag, the harder it chops (snare rolls, stutters, drops)
 * and the brighter the chord. throwing it fires a rising snare roll into a huge chord and a sub drop.
 * Browsers only allow sound after a touch, so it all starts on the first press. ---- */
const SFX = (() => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return { buzz() { }, sparkle() { }, rise() { }, unlock() { } };
  let ctx = null, out = null, drums = null, verb = null, noiseB = null;
  const STEP = 60 / 172 / 4; // 16th notes at 172bpm
  // the break: kick, snare, ghost snare (amen-ish), hats on every step
  const K = [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0], S = [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1], G = [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0];
  const CHORD = [146.83, 220, 277.18, 329.63, 369.99, 440], HIGH = [293.66, 369.99, 440, 554.37, 659.25, 739.99]; // Dmaj9, soft and open
  function init() {
    if (ctx) return ctx; ctx = new AC();
    out = ctx.createGain(); out.gain.value = .32; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; out.connect(comp); comp.connect(ctx.destination);
    drums = ctx.createGain(); drums.gain.value = .4; drums.connect(out);
    // reverb from a made-up room: 3s of fading stereo noise
    verb = ctx.createConvolver(); const n = ctx.sampleRate * 3, ir = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = .45; verb.connect(vg); vg.connect(out);
    noiseB = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noiseB.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function unlock() { init(); if (ctx.state === 'suspended') ctx.resume().catch(() => { }); }
  const env = (g, t, v, a, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + a + d); };
  function buzz() {
    init(); if (ctx.state !== 'running') return; const t = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 55; o2.type = 'square'; o2.frequency.value = 55.6;
    f.type = 'lowpass'; f.frequency.value = 180; f.Q.value = 6;
    lfo.frequency.value = 9; lg.gain.value = 60; lfo.connect(lg); lg.connect(f.frequency);
    env(g, t, .3, .05, .65);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(out);
    [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + .75); });
  }
  // ---- drum voices ----
  function kick(t, v = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
    env(g, t, .95 * v, .002, .38); o.connect(g); g.connect(drums); o.start(t); o.stop(t + .45);
  }
  function snare(t, v = 1, pitch = 1, wet = .25) {
    const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain(), s = ctx.createGain();
    n.buffer = noiseB; n.playbackRate.value = pitch; f.type = 'bandpass'; f.frequency.value = 1900 * pitch; f.Q.value = .8;
    env(g, t, .55 * v, .001, .16); n.connect(f); f.connect(g); g.connect(drums);
    o.type = 'triangle'; o.frequency.setValueAtTime(210 * pitch, t); o.frequency.exponentialRampToValueAtTime(150 * pitch, t + .08);
    env(og, t, .4 * v, .001, .09); o.connect(og); og.connect(drums);
    s.gain.value = wet; g.connect(s); s.connect(verb);
    n.start(t, Math.random() * .5, .3); o.start(t); o.stop(t + .15);
  }
  function hat(t, v = 1) {
    const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseB; f.type = 'highpass'; f.frequency.value = 7500; env(g, t, .16 * v, .001, .035);
    n.connect(f); f.connect(g); g.connect(drums); n.start(t, Math.random() * .5, .08);
  }
  function sub(t, f0, len) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .5, t + len);
    env(g, t, .5, .01, len); o.connect(g); g.connect(out); o.start(t); o.stop(t + len + .05);
  }
  // ---- the chord: detuned saws through a soft lowpass, mostly reverb ----
  function chord(notes, t, vol, fade) {
    const f = ctx.createBiquadFilter(), g = ctx.createGain(), wet = ctx.createGain(), oscs = [];
    f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = .7;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + fade);
    wet.gain.value = .8; f.connect(g); g.connect(out); g.connect(wet); wet.connect(verb);
    notes.forEach(fr => [-8, 7].forEach(c => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = c + (Math.random() * 4 - 2); o.connect(f); o.start(t); oscs.push(o); }));
    return { f, g, stop(at, rel) { at = Math.max(at, ctx.currentTime); if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(at); else { g.gain.cancelScheduledValues(at); g.gain.setValueAtTime(Math.min(vol, g.gain.value), at); } g.gain.setTargetAtTime(0, at, rel / 4); oscs.forEach(o => o.stop(at + rel + .1)); } };
  }
  // ---- the loop: runs only while you're dragging ----
  let seq = 0, nextT = 0, step = 0, energy = 0, lastMove = 0, pad = null, last = null;
  function play(i, t) {
    const e = energy;
    if (e > .35 && Math.random() < .07) return; // a dropout: the break cuts for one step
    hat(t, i % 2 ? .5 : 1);
    if (K[i]) { kick(t); if (i === 0) sub(t, 73.42, .5); last = 'k'; }
    if (S[i]) {
      if (e > 1.1 && Math.random() < .45) { const n = e > 2 ? 6 : 4; for (let k = 0; k < n; k++) snare(t + k * STEP * 1.4 / n, .45 + k * .1, 1 + k * .06, .2); } // roll
      else snare(t, 1, 1, e > .8 ? .45 : .25);
      last = 's';
    } else if (G[i]) snare(t, .3, 1.08, .1);
    if (e > .6 && !K[i] && !S[i] && Math.random() < .18) { // stutter: the last hit repeats, pitched down
      for (let k = 0; k < 3; k++) { if (last === 'k') kick(t + k * STEP / 3, .6); else snare(t + k * STEP / 3, .5, .8 - k * .1, .3); }
    }
  }
  function tick() {
    if (!ctx) return;
    if (performance.now() - lastMove > 260) { stopLoop(.9); return; }
    energy *= .96;
    while (nextT < ctx.currentTime + .12) { play(step, nextT); nextT += STEP; step = (step + 1) % 16; }
    if (pad) pad.f.frequency.setTargetAtTime(700 + energy * 1300, ctx.currentTime, .15);
  }
  function stopLoop(rel) { clearInterval(seq); seq = 0; if (pad) { pad.stop(ctx.currentTime, rel); pad = null; } }
  function sparkle(speed) { // (kept the old name) called on every drag move
    if (!ctx || ctx.state !== 'running') return;
    lastMove = performance.now(); energy += (Math.min(3, speed) - energy) * .3;
    if (!seq) { const t = ctx.currentTime + .03; nextT = t; step = 0; pad = chord(CHORD, t, .016, .5); seq = setInterval(tick, 25); }
  }
  function rise() { // the throw
    if (!ctx || ctx.state !== 'running') return;
    clearInterval(seq); seq = 0; const t = ctx.currentTime;
    if (pad) { pad.f.frequency.setTargetAtTime(4200, t, .3); pad.stop(t + 1, .6); pad = null; }
    let at = t; for (let k = 0; k < 18; k++) { snare(at, .35 + k * .035, 1 + k * .04, .3 + k * .02); at += .11 * Math.pow(.86, k) + .012; }
    kick(at, 1.1); sub(at, 73.42, 1.6); snare(at, 1, .9, 1);
    const big = chord(HIGH.concat(CHORD), Math.max(t, at - .25), .03, .3);
    big.f.frequency.setValueAtTime(900, Math.max(t, at - .25)); big.f.frequency.exponentialRampToValueAtTime(3200, at + .4); big.f.frequency.exponentialRampToValueAtTime(800, at + 3);
    big.stop(at + .9, 2.6);
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
