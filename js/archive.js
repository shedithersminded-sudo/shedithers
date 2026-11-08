/* SHEDITHERS — Artist Archive. Artwork is READ-ONLY: shown as the original files, never filtered,
 * cropped, recoloured, rotated or processed. All motion/texture lives on the surrounding interface. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
const pad = (n, l = 2) => String(n).padStart(l, '0');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const view = $('#view'), hint = $('#hint');
const colOf = id => COLLECTIONS.find(c => c.id === id);
const worksIn = id => ARTWORKS.filter(a => a.col === id);

/* ---------- artwork element: the original file, untouched ---------- */
function guard(el) { el.setAttribute('draggable', 'false'); el.addEventListener('contextmenu', e => e.preventDefault()); el.addEventListener('dragstart', e => e.preventDefault()); return el; }
function artNode(a, { lazy = true, controls = false, autoplay = true } = {}) {
  if (a.type === 'video') { const v = h('video', { src: a.src, playsinline: true, loop: true, preload: lazy ? 'metadata' : 'auto', 'aria-label': a.title, controlslist: 'nodownload noplaybackrate', disablepictureinpicture: true }); v.muted = true; if (autoplay) v.autoplay = true; if (controls) v.controls = true; return guard(v); }
  return guard(h('img', { src: a.src, alt: `${a.title} — artwork by SHEDITHERS`, loading: lazy ? 'lazy' : 'eager', decoding: 'async', width: a.w || null, height: a.h || null }));
}
/* lazy-play videos only while visible */
const vio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) v.play().catch(() => { }); else v.pause(); }), { threshold: 0.2 }) : null;
function watchVideos(root) { if (!vio) return; $$('video', root).forEach(v => vio.observe(v)); }

/* ---------- decorative marks (interface only) ---------- */
const SCRIBBLES = [
  'M5 40 C 30 5, 60 70, 90 25 S 140 10, 160 45',
  'M10 30 l20 -20 l10 30 l20 -25 l12 28 l18 -22',
  'M20 20 c 40 -20 70 30 40 40 c -30 10 -50 -30 -10 -35 c 30 -4 60 10 80 0',
  'M8 18 h120 M14 30 h90',
  'M30 10 l8 18 l20 2 l-15 13 l5 20 l-18 -11 l-18 11 l5 -20 l-15 -13 l20 -2 z',
];
const scribble = (i, cls) => h('span', { class: 'scrib ' + (cls || ''), 'aria-hidden': 'true', html: `<svg viewBox="0 0 170 80"><path d="${SCRIBBLES[i % SCRIBBLES.length]}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>` });

/* ---------- router ---------- */
let route = { name: 'home' };
function parse() { const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); if (!p.length) return { name: 'home' }; if (p[0] === 'col') return { name: 'col', id: p[1], page: +p[2] || 0 }; if (p[0] === 'works') return { name: 'works', filter: p[1] || 'all' }; if (p[0] === 'about') return { name: 'about' }; if (p[0] === 'work') return { name: 'work', id: p[1] }; return { name: 'home' }; }
function render() {
  const r = parse();
  if (r.name === 'work') { const a = artById(r.id); if (!view.childElementCount) renderView({ name: a ? 'col' : 'home', id: a && a.col }); if (a) openViewer(a.id); return; }
  closeViewer(true); route = r; renderView(r);
}
function renderView(r) {
  route = r; view.classList.remove('in'); view.innerHTML = '';
  ({ home: rr => window.SHD_PORTAL ? SHD_PORTAL(view, { h, setHint, open: id => location.hash = `#/work/${id}`, player }) : viewWorks({ name: 'works', filter: 'all' }), col: viewCollection, works: viewWorks, about: viewAbout })[r.name](r);
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r.name || (r.name === 'col' && a.dataset.r === 'works')));
  requestAnimationFrame(() => view.classList.add('in')); watchVideos(view); window.scrollTo(0, 0); closeNav();
}
window.addEventListener('hashchange', render);

