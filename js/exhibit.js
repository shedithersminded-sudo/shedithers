/* SHEDITHERS — the artist's exhibit: view-only gallery, full-screen showcase, UI motion. */
const EXHIBIT = [
  { type: 'video', src: 'assets/art/01M.mp4', name: 'BECOME UNMARKETABLE', kind: 'MOTION · LOOP', line: 'become unmarketable' },
  { src: 'assets/art/gallery/g1.jpg', name: 'NOT IN MY NATURE', kind: 'DIGITAL COLLAGE', line: 'I don’t want ordinary. It’s not in my nature.' },
  { src: 'assets/art/collage.png', name: 'NO IDENTITY', kind: 'DIGITAL COLLAGE', line: 'becoming and unbecoming so I can become who I always have been and never was' },
  { src: 'assets/art/gallery/g3.jpg', name: 'CLICK TO BE SAVED', kind: 'DIGITAL COLLAGE', line: 'click to apologize · click to be saved · click to forgive' },
  { src: 'assets/art/gallery/g2.jpg', name: 'YOU KEEP FORGETTING', kind: 'DIGITAL COLLAGE', line: 'you keep forgetting' },
  { src: 'assets/art/gallery/g7.jpg', name: 'ALL SIGNS POINT TO YES', kind: 'DIGITAL', line: 'dreams aren’t dreams' },
  { src: 'assets/art/gallery/g4.jpg', name: 'BLOOM', kind: 'MIXED MEDIA', line: 'shedithers' },
  { src: 'assets/art/gallery/g5.jpg', name: 'GOLD', kind: 'MIXED MEDIA', line: 'shedithers' },
  { src: 'assets/art/gallery/g6.jpg', name: 'THE END?', kind: 'MIXED MEDIA', line: 'dream without action is hallucination' },
];
const noGrab = el => { el.draggable = false; el.addEventListener('contextmenu', e => e.preventDefault()); el.addEventListener('dragstart', e => e.preventDefault()); return el; };
const artEl = (it, cls) => noGrab(it.type === 'video' ? Object.assign(h('video', { class: cls, src: it.src, loop: true, autoplay: true, playsInline: true, preload: 'metadata' }), { muted: true }) : h('img', { class: cls, src: it.src, alt: it.name, loading: 'lazy' }));

/* ---- left-panel archive: featured rotator + view-only tiles ---- */
let featTimer = null;
function archiveSection() {
  const feat = h('div', { class: 'feat', onclick: () => openExhibit(featIdx) }), cap = h('div', { class: 'feat-cap' });
  let featIdx = 1; const layers = [h('div', { class: 'feat-layer on' }), h('div', { class: 'feat-layer' })]; let front = 0;
  const show = i => { featIdx = i; const it = EXHIBIT[i], next = layers[1 - front]; next.innerHTML = ''; next.append(artEl(it)); next.classList.add('on'); layers[front].classList.remove('on'); front = 1 - front; cap.innerHTML = `<b>${it.name}</b><span>${String(i + 1).padStart(2, '0')} / ${String(EXHIBIT.length).padStart(2, '0')} · ${it.kind}</span>`; };
  feat.append(...layers, h('div', { class: 'feat-shine' }), cap, h('div', { class: 'feat-view' }, '◉ VIEW EXHIBIT'));
  clearInterval(featTimer); show(1); featTimer = setInterval(() => { if (!document.body.contains(feat)) return clearInterval(featTimer); show((featIdx + 1) % EXHIBIT.length); }, 4200);
  const tiles = h('div', { class: 'art-grid' }, EXHIBIT.map((it, i) => h('button', { class: 'art-tile tilt', 'data-tip': `View “${it.name}”`, onclick: () => openExhibit(i) }, artEl(it), h('i', { class: 'tile-shine' }), h('span', null, it.name))));
  return h('div', { class: 'sec' }, h('div', { class: 'sec-t' }, 'ARTIST ARCHIVE', h('span', { style: { color: 'var(--pink)' } }, 'VIEW ONLY ♥')), feat, tiles,
    h('button', { class: 'btn pink', style: { width: '100%', justifyContent: 'center', marginTop: '8px' }, onclick: () => openExhibit(0) }, '◉ ENTER THE EXHIBIT'));
}

