/* SHEDITHERS — old computer screens, in the archive's colours.
 * 1. FILE DIRECTORY on the home page: a green-screen style file menu (in blood red) listing every work.
 * 2. RELEASE INFORMATION: a BBS / .nfo style card under the archive log on every work page. */
(() => {
'use strict';
if (typeof ARTWORKS === 'undefined') return;
const $ = (s, r = document) => r.querySelector(s);
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colOf = id => (typeof COLLECTIONS !== 'undefined' && COLLECTIONS.find(c => c.id === id)) || { name: '', sub: '' };
const kindOf = a => a.type === 'video' ? 'Motion' : { collage: 'Collage', drawing: 'Drawing', signal: 'Signal', motion: 'Motion', objects: 'Object' }[a.col] || 'File';
const ext = a => (a.file.match(/\.(\w+)$/) || [, ''])[1].toLowerCase();
const nice = d => { const [y, m, dd] = d.split('-'); return `${MON[+m - 1]} ${+dd}, ${y}`; };
// A to Z, with titles that start with a number at the end
const works = ARTWORKS.slice().sort((x, y) => (/^\d/.test(x.title) - /^\d/.test(y.title)) || x.title.localeCompare(y.title));

/* ---------- 1. FILE DIRECTORY ---------- */
function clock() { const d = new Date(); let hr = d.getHours(); const ap = hr < 12 ? 'am' : 'pm'; hr = hr % 12 || 12; return [`${d.getDate()}-${MON[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`, `${hr}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`]; }
let tick = 0;
function addDir() {
  const P = $('.portal'); if (!P || $('.nd', P)) return;
  let sel = 0;
  const [dd, tt] = clock(), date = h('span', null, dd), time = h('span', null, tt);
  clearInterval(tick); tick = setInterval(() => { if (!date.isConnected) return clearInterval(tick); const [a, b] = clock(); date.textContent = a; time.textContent = b; }, 15000);
  const rows = works.map((a, i) => h('li', { role: 'option', 'aria-selected': 'false', onmouseenter: () => pick(i, false), onclick: () => go(i) }, h('span', null, a.title.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase())), h('span', null, kindOf(a))));
  const list = h('ol', { class: 'nd-list', role: 'listbox', tabindex: '0', 'aria-label': 'Every file in the archive. Arrow keys to move, Enter to open.' }, rows);
  const f = { sub: h('span'), title: h('span', { class: 'nd-box' }), kind: h('span'), words: h('span') };
  const fields = h('div', { class: 'nd-fields' },
    h('span', null, 'Device'), h('span', null, 'SHEDITHERS Archive'),
    h('span', null, 'Subject'), f.sub, h('span', null, 'Title'), f.title, h('span', null, 'Kind'), f.kind,
    h('span', null, 'Password'), h('span', null, '********'));
  function pick(i, scroll) {
    sel = (i + works.length) % works.length; const a = works[sel], c = colOf(a.col);
    rows.forEach((r, k) => { r.classList.toggle('on', k === sel); r.setAttribute('aria-selected', k === sel); });
    f.sub.textContent = c.name ? c.name.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase()) : '—'; f.title.textContent = a.title; f.kind.textContent = `${kindOf(a)} · .${ext(a)}`;
    if (scroll) { const r = rows[sel], top = r.offsetTop - list.offsetTop; if (top < list.scrollTop) list.scrollTop = top; else if (top + r.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + r.offsetHeight - list.clientHeight; }
  }
  const go = i => { pick(i, false); location.hash = `#/work/${works[sel].id}`; };
  list.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); pick(sel + (e.key === 'ArrowDown' ? 1 : -1), true); }
    else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
  });
  const scr = h('div', { class: 'nd-scr' },
    h('div', { class: 'nd-top' }, date, time), list, fields,
    h('div', { class: 'nd-foot' }, h('span', null, 'Select a file and confirm'), h('span', null, `Or press ENTER to open · ${works.length} files`)));
  const mod = h('section', { class: 'p-mod nd' }, h('div', { class: 'p-head' }, h('small', null, 'ファイル'), h('b', null, 'FILE DIRECTORY'), h('span', null, 'HOVER · ARROW KEYS · CLICK TO OPEN')), h('div', { class: 'nd-crt' }, scr));
  pick(0, false);
  const anchor = $('.p-pop', P) || $('.p-foot', P); P.insertBefore(mod, anchor);
}

