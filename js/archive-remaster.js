/* SHEDITHERS — archive remaster (v3.5.0). Loaded last.
 * 1. code rain: the word "shedithers" falls in columns behind everything, barely there
 * 2. glowing edges on every home panel (a light that slowly travels around the border, brighter on hover)
 * 3. the buy me a drink tab: same art + shape, the cocktail emoji swapped for the artist's own logo figure */
(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. code rain (v4.2.3): "SHEDITHERS" falls inside the THANK YOU panel, soft grey-white.
   it used to sit behind the whole page, so faint nobody saw it. now it lives in one panel, runs every frame
   (smooth, no stepping) and only while that panel is on screen ---------- */
const WORD = 'SHEDITHERS';
function placeRain() { } // kept so older callers don't break
function rainIn(host) {
  const cv = document.createElement('canvas'); cv.className = 'ty-rain'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const g = cv.getContext('2d'); const glyphs = {};
  let W = 0, H = 0, fs = 16, lh = 20, cols = [], raf = 0, last = 0, on = false;
  const glyph = (ch, head) => {
    const k = ch + (head ? 1 : 0); if (glyphs[k]) return glyphs[k];
    const c = document.createElement('canvas'), x = c.getContext('2d'), d = Math.min(2, devicePixelRatio || 1);
    c.width = Math.ceil(fs * .9 * d); c.height = Math.ceil(fs * 1.3 * d); x.scale(d, d);
    x.font = `700 ${fs}px "JetBrains Mono", monospace`; x.textBaseline = 'top';
    if (head) { x.shadowColor = 'rgba(255,255,255,.7)'; x.shadowBlur = 6; }
    x.fillStyle = head ? '#f4f1ea' : '#cfcac0'; x.fillText(ch, 0, 1);
    c._w = c.width / d; c._h = c.height / d; return (glyphs[k] = c);
  };
  const drop = (c, top) => { c.len = 10 + (Math.random() * 12 | 0); c.v = 70 + Math.random() * 60; c.y = top ? Math.random() * (H + c.len * lh) : -Math.random() * H * .6; c.off = Math.random() * 10 | 0; };
  function size() {
    const r = host.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; g.setTransform(d, 0, 0, d, 0, 0);
    fs = W < 600 ? 13 : 16; lh = Math.round(fs * 1.25); for (const k in glyphs) delete glyphs[k];
    const step = Math.round(fs * 1.5), n = Math.ceil(W / step);
    cols = Array.from({ length: n }, (_, i) => { const c = { x: i * step + 3 }; drop(c, true); return c; });
    if (!on || reduce) paint(0);
  }
  function paint(dt) {
    g.clearRect(0, 0, W, H);
    for (const c of cols) {
      c.y += c.v * dt;
      for (let k = 0; k < c.len; k++) {
        const y = c.y - k * lh; if (y < -lh || y > H) continue;
        const ch = WORD[((c.off - k) % 10 + 10) % 10], gl = glyph(ch, k === 0);
        g.globalAlpha = k === 0 ? .95 : .62 * (1 - k / c.len) + .06;
        g.drawImage(gl, c.x, y, gl._w, gl._h);
      }
      if (c.y - c.len * lh > H) drop(c, false);
    }
    g.globalAlpha = 1;
  }
  function frame(t) { raf = 0; if (!on || document.hidden) return; const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t; paint(dt); raf = requestAnimationFrame(frame); }
  const go = () => { if (!raf && on && !reduce && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  if ('ResizeObserver' in window) new ResizeObserver(() => size()).observe(host); size();
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; go(); }, { rootMargin: '80px 0px' }).observe(host); else { on = true; go(); }
  document.addEventListener('visibilitychange', go);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const k in glyphs) delete glyphs[k]; });
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

