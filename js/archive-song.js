/* SHEDITHERS — the site song (v3.9.2). A plain audio file (SHD_CONFIG.siteSong.src), played through Web Audio so it
 * can be muffled: during the intro it sounds like it's coming through a wall, once you're inside the wall opens up
 * and it plays clear. No video player: inside, it's only a few words next to the round MUSIC button.
 * If the file isn't there (or no song is set), nothing shows and nothing plays. */
(() => {
'use strict';
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
const S = CFG.siteSong || {}; const src = String(S.src || '').trim(); if (!src) return;
const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MUFFLE = 320, OPEN = 20000, VOL = .7;
let ctx = null, au = null, lp = null, gain = null, ok = null, playing = false;
const inside = () => document.body.classList.contains('entered');
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// the words: tiny, handwritten, only while it plays
const tag = document.createElement('button'); tag.type = 'button'; tag.className = 'sgw'; tag.hidden = true;
tag.setAttribute('aria-label', 'Pause the music');
tag.innerHTML = `<i class="sgw-dot" aria-hidden="true"></i><span class="sgw-run"><b>${esc(S.title || 'now playing')}</b>${S.artist ? `<em>${esc(S.artist)}</em>` : ''}</span>`;
document.body.append(tag);

// does the file exist? (the site can ship without it)
ok = fetch(src, { method: 'HEAD' }).then(r => r.ok).catch(() => false);

function setup() {
  if (ctx) return; ctx = new AC();
  au = new Audio(src); au.loop = true; au.preload = 'auto';
  const node = ctx.createMediaElementSource(au);
  lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = inside() ? OPEN : MUFFLE; lp.Q.value = .8;
  gain = ctx.createGain(); gain.gain.value = 0;
  node.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
  au.addEventListener('play', () => { playing = true; paint(); });
  au.addEventListener('pause', () => { playing = false; paint(); });
}
async function play(fadeIn = 1.2) {
  if (!(await ok)) return false;
  setup(); try { await ctx.resume(); await au.play(); } catch (_) { return false; }
  const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(inside() ? VOL : VOL * .8, t + fadeIn);
  // the visitor's own file player steps aside (one player at a time)
  const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P && P.audio && !P.audio.paused) P.audio.pause();
  return true;
}
function pause() {
  if (!ctx || !au) return; const t = ctx.currentTime;
  gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + .35);
  setTimeout(() => au.pause(), 380);
}
function toggle() { playing ? pause() : play(.6); }
function openWall() {
  if (!lp) return; const t = ctx.currentTime, d = reduce ? .2 : 2.8;
  lp.frequency.cancelScheduledValues(t); lp.frequency.setValueAtTime(lp.frequency.value, t); lp.frequency.exponentialRampToValueAtTime(OPEN, t + d);
  if (playing) { gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(VOL, t + d); }
}
function paint() {
  tag.hidden = !playing || !inside();
  const b = document.querySelector('.rm-music'); if (b) { b.classList.toggle('playing', playing); b.setAttribute('aria-label', playing ? 'Pause the music' : 'Play the music'); }
}
tag.onclick = pause;
window.SHD_SONG = { play, pause, toggle, get playing() { return playing; } };

// intro: the first press on the logo starts it, muffled through the wall
let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1'; } catch (_) { }
const intro = !seen && !/^#\/work\//.test(location.hash) && document.getElementById('gate');
if (intro) {
  const off = () => { document.removeEventListener('pointerdown', first, true); document.removeEventListener('keydown', first, true); };
  const first = e => { if (!document.querySelector('.dg')) return off(); off(); play(1.5); };
  document.addEventListener('pointerdown', first, true); document.addEventListener('keydown', first, true);
}
// once inside: the wall opens and the words show up
new MutationObserver(() => { if (inside()) { openWall(); paint(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

// the round MUSIC button plays / pauses it
document.addEventListener('click', e => {
  const b = e.target.closest('.rm-music'); if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault(); toggle();
}, true);
// if the visitor plays their own file in the music player, the song pauses
const watchFile = () => { const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P && P.audio && !P.audio.dataset.sg) { P.audio.dataset.sg = '1'; P.audio.addEventListener('play', () => { if (playing) pause(); }); } };
watchFile(); setTimeout(watchFile, 1500);
})();