/* ---------- HOME: the messy pinboard — every collection is a different object ---------- */
const OBJ = { collage: 'folder', drawing: 'sketch', signal: 'crt', motion: 'vhs', objects: 'bag', screens: 'ticketlong' };
const ROT = [-4, 3, -2.5, 5, -6, 2, -3.5];
function win(a, cls) { return h('span', { class: 'win ' + (cls || '') }, artNode(a)); } /* art window: counter-rotated so the art always sits level */
function viewHome() {
  setHint([['TAP ANYTHING', null], ['ALL WORKS', () => location.hash = '#/works'], ['♪ MUSIC', () => player.expand()]]);
  const board = h('section', { class: 'board', 'aria-label': 'Collections' });
  // title scrap
  board.append(h('div', { class: 'scrap title-scrap', style: '--r:-2deg' },
    h('i', { class: 'tape a' }), h('span', { class: 'ts-code' }, 'FILE_01// ARCHIVE LOG'),
    h('h1', null, 'SHE', h('br'), 'DITHERS'), h('span', { class: 'ts-sub' }, `artist archive · ${ARTWORKS.length} files · look don’t take`),
    h('span', { class: 'pin-badge' }, h('span', null, 'I'), h('span', { class: 'pb-heart', html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }), h('b', null, 'SHEDITHERS')),
    h('span', { class: 'brush', 'aria-hidden': 'true', html: '<svg viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M4 38 C 60 10, 120 52, 190 30 S 320 8, 396 34" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>' }),
    scribble(2, 'ts-scrib')));
  COLLECTIONS.forEach((c, i) => {
    const works = worksIn(c.id), kind = OBJ[c.id] || 'folder', r = ROT[i % ROT.length], href = `#/col/${c.id}`;
    const label = h('span', { class: 'obj-label' }, h('b', null, c.name), h('span', null, `${c.code} · ${pad(works.length)} files`));
    let body;
    if (kind === 'folder') body = [h('span', { class: 'fo-back' }), ...works.slice(0, 3).map((a, k) => h('span', { class: 'fo-print', style: `--k:${k}` }, win(a))), h('span', { class: 'fo-front' }, h('span', { class: 'fo-tab' }, c.code), label, h('span', { class: 'stamp-s' }, 'CONFIDENTIAL'))];
    else if (kind === 'sketch') body = [h('span', { class: 'sk-holes' }), works[0] ? win(works[0], 'sk-win') : null, h('span', { class: 'marker' }, 'bloom / decay'), label, h('i', { class: 'tape b' })];
    else if (kind === 'crt') body = [h('span', { class: 'crt-screen' }, works[0] ? win(works[0], 'crt-win') : null), h('span', { class: 'crt-knobs' }, h('i'), h('i')), label];
    else if (kind === 'vhs') body = [h('span', { class: 'vhs-spine' }, 'SHEDITHERS · MOTION · SP'), h('span', { class: 'vhs-window' }, works[0] ? win(works[0], 'vhs-win') : null), label, h('span', { class: 'vhs-rec' }, '● REC')];
    else if (kind === 'bag') body = [h('span', { class: 'bag-zip' }), h('span', { class: 'bag-evidence' }, 'EVIDENCE № ' + pad(i + 1, 3)), works[0] ? win(works[0], 'bag-win') : null, label];
    else body = [h('span', { class: 'tk-head' }, h('span', null, 'SHEDITHERS ARCHIVE'), h('span', null, 'WIDESCREEN')), works[0] ? win(works[0], 'tk-win') : null, label, h('span', { class: 'tk-admit' }, 'ADMIT ONE · VIEW ONLY')];
    board.append(h('a', { class: `obj ${kind}`, href, style: `--r:${r}deg;--c:${c.color};--ink:${c.ink};--i:${i}`, 'aria-label': `${c.name} — ${works.length} works` }, ...body, scribble(i + 1, 'obj-scrib')));
  });
  // loose mess: splatter, stars, a torn note, coffee-free zone (the ring is a hidden discovery)
  board.append(h('span', { class: 'splat s1', 'aria-hidden': 'true' }), h('span', { class: 'splat s2', 'aria-hidden': 'true' }),
    h('span', { class: 'loose-note', style: '--r:4deg' }, 'don’t try ✕ 2', h('br'), 'just look ♥'),
    h('span', { class: 'star-st', 'aria-hidden': 'true' }, '☆'), h('span', { class: 'star-st b', 'aria-hidden': 'true' }, '✦'));
  view.append(board, h('section', { class: 'strip-log' }, h('div', { class: 'log-l' }, 'LOG', h('b', null, new Date().toISOString().slice(0, 10))), h('p', null, 'I don’t want ordinary. It’s not in my nature.'), h('a', { href: '#/works', class: 'stamp' }, 'SEE EVERY FILE ▸')));
}

/* ---------- COLLECTION: sketchbook spread with taped prints ---------- */
function perSpread() { return innerWidth < 760 ? 1 : innerWidth < 1100 ? 2 : 4; }
function viewCollection(r) {
  const c = colOf(r.id) || COLLECTIONS[0], works = worksIn(c.id), per = perSpread(), pages = Math.max(1, Math.ceil(works.length / per));
  let page = Math.min(r.page || 0, pages - 1);
  const book = h('div', { class: 'book', style: `--c:${c.color}` }), pager = h('div', { class: 'pager' });
  const drawPage = (dir) => {
    book.classList.remove('turn-l', 'turn-r'); void book.offsetWidth; if (dir) book.classList.add(dir > 0 ? 'turn-r' : 'turn-l');
    book.innerHTML = ''; const slice = works.slice(page * per, page * per + per), half = Math.ceil(slice.length / 2);
    const mkPage = (items, side) => h('div', { class: 'page ' + side }, h('div', { class: 'page-head' }, h('span', null, `${c.code} // ${c.name}`), h('span', null, `P.${pad(page * 2 + (side === 'right' ? 2 : 1))}`)),
      ...items.map((a, k) => h('figure', { class: 'print', style: `--k:${k}` },
        h('button', { class: 'print-hit', onclick: () => location.hash = `#/work/${a.id}`, 'aria-label': `View ${a.title}` }, h('span', { class: 'print-mat' }, artNode(a))),
        h('i', { class: 'tape a' }), h('i', { class: 'tape b' }),
        h('figcaption', { class: 'label' }, a.title), h('span', { class: 'print-code' }, `0x${pad(a.n)} · ${a.date}`),
        a.words ? h('span', { class: 'marker' }, a.words.length > 34 ? a.words.slice(0, 32) + '…' : a.words) : scribble(a.n, 'p-scrib'))));
    if (per === 1) book.append(mkPage(slice, 'single')); else book.append(mkPage(slice.slice(0, half), 'left'), mkPage(slice.slice(half), 'right'));
    pager.innerHTML = ''; for (let i = 0; i < pages; i++) pager.append(h('button', { class: i === page ? 'on' : '', 'aria-label': `Page ${i + 1}`, onclick: () => go(i) }));
    history.replaceState(null, '', `#/col/${c.id}${page ? '/' + page : ''}`); watchVideos(book);
  };
  const go = i => { if (i < 0 || i >= pages || i === page) return; const d = i > page ? 1 : -1; page = i; drawPage(d); };
  setHint([['◀ PAGE LEFT', () => go(page - 1)], ['PAGE RIGHT ▶', () => go(page + 1)], ['TAP A PRINT TO VIEW', null], ['ESC BACK', () => location.hash = '#/']]);
  keyNav = e => { if (e.key === 'ArrowRight') go(page + 1); else if (e.key === 'ArrowLeft') go(page - 1); else if (e.key === 'Escape') location.hash = '#/'; };
  swipe(book, dx => go(page + (dx < 0 ? 1 : -1)));
  const others = COLLECTIONS.filter(x => x.id !== c.id).map(x => h('a', { class: 'mini-tab', href: `#/col/${x.id}`, style: `--c:${x.color};--ink:${x.ink}` }, `${x.code} // ${x.name}`));
  view.append(h('section', { class: 'col-head' }, h('a', { class: 'back', href: '#/' }, '◂ THE EDIT'), h('div', null, h('span', { class: 'col-code' }, `${c.code} //`), h('h2', null, c.name), h('span', { class: 'col-sub' }, `${c.sub} · ${pad(works.length)} FILES`))),
    h('section', { class: 'desk' }, book, pager));
  drawPage(0);
}

