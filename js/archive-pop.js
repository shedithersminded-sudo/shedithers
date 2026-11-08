/* SHEDITHERS — pop layer: CD intro + spinning CD, seal badge and NEW ART folder on the home page.
 * Uses the artist's work as design (CSS backgrounds only — nothing visitors can save). */
(() => {
'use strict';
const absU = u => new URL(u, location.href).href;
const $ = (s, r = document) => r.querySelector(s);
const IM = ARTWORKS.filter(a => a.type !== 'video');
const pick = () => IM[Math.floor(Math.random() * IM.length)];
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }

/* ---- intro: the CD label is cut from the artist's work ---- */
const gate = $('#gate');
if (gate) {
  const a = ARTWORKS.find(x => x.id === 'no-identity') || pick(), b = pick();
  gate.style.setProperty('--pg-art', `url('${absU(a.src)}')`); gate.style.setProperty('--pg-art2', `url('${absU(b.src)}')`);
  const go = () => gate.classList.add('pg-launch');
  $('#enter') && $('#enter').addEventListener('click', go, true);
  gate.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }, true);
  document.addEventListener('keydown', e => { if (document.body.contains(gate) && !gate.classList.contains('gone') && !e.metaKey && !e.ctrlKey && e.key.length === 1) { go(); setTimeout(() => $('#enter') && $('#enter').click(), 60); } });
}

/* ---- home page: CD + seal + NEW ART folder row ---- */
const SEAL = `<svg viewBox="0 0 200 200"><defs><path id="sealP2" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs><circle cx="100" cy="100" r="96" fill="#f4f1ea" stroke="#111" stroke-width="3"/><circle cx="100" cy="100" r="64" fill="none" stroke="#111" stroke-width="2"/><text font-family="Georgia,serif" font-size="17" font-weight="700" letter-spacing="3" fill="#111"><textPath href="#sealP2">SHEDITHERS ★ NOT ORDINARY ★ VIEW ONLY ★ </textPath></text></svg>`;
function addPop() {
  const P = $('.portal'); if (!P || $('.p-pop', P)) return;
  const A = window.SHD_ARCHIVE, label = pick(), label2 = pick();
  const newest = IM.slice().sort((x, y) => y.date.localeCompare(x.date)).slice(0, 3);
  const cd = h('button', { class: 'pp-cd', style: `--cd-art:url('${absU(label.src)}');--cd-art2:url('${absU(label2.src)}')`, 'aria-label': 'Open the music player' }, h('i', { class: 'pp-shine' }), h('span', { class: 'pp-vert' }, 'NOW', h('br'), 'SPINNING'), h('i', { class: 'pp-hub' }), h('i', { class: 'pp-hole' }));
  cd.onclick = () => { if (!A) return; A.player.expand(); if (A.player.list.length && A.player.audio.paused) A.player.audio.play().catch(() => { }); };
  if (A) { A.player.audio.addEventListener('play', () => cd.classList.add('spin-fast')); A.player.audio.addEventListener('pause', () => cd.classList.remove('spin-fast')); if (!A.player.audio.paused) cd.classList.add('spin-fast'); }
  const seal = h('div', { class: 'pp-seal', 'aria-hidden': 'true' }, h('span', { class: 'pp-seal-ring', html: SEAL }), h('span', { class: 'pp-pix', html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }), h('span', { class: 'pp-stars' }, '★★★★★★★'));
  const folder = h('div', { class: 'pp-folder' }, h('span', { class: 'pg-bubble' }, 'NEW ART!'),
    h('div', { class: 'ppf-body' }, h('div', { class: 'ppf-row' }, newest.map(a => h('button', { class: 'ppf-thumb', style: `background-image:url('${absU(a.src)}')`, title: a.title, 'aria-label': `View ${a.title}`, onclick: () => location.hash = `#/work/${a.id}` }))),
      h('div', { class: 'ppf-name' }, 'shedithers', h('small', null, 'fresh files · ' + newest[0].date))),
    h('span', { class: 'pg-cable', 'aria-hidden': 'true' }, h('i')));
  P.insertBefore(h('section', { class: 'p-mod p-pop' }, h('div', { class: 'p-head' }, h('small', null, 'ナウ・スピニング'), h('b', null, 'NOW SPINNING'), h('span', null, 'TAP THE DISC FOR MUSIC')), h('div', { class: 'pp-row' }, cd, seal, folder)), $('.p-foot', P));
}
const view = $('#view');
if (view) { new MutationObserver(() => addPop()).observe(view, { childList: true }); addPop(); }
})();
