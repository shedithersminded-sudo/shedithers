/* SHEDITHERS — Dither Lab music player.
 * Plays songs from the visitor's own device while they make art. Nothing is uploaded or saved.
 * Self-contained: builds its own markup + styles, so the editor needs only this one script. */
(() => {
'use strict';
if (document.getElementById('labPlayer')) return;
const pad = n => String(n).padStart(2, '0');
const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}` : '0:00';

const css = `
.lp{position:fixed;right:10px;bottom:46px;z-index:60;width:300px;font:500 11px 'JetBrains Mono',monospace;color:#e9e3d1}
.lp button{font:inherit;color:inherit;border:0;cursor:pointer}
.lp-mini{display:flex;align-items:center;gap:8px;padding:8px 24px;clip-path:polygon(0 50%,18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%);background:linear-gradient(90deg,rgba(11,10,9,.85),rgba(11,10,9,.3) 50%,rgba(11,10,9,.85)),url('assets/ui/player-0-strip.png') center/cover,#0b0a09;image-rendering:pixelated;box-shadow:inset 0 -3px 0 #c3141c}
.lp.on .lp-mini{box-shadow:inset 0 -3px 0 #c3141c,inset 0 3px 0 #c3141c}
.lp-b{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:50%;background:#c3141c;color:#e9e3d1;box-shadow:0 0 0 2px #0b0a09;font-size:11px;line-height:1}
.lp-b:hover{background:#0b0a09;box-shadow:0 0 0 2px #c3141c}
.lp-info{flex:1;min-width:0;display:flex;flex-direction:column;cursor:pointer;text-shadow:0 1px 2px #000}
.lp-info b{font:400 15px 'Bebas Neue',sans-serif;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-info span{font-size:9px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-full{display:none;margin-bottom:6px;padding:16px 16px 12px;border-radius:6px;background:linear-gradient(180deg,rgba(11,10,9,.25),rgba(11,10,9,.85) 40%,rgba(11,10,9,.96)),url('assets/ui/player-0-arch.png') center top/cover,#0b0a09;image-rendering:pixelated;box-shadow:0 14px 34px rgba(0,0,0,.6),inset 0 0 0 2px rgba(195,20,28,.6)}
.lp.open .lp-full{display:block}
.lp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.lp-head b{font:400 16px 'Bebas Neue',sans-serif;letter-spacing:.2em;text-shadow:2px 2px 0 #c3141c}
.lp-now b{display:block;font:400 18px 'Bebas Neue',sans-serif;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-now span{display:block;font-size:9px;opacity:.75;margin-bottom:8px}
.lp-seek,.lp-vol{display:flex;align-items:center;gap:6px;font-size:9px}
.lp input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:5px;background:#3a3633;cursor:pointer}
.lp input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:16px;background:#c3141c;border:2px solid #0b0a09}
.lp input[type=range]::-moz-range-thumb{width:8px;height:14px;background:#c3141c;border:2px solid #0b0a09;border-radius:0}
.lp-ctrl{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0}
.lp-ctrl .lp-b{background:#0b0a09;box-shadow:0 0 0 2px rgba(233,227,209,.35)}
.lp-ctrl .lp-b.big{width:42px;height:42px;font-size:14px;background:#c3141c;box-shadow:0 0 0 3px #0b0a09,0 0 0 5px #e9e3d1}
.lp-ctrl .lp-b[aria-pressed=true]{background:#c3141c}
.lp-add{display:block;width:100%;margin-top:10px;padding:8px;background:#e9e3d1;color:#0b0a09!important;font-weight:700;letter-spacing:.08em}
.lp-add:hover{background:#c3141c;color:#e9e3d1!important}
.lp-list{list-style:none;margin:8px 0 0;padding:0;max-height:140px;overflow:auto}
.lp-list button{display:block;width:100%;text-align:left;padding:5px 6px;background:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-list li.on button{background:#c3141c}
.lp-list button:hover{background:rgba(195,20,28,.5)}
.lp-note{margin:8px 0 0;font-size:8px;opacity:.6;text-align:center}
@media (max-width:760px){.lp{left:8px;right:8px;width:auto;bottom:8px}}
`;
document.head.append(Object.assign(document.createElement('style'), { textContent: css }));

const el = document.createElement('div'); el.className = 'lp'; el.id = 'labPlayer'; el.setAttribute('aria-label', 'Music player');
el.innerHTML = `
<input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,.opus,.weba" multiple hidden>
<div class="lp-full">
  <div class="lp-head"><b>MUSIC WHILE U MAKE</b><button class="lp-b" data-a="close" aria-label="Minimize music player" title="Minimize">▾</button></div>
  <div class="lp-now"><b>No music loaded</b><span>add songs from your device</span></div>
  <div class="lp-seek"><span class="lp-cur">0:00</span><input type="range" min="0" max="1000" value="0" aria-label="Seek"><span class="lp-dur">0:00</span></div>
  <div class="lp-ctrl">
    <button class="lp-b" data-a="shuffle" aria-pressed="false" aria-label="Shuffle" title="Shuffle">⤮</button>
    <button class="lp-b" data-a="restart" aria-label="Restart the song" title="Restart the song">↺</button>
    <button class="lp-b" data-a="prev" aria-label="Previous song" title="Previous song">⏮</button>
    <button class="lp-b big" data-a="play" aria-label="Play or pause" title="Play or pause">▶</button>
    <button class="lp-b" data-a="next" aria-label="Skip to the next song" title="Skip">⏭</button>
    <button class="lp-b" data-a="repeat" aria-pressed="false" aria-label="Repeat" title="Repeat">↻</button>
  </div>
  <div class="lp-vol"><span>VOL</span><input type="range" min="0" max="100" value="80" aria-label="Volume"></div>
  <button class="lp-add" data-a="add">+ ADD MUSIC FROM THIS DEVICE</button>
  <ol class="lp-list"></ol>
  <p class="lp-note">Plays files from your own device only. Nothing is uploaded or saved.</p>
</div>
<div class="lp-mini">
  <button class="lp-b" data-a="play" aria-label="Play or pause">▶</button>
  <div class="lp-info" data-a="info"><b>MUSIC OFF</b><span>tap to add your songs</span></div>
  <button class="lp-b" data-a="skip" aria-label="Skip to the next song" title="Skip">⏭</button>
  <button class="lp-b" data-a="open" aria-label="Open music player" title="Open">▴</button>
</div>`;
document.body.append(el);

const q = s => el.querySelector(s), fileIn = q('input[type=file]'), audio = new Audio(), list = [];
let idx = -1, shuffle = false, repeat = 'off', seeking = false;
audio.preload = 'metadata'; audio.volume = 0.8;
const open = () => el.classList.add('open'), close = () => el.classList.remove('open');

function add(files) {
  const aud = Array.from(files).filter(f => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|weba)$/i.test(f.name)); if (!aud.length) return;
  aud.forEach(f => list.push({ url: URL.createObjectURL(f), title: f.name.replace(/\.[^.]+$/, '') }));
  drawList(); if (idx < 0) load(0, true); open();
}
function load(i, play) { if (!list.length) return; idx = (i + list.length) % list.length; audio.src = list[idx].url; showNow(); drawList(); if (play) audio.play().catch(() => { }); }
function next(auto) {
  if (!list.length) return;
  if (repeat === 'one' && auto) { audio.currentTime = 0; audio.play(); return; }
  if (shuffle && list.length > 1) { let j; do j = Math.floor(Math.random() * list.length); while (j === idx); return load(j, true); }
  if (idx === list.length - 1 && auto && repeat === 'off') { audio.pause(); return; }
  load(idx + 1, true);
}
function prev() { if (audio.currentTime > 3) audio.currentTime = 0; else load(idx - 1, true); }
function toggle() { if (!list.length) return fileIn.click(); audio.paused ? audio.play().catch(() => { }) : audio.pause(); }
function showNow() {
  const t = list[idx]; if (!t) return;
  q('.lp-now b').textContent = t.title; q('.lp-now span').textContent = `song ${idx + 1} of ${list.length}`;
  q('.lp-info b').textContent = t.title; q('.lp-info span').textContent = 'now playing';
}
function drawList() {
  const ol = q('.lp-list'); ol.innerHTML = '';
  list.forEach((t, i) => { const li = document.createElement('li'); if (i === idx) li.className = 'on'; const b = document.createElement('button'); b.textContent = t.title; b.onclick = () => load(i, true); li.append(b); ol.append(li); });
}
function paint() { const p = audio.paused; el.querySelectorAll('[data-a=play]').forEach(b => b.textContent = p ? '▶' : '❚❚'); el.classList.toggle('on', !p); }

const acts = {
  play: toggle, open, close, add: () => fileIn.click(), prev: () => prev(), next: () => next(false), skip: () => next(false),
  restart: () => { if (!list.length) return; audio.currentTime = 0; audio.play().catch(() => { }); },
  info: () => list.length ? open() : fileIn.click(),
  shuffle: b => { shuffle = !shuffle; b.setAttribute('aria-pressed', shuffle); },
  repeat: b => { repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'; b.setAttribute('aria-pressed', repeat !== 'off'); b.textContent = repeat === 'one' ? '↻1' : '↻'; },
};
el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || !el.contains(b)) return; e.stopPropagation(); acts[b.dataset.a] && acts[b.dataset.a](b); });
// keep the editor's keyboard shortcuts from firing while using the player
el.addEventListener('keydown', e => e.stopPropagation());
fileIn.onchange = () => { add(fileIn.files); fileIn.value = ''; };

const seek = q('.lp-seek input');
seek.addEventListener('input', () => { seeking = true; });
seek.addEventListener('change', () => { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; seeking = false; });
q('.lp-vol input').addEventListener('input', e => audio.volume = e.target.value / 100);
audio.addEventListener('play', paint); audio.addEventListener('pause', paint); audio.addEventListener('ended', () => next(true));
audio.addEventListener('timeupdate', () => { q('.lp-cur').textContent = fmt(audio.currentTime); q('.lp-dur').textContent = fmt(audio.duration); if (!seeking) seek.value = audio.duration ? audio.currentTime / audio.duration * 1000 : 0; });
if ('mediaSession' in navigator) { const ms = navigator.mediaSession; ms.setActionHandler('play', toggle); ms.setActionHandler('pause', toggle); ms.setActionHandler('nexttrack', () => next(false)); ms.setActionHandler('previoustrack', prev); }
paint();
if (window.SHD_TUCK) window.SHD_TUCK(el, 'labplayer', 'music', '♪');
})();