/* ---------- ALL WORKS: THE EDIT (moving preview) · tickets as an option ---------- */
let editTimer = null;
function viewWorks(r) {
  clearTimeout(editTimer);
  const f = r.filter || 'all', list = f === 'all' ? ARTWORKS : worksIn(f);
  let mode = 'edit'; try { mode = localStorage.getItem('shd.worksMode') || 'edit'; } catch (_) { }
  setHint(mode === 'edit' ? [['TAP THE SCREEN TO OPEN', null], ['❚❚ / ▶ SPACE', null], ['ESC BACK', () => location.hash = '#/']] : [['TAP A TICKET', null], ['ESC BACK', () => location.hash = '#/']]);
  const chips = h('div', { class: 'chips', role: 'tablist' }, [['all', 'EVERYTHING'], ...COLLECTIONS.map(c => [c.id, c.name])].map(([id, n]) => h('a', { href: `#/works/${id}`, class: id === f ? 'on' : '', role: 'tab' }, n)));
  const modes = h('div', { class: 'works-modes', role: 'radiogroup', 'aria-label': 'How to browse' }, [['edit', '▶ THE EDIT'], ['tickets', 'TICKETS']].map(([k, l]) => h('button', { role: 'radio', 'aria-checked': k === mode, onclick: () => { try { localStorage.setItem('shd.worksMode', k); } catch (_) { } renderView(r); } }, l)));
  view.append(h('section', { class: 'works-head' }, h('h2', null, mode === 'edit' ? 'THE EDIT' : 'ALL WORKS'), h('p', null, `${list.length} files · ${mode === 'edit' ? 'sit back — or tap anything to step inside' : 'tap any ticket to step inside'}`), modes), chips);
  if (mode === 'tickets') {
    keyNav = e => { if (e.key === 'Escape') location.hash = '#/'; };
    view.append(h('div', { class: 'tickets' }, list.map((a, i) => {
      const c = colOf(a.col);
      return h('button', { class: 'ticket', style: `--i:${i}`, onclick: () => location.hash = `#/work/${a.id}`, 'aria-label': `View ${a.title}` },
        h('span', { class: 't-top' }, h('span', null, 'SHEDITHERS ARCHIVE'), h('span', null, c.code)),
        h('span', { class: 't-window' }, artNode(a)),
        h('span', { class: 't-place' }, h('span', null, a.medium.toUpperCase()), h('span', null, a.date.slice(0, 4))),
        h('span', { class: 't-title' }, a.title),
        h('span', { class: 't-stub' }, h('span', { class: 't-eye', html: '<svg viewBox="0 0 48 28"><use href="#eye"/></svg>' }), h('span', { class: 't-admit' }, h('b', null, 'ADMIT ONE'), h('small', null, `FILE 0x${pad(a.n)} · VIEW ONLY · ${c.name}`)), h('span', { class: 't-no' }, `№${pad(a.n, 3)}`)));
    })));
    return;
  }
  /* --- the montage screen --- */
  const stage = h('div', { class: 'edit-stage', role: 'button', tabindex: '0', 'aria-label': 'Open the piece on screen' }), cap = h('div', { class: 'edit-cap', 'aria-live': 'polite' });
  const tc = h('span', { class: 'edit-tc' }, '00:00:00'), cnt = h('span', { class: 'edit-cnt' }), dots = h('div', { class: 'edit-dots' });
  const playB = h('button', { class: 'edit-btn', 'aria-label': 'Pause or play the edit' }, '❚❚');
  const screen = h('div', { class: 'edit-screen' }, h('div', { class: 'edit-hud' }, h('span', { class: 'rec' }, '● REC'), h('span', null, 'THE EDIT // SHEDITHERS'), tc), stage, cap,
    h('div', { class: 'edit-ctrl' }, h('button', { class: 'edit-btn', 'aria-label': 'Previous', onclick: () => go(-1) }, '‹'), playB, h('button', { class: 'edit-btn', 'aria-label': 'Next', onclick: () => go(1) }, '›'), cnt, dots));
  const SHOTS = ['cut', 'slide-l', 'split', 'cut', 'slide-r', 'triple', 'rise', 'cut', 'split', 'drop'];
  let k = 0, s = 0, playing = !reduce, t0 = performance.now();
  const pick = n => Array.from({ length: n }, (_, j) => list[(k + j) % list.length]);
  function shot() {
    if (!list.length) return; const type = SHOTS[s % SHOTS.length], n = type === 'split' ? 2 : type === 'triple' ? 3 : 1;
    const items = pick(Math.min(n, list.length)); stage.innerHTML = '';
    stage.className = 'edit-stage shot-' + type + ' n' + items.length;
    stage.append(h('i', { class: 'edit-flash' }), ...items.map((a, j) => h('span', { class: 'edit-cell', style: `--j:${j}` }, artNode(a, { lazy: false }))));
    stage.dataset.id = items[0].id;
    const a = items[0], words = a.words || '';
    cap.innerHTML = ''; cap.append(h('b', null, a.title), words ? h('span', { class: 'marker' }, '“' + words + '”') : h('span', null, `${colOf(a.col).code} · ${a.date}`));
    cnt.textContent = `${pad(k % list.length + 1)} / ${pad(list.length)}`;
    dots.innerHTML = ''; for (let j = 0; j < Math.min(list.length, 24); j++) dots.append(h('i', { class: j === k % Math.min(list.length, 24) ? 'on' : '' }));
    watchVideos(stage); k = (k + items.length) % list.length; s++;
    const nxt = list[k % list.length]; if (nxt && nxt.type !== 'video') { const pre = new Image(); pre.src = nxt.src; }
  }
  function loop() {
    clearTimeout(editTimer); if (!document.body.contains(stage)) return;
    const music = window.SHD_ARCHIVE && SHD_ARCHIVE.player && !SHD_ARCHIVE.player.audio.paused;
    const base = /split|triple/.test(stage.className) ? 2600 : 1900, dur = music ? base * 0.62 : base;
    if (playing) { shot(); editTimer = setTimeout(loop, dur); }
  }
  function go(d) { if (d < 0) k = (k - 2 + list.length * 4) % list.length; shot(); if (playing) { clearTimeout(editTimer); editTimer = setTimeout(loop, 2400); } }
  function setPlay(p) { playing = p; playB.textContent = p ? '❚❚' : '▶'; if (p) loop(); else clearTimeout(editTimer); }
  playB.onclick = () => setPlay(!playing);
  const open = () => { const id = stage.dataset.id; if (id) location.hash = `#/work/${id}`; };
  stage.addEventListener('click', open); stage.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  swipe(stage, dx => go(dx < 0 ? 1 : -1));
  keyNav = e => { if (e.key === 'Escape') location.hash = '#/'; else if (e.key === ' ') { e.preventDefault(); setPlay(!playing); } else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); };
  setInterval(() => { if (document.body.contains(tc)) { const sec = Math.floor((performance.now() - t0) / 1000); tc.textContent = `00:${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`; } }, 500);
  /* --- drifting rows of pieces (tap to open) --- */
  const rows = h('div', { class: 'edit-rows' });
  const third = Math.ceil(list.length / 3);
  [0, 1, 2].forEach(ri => {
    let part = list.slice(ri * third, ri * third + third); if (part.length < 4) part = list.slice(0, Math.min(list.length, 8));
    const tiles = part.map(a => h('button', { class: 'edit-tile', onclick: () => location.hash = `#/work/${a.id}`, 'aria-label': `View ${a.title}` }, h('span', { class: 'et-win' }, artNode(a)), h('span', { class: 'et-cap' }, a.title)));
    const track = h('div', { class: 'edit-track', style: `--dur:${40 + ri * 12}s` }, ...tiles, ...tiles.map(t => { const c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; const id = part[tiles.indexOf(t)].id; c.onclick = () => location.hash = `#/work/${id}`; $$('img,video', c).forEach(guard); return c; }));
    rows.append(h('div', { class: 'edit-row' + (ri % 2 ? ' rev' : '') }, track));
  });
  view.append(screen, rows);
  shot(); if (playing) editTimer = setTimeout(loop, 1900); else playB.textContent = '▶';
}

