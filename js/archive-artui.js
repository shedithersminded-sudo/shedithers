/* SHEDITHERS — every little interactive thing comes from the artist's own work.
 * (The artist allows their art to be used anywhere in the site's design. These are CSS backgrounds,
 *  so visitors can't right-click-save them; the original files are never modified.) */
(() => {
'use strict';
const absU = u => new URL(u, location.href).href;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const IM = ARTWORKS.filter(a => a.type !== 'video');
const GEMS = artById('s-gems'), EYES = artById('shedithers-eyes');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = () => IM[Math.floor(Math.random() * IM.length)];
function crop(el, a, zoom) { a = a || pick(); el.style.backgroundImage = `url('${absU(a.src)}')`; el.style.backgroundSize = (zoom || Math.round(rnd(260, 620))) + '%'; el.style.backgroundPosition = `${Math.round(rnd(5, 95))}% ${Math.round(rnd(5, 95))}%`; el.classList.add('art-crop'); el.dataset.from = a.title; return el; }
const gem = el => { if (!GEMS) return crop(el); el.style.backgroundImage = `url('${absU(GEMS.src)}')`; el.style.backgroundSize = '560%'; el.style.backgroundPosition = `${[30, 45, 55, 40, 60, 50][Math.floor(Math.random() * 6)]}% ${Math.round(rnd(20, 85))}%`; el.classList.add('art-crop', 'gem'); return el; };

/* ---- the messy wall: scraps, stickers, stamps are cut from the art ---- */
function artify(el) {
  if (!el || el.nodeType !== 1 || el.dataset.art) return; el.dataset.art = '1';
  const k = el.dataset.kind || (el.classList.contains('scrap') ? 'scrap' : '');
  if (el.classList.contains('scrap') || k === 'scrap') crop(el, null, Math.round(rnd(220, 420)));
  else if (k === 'star' || k === 'heart') { el.innerHTML = ''; el.classList.add('art-sticker'); Math.random() < 0.45 ? gem(el) : crop(el); }
  else if (k === 'splat' || k === 'tape') { el.classList.add('art-sticker', 'torn'); crop(el); }
  else if (el.classList.contains('stamp-art') || /stamp|mess/.test(el.className)) { el.classList.add('art-sticker'); Math.random() < 0.5 ? gem(el) : crop(el); }
}
const wall = $('.wall');
if (wall) {
  $$('.w', wall).forEach(artify);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains('w')) artify(n); }))).observe(wall, { childList: true });
  // a few torn polaroids cut from the work, scattered around the wall
  const H = Math.max(document.documentElement.scrollHeight, innerHeight * 2);
  for (let i = 0; i < 7; i++) { const p = document.createElement('span'); p.className = 'w artbit'; p.dataset.kind = 'artbit'; p.dataset.art = '1'; p.style.left = rnd(0, innerWidth - 120) + 'px'; p.style.top = rnd(80, H - 200) + 'px'; p.style.setProperty('--r', rnd(-14, 14).toFixed(1) + 'deg'); const inner = document.createElement('i'); crop(inner, null, Math.round(rnd(180, 320))); p.append(inner); wall.append(p); }
}

/* ---- cute layer: floating hearts / sparks become gems + art bits; peeking eyes are the artist's eyes ---- */
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
  if (n.nodeType !== 1) return;
  if (n.classList.contains('float-heart') || n.classList.contains('click-spark') || n.classList.contains('burst')) { n.innerHTML = ''; n.classList.add('art-sticker'); Math.random() < 0.6 ? gem(n) : crop(n); }
  if (n.classList.contains('peep') && EYES) { n.classList.add('art-eyes'); n.style.backgroundImage = `url('${absU(EYES.src)}')`; }
}))).observe(document.body, { childList: true });
$$('.peep').forEach(p => { if (EYES) { p.classList.add('art-eyes'); p.style.backgroundImage = `url('${absU(EYES.src)}')`; } });

/* ---- discoveries: the hidden objects are pieces of the art ---- */
function hiddenBits() { $$('.ring:not([data-art]), .sticky:not([data-art]), .clip:not([data-art])').forEach(el => { el.dataset.art = '1'; el.classList.add('art-sticker'); el.classList.contains('ring') ? gem(el) : crop(el); }); }
new MutationObserver(() => hiddenBits()).observe($('#view'), { childList: true, subtree: true }); hiddenBits();

/* ---- THE PLAYER, made out of the art ---- */
const A = window.SHD_ARCHIVE, player = $('#player');
if (A && player) {
  player.classList.add('art-player');
  const art = (i) => IM[(i * 7 + 3) % IM.length];
  const setTrackArt = i => {
    const a = art(i < 0 ? 0 : i), b = art(i + 5);
    // art cut to fit each part of the player (strip → mini blade, tall → arch, centred → disc), dithered warm
    const set = ((i < 0 ? 0 : i) % 3 + 3) % 3, pa = n => `url('${absU('assets/ui/player-' + set + '-' + n + '.png')}')`;
    player.style.setProperty('--p-art', pa('disc')); player.style.setProperty('--p-art2', pa('arch')); player.style.setProperty('--p-strip', pa('strip'));
    const lab = $('.cs-label'); if (lab) { lab.style.setProperty('--lab-art', `url('${absU(a.src)}')`); }
    const cover = $('#pCover'); if (cover && !cover.querySelector('img')) { cover.style.backgroundImage = `url('${(EYES || a).src}')`; cover.classList.add('art-cover'); }
    const cap = $('.p-art-cap'); if (cap) cap.textContent = 'tape art: ' + a.title.toLowerCase();
  };
  // reels become gems from "S"
  $$('.reel').forEach(r => { if (GEMS) { r.classList.add('gem-reel'); r.style.backgroundImage = `url('${absU(GEMS.src)}')`; } });
  const mr = $('.mini-reel'); if (mr && GEMS) { mr.classList.add('gem-reel'); mr.style.backgroundImage = `url('${absU(GEMS.src)}')`; }
  const full = $('.p-full');
  if (full) { const relic = document.createElement('div'); relic.className = 'relic'; relic.setAttribute('aria-hidden', 'true'); relic.innerHTML = '<i class="rl-star"></i><i class="rl-disc"></i><span class="rl-word">shedithers</span>'; full.insertBefore(relic, full.querySelector('.p-now')); }
  if (full) { const c = document.createElement('div'); c.className = 'p-art-cap'; full.insertBefore(c, full.querySelector('.p-moods') || null); }
  let idx = 0; setTrackArt(0);
  A.player.audio.addEventListener('play', () => { const i = A.player.list.findIndex(t => t.url === A.player.audio.src); if (i >= 0 && i !== idx) { idx = i; setTrackArt(i); } player.classList.add('art-on'); });
  A.player.audio.addEventListener('pause', () => player.classList.remove('art-on'));
}
})();
