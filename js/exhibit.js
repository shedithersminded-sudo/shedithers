/* SHEDITHERS — the artist's exhibit: view-only gallery, full-screen showcase, UI motion. */
/* The artist's work is viewed in the Archive (archive.html). In the editor it is never loaded for editing. */
function openExhibit(id) { location.href = 'archive.html' + (typeof id === 'string' ? '#/work/' + id : ''); }
const noGrab = el => { el.draggable = false; el.addEventListener('contextmenu', e => e.preventDefault()); el.addEventListener('dragstart', e => e.preventDefault()); return el; };
const artEl = (a, cls) => noGrab(a.type === 'video' ? Object.assign(h('video', { class: cls, src: a.src, loop: true, autoplay: true, playsInline: true, preload: 'metadata' }), { muted: true }) : h('img', { class: cls, src: a.src, alt: a.title, loading: 'lazy', decoding: 'async' }));
function archiveSection() {
  const list = ARTWORKS.filter(a => a.col !== 'objects');
  const tiles = h('div', { class: 'art-grid' }, list.map((a, i) => h('button', { class: 'art-tile tilt', 'data-tip': `View “${a.title}” in the Archive`, onclick: () => openExhibit(a.id) }, h('span', { class: 'art-mat' }, artEl(a)), h('span', { class: 'art-label' }, a.title))));
  return h('div', { class: 'sec' }, h('div', { class: 'sec-t' }, 'ARTIST ARCHIVE', h('span', { style: { color: 'var(--pink)' } }, 'VIEW ONLY ♥')), tiles,
    h('button', { class: 'btn pink', style: { width: '100%', justifyContent: 'center', marginTop: '8px' }, onclick: () => openExhibit() }, '◉ ENTER THE ARCHIVE'));
}

/* ---- UI motion: staggered entrances, 3D tilt, ripples ---- */
function stagger(root) { $$('.preset, .fx-item, .lib-item, .art-tile, .list-item, .tex-sw, .sec', root).forEach((e, i) => { e.style.setProperty('--i', Math.min(i, 30)); e.classList.add('rise'); }); }
document.addEventListener('mousemove', e => { const t = e.target.closest && e.target.closest('.tilt, .preset, .art-card, .feat'); if (!t) return; const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; t.style.setProperty('--rx', (-y * 10).toFixed(1) + 'deg'); t.style.setProperty('--ry', (x * 12).toFixed(1) + 'deg'); t.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%'); });
document.addEventListener('mouseout', e => { const t = e.target.closest && e.target.closest('.tilt, .preset, .art-card, .feat'); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); } });
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.btn, .tbtn, .seg button, .ex-tabs button, .drink'); if (!b || document.body.classList.contains('no-motion')) return; const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, rp = h('span', { class: 'ripple', style: `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px` }); b.append(rp); setTimeout(() => rp.remove(), 600); });