/* ---------- ABOUT ---------- */
function viewAbout() {
  setHint([['ESC BACK', () => location.hash = '#/']]); keyNav = e => { if (e.key === 'Escape') location.hash = '#/'; };
  const link = (ok, label, href) => ok ? h('a', { class: 'stamp', href, target: '_blank', rel: 'noopener' }, label) : null;
  const tt = String(CFG.tiktok || '').replace(/^@/, ''), yt = String(CFG.youtube || '').replace(/^@/, ''), cash = String(CFG.cashapp || '').replace(/^\$/, '');
  const rb = String(CFG.redbubble || '').trim(), mail = String(CFG.email || '').trim();
  // a poem cut out of my own pieces: every line is words from the art
  const POEM = [
    'i look prettier in fragments', 'so click to be saved', 'click to forgive', 'you keep forgetting',
    'people are either trauma or checkpoints', 'and when it’s all over', 'who will you be?',
    'i stand alone', 'but i’m not lonely', 'are we alive yet?', 'become unmarketable',
    'dreams aren’t dreams', 'dream without action is hallucination', 'when you rain you pour',
    'i’m sorry i’m sorry again', 'shedithers loves you'];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const FONTS = ['f-bebas', 'f-type', 'f-marker', 'f-hand', 'f-mono', 'f-serif'], INKS = ['k-paper', 'k-black', 'k-red', 'k-news', 'k-paper', 'k-black'];
  const poem = h('div', { class: 'cutup', 'aria-label': POEM.join(' / ') }, POEM.map((line, li) => h('div', { class: 'cu-line', 'aria-hidden': 'true', style: `margin-left:${Math.round(rnd() * 14)}%` },
    line.split(' ').map(w => h('span', { class: `cu ${FONTS[Math.floor(rnd() * FONTS.length)]} ${INKS[Math.floor(rnd() * INKS.length)]}${w === 'sorry' && li === 14 && rnd() > .2 ? ' strike' : ''}`, style: `--r:${(rnd() * 8 - 4).toFixed(1)}deg;--s:${(0.85 + rnd() * 0.6).toFixed(2)}` }, w)))));
  const KINDS = [['digital collage', true], ['mixed media drawing', true], ['moving image', true], ['dithered video + static', true], ['handwriting', true], ['little object studies', true], ['ordinary', false]];
  // suggestion box, right here (same inbox as the Dither Lab's)
  let kind = 'idea', lastSent = 0;
  const msg = h('textarea', { class: 'sb-msg', maxLength: 2000, placeholder: 'tell me what u want next. ideas, bugs, love notes, collabs…', 'aria-label': 'Your message' });
  const who = h('input', { class: 'sb-in', maxLength: 60, placeholder: 'your name (optional)', 'aria-label': 'Your name' });
  const reply = h('input', { class: 'sb-in', type: 'email', maxLength: 120, placeholder: 'email, only if u want a reply', 'aria-label': 'Your email' });
  const honey = h('input', { type: 'text', tabindex: '-1', autocomplete: 'off', class: 'sb-honey', 'aria-hidden': 'true' });
  const sbStatus = h('p', { class: 'sb-status', role: 'status' });
  const kinds = h('div', { class: 'sb-kinds' }, ['idea', 'bug', 'love note', 'collab'].map((k, i) => h('button', { type: 'button', class: i ? '' : 'on', 'aria-pressed': i ? 'false' : 'true', onclick: e => { kind = k; [...kinds.children].forEach(b => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', b === e.currentTarget); }); } }, k)));
  const sendBtn = h('button', { type: 'button', class: 'sb-send', onclick: async () => {
    const text = msg.value.trim(); if (text.length < 3) { msg.focus(); sbStatus.textContent = 'write me something first'; return; }
    if (honey.value) return; if (Date.now() - lastSent < 45000) { sbStatus.textContent = 'got it ♥ give it a sec before sending another'; return; }
    if (reply.value && !reply.checkValidity()) { reply.focus(); sbStatus.textContent = 'that email looks off. fix it or leave it blank'; return; }
    sendBtn.disabled = true; sbStatus.textContent = 'sending…';
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(mail), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: `SHEDITHERS ${kind} ♥ (archive)`, _template: 'table', _captcha: 'false', type: kind, message: text, name: who.value || '', email: reply.value || '' }) });
      const j = await r.json().catch(() => ({})); if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'HTTP ' + r.status);
      lastSent = Date.now(); msg.value = ''; sbStatus.textContent = 'sent. i read every single one ♥';
    } catch (e) { sbStatus.innerHTML = ''; sbStatus.append('couldn’t send that one. ', h('a', { href: `mailto:${mail}?subject=${encodeURIComponent('SHEDITHERS ' + kind)}&body=${encodeURIComponent(msg.value)}` }, 'email it to me instead ▸')); }
    sendBtn.disabled = false;
  } }, 'send it ▸');
  const ticket = (ok, label, sub, href, cls, ext) => ok ? h('a', { class: 'tkt ' + (cls || ''), href, target: ext === false ? null : '_blank', rel: ext === false ? null : 'noopener' }, h('b', null, label), h('small', null, sub)) : null;
  view.append(h('section', { class: 'about' },
    h('div', { class: 'about-card' }, h('i', { class: 'tape a' }), h('i', { class: 'tape b' }),
      h('div', { class: 'about-code' }, 'FILE_00 // WHO MADE THIS'), h('h2', null, 'SHEDITHERS'),
      h('div', { class: 'bio' },
        h('p', { class: 'bio-hi' }, 'hi. it’s me.'),
        h('p', null, 'i cut things up and put them back together wrong on purpose. collage, drawings, signals, moving pictures, dithered static, handwriting on whatever’s closest.'),
        h('p', null, 'i don’t want ordinary. ', h('s', null, 'it’s not'), ' it was never in my nature.'),
        h('p', null, 'becoming and unbecoming so i can become who i always have been and never was. this archive is the proof.')),
      h('h3', { class: 'ab-h' }, 'a poem made out of my pieces', h('small', null, 'every word here came off one of my artworks')),
      poem,
      h('h3', { class: 'ab-h' }, 'what i make'),
      h('ul', { class: 'kinds' }, KINDS.map(([k, yes]) => h('li', { class: yes ? 'yes' : 'no' }, h('i', null, yes ? '✗' : ''), k))),
      h('h3', { class: 'ab-h' }, 'find me'),
      h('div', { class: 'tkts' },
        ticket(tt, '♪ tiktok', '@' + tt, `https://www.tiktok.com/@${tt}`, 'red'),
        ticket(yt, '▶ youtube', '@' + yt, `https://www.youtube.com/@${yt}`),
        ticket(mail, '✉ email', mail, `mailto:${mail}`),
        ticket(cash, '$ cash app', '$' + cash, `https://cash.app/$${cash}`, 'red'),
        ticket(rb, '★ stickers + prints', 'redbubble', `https://www.redbubble.com/people/${rb}/shop`),
        ticket(true, '▣ the dither lab', 'make your own', 'index.html', 'paper', false)),
      h('div', { class: 'ab-tip' },
        h('div', null, h('h3', { class: 'ab-h' }, 'tip jar'), h('p', null, CFG.tipLine || 'buy me a drink ♥')),
        h('button', { type: 'button', class: 'ab-tip-btn', onclick: () => window.SHD_DRINK && window.SHD_DRINK() }, '🍹 buy me a drink')),
      mail ? h('div', { class: 'sbox' }, h('h3', { class: 'ab-h' }, 'suggestion box', h('small', null, 'straight to me. i read every one')), honey, kinds, msg, h('div', { class: 'sb-row' }, who, reply), h('div', { class: 'sb-row' }, sbStatus, sendBtn)) : null,
      h('p', { class: 'rights' }, 'all art © shedithers. look as long as u want. just don’t download it, edit it, sell it, or feed it to AI. it’s mine ♥'))));
}