/* ---------- 11. OTHER THINGS I MADE: the two free studios side by side (Dither Lab for pictures, SHELOOPS for music) ---------- */
function loopsPanel() {
  const P = document.querySelector('.portal'); if (!P || P.querySelector('.p-made') || typeof ARTWORKS === 'undefined') return;
  const lab = P.querySelector('.p-lab'); if (!lab) return;
  const A2 = f => new URL('assets/ui/art2/' + f, location.href).href;
  const screen = lab.querySelector('.pl-screen');
  const rays = Array.from({ length: 40 }, (_, k) => `<i style="--a:${k * 9}deg;--k:${k}"><b></b></i>`).join('');
  const sec = document.createElement('section'); sec.className = 'p-mod p-made';
  sec.innerHTML = `
    <div class="p-head"><small>つくったもの</small><b>OTHER THINGS I MADE</b><span>FREE · NO SIGN UP · WHAT YOU MAKE IS YOURS</span></div>
    <div class="mk-sky" aria-hidden="true" style="background-image:url('${new URL('assets/archive/sky-2.jpg', location.href).href}')"></div>
    <p class="mk-lede">i built these for me first. now they’re yours too. free, nothing to install, no account. go make something weird.</p>
    <div class="mk-row">
      <article class="mk-card mk-lab">
        <span class="mk-free" aria-hidden="true">FREE</span>
        <div class="mk-art"></div>
        <small class="mk-for">01 · for pictures + video</small>
        <h3>DITHER LAB</h3>
        <p>drop in a photo and break it on purpose. dither, glitch, glow, halftone, paper, grain. 60+ effects. save it as a picture, a gif or a video.</p>
        <a class="mk-go" href="index.html">open the lab <i aria-hidden="true">▸</i></a>
        <small class="mk-note">your photos never leave your computer.</small>
      </article>
      <article class="mk-card mk-loops">
        <div class="lp-sky" aria-hidden="true" style="background-image:url('${A2('sky.webp')}')"></div>
        <img class="lp-branch" src="${A2('leaves.webp')}" alt="" aria-hidden="true" draggable="false">
        <span class="mk-free" aria-hidden="true">FREE</span>
        <div class="mk-art"><div class="lp-deck" aria-hidden="true">
          <div class="lp-rays">${rays}</div>
          <div class="lp-disc"><i class="lp-label" style="background-image:url('${A2('no-face.webp')}')"></i><i class="lp-hole"></i></div>
          <i class="lp-arm"></i>
        </div></div>
        <small class="mk-for">02 · for music</small>
        <h3>SHELOOPS</h3>
        <p>make beats, record your voice over them, mix it, design the cover. your songs stay on your computer. export them as wav or mp3 whenever you want.</p>
        <a class="mk-go" href="https://shedithersminded-sudo.github.io/sheloops/" target="_blank" rel="noopener">open sheloops <i aria-hidden="true">▸</i></a>
        <small class="mk-note">works best in chrome or edge.</small>
      </article>
    </div>`;
  if (screen) { screen.setAttribute('aria-label', 'Open the Dither Lab'); sec.querySelector('.mk-lab .mk-art').append(screen); }
  lab.after(sec); lab.remove();
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

/* ---------- 15. THE DARKROOM (was THE WALL): prints hang on lines under a red safelight. your cursor (or finger)
   is the only light. tap a print to develop it, it stays lit. tap a developed print to look closer ---------- */
function wallPanel() {
  const P = document.querySelector('.portal'); if (!P || P.querySelector('.p-wallpin') || typeof ARTWORKS === 'undefined') return;
  const after = P.querySelector('.p-made') || P.querySelector('.p-lab'); if (!after) return;
  const all = ARTWORKS.filter(a => a.type !== 'video' && a.w && a.h && a.id !== 'play-online');
  const deck = new Set(all.slice().sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, 12).map(a => a.id));
  const pieces = all.filter(a => a.date >= '2026-11-20' && !deck.has(a.id)).slice(0, 12);
  if (pieces.length < 6) return;
  const small = a => new URL('assets/ui/intro-art/' + a.id + '.jpg', location.href).href;
  const half = Math.ceil(pieces.length / 2), rows = [pieces.slice(0, half), pieces.slice(half)];
  const sec = document.createElement('section'); sec.className = 'p-mod p-wallpin p-dark';
  sec.innerHTML = `<div class="p-head"><small>ダークルーム</small><b>THE DARKROOM</b><span>YOU ARE THE ONLY LIGHT · MOVE AROUND · TAP A PRINT TO DEVELOP IT</span></div>
    <div class="dr-board" role="group" aria-label="The darkroom: prints you can develop. Tap a print to develop it, tap again to look closer.">
      ${rows.map((r, ri) => `<div class="dr-row" style="--ri:${ri}"><i class="dr-line" aria-hidden="true"></i>${r.map((a, k) => `
        <button type="button" class="dr-print" data-id="${a.id}" style="--k:${k};--tilt:${[-3, 2, -1, 3, -2, 1, -4][(k + ri * 3) % 7]}deg" aria-label="${a.title.replace(/"/g, '')}. Tap to develop.">
          <i class="dr-clip" aria-hidden="true"></i>
          <span class="dr-img" style="background-image:url('${small(a)}')"></span>
          <span class="dr-cap">${a.title.toLowerCase()}</span>
        </button>`).join('')}</div>`).join('')}
      <i class="dr-light" aria-hidden="true"></i><i class="dr-grain" aria-hidden="true"></i>
      <span class="dr-count" aria-live="polite">0 / ${pieces.length} developed</span>
    </div>
    <div class="wp-ctrl"><button type="button" class="wp-btn" data-k="all">✦ lights on</button><button type="button" class="wp-btn" data-k="off">lights off</button></div>`;
  after.after(sec); edges();
  const board = sec.querySelector('.dr-board'), light = sec.querySelector('.dr-light'), count = sec.querySelector('.dr-count');
  const prints = [...sec.querySelectorAll('.dr-print')];
  const tally = () => { const n = prints.filter(p => p.classList.contains('dev')).length; count.textContent = n === prints.length ? 'all developed. thank you for looking.' : `${n} / ${prints.length} developed`; board.classList.toggle('lit', n === prints.length); };
  function develop(p) { if (p.classList.contains('dev')) return; p.classList.add('dev'); p.setAttribute('aria-label', p.getAttribute('aria-label').replace('Tap to develop.', 'Tap to look closer.')); tally(); }
  prints.forEach(p => p.addEventListener('click', () => { if (p.classList.contains('dev')) location.hash = `#/work/${p.dataset.id}`; else develop(p); }));
  sec.querySelector('[data-k=all]').onclick = () => prints.forEach((p, i) => setTimeout(() => develop(p), reduce ? 0 : i * 70));
  sec.querySelector('[data-k=off]').onclick = () => { prints.forEach(p => { p.classList.remove('dev'); p.setAttribute('aria-label', p.getAttribute('aria-label').replace('Tap to look closer.', 'Tap to develop.')); }); tally(); };
  // the light: follows the pointer; when nobody is pointing it drifts slowly on its own (only while on screen)
  let x = 0, y = 0, tx = 0, ty = 0, idle = 0, on = false, raf = 0, t0 = 0;
  const size = () => { const r = board.getBoundingClientRect(); return [r.width, r.height]; };
  function frame(t) {
    raf = 0; if (!on || document.hidden) return;
    if (performance.now() - idle > 1800 && !reduce) { const [w, h] = size(), s = t / 1000; tx = w * (.5 + .36 * Math.sin(s * .45)); ty = h * (.5 + .3 * Math.sin(s * .71 + 1)); }
    x += (tx - x) * .14; y += (ty - y) * .14;
    light.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    raf = requestAnimationFrame(frame);
  }
  const go = () => { if (!raf && on) raf = requestAnimationFrame(frame); };
  board.addEventListener('pointermove', e => { const r = board.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; idle = performance.now(); go(); });
  board.addEventListener('pointerdown', e => { const r = board.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; idle = performance.now(); go(); });
  { const [w, h] = size(); x = tx = w / 2; y = ty = h / 2; light.style.transform = `translate3d(${x}px,${y}px,0)`; }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) go(); }, { rootMargin: '60px' }).observe(board);
  else { on = true; go(); }
  document.addEventListener('visibilitychange', go);
}
if (view) new MutationObserver(wallPanel).observe(view, { childList: true, subtree: true });
wallPanel();

