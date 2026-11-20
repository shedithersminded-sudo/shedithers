/* SHEDITHERS — archive remaster (v3.5.0). Loaded last.
 * 1. code rain: the word "shedithers" falls in columns behind everything, barely there
 * 2. glowing edges on every home panel (a light that slowly travels around the border, brighter on hover)
 * 3. the buy me a drink tab: same art + shape, the cocktail emoji swapped for the artist's own logo figure */
(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. code rain ---------- */
const WORD = 'shedithers';
const cv = document.createElement('canvas'); cv.className = 'rm-rain'; cv.setAttribute('aria-hidden', 'true');
// the background art lives inside #view (as its first layer), so the rain sits right above it, still under every panel
function placeRain() {
  const v = document.getElementById('view'); if (!v) { if (!cv.isConnected) document.body.append(cv); return; }
  const pr = v.querySelector(':scope > .p-render');
  if (pr) { if (cv.previousElementSibling !== pr) pr.after(cv); }
  else if (cv.parentElement !== v) v.prepend(cv);
}
placeRain();
const g = cv.getContext('2d');
let W = 0, H = 0, cols = [], fs = 15, dpr = 1, last = 0;
function size() {
  dpr = 1; // the rain is soft and faint: full device resolution only cost speed W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  fs = W < 760 ? 13 : 15; for (const k in glyphs) delete glyphs[k]; const step = Math.round(fs * 1.35), n = Math.ceil(W / step);
  cols = Array.from({ length: n }, (_, i) => ({ x: i * step + 4, y: Math.random() * H * 1.5 - H * .5, v: 90 + Math.random() * 80, len: 8 + (Math.random() * 14 | 0), off: Math.random() * 10 | 0, on: Math.random() < .55 }));
}
const glyphs = {};
function glyph(ch, head) {
  const k = ch + (head ? 1 : 0); if (glyphs[k]) return glyphs[k];
  const c = document.createElement('canvas'), x = c.getContext('2d'); c.width = Math.ceil(fs * .8); c.height = Math.ceil(fs * 1.25);
  x.font = `500 ${fs}px "JetBrains Mono", monospace`; x.textBaseline = 'top'; x.fillStyle = head ? 'rgb(233,255,170)' : 'rgb(212,255,0)'; x.fillText(ch, 0, 0);
  return (glyphs[k] = c);
}
function draw(t) {
  if (!reduce && t - last < 32) { raf = requestAnimationFrame(draw); return; } // ~30 fps is plenty for falling letters
  const dt = Math.min(.08, (t - last) / 1000 || 0); last = t;
  g.clearRect(0, 0, W, H); g.font = `500 ${fs}px "JetBrains Mono", monospace`; g.textBaseline = 'top';
  const lh = fs * 1.2;
  for (const c of cols) {
    if (!c.on) { if (Math.random() < .004) c.on = true; continue; }
    c.y += c.v * dt; // smooth, sub-pixel fall (no row snapping)
    for (let k = 0; k < c.len; k++) {
      const y = c.y - k * lh; if (y < -lh || y > H) continue;
      // each trail carries its own letters, so it always reads s-h-e-d-i-t-h-e-r-s top to bottom
      const ch = WORD[((c.off - k) % 10 + 10) % 10];
      const a = k === 0 ? 1 : (1 - k / c.len) * .7;
      g.globalAlpha = k === 0 ? a : a * .75; g.drawImage(glyph(ch, k === 0), c.x, y);
    }
    if (c.y - c.len * lh > H) { c.len = 8 + (Math.random() * 14 | 0); c.y = -Math.random() * H * .4; c.v = 90 + Math.random() * 80; c.on = Math.random() < .75; }
  }
  g.globalAlpha = 1;
  if (!reduce) raf = requestAnimationFrame(draw);
}
let raf = 0;
size(); addEventListener('resize', () => { size(); if (reduce) draw(0); });
if (reduce) { cols.forEach(c => { c.y = Math.random() * H; }); draw(0); }
else {
  raf = requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); } });
}