/* ---------- hint bar (game-style controls, all tappable) ---------- */
let keyNav = null;
function setHint(items) { hint.innerHTML = ''; items.forEach(([label, fn]) => hint.append(fn ? h('button', { onclick: fn }, label) : h('span', null, label))); }
document.addEventListener('keydown', e => { if (!viewer.hidden) return vKey(e); if (e.target.matches('input,textarea')) return; keyNav && keyNav(e); });

/* ---------- swipe helper ---------- */
function swipe(el, fn) { let sx = null, sy = 0; el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true }); el.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) fn(dx); sx = null; }, { passive: true }); }

/* ---------- VIEWER: the light table ---------- */
const viewer = $('#viewer'), vMat = $('#vMat'), vLog = $('#vLog'), vStage = $('#vStage'), vStrip = $('#vStrip');
let vList = ARTWORKS, vIdx = 0, lastFocus = null;
function openViewer(id) {
  const a = artById(id); if (!a) return;
  vList = route.name === 'col' ? worksIn(route.id || a.col) : ARTWORKS; if (!vList.includes(a)) vList = ARTWORKS;
  vIdx = vList.indexOf(a);
  if (viewer.hidden) { lastFocus = document.activeElement; viewer.hidden = false; document.body.classList.add('locked'); requestAnimationFrame(() => viewer.classList.add('in')); buildStrip(); }
  showWork();
}
function buildStrip() { vStrip.innerHTML = ''; vList.forEach((a, i) => vStrip.append(h('button', { 'aria-label': a.title, onclick: () => { vIdx = i; showWork(); } }, artNode(a, { autoplay: false })))); }
function showWork() {
  const a = vList[vIdx], c = colOf(a.col);
  vMat.classList.remove('show'); void vMat.offsetWidth; vMat.innerHTML = ''; vMat.append(artNode(a, { lazy: false, controls: a.type === 'video' })); vMat.classList.add('show');
  $('#vFile').textContent = `FILE 0x${pad(a.n)} / ${pad(ARTWORKS.length)} · READ-ONLY`;
  vLog.innerHTML = ''; vLog.append(...[h('div', { class: 'log-head' }, 'ARCHIVE LOG'), h('h3', null, a.title),
    h('dl', null, h('dt', null, 'COLLECTION'), h('dd', null, `${c.code} // ${c.name}`), h('dt', null, 'MEDIUM'), h('dd', null, a.medium), h('dt', null, 'LOGGED'), h('dd', null, a.date), a.w ? h('dt', null, 'SIZE') : null, a.w ? h('dd', null, `${a.w} × ${a.h} px`) : null),
    a.words ? h('p', { class: 'words' }, '“' + a.words + '”') : null, h('p', { class: 'rights' }, 'View only · © SHEDITHERS')].filter(Boolean));
  $$('button', vStrip).forEach((b, i) => b.classList.toggle('on', i === vIdx)); const on = $$('button', vStrip)[vIdx]; on && on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', `#/work/${a.id}`); setDetail(false);
}
function closeViewer(silent) {
  if (viewer.hidden) return; viewer.classList.remove('in'); document.body.classList.remove('locked');
  setTimeout(() => { viewer.hidden = true; vMat.innerHTML = ''; }, reduce ? 0 : 280);
  if (!silent) history.replaceState(null, '', route.name === 'col' ? `#/col/${route.id}` : route.name === 'works' ? '#/works' : route.name === 'about' ? '#/about' : '#/');
  lastFocus && lastFocus.focus && lastFocus.focus();
}
const step = d => { vIdx = (vIdx + d + vList.length) % vList.length; showWork(); };
function setDetail(on) { viewer.classList.toggle('detail', on); $('#vDetail').setAttribute('aria-pressed', on); if (on) vStage.scrollTo((vStage.scrollWidth - vStage.clientWidth) / 2, (vStage.scrollHeight - vStage.clientHeight) / 2); }
function vKey(e) { if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); else if (e.key.toLowerCase() === 'i') $('#vInfo').click(); else if (e.key.toLowerCase() === 'd') setDetail(!viewer.classList.contains('detail')); else return; e.preventDefault(); }
$('#vClose').onclick = () => closeViewer(); $('#vPrev').onclick = () => step(-1); $('#vNext').onclick = () => step(1);
$('#vInfo').onclick = e => { const on = viewer.classList.toggle('noinfo'); e.currentTarget.setAttribute('aria-pressed', !on); };
$('#vDetail').onclick = () => setDetail(!viewer.classList.contains('detail'));
vStage.addEventListener('dblclick', () => setDetail(!viewer.classList.contains('detail')));
swipe(vStage, dx => { if (!viewer.classList.contains('detail')) step(dx < 0 ? 1 : -1); });