/* ---------- 15b. THANK YOU: a note near the bottom of the home page ---------- */
function thanksPanel() {
  const P = document.querySelector('.portal'); if (!P || P.querySelector('.p-thanks')) return;
  const foot = P.querySelector('.p-foot'); if (!foot) return;
  const st = f => new URL('assets/ui/stickers/' + f + '.webp', location.href).href;
  const sec = document.createElement('section'); sec.className = 'p-mod p-thanks';
  sec.innerHTML = `<div class="p-head"><small>ありがとう</small><b>THANK YOU</b><span>FOR BEING HERE</span></div>
    <div class="ty-body">
      <p class="ty-big">Thank you for looking.</p>
      <p>If you liked something, saved it, reposted it, sent it to a friend, left a comment, or stayed on one piece a little longer than you meant to, I noticed. It means more than you know.</p>
      <p>Every person who stops to look is the reason I keep making things.</p>
      <p class="ty-sign">With love, SHEDITHERS <span aria-hidden="true">♥</span></p>
    </div>`;
  rainIn(sec);
  foot.before(sec); edges();
}
if (view) new MutationObserver(thanksPanel).observe(view, { childList: true, subtree: true });
thanksPanel();

/* ---------- 16. a few words about the work, in the NO IDENTITY block ---------- */
function styleNote() {
  const L = document.querySelector('.portal > .p-logo'); if (!L || L.querySelector('.pl-style')) return;
  const d = document.createElement('div'); d.className = 'pl-style';
  d.innerHTML = `<small>スタイル · the work</small>
    <p class="pl-style-a">i work fast. older pieces pull from things i found online, cut up and rebuilt. now it starts with photos i take myself: what’s around me, my hands, the sky, the walls. then it’s layers. torn paper, old computer windows, my handwriting and drawings, pushed through dither and glitch until it feels like a memory with bad reception.</p>
    <ol class="pl-steps" aria-label="how the work gets made"><li>my photos</li><li>found things</li><li>collage</li><li>handwriting</li><li>dither</li><li>signal</li></ol>
    <p>collage, drawing, signal and moving image. no one way to make it.</p>
    <p class="pl-style-b">it’s about identity. becoming and unbecoming, feeling things out loud, staying a little strange.</p>`;
  // the words come in when the block is on screen
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { d.classList.add('in'); io.disconnect(); } }, { threshold: .3 }); io.observe(d); } else d.classList.add('in');
  L.append(d);
}
if (view) new MutationObserver(styleNote).observe(view, { childList: true, subtree: true });
styleNote();