/* ---------- 2. glowing panel edges ---------- */
const HUES = ['#ff2338', '#2f7dff']; // the artist asked for a real glow: red or blue, alternating
function edges() {
  const P = document.querySelector('.portal'); if (!P) return;
  [...P.children].forEach((m, i) => {
    if (!m.classList.contains('p-mod') || m.querySelector(':scope > .rm-edge')) return;
    const e = document.createElement('i'); e.className = 'rm-edge'; e.setAttribute('aria-hidden', 'true');
    const c1 = HUES[i % 2], c2 = i % 2 ? '#7fb2ff' : '#ff7a5c'; e.style.setProperty('--c1', c1); e.style.setProperty('--c2', c2); m.style.setProperty('--rm-g', c1);
    e.style.setProperty('--spd', (9 + (i % 5) * 2) + 's'); e.style.setProperty('--dl', (-i * 1.7) + 's');
    m.append(e);
    if (edgeRO) edgeRO.observe(m);
  });
}
const edgeRO = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(en => { const r = en.contentRect; en.target.style.setProperty('--rm-d', Math.round(Math.hypot(r.width, r.height) + 40) + 'px'); })) : null;
const view = document.getElementById('view');
if (view) { new MutationObserver(() => { edges(); placeRain(); }).observe(view, { childList: true }); new MutationObserver(edges).observe(view, { childList: true, subtree: true }); edges(); }

/* ---------- 3. buy me a drink tab: the artist's logo figure instead of the emoji ---------- */
function drinkTab() {
  const t = document.querySelector('.drink-tab'); if (!t || t.dataset.rm) return; t.dataset.rm = '1';
  t.classList.add('dt2');
  t.innerHTML = `<i class="dt2-thread" aria-hidden="true"></i><i class="dt2-stamp" aria-hidden="true" style="background-image:url('${new URL('assets/ui/art2/thumbprint.webp', location.href).href}')"></i><b>buy me a drink</b><small>no pressure</small>`;
}
// v4.0.1: the side tab is removed (the artist was done with it); words open the drink window instead
const killTab = () => document.querySelectorAll('.drink-tab').forEach(t => t.remove()); killTab(); setTimeout(killTab, 800); setTimeout(killTab, 2500);
// the little drink links elsewhere lose the emoji too
function deEmoji() { document.querySelectorAll('.ds-foot,.ds-view,.ab-tip-btn').forEach(b => { if (b.textContent.includes('🍹')) b.textContent = b.textContent.replace('🍹', '✦'); }); }
if (view) new MutationObserver(deEmoji).observe(view, { childList: true, subtree: true });
deEmoji();

