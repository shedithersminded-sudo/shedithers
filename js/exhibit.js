/* SHEDITHERS — the artist's exhibit: view-only gallery, full-screen showcase, UI motion. */
/* The artist's work is viewed in the Archive (archive.html). In the editor it is never loaded for editing. */
function openExhibit(id) { location.href = 'archive.html' + (typeof id === 'string' ? '#/work/' + id : ''); }
const noGrab = el => { el.draggable = false; el.addEventListener('contextmenu', e => e.preventDefault()); el.addEventListener('dragstart', e => e.preventDefault()); return el; };
const artEl = (a, cls) => noGrab(a.type === 'video' ? Object.assign(h('video', { class: cls, src: a.src, loop: true, autoplay: true, playsInline: true, preload: 'metadata' }), { muted: true }) : h('img', { class: cls, src: a.src, alt: a.title, loading: 'lazy', decoding: 'async' }));
/* the archive as a moving edit: jump-cuts between untouched pieces, timecode HUD, sliding filmstrip */
let editTimer = null;
function archiveSection() {
  const list = ARTWORKS.filter(a => a.type !== 'video' && a.col !== 'objects').sort(() => Math.random() - 0.5);
  const layers = [h('span', { class: 'er-layer on' }), h('span', { class: 'er-layer' })];
  const hud = h('span', { class: 'er-hud' }), title = h('span', { class: 'er-title' }), flash = h('i', { class: 'er-flash' });
  let i = 0, front = 0, paused = false, frames = 0;
  const screen = h('button', { class: 'er-screen', 'data-tip': 'Open this piece in the Archive', onclick: () => openExhibit(list[i].id), onmouseenter: () => paused = true, onmouseleave: () => paused = false }, ...layers, flash, h('span', { class: 'er-rec' }, '● REC'), hud, title);
  const cut = () => {
    const a = list[i], back = layers[1 - front]; back.innerHTML = ''; back.append(noGrab(h('img', { src: a.src, alt: a.title, decoding: 'async' })));
    const show = () => { back.classList.add('on'); layers[front].classList.remove('on'); front = 1 - front; flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); title.textContent = a.title; };
    const im = back.firstChild; if (im.complete) show(); else { im.onload = show; im.onerror = show; }
  };
  const strip = h('div', { class: 'er-strip' }, h('div', { class: 'er-track' }, [...list.slice(0, 10), ...list.slice(0, 10)].map(a => h('button', { class: 'er-thumb', 'data-tip': a.title, onclick: () => openExhibit(a.id) }, noGrab(h('img', { src: a.src, alt: '', loading: 'lazy', decoding: 'async' }))))));
  clearInterval(editTimer); cut();
  editTimer = setInterval(() => {
    if (!document.body.contains(screen)) return clearInterval(editTimer);
    frames += 6; const s = Math.floor(frames / 24); hud.textContent = `CUT ${String(i + 1).padStart(2, '0')}/${list.length} · 00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(frames % 24).padStart(2, '0')}`;
    if (!paused && frames % 42 === 0) { i = (i + 1) % list.length; cut(); }
  }, 250);
  return h('div', { class: 'sec' }, h('div', { class: 'sec-t' }, 'ARTIST ARCHIVE', h('span', { style: { color: 'var(--pink)' } }, 'NOW PLAYING ♥')), screen, strip,
    h('button', { class: 'btn pink', style: { width: '100%', justifyContent: 'center', marginTop: '8px' }, onclick: () => openExhibit() }, `◉ ENTER THE ARCHIVE · ${ARTWORKS.length} FILES`));
}

/* ---- UI motion: staggered entrances, 3D tilt, ripples ---- */
function stagger(root) { $$('.preset, .fx-item, .lib-item, .art-tile, .list-item, .tex-sw, .sec', root).forEach((e, i) => { e.style.setProperty('--i', Math.min(i, 30)); e.classList.add('rise'); }); }
document.addEventListener('mousemove', e => { const t = e.target.closest && e.target.closest('.tilt, .preset, .art-card, .feat'); if (!t) return; const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; t.style.setProperty('--rx', (-y * 10).toFixed(1) + 'deg'); t.style.setProperty('--ry', (x * 12).toFixed(1) + 'deg'); t.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%'); });
document.addEventListener('mouseout', e => { const t = e.target.closest && e.target.closest('.tilt, .preset, .art-card, .feat'); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); } });
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.btn, .tbtn, .seg button, .ex-tabs button, .drink'); if (!b || document.body.classList.contains('no-motion')) return; const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, rp = h('span', { class: 'ripple', style: `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px` }); b.append(rp); setTimeout(() => rp.remove(), 600); });