/* ---------- 17. FILE DIRECTORY: an old hacker screen. green phosphor, a typed command, a preview of the file,
   a glitch tear now and then while it's on screen, ACCESS GRANTED when you open something ---------- */
function hackDir() {
  const nd = document.querySelector('.portal > .nd'); if (!nd || nd.dataset.hk) return;
  const scr = nd.querySelector('.nd-scr'), list = nd.querySelector('.nd-list'), fields = nd.querySelector('.nd-fields'), box = nd.querySelector('.nd-box');
  if (!scr || !list || !fields || !box) return; nd.dataset.hk = '1'; nd.classList.add('hk');
  const sub = nd.querySelector('.p-head span'); if (sub) sub.textContent = 'HOVER · ARROW KEYS · CLICK TO OPEN';
  const cmd = document.createElement('div'); cmd.className = 'nd-cmd';
  cmd.innerHTML = '<span class="nd-ps">C:\\SHEDITHERS&gt;</span> <span class="nd-typed"></span><i class="nd-car" aria-hidden="true"></i>';
  list.before(cmd);
  const low = document.createElement('div'); low.className = 'nd-low'; fields.before(low); low.append(fields);
  const prev = document.createElement('div'); prev.className = 'nd-prev'; prev.setAttribute('aria-hidden', 'true');
  prev.innerHTML = '<i class="nd-img"></i><b class="nd-pt">PREVIEW</b><span class="nd-pk"></span>'; low.append(prev);
  scr.insertAdjacentHTML('beforeend', '<i class="nd-roll" aria-hidden="true"></i><i class="nd-tear" aria-hidden="true"></i><i class="nd-tear b" aria-hidden="true"></i><div class="nd-ok" aria-hidden="true"><b>ACCESS GRANTED</b><small>opening file…</small></div>');
  const img = prev.querySelector('.nd-img'), pk = prev.querySelector('.nd-pk'), cache = {};
  // small copies first (the intro art), the full piece if there is no small one
  function load(a, cb) {
    if (cache[a.id]) return cb(cache[a.id]);
    const sm = new URL('assets/ui/intro-art/' + a.id + '.jpg', location.href).href, im = new Image();
    im.onload = () => { cache[a.id] = sm; cb(sm); }; im.onerror = () => { const f = new URL(a.src, location.href).href; cache[a.id] = f; cb(f); }; im.src = sm;
  }
  let cur = '', pt = 0;
  function show() {
    const t = box.textContent; if (t === cur) return; cur = t; clearTimeout(pt);
    prev.classList.remove('sw'); void prev.offsetWidth; prev.classList.add('sw');
    const a = ARTWORKS.find(x => x.title === t); if (!a) return;
    if (a.type === 'video') { img.style.backgroundImage = ''; prev.classList.add('mo'); pk.textContent = 'MOTION · OPEN TO PLAY'; return; }
    prev.classList.remove('mo'); pk.textContent = a.w && a.h ? `${a.w}×${a.h}` : '';
    pt = setTimeout(() => load(a, u => { if (cur === t) img.style.backgroundImage = `url('${u}')`; }), 120);
  }
  new MutationObserver(show).observe(box, { childList: true, characterData: true, subtree: true }); show();
  const typed = cmd.querySelector('.nd-typed'), line = 'dir /archive /all /show-me-everything';
  let on = false, gt = 0, did = false;
  function type() { if (did) return; did = true; if (reduce) { typed.textContent = line; return; } let k = 0; const iv = setInterval(() => { typed.textContent = line.slice(0, ++k); if (k >= line.length) clearInterval(iv); }, 42); }
  function glitch() {
    clearTimeout(gt); if (!on || !nd.isConnected) return;
    if (!reduce && !document.hidden && !document.body.classList.contains('rm-scrolling')) { scr.style.setProperty('--ty', (8 + Math.random() * 80).toFixed(0) + '%'); scr.classList.remove('gl'); void scr.offsetWidth; scr.classList.add('gl'); }
    gt = setTimeout(glitch, 2400 + Math.random() * 4000);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) { type(); glitch(); } else clearTimeout(gt); }, { threshold: .15 }).observe(nd); else type();
  // opening a file: ACCESS GRANTED flashes, then the file opens
  const grant = li => { if (scr.classList.contains('ok')) return; scr.classList.add('ok'); setTimeout(() => { li.dataset.ok = '1'; li.click(); delete li.dataset.ok; }, reduce ? 0 : 420); setTimeout(() => scr.classList.remove('ok'), 1100); };
  list.addEventListener('click', e => { const li = e.target.closest('li'); if (!li || li.dataset.ok) return; e.stopPropagation(); e.preventDefault(); grant(li); }, true);
  list.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const li = list.querySelector('li.on'); if (!li) return; e.stopPropagation(); e.preventDefault(); grant(li); }, true);
}
if (view) new MutationObserver(hackDir).observe(view, { childList: true, subtree: true });
hackDir();