/* ---------- 4. collections showcase: the left side of the panel crossfades through each collection's pieces ---------- */
function showcase() {
  const S = document.querySelector('.portal > .p-strips'); if (!S || S.querySelector('.rm-show') || typeof ARTWORKS === 'undefined') return;
  const rowEls = [...S.querySelectorAll(':scope > .ps-row')]; if (!rowEls.length) return;
  const rows = h('div', 'rm-rows'); rowEls.forEach(r => rows.append(r));
  const show = document.createElement('a'); show.className = 'rm-show';
  const code = h('span', 'rs-code'), count = h('span', 'rs-count'), txt = h('span', 'rs-txt'), bar = h('i', 'rs-bar');
  const name = h('b', 'rs-name'), sub = h('span', 'rs-sub'), words = h('span', 'rs-words'); txt.append(name, sub, words);
  const cols = (typeof COLLECTIONS !== 'undefined' ? COLLECTIONS : []).map(c => ({ c, w: ARTWORKS.filter(a => a.col === c.id && a.type !== 'video').slice(0, 6) })).filter(x => x.w.length);
  if (!cols.length) return;
  const layers = [h('i'), h('i')]; show.append(...layers, code, count, txt, bar);
  S.append(show, rows);
  // each row lights up its collection
  const rowOf = cols.map(x => rowEls.find(r => (r.querySelector('.ps-label')?.getAttribute('href') || '').endsWith('/' + x.c.id)));
  const T = 3400; let ci = 0, pi = 0, top = 0, pinned = false, timer = 0;
  show.style.setProperty('--rs-t', T + 'ms');
  function paint(newCol) {
    const { c, w } = cols[ci], a = w[pi % w.length];
    const L = layers[top = 1 - top]; L.style.backgroundImage = `url('${a.src}')`;
    L.classList.add('on'); layers[1 - top].classList.remove('on');
    const set = () => { code.textContent = c.code || ''; name.textContent = c.name; sub.textContent = c.sub || ''; };
    if (newCol) { show.classList.add('swap'); setTimeout(() => { set(); words.textContent = a.words || a.title.toLowerCase(); show.classList.remove('swap'); }, 350); }
    else { set(); words.textContent = a.words || a.title.toLowerCase(); }
    count.textContent = String(pi % w.length + 1).padStart(2, '0') + ' / ' + String(w.length).padStart(2, '0');
    show.href = `#/col/${c.id}`; show.setAttribute('aria-label', `Open the ${c.name} collection`);
    rowOf.forEach((r, i) => r && r.classList.toggle('rm-on', i === ci));
    show.classList.remove('run'); void show.offsetWidth; if (!reduce) show.classList.add('run');
  }
  function tick() {
    if (!S.isConnected) return clearInterval(timer);
    if (document.hidden) return;
    pi++;
    if (!pinned && pi >= cols[ci].w.length) { ci = (ci + 1) % cols.length; pi = 0; paint(true); } else paint(false);
  }
  function pick(i) { if (i === ci) return; ci = i; pi = 0; paint(true); clearInterval(timer); timer = setInterval(tick, T); }
  rowOf.forEach((r, i) => { if (!r) return;
    r.addEventListener('pointerenter', () => { pinned = true; pick(i); });
    r.addEventListener('focusin', () => { pinned = true; pick(i); });
    r.addEventListener('pointerleave', () => { pinned = false; });
    r.addEventListener('focusout', () => { pinned = false; });
  });
  paint(false);
  timer = setInterval(tick, reduce ? T * 2 : T);
}
function h(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; if (tag === 'i') e.setAttribute('aria-hidden', 'true'); return e; }

/* ---------- 5. WHERE TO FIND ME: the peek always holds a piece (the first stop's art), never an empty frame ---------- */
function peekDefault() {
  const p = document.querySelector('.p-collab .fm-peek'); if (!p || p.dataset.rm) return; p.dataset.rm = '1';
  const s = document.querySelector('.p-collab .fm-stop.here') || document.querySelector('.p-collab .fm-stop'); if (!s) return;
  s.dispatchEvent(new Event('pointerenter')); p.classList.remove('on');
}
function homeBits() { showcase(); peekDefault(); }
if (view) new MutationObserver(homeBits).observe(view, { childList: true, subtree: true });
homeBits();

/* ---------- 6. WANNA COLLAB: the letters break by word, never mid-word ---------- */
function collabTitle() {
  const t = document.querySelector('.p-collab .cl-title'); if (!t || t.dataset.rm) return; t.dataset.rm = '1';
  const kids = [...t.childNodes]; t.textContent = ''; let w = null;
  for (const k of kids) {
    const sp = k.nodeType === 1 && (k.classList.contains('sp') || !k.textContent.trim());
    if (sp) { w = null; t.append(k); continue; }
    if (!w) { w = document.createElement('span'); w.className = 'cl-word'; t.append(w); }
    w.append(k);
  }
}

/* ---------- 7. music: the player stays tucked away by default, behind one clear music button ---------- */
function musicBtn() {
  const pl = document.getElementById('player'); if (!pl || !pl.dataset.tuck) return;
  const tab = [...document.querySelectorAll('.tuck-tab')].find(b => /music/i.test(b.getAttribute('aria-label') || '')); if (!tab || tab.dataset.rm) return;
  tab.dataset.rm = '1'; tab.classList.add('rm-music');
  tab.innerHTML = '<span class="rmm-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>music</b>';
  tab.setAttribute('aria-label', 'Open the music player'); tab.title = 'music';
  // first visit: start tucked (after that, the visitor's own choice is remembered by tuck.js)
  let first = false; try { first = !localStorage.getItem('shd.rm.music'); localStorage.setItem('shd.rm.music', '1'); } catch (_) { }
  if (first && !pl.classList.contains('is-tucked')) { const x = pl.querySelector(':scope > .tuck-x'); if (x) x.click(); }
  // the ♪ MUSIC shortcut in the hint bar brings the player back too
  document.addEventListener('click', e => { const b = e.target.closest('#hint *'); if (b && /music/i.test(b.textContent) && pl.classList.contains('is-tucked')) tab.click(); }, true);
  // the bars move while something is playing
  const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player, a = P && P.audio;
  if (a) { const on = () => tab.classList.toggle('playing', !a.paused); a.addEventListener('play', on); a.addEventListener('pause', on); a.addEventListener('ended', on); on(); }
}
function bits2() { collabTitle(); musicBtn(); }
if (view) new MutationObserver(bits2).observe(view, { childList: true, subtree: true });
bits2(); setTimeout(bits2, 600); setTimeout(bits2, 2000);

