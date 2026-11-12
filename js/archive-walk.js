/* SHEDITHERS — the way in: a night alley papered with the artist's posters and sprayed with the artist's doodles, and at the end
 * a warehouse with the roll-up door half open, lime light and bass pouring out. You're holding a xeroxed flyer in
 * bone-print rave gloves. The scene is rendered from the artist's own art (re-render with tools/walk-scene.py). */
(() => {
'use strict';
const gate = document.getElementById('gate'); if (!gate || typeof ARTWORKS === 'undefined') return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; };
const abs = u => new URL(u, location.href).href;

/* 1) the gate wears the same lime render as the inside of the site */
const render = el('div', 'g-render'); render.setAttribute('aria-hidden', 'true');
['who-will-you-be', 'are-we-alive-yet', 'when-you-rain'].map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean)
  .forEach((a, i) => { const L = el('i', 'pr-layer' + (i === 0 ? ' on' : '')); L.style.backgroundImage = `url('${abs(a.src)}')`; render.append(L); });
render.append(el('i', 'pr-tint'), el('i', 'pr-streaks'), el('i', 'pr-grid'));
gate.prepend(render);

/* 1b) the gate wears the blob-tracking art screen: the artist's pieces flash by on the beat, dithered, with
 * flickering yellow characters and tracking boxes locked onto the shapes (js/blob-screen.js) */
if (window.SHD_BLOBSCREEN) {
  const bsg = el('div', 'gate-bs'); render.after(bsg); const gateScr = window.SHD_BLOBSCREEN(bsg); gate.classList.add('in-bs');
  const mo = new MutationObserver(() => { if (!document.body.contains(gate)) { gateScr.stop(); mo.disconnect(); } }); mo.observe(document.body, { childList: true, subtree: true });
}
let gi = 0; const gT = setInterval(() => { if (!document.body.contains(render)) return clearInterval(gT); const L = render.querySelectorAll('.pr-layer'); L[gi].classList.remove('on'); gi = (gi + 1) % L.length; L[gi].classList.add('on'); }, 7000);

