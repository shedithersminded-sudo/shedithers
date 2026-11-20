/* SHEDITHERS — the site song (v3.7.1), played through YouTube's own player (SHD_CONFIG.introSong.youtube).
 * YouTube's rules: the player must stay visible (at least 200x200) while it plays, and its sound can't be filtered.
 * So: during the intro it plays quiet (in place of a muffle), once you're inside it fades up to full.
 * It shows as a small "now playing" card only while playing; hiding the card pauses the song.
 * The round MUSIC button plays / pauses it. Starts on the first touch of the intro (browsers need a tap for sound). */
(() => {
'use strict';
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
const id = CFG.introSong && String(CFG.introSong.youtube || '').trim(); if (!/^[\w-]{11}$/.test(id)) return;
const QUIET = 14, LOUD = 75;
const card = document.createElement('div'); card.className = 'sg'; card.hidden = true;
card.innerHTML = `<div class="sg-top"><span class="sg-dot" aria-hidden="true"></span><b>now playing</b><button class="sg-x" type="button" aria-label="Pause and hide the song">✕</button></div><div class="sg-frame"><div id="sgPlayer"></div></div>`;
document.body.append(card);
let player = null, ready = false, want = false, playing = false, fadeT = 0, vol = QUIET;
const inside = () => document.body.classList.contains('entered');

// load YouTube's player API once
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('sgPlayer', {
    width: 200, height: 200, videoId: id,
    playerVars: { origin: location.origin, playsinline: 1, loop: 1, playlist: id, rel: 0, modestbranding: 1, controls: 1 },
    events: {
      onReady: () => { ready = true; player.setVolume(vol); if (want) play(); },
      onStateChange: e => { playing = e.data === 1; card.classList.toggle('on', playing); paint(); },
    },
  });
};
const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.append(s);

function setVol(target, ms) {
  clearInterval(fadeT); const from = vol, t0 = performance.now();
  fadeT = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); vol = Math.round(from + (target - from) * k); if (player && ready) player.setVolume(vol); if (k >= 1) clearInterval(fadeT); }, 80);
}
function play() {
  want = true; card.hidden = false; card.classList.toggle('in-intro', !inside());
  if (!ready) return;
  player.setVolume(vol); player.playVideo();
  // the site's own file player steps aside (one player at a time)
  const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P && P.audio && !P.audio.paused) P.audio.pause();
}
function pause() { want = false; if (ready) player.pauseVideo(); card.hidden = true; paint(); }
function toggle() { card.hidden ? play() : pause(); }
card.querySelector('.sg-x').onclick = pause;
window.SHD_SONG = { play, pause, toggle, get playing() { return playing; } };

// the first touch on the intro starts it, quiet
const first = () => { if (document.querySelector('.dg')) { vol = QUIET; play(); } off(); };
const off = () => { document.removeEventListener('pointerdown', first, true); document.removeEventListener('keydown', first, true); };
let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1'; } catch (_) { }
const intro = !seen && !/^#\/work\//.test(location.hash) && document.getElementById('gate'); // same test as archive-intro.js
if (intro) { document.addEventListener('pointerdown', first, true); document.addEventListener('keydown', first, true); }
else vol = LOUD;
// once inside: full volume, the card moves to its corner
new MutationObserver(() => { if (inside()) { card.classList.remove('in-intro'); if (vol < LOUD) setVol(LOUD, 2600); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

// the round MUSIC button controls this song
function paint() { const b = document.querySelector('.rm-music'); if (b) { b.classList.toggle('playing', playing); b.setAttribute('aria-label', playing ? 'Pause the music' : 'Play the music'); } }
document.addEventListener('click', e => {
  const b = e.target.closest('.rm-music'); if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault(); vol = Math.max(vol, inside() ? LOUD : QUIET); toggle();
}, true);
// if the visitor plays their own file in the music player, the song pauses
const watchFile = () => { const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P && P.audio && !P.audio.dataset.sg) { P.audio.dataset.sg = '1'; P.audio.addEventListener('play', () => { if (playing) pause(); }); } };
watchFile(); setTimeout(watchFile, 1500);
})();