/* ---------- 8. discovery notes wear a strip of the artist's art; the bottom-of-the-page note says something new ---------- */
if (window.SHD_FX && window.SHD_FX.NOTES) window.SHD_FX.NOTES.bottom = 'this is the bottom. i kept going anyway. so did you.';
const NOTE_ART = (typeof ARTWORKS !== 'undefined' ? ARTWORKS : []).filter(a => a.type !== 'video');
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) {
  if (n.nodeType !== 1 || !n.classList.contains('note-pop') || n.querySelector('.np-art') || !NOTE_ART.length) continue;
  const a = NOTE_ART[Math.random() * NOTE_ART.length | 0], strip = document.createElement('i');
  strip.className = 'np-art'; strip.setAttribute('aria-hidden', 'true'); strip.style.setProperty('--na', `url('${new URL(a.src, location.href).href}')`);
  n.prepend(strip);
} }).observe(document.body, { childList: true });

/* ---------- 9. smoothness: panels off screen stop animating; the background only moves the layer you can see ---------- */
const offIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('rm-off', !e.isIntersecting)), { rootMargin: '120px 0px' }) : null;
function watchPanels() { const P = document.querySelector('.portal'); if (!P || !offIO) return; [...P.children].forEach(m => { if (m.classList.contains('p-mod') && !m.dataset.rmio) { m.dataset.rmio = '1'; offIO.observe(m); } }); }
if (view) new MutationObserver(watchPanels).observe(view, { childList: true, subtree: true });
watchPanels();
// while the page is scrolling, the heaviest decorative motion holds still (less work per frame = smoother scroll)
let scT = 0; addEventListener('scroll', () => { if (!document.body.classList.contains('rm-scrolling')) document.body.classList.add('rm-scrolling'); clearTimeout(scT); scT = setTimeout(() => document.body.classList.remove('rm-scrolling'), 160); }, { passive: true });

/* ---------- 10. the comment wall video only plays while you can see it ---------- */
const vidIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { const v = e.target; v.muted = true; if (e.isIntersecting && !reduce) v.play().catch(() => { }); else v.pause(); }), { rootMargin: '80px 0px' }) : null;
function watchWall() { document.querySelectorAll('video.vc-wall:not([data-io])').forEach(v => { v.dataset.io = '1'; v.muted = true; if (vidIO) vidIO.observe(v); }); }