/* ---- full-screen exhibit ---- */
let EXH = null;
function openExhibit(start = 0) {
  if (EXH) return;
  const root = h('div', { id: 'exhibit', class: 'exh' }), bg = h('div', { class: 'exh-bg' }), frame = h('div', { class: 'exh-frame' }), art = h('div', { class: 'exh-art' }), glare = h('i', { class: 'exh-glare' });
  frame.append(art, glare, h('span', { class: 'exh-wm' }, '© SHEDITHERS'));
  const idx = h('div', { class: 'exh-idx' }), title = h('div', { class: 'exh-title' }), kind = h('div', { class: 'exh-kind' }), line = h('div', { class: 'exh-line' }), bar = h('div', { class: 'exh-bar' }, h('i'));
  const strip = h('div', { class: 'exh-strip' }, EXHIBIT.map((it, i) => h('button', { onclick: () => go(i) }, artEl(it))));
  const link = (ok, label, fn, cls) => ok ? h('button', { class: 'btn sm ' + (cls || ''), onclick: fn }, label) : null;
  const more = h('div', { class: 'exh-more' }, h('div', { class: 'exh-more-t' }, 'MORE OF MY WORLD'),
    link(typeof tiktokUser === 'function' && tiktokUser(), '♪ TIKTOK', () => openTiktok()), link(typeof ytUser === 'function' && ytUser(), '▶ YOUTUBE', () => openYoutube()),
    link(typeof rbUser === 'function' && rbUser(), 'STICKERS & PRINTS', () => openShop()), link(typeof cashtag === 'function' && cashtag(), '♥ TIP THE ARTIST', () => openTip(), 'pink'));
  const btn = (cls, html, tip, fn) => h('button', { class: 'exh-btn ' + cls, 'data-tip': tip, html, onclick: e => { e.stopPropagation(); fn(); } });
  const playB = btn('play', '❚❚', 'Slideshow · Space', () => setPlay(!playing));
  root.append(bg, h('div', { class: 'exh-scan' }),
    h('div', { class: 'exh-hud tl' }, 'SHEDITHERS // EXHIBIT', h('br'), h('span', null, 'VIEW ONLY · ALL WORK © THE ARTIST')),
    btn('close', '✕', 'Close · Esc', close),
    h('div', { class: 'exh-main' }, btn('prev', '‹', 'Previous · ←', () => go(cur - 1)), h('div', { class: 'exh-stage' }, frame), btn('next', '›', 'Next · →', () => go(cur + 1))),
    h('div', { class: 'exh-info' }, idx, title, kind, line, h('div', { class: 'exh-ctrl' }, playB, bar), more),
    strip, h('div', { class: 'ticker exh-ticker' }, h('div', { class: 'ticker-in' })));
  fillTicker($('.exh-ticker', root), TICKER);
  document.body.append(root); requestAnimationFrame(() => root.classList.add('in'));
  let cur = -1, playing = true, timer = null, t0 = 0, raf = 0;
  function go(i) {
    i = (i + EXHIBIT.length) % EXHIBIT.length; if (i === cur) return; cur = i; const it = EXHIBIT[i];
    art.classList.remove('reveal'); void art.offsetWidth; art.innerHTML = ''; art.append(artEl(it, 'exh-media')); art.classList.add('reveal');
    bg.style.backgroundImage = it.type === 'video' ? `url(${EXHIBIT[2].src})` : `url(${it.src})`;
    idx.innerHTML = `<b>0x${String(i + 1).padStart(2, '0')}</b> / ${String(EXHIBIT.length).padStart(2, '0')}`;
    title.textContent = it.name; title.dataset.text = it.name; title.classList.remove('glitch'); void title.offsetWidth; title.classList.add('glitch');
    kind.textContent = it.kind; line.textContent = '“' + it.line + '”';
    $$('button', strip).forEach((b, k) => b.classList.toggle('on', k === i)); const on = $$('button', strip)[i]; if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    t0 = performance.now();
  }
  function setPlay(p) { playing = p; playB.innerHTML = p ? '❚❚' : '▶'; t0 = performance.now(); }
  const tick = () => { raf = requestAnimationFrame(tick); const el = (performance.now() - t0) / 6500; $('i', bar).style.width = (playing ? Math.min(1, el) * 100 : 0) + '%'; if (playing && el >= 1) go(cur + 1); };
  const onKey = e => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(cur + 1); else if (e.key === 'ArrowLeft') go(cur - 1); else if (e.key === ' ') setPlay(!playing); else if (e.key.toLowerCase() === 'f') root.requestFullscreen && root.requestFullscreen().catch(() => { }); else return; e.preventDefault(); e.stopPropagation(); };
  const onMove = e => { const r = frame.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; frame.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg'); frame.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); frame.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%'); frame.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%'); root.style.setProperty('--px', x.toFixed(3)); root.style.setProperty('--py', y.toFixed(3)); };
  let sx = null; root.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true }); root.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
  document.addEventListener('keydown', onKey, true); root.addEventListener('mousemove', onMove);
  function close() { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey, true); if (document.fullscreenElement === root) document.exitFullscreen(); root.classList.remove('in'); root.classList.add('out'); setTimeout(() => root.remove(), 450); EXH = null; }
  EXH = { close }; go(start); tick();
}

/* ---- UI motion: staggered entrances, 3D tilt, ripples ---- */
function stagger(root) { $$('.preset, .fx-item, .lib-item, .art-tile, .list-item, .tex-sw, .sec', root).forEach((e, i) => { e.style.setProperty('--i', Math.min(i, 30)); e.classList.add('rise'); }); }
document.addEventListener('mousemove', e => { const t = e.target.closest && e.target.closest('.tilt, .preset, .art-card, .feat'); if (!t) return; const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; t.style.setProperty('--rx', (-y * 10).toFixed(1) + 'deg'); t.style.setProperty('--ry', (x * 12).toFixed(1) + 'deg'); t.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%'); });
document.addEventListener('mouseout', e => { const t = e.target.closest && e.target.closest('.tilt, .preset, .art-card, .feat'); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); } });
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.btn, .tbtn, .seg button, .ex-tabs button, .drink'); if (!b || document.body.classList.contains('no-motion')) return; const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, rp = h('span', { class: 'ripple', style: `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px` }); b.append(rp); setTimeout(() => rp.remove(), 600); });