/* ---------- mobile nav ---------- */
const navBtn = $('#navBtn'), nav = $('#nav');
function closeNav() { nav.classList.remove('open'); navBtn.setAttribute('aria-expanded', 'false'); }
navBtn.onclick = () => { const o = nav.classList.toggle('open'); navBtn.setAttribute('aria-expanded', o); };

/* ---------- gate ---------- */
const gate = $('#gate');
function enter() { gate.classList.add('gone'); document.body.classList.add('entered'); try { sessionStorage.setItem('shd.archive.in', '1'); } catch (_) { } setTimeout(() => gate.remove(), reduce ? 0 : 900); }
(function gateIntro() {
  let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1'; } catch (_) { }
  if (seen || /^#\/work\//.test(location.hash)) { gate.remove(); document.body.classList.add('entered'); return; }
  const lines = ['OPENING ARCHIVE_01 …', `${ARTWORKS.length} FILES FOUND · READ-ONLY`, 'TAPE + PAPER + STATIC …… OK', 'IDENTITY CHECK …… ERROR: NO IDENTITY'];
  lines.forEach((l, i) => setTimeout(() => $('#gateLog') && $('#gateLog').append(h('div', null, '> ' + l)), 300 + i * 380));
  $('#enter').onclick = enter; gate.addEventListener('keydown', e => { if (e.key === 'Enter') enter(); });
  setTimeout(() => $('#enter') && $('#enter').focus(), 50);
})();

/* ---------- MUSIC PLAYER: local files only, nothing uploaded ---------- */
const player = (() => {
  const el = $('#player'), audio = new Audio(), list = [], fileIn = $('#pFiles'); let idx = -1, shuffle = false, repeat = 'off', ctx = null, an = null, raf = 0;
  audio.preload = 'metadata'; audio.volume = 0.8;
  const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}` : '0:00';
  const expand = () => { el.classList.remove('mini'); el.classList.add('full'); }, collapse = () => { el.classList.add('mini'); el.classList.remove('full'); };
  async function add(files) {
    const aud = Array.from(files).filter(f => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|weba)$/i.test(f.name)); if (!aud.length) return;
    for (const f of aud) { const t = { file: f, url: URL.createObjectURL(f), title: f.name.replace(/\.[^.]+$/, ''), artist: '', album: '', cover: null }; list.push(t); readTags(f).then(m => { Object.assign(t, m); drawList(); if (list[idx] === t) showNow(); }); }
    drawList(); if (idx < 0) load(0, true); expand();
  }
  function load(i, play) {
    if (!list.length) return; idx = (i + list.length) % list.length; audio.src = list[idx].url; showNow(); drawList();
    if (play) audio.play().catch(() => { });
  }
  function next(auto) { if (!list.length) return; if (repeat === 'one' && auto) { audio.currentTime = 0; audio.play(); return; } if (shuffle && list.length > 1) { let j; do j = Math.floor(Math.random() * list.length); while (j === idx); return load(j, true); } if (idx === list.length - 1 && auto && repeat === 'off') { audio.pause(); return; } load(idx + 1, true); }
  function prev() { if (audio.currentTime > 3) audio.currentTime = 0; else load(idx - 1, true); }
  function toggle() { if (!list.length) { fileIn.click(); return; } if (audio.paused) audio.play().catch(() => { }); else audio.pause(); }
  function showNow() {
    const t = list[idx]; if (!t) return;
    $('#pTitle').textContent = t.title; $('#pArtist').textContent = [t.artist, t.album].filter(Boolean).join(' — ') || 'from your device';
    $('#pMiniInfo').innerHTML = ''; $('#pMiniInfo').append(h('b', null, t.title), h('span', null, t.artist || 'now playing'));
    const cv = $('#pCover'); cv.innerHTML = ''; cv.append(t.cover ? h('img', { src: t.cover, alt: '' }) : h('span', { html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }));
    if ('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist || '', album: t.album || 'SHEDITHERS ARCHIVE', artwork: t.cover ? [{ src: t.cover }] : [] }); }
  }
  function drawList() { const ol = $('#pList'); ol.innerHTML = ''; list.forEach((t, i) => ol.append(h('li', { class: i === idx ? 'on' : '' }, h('button', { onclick: () => load(i, true) }, h('b', null, t.title), h('span', null, t.artist || ''))))); }
  function setIcons() { const p = audio.paused; $('#pPlay').textContent = p ? '▶' : '❚❚'; $('#pMiniPlay').textContent = p ? '▶' : '❚❚'; el.classList.toggle('playing', !p); }
  function viz() {
    const cv = $('#pViz'), cx = cv.getContext('2d'); cancelAnimationFrame(raf);
    const draw = () => { raf = requestAnimationFrame(draw); cx.clearRect(0, 0, 60, 24); if (!an || audio.paused) { for (let i = 0; i < 10; i++) { cx.fillStyle = '#5a5648'; cx.fillRect(i * 6, 22, 4, 2); } cancelAnimationFrame(raf); raf = 0; return; } const d = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(d); for (let i = 0; i < 10; i++) { const v = d[2 + i * 3] / 255, hh = Math.max(2, v * 24); cx.fillStyle = i % 3 === 0 ? '#ff4fa3' : '#d4ff00'; cx.fillRect(i * 6, 24 - hh, 4, hh); } };
    draw();
  }
  function ensureAudioGraph() { if (ctx || !window.AudioContext) return; try { ctx = new AudioContext(); const src = ctx.createMediaElementSource(audio); an = ctx.createAnalyser(); an.fftSize = 64; src.connect(an); an.connect(ctx.destination); } catch (_) { ctx = null; an = null; } }
  audio.addEventListener('play', () => { ensureAudioGraph(); ctx && ctx.resume(); setIcons(); viz(); });
  audio.addEventListener('pause', setIcons); audio.addEventListener('ended', () => next(true));
  audio.addEventListener('timeupdate', () => { $('#pCur').textContent = fmt(audio.currentTime); $('#pDur').textContent = fmt(audio.duration); if (!seeking) $('#pSeek').value = audio.duration ? audio.currentTime / audio.duration * 1000 : 0; });
  let seeking = false; const sk = $('#pSeek'); sk.addEventListener('input', () => { seeking = true; }); sk.addEventListener('change', () => { if (audio.duration) audio.currentTime = sk.value / 1000 * audio.duration; seeking = false; });
  $('#pVol').addEventListener('input', e => audio.volume = e.target.value / 100);
  $('#pPlay').onclick = toggle; $('#pMiniPlay').onclick = toggle; $('#pNext').onclick = () => next(false); $('#pPrev').onclick = prev;
  $('#pShuffle').onclick = e => { shuffle = !shuffle; e.currentTarget.setAttribute('aria-pressed', shuffle); };
  $('#pRepeat').onclick = e => { repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'; e.currentTarget.setAttribute('aria-pressed', repeat !== 'off'); e.currentTarget.textContent = repeat === 'one' ? '↻1' : '↻'; };
  $('#pAdd').onclick = () => fileIn.click(); fileIn.onchange = () => { add(fileIn.files); fileIn.value = ''; };
  $('#pExpand').onclick = expand; $('#pCollapse').onclick = collapse; $('#pMiniInfo').onclick = () => list.length ? expand() : fileIn.click();
  document.addEventListener('dragover', e => { if (Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault(); });
  document.addEventListener('drop', e => { if (!e.dataTransfer.files.length) return; e.preventDefault(); add(e.dataTransfer.files); });
  if ('mediaSession' in navigator) { const ms = navigator.mediaSession; ms.setActionHandler('play', toggle); ms.setActionHandler('pause', toggle); ms.setActionHandler('nexttrack', () => next(false)); ms.setActionHandler('previoustrack', prev); }
  setIcons(); viz();
  return { expand, collapse, add, audio, list };
})();

/* ---------- ID3 tags (title / artist / album / cover) read locally ---------- */
async function readTags(file) {
  const out = {}; try {
    const buf = new Uint8Array(await file.slice(0, 1 << 20).arrayBuffer());
    if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return out;
    const ver = buf[3], size = (buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]; let p = 10; const end = Math.min(buf.length, size + 10);
    const txt = (b, enc) => { try { if (enc === 0) return new TextDecoder('latin1').decode(b); if (enc === 1) return new TextDecoder('utf-16').decode(b); if (enc === 2) return new TextDecoder('utf-16be').decode(b); return new TextDecoder('utf-8').decode(b); } catch (_) { return ''; } };
    const clean = s => s.replace(/\0+$/g, '').replace(/\0/g, ' ').trim();
    while (p < end - 10) {
      const id = ver === 2 ? String.fromCharCode(buf[p], buf[p + 1], buf[p + 2]) : String.fromCharCode(buf[p], buf[p + 1], buf[p + 2], buf[p + 3]); if (!/^[A-Z0-9]{3,4}$/.test(id)) break;
      let len, hd; if (ver === 2) { len = (buf[p + 3] << 16) | (buf[p + 4] << 8) | buf[p + 5]; hd = 6; } else { len = ver === 4 ? ((buf[p + 4] << 21) | (buf[p + 5] << 14) | (buf[p + 6] << 7) | buf[p + 7]) : ((buf[p + 4] << 24) | (buf[p + 5] << 16) | (buf[p + 6] << 8) | buf[p + 7]); hd = 10; }
      const d = buf.subarray(p + hd, p + hd + len); p += hd + len; if (!len) break;
      if (id === 'TIT2' || id === 'TT2') out.title = clean(txt(d.subarray(1), d[0]));
      else if (id === 'TPE1' || id === 'TP1') out.artist = clean(txt(d.subarray(1), d[0]));
      else if (id === 'TALB' || id === 'TAL') out.album = clean(txt(d.subarray(1), d[0]));
      else if ((id === 'APIC' || id === 'PIC') && !out.cover) {
        const enc = d[0]; let q = 1, mime = 'image/jpeg';
        if (id === 'APIC') { let m = q; while (d[m] !== 0 && m < d.length) m++; mime = new TextDecoder('latin1').decode(d.subarray(q, m)) || mime; q = m + 1; } else { q = 4; }
        q++; if (enc === 1 || enc === 2) { while (q < d.length - 1 && !(d[q] === 0 && d[q + 1] === 0)) q += 2; q += 2; } else { while (q < d.length && d[q] !== 0) q++; q++; }
        out.cover = URL.createObjectURL(new Blob([d.subarray(q)], { type: mime.includes('/') ? mime : 'image/' + mime.toLowerCase() }));
      }
    }
  } catch (_) { } return out;
}

/* ---------- hooks for the immersive layer (archive-plus.js) ---------- */
window.SHD_ARCHIVE = { player, openViewer, step: d => step(d), getRoute: () => route, viewer };

/* ---------- boot ---------- */
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (route.name === 'col') renderView(route); }, 250); });
render();
})();