/* ---------- 11. SHELOOPS: the sister studio, in a panel made from the artist's art ---------- */
function loopsPanel() {
  const P = document.querySelector('.portal'); if (!P || P.querySelector('.p-loops') || typeof ARTWORKS === 'undefined') return;
  const lab = P.querySelector('.p-lab') || P.querySelector('.p-strips'); if (!lab) return;
  const A2 = f => new URL('assets/ui/art2/' + f, location.href).href;
  const pics = ARTWORKS.filter(a => a.type !== 'video').slice(-8).map(a => new URL(a.src, location.href).href);
  const sec = document.createElement('section'); sec.className = 'p-mod p-loops';
  const rays = Array.from({ length: 40 }, (_, k) => `<i style="--a:${k * 9}deg;--k:${k}"><b></b></i>`).join('');
  const lane = (name, k) => `<div class="lp-lane" style="--k:${k}"><span>${name}</span><div class="lp-wave"><i style="background-image:url('${pics[k % pics.length]}')"></i><i style="background-image:url('${pics[(k + 3) % pics.length]}')"></i></div></div>`;
  sec.innerHTML = `
    <div class="lp-sky" aria-hidden="true" style="background-image:url('${A2('sky.webp')}')"></div>
    <img class="lp-branch" src="${A2('leaves.webp')}" alt="" aria-hidden="true" draggable="false">
    <div class="p-head"><small>ループ</small><b>SHELOOPS</b><span>MY OTHER STUDIO · FOR MUSIC</span></div>
    <div class="lp-wrap">
      <div class="lp-deck" aria-hidden="true">
        <div class="lp-rays">${rays}</div>
        <div class="lp-disc"><i class="lp-label" style="background-image:url('${A2('no-face.webp')}')"></i><i class="lp-hole"></i></div>
        <i class="lp-arm"></i>
        <span class="lp-now">now spinning · your next song</span>
      </div>
      <div class="lp-txt">
        <p class="lp-lede">make music in your browser.<br><em>keep every bit of it.</em></p>
        <div class="lp-lanes"><i class="lp-head" aria-hidden="true"></i>
          ${lane('vocals · record over your own beats', 0)}${lane('beats · drums, sounds, loops', 1)}${lane('mix + master · then export', 2)}${lane('cover art · design the sleeve', 3)}
        </div>
        <p class="lp-safe"><b>your songs are yours.</b> they stay on your computer, nothing gets uploaded anywhere. export them as WAV or MP3 whenever you want and do whatever you want with them.</p>
        <a class="lp-go" href="https://shedithersminded-sudo.github.io/sheloops/" target="_blank" rel="noopener">open SHELOOPS <i aria-hidden="true">▸</i></a>
        <small class="lp-note">free. works best in chrome or edge. nothing to install.</small>
      </div>
    </div>`;
  lab.after(sec);
  edges();
}
function bits3() { watchWall(); loopsPanel(); }
if (view) new MutationObserver(bits3).observe(view, { childList: true, subtree: true });
bits3();

/* ---------- 12. floating players never cover the menu bar ---------- */
function keepBelowBar() {
  const bar = document.getElementById('bar'), top = bar ? bar.getBoundingClientRect().bottom + 8 : 70;
  document.querySelectorAll('.tv, .art-player').forEach(el => { const r = el.getBoundingClientRect(); if (r.height && r.top < top && getComputedStyle(el).position === 'fixed') el.style.top = top + 'px'; });
}
setInterval(keepBelowBar, 1500); addEventListener('resize', keepBelowBar);