/* 2) the walk (once per visit, only when the gate is showing) */
let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1' || sessionStorage.getItem('shd.walked') === '1'; } catch (_) { }
if (seen || /^#\/work\//.test(location.hash)) return;

const PAPER = '#e9e3d1', ORANGE = '#e2682a', LIME = '#d4ff00';
/* the scene: a rendered night alley (built from the artist's posters + doodles) at the end of which a warehouse door
 * is half up, lime light and bass pouring out. wide picture for PC/tablet, tall picture for phones. */
const tall = matchMedia('(max-aspect-ratio: 5/6)').matches;
const PH = { wide: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAXACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDz2EYPPIpWthLMfLGAaji6jmtu1RGBwB2J/KuepPk1OiLTVmZp0qXZuyMeuaqtbOrlcZx6V3cL2wsVX7QWdiUEODx3+mKx9Vt1hZNu0ZTJrCnipSdmXUp0/snONAV60VPORg0V1ptolqCK6vjFaNneiM9M54ORRRSnFNamCZqyapB9l2+RmTdu8wnn6YrJvL43BA+7gYoorGnSitTRybM6Rs5Gc0UUV1IzbP/Z', tall: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAoABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzMAnpS7G9Kv2truCvjOea6EaXbm1y2NxXOAvf65rnqYhQZ0U6Cmrt2OP2NjpRWzd2aoN3yqvYUVcaqauJ0SxpsaeXkk5zxjtXSR3MjWbW7WkYTOBOM5/wrirK7MeAxJXOcVv/ANvNHYm3iwsZ5wGIP6VwYijJva5VOWm5BrSxx20KA5b5sn8aKzbq+a5UJI/yjOO/WiumlFxjZg5XMkMRT/ObHWiiuqyOdNoYXJoooosFz//Z' }; // tiny blurred stand-ins while the real picture loads
const scene = `<div class="wk-scene" aria-hidden="true" style="--ph:url('${tall ? PH.tall : PH.wide}')"><picture><source media="(max-aspect-ratio: 5/6)" srcset="${abs('assets/ui/walk-scene-tall.jpg')}"><img src="${abs('assets/ui/walk-scene.jpg')}" alt="" decoding="async"></picture><i class="wk-bass"></i><i class="wk-doods"></i><i class="wk-fog"></i></div>`;
/* bone-print rave gloves: palms behind the flyer, thumbs over the front */
/* skeleton hands, drawn as dithered bone: every bone is a dark outline with a dot-dither fill (ink + paper) */
const bone = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bo" stroke-width="${w * 1.5 + 8}"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bi" stroke-width="${w * 1.5}"/>`;
const knob = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 1.4 + 4}" class="bko"/><circle cx="${x}" cy="${y}" r="${r * 1.4}" class="bki"/>`;
const palm = bone(-46, 790, -22, 640, 18) + bone(-8, 790, 12, 642, 15) +
  knob(-24, 624, 9) + knob(-3, 618, 8) + knob(15, 626, 8) + knob(-13, 602, 7) + knob(6, 600, 7) +
  bone(-22, 598, -19, 556, 9) + bone(-4, 594, 8, 546, 9) + bone(11, 598, 32, 552, 9) + bone(22, 606, 50, 570, 8) +
  knob(-19, 556, 6) + knob(8, 546, 6) + knob(32, 552, 6) + knob(50, 570, 5) +
  bone(-19, 556, -16, 512, 7) + bone(8, 546, 12, 494, 7) + bone(32, 552, 38, 504, 7) + bone(50, 570, 62, 532, 6);
const thumb = bone(14, 612, 46, 548, 10) + knob(46, 548, 6) + bone(46, 548, 72, 506, 8) + knob(72, 506, 5) + bone(72, 506, 94, 478, 7) + `<circle cx="97" cy="474" r="6" class="bki tip"/>`;
const dith = id => `<defs><pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#9d9684"/><rect width="2" height="2" fill="#e9e3d1"/><rect x="2" y="2" width="2" height="2" fill="#e9e3d1"/><rect x="2" y="0" width="1" height="1" fill="#4a463d"/></pattern></defs>`;
const hands = (inner, cls) => `<svg class="fy-hands bones ${cls}" viewBox="0 0 400 720" aria-hidden="true">${dith('dth-' + cls)}<g style="--dth:url(#dth-${cls})" transform="translate(0 -70)">${inner(false)}</g><g style="--dth:url(#dth-${cls})" transform="translate(400 -70) scale(-1 1)">${inner(true)}</g></svg>`;
const back = hands(() => palm, 'back');
const front = hands(() => thumb, 'front');
const flyer = `<button class="wk-hold" type="button" aria-label="Tap the flyer to go in">${back}
  <span class="fly">
    <i class="fy-staple"></i><i class="fy-tape"></i>
    <span class="fy-top"><em>underground · invite only</em><em>N°01</em></span>
    <b class="fy-name">shedithers</b>
    <span class="fy-art"><i class="fy-k"></i><i class="fy-r"></i><span class="fy-stamp">no photos</span></span>
    <span class="fy-line">REMEMBER TO FORGET</span>
    <span class="fy-line sm">a night of dither + glitch · the archive + the dither lab open all night</span>
    <span class="fy-info">SUN 08.11.26 — 10PM ’TIL LATE<br>LOCATION: FOLLOW THE BASS<br>NO IDENTITY · NO PAYWALL · NO PHONES OUT</span>
    <span class="fy-stub"><span>ADMIT ONE</span><span class="fy-go">tap to go in ▸</span></span>
  </span>${front}</button>`;
const title = 'shedithers'.split('').map((ch, i) => `<span style="--d:${(i * 0.11).toFixed(2)}s">${ch}</span>`).join('');
const walk = el('div', 'walk' + (reduce ? ' still' : ''));
walk.setAttribute('role', 'dialog'); walk.setAttribute('aria-label', 'Walking to the SHEDITHERS warehouse. Tap the flyer to go in.');
walk.innerHTML = `${scene}<i class="wk-vig"></i>
  <div class="wk-hud"><b class="wk-title" aria-label="SHEDITHERS">${title}</b><span class="wk-dist">0.20 MI ▸</span></div>
  <div class="wk-steps" aria-hidden="true"><span>you found a flyer.</span><span>follow the bass.</span></div>
  ${flyer}
  <button class="wk-skip" type="button">skip ▸</button><i class="wk-grain"></i>
  <div class="wk-bar top" aria-hidden="true"></div>
  <div class="wk-bar bot" aria-hidden="true"><span class="wk-obs">shedithers</span><span class="wk-date">08✦11✦2026</span><span class="wk-check"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`;
/* the flyer in your hands IS one of the artist's pieces (a different one each visit), with the ticket stub under it */
const FLYERS = ['memory-is-punishment', 'she-knows-the-night', 'when-you-rain', 'who-will-you-be', 'untitled-hands', 'dream-without-action', 'not-in-my-nature']
  .map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean);
