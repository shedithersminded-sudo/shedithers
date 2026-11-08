/* SHEDITHERS — "wanna collab?": a home-page block that lets people hit the artist up for a collab (form → the same inbox
 * as the suggestion box), plus a signal line of every place to find the work. window.SHD_COLLAB() opens the form anywhere. */
(() => {
'use strict';
if (typeof ARTWORKS === 'undefined') return;
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
const $ = (s, r = document) => r.querySelector(s);
const abs = u => new URL(u, location.href).href;
const art = id => { const a = ARTWORKS.find(z => z.id === id); return a ? `url('${abs(a.src)}')` : 'none'; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }
const mail = String(CFG.email || '').trim();
const tt = String(CFG.tiktok || 'shedithers').replace(/^@/, ''), yt = String(CFG.youtube || '').replace(/^@/, '');
const pin = String(CFG.pinterest || '').trim();
const cash = String(CFG.cashapp || '').replace(/^\$+/, '');

/* ---------- the form ---------- */
let modal = null;
function closeForm() { if (!modal) return; const m = modal; modal = null; m.classList.remove('in'); document.removeEventListener('keydown', esc, true); setTimeout(() => m.remove(), 250); }
function esc(e) { if (e.key === 'Escape') { e.stopPropagation(); closeForm(); } }
function openForm() {
  if (modal || !mail) return; window.shdCount && window.shdCount('collab-opened', 'Opened the collab form');
  let kind = 'music', lastSent = 0;
  const KINDS = ['music', 'clothes / merch', 'art / prints', 'video', 'a show / event', 'something weird'];
  const kinds = h('div', { class: 'cb-kinds', role: 'group', 'aria-label': 'What kind of collab' }, KINDS.map((k, i) => h('button', { type: 'button', class: i ? '' : 'on', 'aria-pressed': i ? 'false' : 'true', onclick: e => { kind = k; [...kinds.children].forEach(b => { const on = b === e.currentTarget; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); } }, k)));
  const who = h('input', { class: 'cb-in', maxLength: 60, placeholder: 'your name / @handle', 'aria-label': 'Your name or handle' });
  const reply = h('input', { class: 'cb-in', type: 'email', maxLength: 120, placeholder: 'your email (so i can write back)', 'aria-label': 'Your email', required: true });
  const msg = h('textarea', { class: 'cb-msg', maxLength: 2000, placeholder: 'what are we making? links to your stuff help ♥', 'aria-label': 'Your idea' });
  const honey = h('input', { type: 'text', tabindex: '-1', autocomplete: 'off', class: 'sb-honey', 'aria-hidden': 'true' });
  const status = h('p', { class: 'cb-status', role: 'status' });
  const send = h('button', { type: 'button', class: 'cb-send' }, h('span', null, 'send the signal'), h('i', null, '▸'));
  send.onclick = async () => {
    const text = msg.value.trim();
    if (!reply.value || !reply.checkValidity()) { reply.focus(); status.textContent = 'i need an email to write u back'; return; }
    if (text.length < 5) { msg.focus(); status.textContent = 'tell me the idea first'; return; }
    if (honey.value) return; if (Date.now() - lastSent < 45000) { status.textContent = 'got it ♥ give it a sec'; return; }
    send.disabled = true; status.textContent = 'transmitting…'; card.classList.add('sending');
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(mail), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: `SHEDITHERS collab ♥ ${kind}`, _template: 'table', _captcha: 'false', _replyto: reply.value, type: 'collab: ' + kind, message: text, name: who.value || '', email: reply.value }) });
      const j = await r.json().catch(() => ({})); if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'HTTP ' + r.status);
      lastSent = Date.now(); msg.value = ''; card.classList.add('sent'); status.textContent = 'signal received. i’ll hit u back ♥';
      window.shdCount && window.shdCount('collab-sent', 'Sent a collab request');
    } catch (e) {
      status.innerHTML = ''; status.append('the signal dropped. ', h('a', { href: `mailto:${mail}?subject=${encodeURIComponent('SHEDITHERS collab — ' + kind)}&body=${encodeURIComponent(text + (who.value ? '\n\n— ' + who.value : ''))}` }, 'email me instead ▸'));
    }
    card.classList.remove('sending'); send.disabled = false;
  };
  const x = h('button', { type: 'button', class: 'cb-x', 'aria-label': 'Close', onclick: closeForm }, '✕');
  const card = h('div', { class: 'cb-card', style: `--cb-art:${art('who-will-you-be')}` },
    h('i', { class: 'cb-art', 'aria-hidden': 'true' }), x,
    h('small', { class: 'cb-kana' }, 'コラボ'), h('h3', null, 'LET’S MAKE SOMETHING'),
    h('p', { class: 'cb-lede' }, 'not ordinary. not in my nature. if u make music, clothes, art, videos or something with no name yet, send it. i read every one.'),
    h('div', { class: 'cb-label' }, 'what kind?'), kinds, h('div', { class: 'cb-row' }, who, reply), msg, honey,
    h('div', { class: 'cb-row end' }, status, send));
  modal = h('div', { class: 'cb', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Collab request' }, card);
  modal.addEventListener('click', e => { if (e.target === modal) closeForm(); });
  document.body.append(modal); { const m = modal; requestAnimationFrame(() => m.classList.add('in')); } document.addEventListener('keydown', esc, true);
  setTimeout(() => who.focus({ preventScroll: true }), 60);
}
window.SHD_COLLAB = openForm;

/* ---------- the home block ---------- */
const STOPS = [
  { k: 'tiktok', label: 'TIKTOK', sub: '@' + tt, word: 'watch me unravel', href: `https://www.tiktok.com/@${tt}`, art: 'are-we-alive-yet' },
  yt && { k: 'youtube', label: 'YOUTUBE', sub: '@' + yt, word: 'the long versions', href: `https://www.youtube.com/@${yt}`, art: 'when-you-rain' },
  { k: 'pinterest', label: 'PINTEREST', sub: pin ? pin.replace(/^https?:\/\/(www\.)?pinterest\.[a-z.]+\//, '').replace(/\/$/, '') : 'shedithers', word: 'scroll the fragments', href: pin || 'https://www.pinterest.com/search/pins/?q=shedithers', art: 'i-stand-alone-orange' },
  { k: 'here', label: 'THE ARCHIVE', sub: 'u are here', word: 'every file, view only', href: '#/', art: 'no-identity', here: true },
  { k: 'lab', label: 'DITHER LAB', sub: 'make ur own', word: 'remember to forget', href: 'index.html', art: 'who-will-you-be' },
  cash && { k: 'tip', label: 'TIP JAR', sub: '$' + cash, word: 'keep the lights on', href: '#', art: 'mad-women-and-poets', tip: true },
].filter(Boolean);
function build() {
  const title = 'WANNA COLLAB?'.split('').map((c, i) => c === ' ' ? h('i', { class: 'sp' }) : h('span', { style: `--i:${i}` }, c));
  const btn = h('button', { type: 'button', class: 'cl-btn', onclick: openForm }, h('span', { class: 'cl-btn-t' }, 'HIT ME UP FOR A COLLAB'), h('i', { 'aria-hidden': 'true' }, '▸'));
  const poster = h('div', { class: 'cl-poster', style: `--cl-a:${art('not-in-my-nature')};--cl-b:${art('stop-asking-me-about-my-future')}` },
    h('i', { class: 'cl-a', 'aria-hidden': 'true' }), h('i', { class: 'cl-b', 'aria-hidden': 'true' }), h('i', { class: 'cl-scan', 'aria-hidden': 'true' }),
    h('span', { class: 'cl-tag', 'aria-hidden': 'true' }, 'OPEN FOR COLLABS ✦ 2026'),
    h('b', { class: 'cl-title', 'aria-label': 'Wanna collab?' }, title),
    h('p', { class: 'cl-words' }, 'two signals cross. something weird comes out.', h('br'), 'music · clothes · prints · video · whatever has no name yet.'),
    btn, h('small', { class: 'cl-note' }, 'goes straight to my inbox ♥'));
  // the poster leans toward the pointer; the button is a little magnetic
  if (!reduce) {
    poster.addEventListener('pointermove', e => { const r = poster.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; poster.style.setProperty('--mx', x.toFixed(3)); poster.style.setProperty('--my', y.toFixed(3)); });
    poster.addEventListener('pointerleave', () => { poster.style.setProperty('--mx', 0); poster.style.setProperty('--my', 0); });
    btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect(); btn.style.setProperty('--bx', ((e.clientX - r.left) / r.width - .5) * 10 + 'px'); btn.style.setProperty('--by', ((e.clientY - r.top) / r.height - .5) * 8 + 'px'); });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--bx', '0px'); btn.style.setProperty('--by', '0px'); });
  }
  const peek = h('div', { class: 'fm-peek', 'aria-hidden': 'true' }, h('i'), h('b'), h('span'));
  const show = s => { peek.querySelector('i').style.backgroundImage = art(s.art); peek.querySelector('b').textContent = s.label; peek.querySelector('span').textContent = s.word; peek.classList.add('on'); };
  const stops = h('ol', { class: 'fm-line' }, STOPS.map((s, i) => {
    const a = h('a', { class: 'fm-stop' + (s.here ? ' here' : ''), href: s.href, style: `--n:${i}`, target: /^https?:/.test(s.href) ? '_blank' : null, rel: /^https?:/.test(s.href) ? 'noopener' : null },
      h('i', { class: 'fm-dot', 'aria-hidden': 'true' }), h('b', null, s.label), h('small', null, s.sub));
    if (s.tip) a.addEventListener('click', e => { e.preventDefault(); window.SHD_DRINK && window.SHD_DRINK(); });
    a.addEventListener('pointerenter', () => show(s)); a.addEventListener('focus', () => show(s));
    return h('li', null, a);
  }));
  stops.addEventListener('pointerleave', () => peek.classList.remove('on'));
  const find = h('div', { class: 'fm' }, h('div', { class: 'fm-head' }, h('small', null, 'シグナル'), h('b', null, 'WHERE TO FIND ME'), h('span', null, 'FOLLOW THE SIGNAL · HOVER A STOP')), h('div', { class: 'fm-wrap' }, stops, peek), h('i', { class: 'fm-pulse', 'aria-hidden': 'true' }));
  return h('section', { class: 'p-mod p-collab' }, h('div', { class: 'p-head' }, h('small', null, 'コラボ'), h('b', null, 'COLLABS'), h('span', null, 'MAKE SOMETHING WITH ME')), h('div', { class: 'cl-grid' }, mail ? poster : null, find));
}
function add() {
  const P = $('.portal'); if (!P || $('.p-collab', P)) return;
  const after = $('.p-voices', P) || $('.p-deck', P), sec = build();
  if (after && after.nextSibling) P.insertBefore(sec, after.nextSibling); else P.append(sec);
  // the deck lives under the comments + collabs row
  const deck = $('.p-deck', P); if (deck) sec.after(deck);
}
const view = $('#view'); if (view) { new MutationObserver(add).observe(view, { childList: true }); add(); }
})();