/* ---------- 2. RELEASE INFORMATION (.nfo) ---------- */
const row = (k, v) => h('div', { class: 'nf-row' }, h('span', { class: 'nf-k' }, k), h('span', { class: 'nf-v' }, '[ ', h('b', null, v), ' ]'));
function nfo(a) {
  const c = colOf(a.col), boxes = ['collage', 'drawing', 'signal', 'motion', 'objects'];
  return h('div', { class: 'nf', 'aria-label': 'Release information' },
    h('div', { class: 'nf-logo', 'aria-hidden': 'true' }, 'S h e d i t h e r S'),
    h('div', { class: 'nf-bar' }, '── RELEASE INFORMATION ──'),
    h('p', { class: 'nf-pres' }, '·· SHEDITHERS proudly presents ··'),
    row('File Name', a.file), row('Title', a.title),
    h('div', { class: 'nf-split' }, row('Released', nice(a.date)), row('Author', 'SHEDITHERS')),
    h('div', { class: 'nf-split' }, row('Medium', a.medium), row(a.w ? 'Size' : 'Kind', a.w ? `${a.w}×${a.h}` : kindOf(a))),
    a.words ? h('div', { class: 'nf-desc' }, h('span', { class: 'nf-k' }, 'Description'), h('p', null, a.words)) : null,
    h('div', { class: 'nf-row nf-sup' }, h('span', { class: 'nf-k' }, 'Collection'), h('span', { class: 'nf-v' }, boxes.map(b => h('i', { class: b === a.col ? 'on' : '' }, `[${b === a.col ? '■' : ' '}] ${b.toUpperCase()}`)))),
    h('p', { class: 'nf-more' }, 'More releases at the archive · view only · do not repost without credit'),
    h('div', { class: 'nf-copy' }, `── © SHEDITHERS 2025-${new Date().getFullYear()} ──`));
}
const vLog = $('#vLog');
function addNfo() {
  if (!vLog || $('.nf', vLog)) return; const id = (location.hash.match(/#\/work\/([^/]+)/) || [])[1], a = id && ARTWORKS.find(x => x.id === id); if (!a) return;
  const rights = $('.rights', vLog); rights ? vLog.insertBefore(nfo(a), rights) : vLog.append(nfo(a));
}
// the viewer may already be open when this script loads (direct link to a work), so check now too
if (vLog) { new MutationObserver(addNfo).observe(vLog, { childList: true }); addNfo(); }

const view = $('#view');
if (view) { new MutationObserver(addDir).observe(view, { childList: true }); addDir(); }
})();

/* ---------- TRACK button in the art viewer: blob tracking over the piece, in the house tracking style ---------- */
(() => {
  const info = document.getElementById('vInfo'); if (!info || !window.SHD_TRACKOVER) return;
  let on = false, cur = null; try { on = localStorage.getItem('shd.track') === '1'; } catch (_) { }
  const btn = document.createElement('button'); btn.className = 'v-btn v-track'; btn.type = 'button'; btn.title = 'Blob tracking over the piece';
  const paint = () => { btn.textContent = on ? '⌖ TRACKING' : '⌖ TRACK'; btn.setAttribute('aria-pressed', String(on)); };
  info.before(btn); paint();
  const run = a => { if (cur) { cur.stop(); cur = null; } if (!on || !a || a.type === 'video') return; const img = document.querySelector('#vMat img'); if (img) cur = window.SHD_TRACKOVER(img, a.id); };
  let last = null; window.SHD_TRACK_ON = a => { last = a; run(a); };
  btn.addEventListener('click', () => { on = !on; try { localStorage.setItem('shd.track', on ? '1' : '0'); } catch (_) { } paint(); run(last); });
})();