const fyArt = FLYERS[Math.floor(Math.random() * FLYERS.length)] || ARTWORKS.find(a => a.id === 'shedithers-eyes');
if (fyArt) { const fly = walk.querySelector('.fly'); fly.style.setProperty('--fy-art', `url('${abs(fyArt.src)}')`); fly.classList.add('art-flyer'); fly.insertAdjacentHTML('afterbegin', '<span class="fy-song">♪ follow me to heaven</span><i class="fy-tex" aria-hidden="true"></i><span class="fy-sim" aria-hidden="true"><b>ADMIT ONE</b> into a better simulation · v2.0 · no return</span>'); }
/* the flyer becomes a pile of little 3D cubes with the artist's pieces on every face: they tumble down into the
 * gloves and settle into a heap, then slowly turn (artist's reference: a tumbling pile of dice). The ticket stub stays. */
if (typeof SHD_INTRO_ART !== 'undefined' && SHD_INTRO_ART.length) {
  const fly = walk.querySelector('.fly'), pile = el('span', 'fy-cubes'); pile.setAttribute('aria-hidden', 'true');
  const art = SHD_INTRO_ART.slice().sort(() => Math.random() - .5), url = id => `url('${abs('assets/ui/intro-art/' + id + '.jpg')}')`;
  // a heap: wide at the bottom, a few on top, a little messy
  const rows = [6, 5, 4, 3, 2]; let n = 0, html = '';
  rows.forEach((count, r) => { for (let c = 0; c < count; c++) {
    const x = (c - (count - 1) / 2) * 15.5 + (Math.random() - .5) * 5, y = 78 - r * 14.5 + (Math.random() - .5) * 3, rx = (Math.random() * 40 - 20) | 0, ry = (Math.random() * 70 - 35) | 0, rz = (Math.random() * 30 - 15) | 0;
    const faces = Array.from({ length: 6 }, (_, f) => `<i class="cf f${f}" style="background-image:${url(art[(n * 6 + f) % art.length])}"></i>`).join('');
    html += `<span class="cube" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--rx:${rx}deg;--ry:${ry}deg;--rz:${rz}deg;--d:${(n * .07 + Math.random() * .15).toFixed(2)}s;--s:${(.85 + Math.random() * .3).toFixed(2)}">${faces}</span>`; n++; } });
  pile.innerHTML = html; const scr = el('span', 'fy-screen'); scr.append(pile); scr.insertAdjacentHTML('beforeend', '<i class="fy-glare"></i><i class="fy-cam"></i>'); fly.append(scr); fly.classList.add('cube-flyer', 'tablet');
  const sizeCubes = () => { const w = fly.offsetWidth; if (w) pile.style.setProperty('--c', Math.max(22, w * .17) + 'px'); }; requestAnimationFrame(sizeCubes); if (window.ResizeObserver) new ResizeObserver(sizeCubes).observe(fly);
}
if ((typeof SHD_CONFIG !== 'undefined' && SHD_CONFIG.soundcloudSong)) { const st = walk.querySelectorAll('.wk-steps span'); if (st[1]) st[1].textContent = 'follow me to heaven.'; walk.classList.add('walk-heaven'); }
document.body.append(walk); document.body.classList.add('walking');
let walkScr = null;
if (window.SHD_BLOBSCREEN) { walk.classList.add('bs'); walkScr = window.SHD_BLOBSCREEN(walk.querySelector('.wk-scene'), { beatsPer: 4 }); }
/* the warehouse door is a glowing portal. It sits exactly on the door in the picture (worked out from how the
 * picture is cropped to the screen), swirls, and pumps with the bass. Going in = flying through it. */