/* ---------- 13. THE EDIT (and the other inside pages) wear the home page's look ---------- */
function routeName() { const h = location.hash; return /^#\/work\//.test(h) ? null : /^#\/works/.test(h) ? 'works' : /^#\/col\//.test(h) ? 'col' : /^#\/about/.test(h) ? 'about' : 'home'; }
function setRoute() { const r = routeName(); if (r) document.body.dataset.route = r; }
addEventListener('hashchange', setRoute); setRoute();
// a slow, dithered backdrop of the artist's pieces for the inside pages (opacity crossfade only: cheap)
const bgw = document.createElement('div'); bgw.className = 'rm-bgw'; bgw.setAttribute('aria-hidden', 'true');
const BGW = ['i-dont-want-a-face', 'doing-it-scared', 'sky-lights', 'not-in-my-nature', 'when-you-rain'].map(id => typeof ARTWORKS !== 'undefined' && ARTWORKS.find(a => a.id === id)).filter(Boolean);
BGW.forEach((a, i) => { const L = document.createElement('i'); if (i === 0) L.className = 'on'; L.style.backgroundImage = `url('${new URL(a.src, location.href).href}')`; bgw.append(L); });
document.body.prepend(bgw);
let bgi = 0; setInterval(() => { if (document.hidden || document.body.dataset.route === 'home') return; const L = bgw.children; if (!L.length) return; L[bgi].classList.remove('on'); bgi = (bgi + 1) % L.length; L[bgi].classList.add('on'); }, 11000);
function dressEdit() {
  const head = document.querySelector('#view .works-head'); if (head && !head.dataset.rm) {
    head.dataset.rm = '1'; const k = document.createElement('small'); k.className = 'wh-kana'; k.textContent = document.body.dataset.route === 'works' ? 'エディット' : 'アーカイブ'; head.prepend(k);
  }
  const scr = document.querySelector('#view .edit-screen'); if (scr && !scr.dataset.rm) {
    scr.dataset.rm = '1';
    const e = document.createElement('i'); e.className = 'rm-edge'; e.setAttribute('aria-hidden', 'true'); e.style.setProperty('--c1', '#ff2338'); e.style.setProperty('--c2', '#7fb2ff'); e.style.setProperty('--spd', '12s'); scr.append(e); if (edgeRO) edgeRO.observe(scr);
    const br = document.createElement('img'); br.className = 'es-branch'; br.src = new URL('assets/ui/art2/leaves.webp', location.href).href; br.alt = ''; br.setAttribute('aria-hidden', 'true'); br.draggable = false; scr.append(br);
  }
  // the drifting rows: videos stay still (first frame) and only play while hovered. Many big videos at once was the lag
  document.querySelectorAll('#view .edit-rows video:not([data-rm])').forEach(v => {
    v.dataset.rm = '1'; v.autoplay = false; v.removeAttribute('autoplay'); v.pause();
    v.addEventListener('play', () => { if (!v.matches(':hover') && !v.closest('.edit-tile:hover')) v.pause(); });
    const t = v.closest('.edit-tile'); if (t) { t.addEventListener('mouseenter', () => v.play().catch(() => { })); t.addEventListener('mouseleave', () => v.pause()); }
  });
}
if (view) new MutationObserver(dressEdit).observe(view, { childList: true, subtree: true });
dressEdit();

/* ---------- 14. NOW PLAYING: a volume control for the site song (no speaker), the seal wears the logo ---------- */
function dressPop() {
  const pop = document.querySelector('.portal > .p-pop'); if (!pop || pop.dataset.rm) return; pop.dataset.rm = '1';
  const sub = pop.querySelector('.p-head span'); if (sub) sub.textContent = 'TURN IT UP OR DOWN';
  const S = window.SHD_SONG, row = pop.querySelector('.pp-row'), spk = pop.querySelector('.pp-spk');
  const vol = document.createElement('div'); vol.className = 'pp-vol';
  const v0 = S ? Math.round(S.volume * 100) : 35;
  vol.innerHTML = `<button type="button" class="pv-play" aria-label="Play the music"><i aria-hidden="true"></i></button>
    <div class="pv-body"><small>the sound</small><b class="pv-name">${S && S.title ? S.title : 'no song yet'}</b>${S && S.artist ? `<em>${S.artist}</em>` : ''}
    <label class="pv-slide"><span class="pv-lo" aria-hidden="true">quiet</span><input type="range" min="0" max="100" value="${v0}" aria-label="Music volume"><span class="pv-hi" aria-hidden="true">loud</span></label>
    <span class="pv-num">${v0}</span></div>`;
  if (spk) spk.replaceWith(vol); else if (row) row.prepend(vol);
  const btn = vol.querySelector('.pv-play'), rng = vol.querySelector('input'), num = vol.querySelector('.pv-num');
  const sync = () => { const p = !!(window.SHD_SONG && window.SHD_SONG.playing); vol.classList.toggle('on', p); btn.setAttribute('aria-label', p ? 'Pause the music' : 'Play the music'); };
  btn.onclick = () => { if (window.SHD_SONG) window.SHD_SONG.toggle(); };
  rng.oninput = () => { num.textContent = rng.value; rng.style.setProperty('--v', rng.value + '%'); if (window.SHD_SONG) window.SHD_SONG.setVolume(rng.value / 100); };
  rng.style.setProperty('--v', v0 + '%');
  document.addEventListener('shd-song', sync); sync();
  const none = () => { vol.classList.add('none'); vol.querySelector('.pv-name').textContent = 'no song yet'; const em = vol.querySelector('.pv-body em'); if (em) em.remove(); };
  if (!S) none(); else if (S.available) S.available.then(a => { if (!a) none(); });
  // the seal: the artist's logo in the middle, the artist's own line around it
  const seal = pop.querySelector('.pp-seal');
  if (seal) {
    const tp = seal.querySelector('textPath'); if (tp) { tp.textContent = 'doing it scared is just being brave ✶ shedithers ✶ '; const t = tp.parentNode; t.setAttribute('font-family', "'JetBrains Mono', monospace"); t.setAttribute('font-size', '14'); t.setAttribute('letter-spacing', '1'); t.setAttribute('font-weight', '500'); tp.setAttribute('textLength', '486'); tp.setAttribute('lengthAdjust', 'spacing'); }
    const pix = seal.querySelector('.pp-pix'); if (pix) pix.innerHTML = `<img src="${new URL('assets/ui/logo-red.png', location.href).href}" alt="" draggable="false">`;
  }
}
if (view) new MutationObserver(dressPop).observe(view, { childList: true, subtree: true });
dressPop();

/* ---------- 15. THE WALL: the newest pieces pinned up loose. drag them anywhere, tap to look closer,
   "mess it up" throws them around, "line them up" puts them in rows. A YouTube short is pinned up too ---------- */
function wallPanel() {
  const P = document.querySelector('.portal'); if (!P || P.querySelector('.p-wallpin') || typeof ARTWORKS === 'undefined') return;
  const after = P.querySelector('.p-loops') || P.querySelector('.p-lab'); if (!after) return;
  const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
  // SHE, NOT ME I + II hang together as one double card
  const pieces = ARTWORKS.filter(a => a.type !== 'video' && a.date >= '2026-11-20' && a.id !== 'self-portrait-grey').slice(-14);
  const twin = ARTWORKS.find(a => a.id === 'self-portrait-grey');
  const yt = (CFG.youtubeShorts || [])[0], ytUser = String(CFG.youtube || '').replace(/^@/, '');
  const sec = document.createElement('section'); sec.className = 'p-mod p-wallpin';
  sec.innerHTML = `<div class="p-head"><small>ウォール</small><b>THE WALL</b><span>NEW PIECES, PINNED UP LOOSE · DRAG THEM AROUND · TAP ONE TO LOOK CLOSER</span></div>
    <div class="wp-board" role="group" aria-label="The wall: new pieces you can move around"></div>
    <div class="wp-ctrl"><button type="button" class="wp-btn" data-k="mess">✦ mess it up</button><button type="button" class="wp-btn" data-k="rows">line them up</button>
    ${ytUser ? `<a class="wp-btn red" href="https://www.youtube.com/@${ytUser}" target="_blank" rel="noopener">follow on youtube ▸</a>` : ''}</div>`;
  after.after(sec); edges();
  const board = sec.querySelector('.wp-board'), abs = u => new URL(u, location.href).href;
  const cards = pieces.map((a, i) => {
    const c = document.createElement('button'); c.type = 'button'; c.className = 'wp-card'; c.dataset.id = a.id;
    c.setAttribute('aria-label', `${a.title}. Drag to move, tap to look closer`);
    if (a.id === 'self-portrait-green' && twin) { c.classList.add('wp-pair'); c.setAttribute('aria-label', 'She, not me. Drag to move, tap to look closer');
      c.innerHTML = `<i class="wp-pin" aria-hidden="true"></i><span class="wp-two"><span class="wp-img" style="background-image:url('${abs(a.src)}')"></span><span class="wp-img" style="background-image:url('${abs(twin.src)}')"></span></span><span class="wp-cap">she, not me</span>`; }
    else c.innerHTML = `<i class="wp-pin" aria-hidden="true"></i><span class="wp-img" style="background-image:url('${abs(a.src)}')"></span><span class="wp-cap">${a.title.toLowerCase()}</span>`;
    board.append(c); return c;
  });
  if (yt) {
    const c = document.createElement('a'); c.className = 'wp-card wp-yt'; c.href = `https://youtube.com/shorts/${yt}`; c.target = '_blank'; c.rel = 'noopener';
    c.setAttribute('aria-label', 'Watch on YouTube');
    c.innerHTML = `<i class="wp-pin" aria-hidden="true"></i><span class="wp-img" style="background-image:url('https://i.ytimg.com/vi/${yt}/hqdefault.jpg')"><b class="wp-play" aria-hidden="true">▶</b></span><span class="wp-cap">watch on youtube ▸</span>`;
    board.append(c); cards.push(c);
  }
  let z = 10;
  const place = mode => {
    const W = board.clientWidth, H = board.clientHeight, cw = cards[0] ? cards[0].offsetWidth : 140, ch = cards[0] ? cards[0].offsetHeight : 170;
    const cols = Math.max(2, Math.floor(W / (cw + 18)));
    cards.forEach((c, i) => {
      let x, y, r;
      if (mode === 'rows') { const col = i % cols, row = (i / cols) | 0, gap = (W - cols * cw) / (cols + 1); x = gap + col * (cw + gap); y = 14 + row * (ch * .62); r = (i % 2 ? 1.5 : -1.5); }
      else { x = Math.random() * Math.max(10, W - cw); y = Math.random() * Math.max(10, H - ch); r = Math.random() * 24 - 12; }
      c.style.transform = `translate(${x | 0}px,${y | 0}px) rotate(${r.toFixed(1)}deg)`; c.dataset.x = x; c.dataset.y = y; c.dataset.r = r;
    });
  };
  // dragging: pointer moves the card with transform only (cheap); a short tap opens the piece
  let drag = null;
  board.addEventListener('pointerdown', e => {
    const c = e.target.closest('.wp-card'); if (!c) return;
    drag = { c, sx: e.clientX, sy: e.clientY, x: +c.dataset.x || 0, y: +c.dataset.y || 0, moved: false };
    c.style.zIndex = ++z; c.classList.add('lift'); c.setPointerCapture(e.pointerId);
  });
  board.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (!drag.moved) return;
    const W = board.clientWidth, H = board.clientHeight, c = drag.c;
    const x = Math.max(-20, Math.min(W - c.offsetWidth + 20, drag.x + dx)), y = Math.max(-10, Math.min(H - c.offsetHeight + 10, drag.y + dy));
    c.dataset.x = x; c.dataset.y = y; c.style.transform = `translate(${x | 0}px,${y | 0}px) rotate(${(dx * .04).toFixed(1)}deg) scale(1.06)`;
  });
  const end = e => {
    if (!drag) return; const { c, moved } = drag; drag = null; c.classList.remove('lift');
    c.style.transform = `translate(${+c.dataset.x | 0}px,${+c.dataset.y | 0}px) rotate(${(+c.dataset.r || 0).toFixed(1)}deg)`;
    if (moved) { c.dataset.dragged = '1'; setTimeout(() => delete c.dataset.dragged, 50); }
  };
  board.addEventListener('pointerup', end); board.addEventListener('pointercancel', end);
  board.addEventListener('click', e => {
    const c = e.target.closest('.wp-card'); if (!c) return;
    if (c.dataset.dragged) { e.preventDefault(); return; }
    if (c.dataset.id) location.hash = `#/work/${c.dataset.id}`;
  });
  sec.querySelector('[data-k=mess]').onclick = () => place('mess');
  sec.querySelector('[data-k=rows]').onclick = () => place('rows');
  requestAnimationFrame(() => place('mess'));
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => sec.isConnected && place('mess'), 300); });
}
if (view) new MutationObserver(wallPanel).observe(view, { childList: true, subtree: true });
wallPanel();

/* ---------- 16. a few words about the work, in the NO IDENTITY block ---------- */
function styleNote() {
  const L = document.querySelector('.portal > .p-logo'); if (!L || L.querySelector('.pl-style')) return;
  const d = document.createElement('div'); d.className = 'pl-style';
  d.innerHTML = `<small>スタイル · the work</small>
    <p class="pl-style-a">most of what you see here starts as photos i take myself. i layer them with found images, old computer windows, torn paper, my own handwriting and drawings, then push it all through dither and glitch until it feels like a memory with bad reception.</p>
    <ol class="pl-steps" aria-label="how the work gets made"><li>my photos</li><li>collage</li><li>handwriting</li><li>dither</li><li>glitch</li><li>signal</li></ol>
    <p>collage, drawing, signal and moving image. there’s no one way i make it.</p>
    <p class="pl-style-b">it’s about identity. becoming and unbecoming, feeling things out loud, staying a little strange.</p>`;
  // the words come in when the block is on screen
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { d.classList.add('in'); io.disconnect(); } }, { threshold: .3 }); io.observe(d); } else d.classList.add('in');
  L.append(d);
}
if (view) new MutationObserver(styleNote).observe(view, { childList: true, subtree: true });
styleNote();
})();