/* ---------- 18. (v4.2.0) make a mess is retired; clear what it saved ---------- */
try { localStorage.removeItem('shd.mess2'); localStorage.removeItem('shd.mess'); } catch (_) { }


/* ---------- 19. DREAM MODE (top right): the site dims and the artist's pieces drift by like an old screensaver.
   the song keeps playing. tap a piece to open it, tap anywhere else (or esc) to wake up ---------- */
(() => {
  if (typeof ARTWORKS === 'undefined') return;
  const U = p => new URL(p, location.href).href;
  const POOL = ARTWORKS.filter(a => a.type !== 'video' && a.w && a.h && a.id !== 'play-online');
  const LINES = ['meet me in my dreams', 'are we alive yet?', 'doing it scared is just being brave', 'who will you be?', 'i look prettier in fragments', 'understanding me is understanding we', 'offline is the new luxury', 'strangers with familiar eyes', 'let the light in', 'stay a little strange', 'it\u2019s all in your head', 'shedithers loves you'];
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dream-btn'; btn.setAttribute('aria-label', 'Dream mode: watch the art drift by');
  btn.innerHTML = `<i class="db-moon" aria-hidden="true" style="background-image:url('${U('assets/ui/intro-art/sky-2.jpg')}')"></i><b>DREAM MODE</b>`;
  document.body.append(btn);
  let ov = null, spawnT = 0, lineT = 0, li = 0;
  const pick = () => POOL[Math.floor(Math.random() * POOL.length)];
  function fly(pre) {
    if (!ov) return; const field = ov.querySelector('.dm-field'); if (field.children.length > 10) return;
    const a = pick(), z = Math.random(), w = Math.round(80 + z * 150), ltr = Math.random() < .5, dur = 34 - z * 16;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'dm-p'; el.dataset.id = a.id; el.setAttribute('aria-label', 'Open ' + a.title);
    el.style.cssText = `--w:${w}px;--y:${(4 + Math.random() * 72).toFixed(1)}vh;--x0:${ltr ? `-${w + 60}px` : `calc(100vw + 60px)`};--x1:${ltr ? `calc(100vw + 60px)` : `-${w + 60}px`};--r0:${((Math.random() - .5) * 24).toFixed(1)}deg;--r1:${((Math.random() - .5) * 24).toFixed(1)}deg;--d:${dur.toFixed(1)}s;--o:${(.45 + z * .55).toFixed(2)};z-index:${Math.round(z * 10)};animation-delay:${pre ? -(Math.random() * dur * .8).toFixed(1) : 0}s`;
    el.innerHTML = `<span class="dm-bob" style="--bd:${(4 + Math.random() * 4).toFixed(1)}s"><span class="dm-img" style="background-image:url('${U('assets/ui/intro-art/' + a.id + '.jpg')}')"></span></span>`;
    el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
    field.append(el);
  }
  function nextLine() { if (!ov) return; const l = ov.querySelector('.dm-line'); l.classList.remove('on'); setTimeout(() => { if (!ov) return; l.textContent = LINES[li++ % LINES.length]; l.classList.add('on'); }, 900); }
  function open() {
    if (ov) return;
    ov = document.createElement('div'); ov.className = 'dm'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Dream mode');
    const S = window.SHD_SONG;
    ov.innerHTML = `<i class="dm-sky" aria-hidden="true" style="background-image:url('${U('assets/archive/sky-2.jpg')}')"></i><i class="dm-dots" aria-hidden="true"></i>
      <div class="dm-field"></div>
      <p class="dm-line" aria-live="polite"></p>
      <div class="dm-top"><small>ドリーム · dream mode</small>${S && S.title ? `<span class="dm-song">\u266a ${S.title} \u00b7 ${S.artist}</span>` : ''}<button type="button" class="dm-x">wake up \u2715</button></div>
      <p class="dm-hint">tap a piece to open it \u00b7 tap anywhere else to wake up</p>`;
    document.body.append(ov); document.body.classList.add('dreaming'); btn.setAttribute('aria-pressed', 'true');
    for (let i = 0; i < 7; i++) fly(true);
    spawnT = setInterval(() => { if (!document.hidden) fly(false); }, 2600);
    nextLine(); lineT = setInterval(nextLine, 7000);
    let off = false; try { off = !!localStorage.getItem('shd.songOff'); } catch (_) { }
    if (S && !S.playing && !off) S.play();
    ov.addEventListener('click', e => { const p = e.target.closest('.dm-p'); if (p) { close(); location.hash = `#/work/${p.dataset.id}`; return; } close(); });
    ov.querySelector('.dm-x').focus();
    window.shdCount && window.shdCount('dream-mode', 'Opened dream mode');
  }
  function close() {
    if (!ov) return; clearInterval(spawnT); clearInterval(lineT);
    const o = ov; ov = null; o.classList.add('out'); document.body.classList.remove('dreaming'); btn.setAttribute('aria-pressed', 'false');
    setTimeout(() => o.remove(), 600); btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', open);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('hashchange', () => { if (ov) close(); });
  document.addEventListener('visibilitychange', () => { if (ov && !document.hidden) { const f = ov.querySelector('.dm-field'); for (let i = f.children.length; i < 6; i++) fly(true); } });
})();

/* ---------- 20. (v4.3.1) panel titles always fit their panel: if a title is wider than its box
   (long words like INSTANT-PHOTO in a narrow column), shrink just that title until it fits ---------- */
(() => {
  let t = 0;
  function fit() {
    const bs = [...document.querySelectorAll('.portal .p-head b')];
    bs.forEach(b => b.style.removeProperty('font-size'));
    const plan = bs.map(b => {
      const room = b.parentElement.clientWidth - 4, w = b.scrollWidth;
      if (!room || w <= room) return null;
      const fs = parseFloat(getComputedStyle(b).fontSize);
      return [b, Math.max(15, Math.floor(fs * room / w * .96))];
    });
    plan.forEach(x => x && x[0].style.setProperty('font-size', x[1] + 'px', 'important'));
  }
  const soon = () => { clearTimeout(t); t = setTimeout(fit, 120); };
  if (view) new MutationObserver(() => { const P = document.querySelector('.portal:not([data-fit])'); if (P) { P.dataset.fit = '1'; soon(); } }).observe(view, { childList: true, subtree: true });
  addEventListener('resize', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  soon();
})();
})();