const portal = el('div', 'wk-portal', '<i class="pt-glow"></i><i class="pt-rays"></i><i class="pt-ring"></i><i class="pt-swirl"></i><i class="pt-core"></i><i class="pt-motes"></i><b class="pt-o a"></b><b class="pt-o b"></b>');
portal.setAttribute('aria-hidden', 'true'); walk.querySelector('.wk-scene').append(portal);
// door in the source pictures: centre x/y and size, in that picture's pixels
const DOOR = { wide: { iw: 2400, ih: 1400, x: 1200, y: 760, w: 270, h: 340 }, tall: { iw: 1200, ih: 2000, x: 600, y: 890, w: 240, h: 315 } };
function placePortal() {
  if (walkScr) { const st = portal.style; st.left = '50%'; st.top = '46%'; st.width = 'min(62vw,70svh)'; st.height = 'min(31vw,35svh)'; portal.classList.add('loop'); return; }
  const d = matchMedia('(max-aspect-ratio: 5/6)').matches ? DOOR.tall : DOOR.wide, W = walk.clientWidth, H = walk.clientHeight;
  const k = Math.max(W / d.iw, H / d.ih), ox = (W - d.iw * k) * 0.5, oy = (H - d.ih * k) * 0.56;
  const st = portal.style; st.left = (ox + d.x * k) + 'px'; st.top = (oy + d.y * k) + 'px'; st.width = (d.w * k * 1.35) + 'px'; st.height = (d.h * k * 1.12) + 'px';
}
placePortal(); addEventListener('resize', placePortal);
/* the simulation is watching: thin tracking boxes lock onto things in the alley, with labels and lines between them,
 * like a computer counting the crowd (artist's reference: a crowd-tracking clip). Drawn in the site's lime + red. */
const trk = el('canvas', 'wk-track'); trk.setAttribute('aria-hidden', 'true'); walk.querySelector('.wk-vig').after(trk);
const TAGS = ['ID ??? · NO IDENTITY', 'SUBJECT: YOU', 'conf .97 · human?', 'ID 0x2F · LOOPING', 'signal: weak', 'GUEST · UNVERIFIED', 'ID 0x00 · REMEMBER TO FORGET', 'conf .41 · ghost'];
const boxes = Array.from({ length: 8 }, (_, i) => ({ x: .2 + Math.random() * .6, y: .45 + Math.random() * .3, w: .04 + Math.random() * .05, h: .08 + Math.random() * .1, vx: (Math.random() - .5) * .0016, vy: (Math.random() - .5) * .0008, t: TAGS[i], red: i % 3 === 0 }));
let trT = 0;
function drawTrack() {
  if (done || !trk.isConnected) return;
  const W = trk.width = walk.clientWidth, H = trk.height = walk.clientHeight, x = trk.getContext('2d');
  x.clearRect(0, 0, W, H); x.lineWidth = 1; x.font = '10px "JetBrains Mono", monospace';
  boxes.forEach(b => { b.x += b.vx; b.y += b.vy; if (b.x < .12 || b.x > .82) b.vx *= -1; if (b.y < .38 || b.y > .8) b.vy *= -1; });
  x.strokeStyle = 'rgba(212,255,0,.35)'; x.beginPath();
  for (let i = 0; i < boxes.length - 1; i += 1) { const a = boxes[i], c = boxes[(i * 3 + 1) % boxes.length]; x.moveTo(a.x * W, a.y * H); x.lineTo(c.x * W, c.y * H); }
  x.stroke();
  boxes.forEach(b => {
    const bx = (b.x - b.w / 2) * W, by = (b.y - b.h / 2) * H, bw = b.w * W, bh = b.h * H, col = b.red ? '#ff3b3b' : '#d4ff00';
    x.strokeStyle = col; x.strokeRect(bx, by, bw, bh);
    x.fillStyle = col; x.fillRect(bx, by - 13, x.measureText(b.t).width + 8, 12);
    x.fillStyle = '#0b0a09'; x.fillText(b.t, bx + 4, by - 3);
    x.fillStyle = col; x.fillRect(b.x * W - 2, b.y * H - 2, 4, 4);
  });
  trT = setTimeout(() => requestAnimationFrame(drawTrack), reduce ? 1000 : 50);
}
if (!reduce && !walkScr) requestAnimationFrame(drawTrack); // after the rest of the walk is set up (the art screen does real tracking itself)
let done = false, dist = 0.2;
const dEl = walk.querySelector('.wk-dist');
const tick = setInterval(() => { if (!walk.classList.contains("ready")) return; dist = Math.max(0, dist - 0.03); dEl.textContent = dist > 0.01 ? `${dist.toFixed(2)} MI ▸` : 'YOU’RE HERE ★'; }, 600);
function finish() {
  if (done) return; done = true; clearInterval(tick); clearTimeout(auto); bass.stop();
  try { sessionStorage.setItem('shd.walked', '1'); } catch (_) { }
  walk.classList.add('arrive'); document.body.classList.remove('walking');
  removeEventListener('resize', placePortal); clearTimeout(trT); if (walkScr) setTimeout(() => walkScr.stop(), 1100);
  setTimeout(() => { walk.remove(); const b = document.getElementById('enter'); if (b) b.focus(); }, reduce ? 0 : 1100);
}
walk.querySelector('.wk-hold').addEventListener('click', finish);
walk.querySelector('.wk-skip').addEventListener('click', finish);
walk.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') finish(); });
// the walk starts once the alley is actually on screen (or after 4s if the picture is slow)
let auto = 0;
/* bass through the walls: "Sorry" (evo & crevo) muffled behind a low-pass filter that opens up as you get closer.
 * A bass analyser drives --b (0..1) so the alley pumps on every kick. Browsers only allow sound after a tap, so if
 * it can't start on its own the chip says "tap for bass" and the first tap anywhere starts it. */
/* when a SoundCloud song is set (CFG.soundcloudSong), the alley plays that instead, through SoundCloud's own player.
 * SoundCloud doesn't hand over the raw sound, so there's no wall muffle or kick detector: it fades up as you walk in
 * and the alley pumps on a steady beat. The same player keeps going into the song bar after ENTER (window.SHD_SCW). */
const SCSONG = (typeof SHD_CONFIG !== 'undefined' && SHD_CONFIG.soundcloudSong) || '';
const bassSC = () => {
  let on = true; try { on = localStorage.getItem('shd.introSound') !== 'off'; } catch (_) { }
  let vol = 0.3; try { const v = parseFloat(localStorage.getItem('shd.introVol')); if (v >= 0 && v <= 1) vol = v; } catch (_) { }
  const btn = el('button', 'wk-snd'); btn.type = 'button'; walk.append(btn);
  let w = null, ready = null, playing = false, beat = 0, ramp = 0;
  const paint = () => { btn.textContent = playing ? '♪ bass: on' : (on ? '♪ tap for bass' : '♪ bass: off'); btn.setAttribute('aria-pressed', String(playing)); btn.classList.toggle('ask', on && !playing); };
  function load() {
    if (ready) return ready;
    ready = new Promise(res => {
      const go = () => {
        const f = document.createElement('iframe'); f.className = 'sc-hidden'; f.allow = 'autoplay'; f.title = 'SoundCloud player';
        f.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(SCSONG) + '&auto_play=false&visual=false&show_artwork=false';
        f.style.cssText = 'position:fixed;left:-9999px;top:0;width:300px;height:166px;border:0'; document.body.append(f);
        w = window.SC.Widget(f); window.SHD_SCW = { widget: w, url: SCSONG, frame: f };
        w.bind(window.SC.Widget.Events.READY, () => res(w));
      };
      if (window.SC && window.SC.Widget) go(); else { const sc = document.createElement('script'); sc.src = 'https://w.soundcloud.com/player/api.js'; sc.onload = go; sc.onerror = () => res(null); document.head.append(sc); }
    });
    return ready;
  }
  load();
  async function start() {
    if (playing || done || !on) return false;
    const wd = await load(); if (!wd || done) { paint(); return false; }
    const started = await new Promise(res => { let ok = false; const E = window.SC.Widget.Events; wd.bind(E.PLAY, () => { ok = true; res(true); }); wd.setVolume(4); wd.play(); setTimeout(() => res(ok), 1500); });
    if (!started) { wd.pause(); paint(); return false; }
    playing = true; walk.classList.add('loud');
    // fades up as you walk closer
    const loud = Math.round(Math.min(0.7, vol * 1.8) * 100), t0 = performance.now();
    clearInterval(ramp); ramp = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / 8000); wd.setVolume(Math.round(4 + (loud - 4) * k)); if (k >= 1) clearInterval(ramp); }, 200);
    // a steady thump for the alley to pump on
    let ph = 0; clearInterval(beat); beat = setInterval(() => { ph = (ph + 30 / (60000 / 130)) % 1; walk.style.setProperty('--b', Math.max(0, 1 - ph * 3).toFixed(3)); }, 30);
    paint(); return true;
  }
  function stop() { clearInterval(beat); clearInterval(ramp); walk.classList.remove('loud'); walk.style.removeProperty('--b'); if (!playing) return; playing = false; w && w.pause(); }
  btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (playing) { on = false; stop(); } else { on = true; if (await start()) { clearTimeout(auto); auto = setTimeout(finish, reduce ? 999999 : 8200); } }
    try { localStorage.setItem('shd.introSound', on ? 'on' : 'off'); } catch (_) { }
    paint();
  });
  walk.addEventListener('pointerdown', e => { if (!playing && on && !e.target.closest('button')) start().then(ok => { if (ok) { clearTimeout(auto); auto = setTimeout(finish, reduce ? 999999 : 8200); } }); });
  paint();
  return { start, stop };
};
const bass = SCSONG ? bassSC() : (() => {
  let on = true; try { on = localStorage.getItem('shd.introSound') !== 'off'; } catch (_) { }
  let vol = 0.3; try { const v = parseFloat(localStorage.getItem('shd.introVol')); if (v >= 0 && v <= 1) vol = v; } catch (_) { }
  const btn = el('button', 'wk-snd'); btn.type = 'button'; walk.append(btn);
  let ctx = null, au, filt, gain, an, data, raf = 0, playing = false;
  const paint = () => { btn.textContent = playing ? '♪ bass: on' : (on ? '♪ tap for bass' : '♪ bass: off'); btn.setAttribute('aria-pressed', String(playing)); btn.classList.toggle('ask', on && !playing); };
  function setup() {
    if (ctx) return true; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); au = new Audio(abs('assets/ui/intro.mp3')); au.loop = true; au.preload = 'auto';
    const src = ctx.createMediaElementSource(au);
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 150; filt.Q.value = 0.9;
    an = ctx.createAnalyser(); an.fftSize = 1024; data = new Float32Array(an.fftSize);
    gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filt); filt.connect(an); an.connect(gain); gain.connect(ctx.destination);
    return true;
  }
  let slow = 0.05, shown = 0;
  function loop() { // kick detector: loudness of the filtered bass vs its own running average, with a quick fall-off
    an.getFloatTimeDomainData(data); let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length); slow = slow * 0.94 + rms * 0.06;
    const hit = Math.min(1, Math.max(0, (rms - slow * 1.12) / (slow * 1.1 + 0.002)));
    shown = Math.max(hit, shown * 0.8);
    walk.style.setProperty('--b', shown.toFixed(3)); raf = setTimeout(loop, 30);
  }
  async function start() {
    if (playing || done || !on || !setup()) return false;
    try { await ctx.resume(); await au.play(); } catch (_) { paint(); return false; }
    if (ctx.state !== 'running') { au.pause(); paint(); return false; }
    playing = true; walk.classList.add('loud');
    const now = ctx.currentTime, loud = Math.min(0.7, vol * 1.8);
    gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(loud, now + 1.2);
    filt.frequency.cancelScheduledValues(now); filt.frequency.setValueAtTime(150, now); filt.frequency.exponentialRampToValueAtTime(1400, now + 8.5);
    clearTimeout(raf); loop(); paint(); return true;
  }
  function stop(fade = 0.9) {
    clearTimeout(raf); walk.classList.remove('loud'); walk.style.removeProperty('--b');
    if (!playing) return; playing = false; const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(0, now + fade);
    const c = ctx; setTimeout(() => { au.pause(); if (done) c.close().catch(() => { }); }, fade * 1000 + 100);
  }
  btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (playing) { on = false; stop(0.3); } else { on = true; if (await start()) { clearTimeout(auto); auto = setTimeout(finish, reduce ? 999999 : 8200); } }
    try { localStorage.setItem('shd.introSound', on ? 'on' : 'off'); } catch (_) { }
    paint();
  });
  // the first tap on the alley itself (not the flyer or skip) also turns the bass on
  walk.addEventListener('pointerdown', e => { if (!playing && on && !e.target.closest('button')) start().then(ok => { if (ok) { clearTimeout(auto); auto = setTimeout(finish, reduce ? 999999 : 8200); } }); });
  paint();
  return { start, stop };
})();
const go = () => { if (walk.classList.contains('ready') || done) return; walk.classList.add('ready'); auto = setTimeout(finish, reduce ? 999999 : 8200); bass.start(); };
const sImg = walk.querySelector('.wk-scene img');
if (walkScr || (sImg.complete && sImg.naturalWidth)) go(); else { sImg.addEventListener('load', go, { once: true }); sImg.addEventListener('error', go, { once: true }); setTimeout(go, 4000); }
setTimeout(() => walk.querySelector('.wk-hold').focus({ preventScroll: true }), 50);
})();
