/* SHEDITHERS — THE DECK: the art as 3D trading cards on a spinning ring.
 * drag / swipe to spin · hover to tilt · tap the front card to flip it · "look closer" opens the viewer.
 * The art is only ever a CSS background (view-only, never a saveable <img>). */
(() => {
'use strict';
if (typeof ARTWORKS === 'undefined') return;
const $ = (s, r = document) => r.querySelector(s);
const abs = u => new URL(u, location.href).href;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }

const PICK = ARTWORKS.filter(a => a.type !== 'video' && a.w && a.h).sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, 12);
const N = PICK.length; if (N < 3) return;
const STEP = 360 / N;
const INKS = ['red', 'black', 'paper', 'teal', 'mustard', 'plum'];
// small riddles for the "reading:" line on each slip
const READINGS = [
  'what you keep checking was never locked.',
  'the thing you lost is wearing a different coat.',
  'someone is still holding the other end.',
  'you already know which one. you just want it said out loud.',
  'what grows in the dark still reaches for something.',
  'count what stayed, not what left.',
  'you are the echo and the wall.',
  'the answer sleeps in the last thing you said no to.',
  'what gets heavier the longer you hold it? put it down and see.',
  'i have no mouth but i keep you up at night. what am i?',
  'the more you feed it, the less it eats. find the hunger.',
  'what breaks when you say its name? say it anyway.',
  'a door, a mirror, a wire. one of them is you today.',
  'what is always behind you and never catches up?',
];
// every line of words in the art, for the paper slips
const LINES = ARTWORKS.filter(a => a.words && a.words.trim()).map(a => ({ text: a.words.trim(), a }));

function build() {
  let angle = 0, vel = 0, drag = null, flipped = null, auto = !reduce, visible = false, raf = 0, last = 0;
  const ring = h('div', { class: 'd3-ring', style: `--step:${STEP}deg` });
  const cards = PICK.map((a, i) => {
    const words = String(a.words || '').split(' · ')[0];
    const front = h('div', { class: 'd3-face d3-front' },
      h('i', { class: 'd3-art', style: `background-image:url('${abs(a.src)}')`, 'aria-hidden': 'true' }),
      h('i', { class: 'd3-glare', 'aria-hidden': 'true' }),
      h('span', { class: 'd3-code' }, `NO.${String(i + 1).padStart(2, '0')}`),
      h('span', { class: 'd3-stars', 'aria-hidden': 'true' }, '★'.repeat(3 + (i % 3))),
      h('span', { class: 'd3-words', 'aria-hidden': 'true' }, (words || a.title.toLowerCase()).split(/\s+/).filter(Boolean).slice(0, 7).map((w, k) => h('i', { class: `w${(k + i) % 6}`, style: `--k:${k};--r:${[-6, 4, -2, 7, -5, 3, -8][k % 7]}deg` }, w))),
      h('span', { class: 'd3-title' }, a.title));
    const back = h('div', { class: 'd3-face d3-back' },
      h('span', { class: 'd3-mark' }, 'SHEDITHERS'),
      h('b', null, a.title),
      words ? h('q', null, words) : h('q', null, 'no words. just look.'),
      h('small', null, `${a.medium || 'mixed media'} · ${a.date || ''}`),
      h('span', { class: 'd3-look', role: 'button', tabindex: '0' }, 'look closer ▸'),
      h('span', { class: 'd3-err', 'aria-hidden': 'true' }, 'ERROR: NO IDENTITY'));
    const card = h('button', { type: 'button', class: `d3-card ink-${INKS[i % INKS.length]}`, style: `--i:${i}`, 'aria-label': `${a.title} — tap to flip` }, h('div', { class: 'd3-inner' }, front, back));
    card.dataset.id = a.id;
    card.addEventListener('click', e => {
      if (moved) return;
      const isFront = card.classList.contains('front');
      if (e.target.closest('.d3-look')) { location.hash = `#/work/${a.id}`; return; }
      if (!isFront) { goTo(i); return; }
      if (card.classList.contains('flipped')) { flip(card); return; }
      pull(card, a);
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('.d3-look')) { e.preventDefault(); location.hash = `#/work/${a.id}`; } });
    card.addEventListener('pointermove', e => {
      if (!card.classList.contains('front') || drag) return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.setProperty('--tx', (x * 22).toFixed(1) + 'deg'); card.style.setProperty('--ty', (-y * 22).toFixed(1) + 'deg');
      card.style.setProperty('--gx', ((x + .5) * 100).toFixed(0) + '%'); card.style.setProperty('--gy', ((y + .5) * 100).toFixed(0) + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--tx', '0deg'); card.style.setProperty('--ty', '0deg'); });
    ring.append(card); return card;
  });
  // tap the front card and a paper slip comes out of it with a line from the art. not a cookie, still a card.
  let slip = null, lastLine = '';
  function pull(card, a) {
    let pick = String(a.words || '').trim();
    if (!pick || pick === lastLine || Math.random() < .5) {
      const others = LINES.filter(l => l.text !== lastLine); const o = others[Math.floor(Math.random() * others.length)];
      if (o) { pick = o.text; a = o.a; }
    }
    lastLine = pick;
    if (slip) { const old = slip; old.classList.add('gone'); setTimeout(() => old.remove(), 350); }
    const close = h('button', { type: 'button', class: 'd3-slip-x', 'aria-label': 'Put the paper away', onclick: e => { e.stopPropagation(); away(); } }, '✕');
    slip = h('div', { class: 'd3-slip', role: 'status', style: `--rot:${(Math.random() * 6 - 3).toFixed(1)}deg` },
      close, h('small', null, 'you pulled'), h('p', null, pick),
      h('p', { class: 'd3-slip-read' }, h('b', null, 'reading: '), READINGS[Math.floor(Math.random() * READINGS.length)]),
      h('a', { href: `#/work/${a.id}`, class: 'd3-slip-from' }, `from “${a.title.toLowerCase()}” ▸`));
    stage.append(slip); card.classList.remove('tug'); void card.offsetWidth; card.classList.add('tug');
    window.shdCount && window.shdCount('deck-slip', 'Pulled a paper from the deck');
  }
  function away() { if (!slip) return; const s = slip; slip = null; s.classList.add('gone'); setTimeout(() => s.remove(), 350); kick(); }
  function flip(card) { const on = !card.classList.contains('flipped'); cards.forEach(c => c.classList.remove('flipped')); card.classList.toggle('flipped', on); flipped = on ? card : null; }
  function frontIndex() { return ((Math.round(-angle / STEP) % N) + N) % N; }
  function paint() {
    ring.style.transform = `translateZ(calc(var(--r) * -1)) rotateY(${angle}deg)`;
    const fi = frontIndex();
    cards.forEach((c, i) => { const on = i === fi; if (c.classList.contains('front') !== on) { c.classList.toggle('front', on); if (!on && c.classList.contains('flipped')) { c.classList.remove('flipped'); flipped = null; } } });
    count.textContent = `${String(fi + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  }
  let target = null;
  function goTo(i) { const cur = -angle / STEP; let d = ((i - cur) % N + N) % N; if (d > N / 2) d -= N; target = angle - d * STEP; vel = 0; kick(); }
  function tick(t) {
    raf = 0; const dt = Math.min(48, t - (last || t)); last = t;
    if (drag) { /* finger moves it */ }
    else if (target != null) { const d = target - angle; angle += d * Math.min(1, dt / 120); if (Math.abs(d) < .05) { angle = target; target = null; } }
    else if (Math.abs(vel) > .02) { angle += vel * dt / 16; vel *= Math.pow(.92, dt / 16); if (Math.abs(vel) <= .02) goTo(frontIndex()); }
    else if (auto && !flipped && !hover && !slip) angle -= .012 * dt;
    paint();
    if (visible && !document.hidden && (drag || target != null || Math.abs(vel) > .02 || (auto && !flipped && !hover && !slip))) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

  let hover = false, moved = false;
  const stage = h('div', { class: 'd3-stage', tabindex: '0', role: 'region', 'aria-label': 'The deck: 3D art cards. Use arrow keys to spin, Enter to flip.' }, ring);
  stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; } });
  stage.addEventListener('pointerleave', () => { hover = false; kick(); });
  stage.addEventListener('pointerdown', e => { if (e.button > 0) return; drag = { x: e.clientX, a: angle, t: performance.now(), lx: e.clientX }; moved = false; target = null; vel = 0; kick(); });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) moved = true; if (!moved) return; const now = performance.now(); vel = (e.clientX - drag.lx) * .35 * 16 / Math.max(8, now - drag.t); drag.lx = e.clientX; drag.t = now; angle = drag.a + dx * .35; paint(); });
  addEventListener('pointerup', () => { if (!drag) return; drag = null; if (!moved) vel = 0; else if (Math.abs(vel) < .3) goTo(frontIndex()); kick(); setTimeout(() => { moved = false; }, 0); });
  stage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); goTo((frontIndex() + 1) % N); } else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo((frontIndex() - 1 + N) % N); } else if (e.key === 'Enter' && e.target === stage) { e.preventDefault(); flip(cards[frontIndex()]); } });

  const count = h('span', { class: 'd3-count' });
  const autoBtn = h('button', { type: 'button', class: 'd3-btn', 'aria-pressed': String(auto), onclick: () => { auto = !auto; autoBtn.setAttribute('aria-pressed', auto); autoBtn.textContent = auto ? '✦ spinning' : '✦ paused'; kick(); } }, auto ? '✦ spinning' : '✦ paused');
  const controls = h('div', { class: 'd3-ctrl' },
    h('button', { type: 'button', class: 'd3-btn', 'aria-label': 'Previous card', onclick: () => goTo((frontIndex() - 1 + N) % N) }, '◂'),
    count,
    h('button', { type: 'button', class: 'd3-btn', 'aria-label': 'Next card', onclick: () => goTo((frontIndex() + 1) % N) }, '▸'),
    h('button', { type: 'button', class: 'd3-btn', onclick: () => goTo(Math.floor(Math.random() * N)) }, '★ shuffle'),
    autoBtn,
    h('button', { type: 'button', class: 'd3-btn red', onclick: () => flip(cards[frontIndex()]) }, '↻ flip'));
  const sizeIt = () => { const w = Math.min(stage.clientWidth || 600, 900), cw = w < 560 ? 150 : 190; stage.style.setProperty('--cw', cw + 'px'); stage.style.setProperty('--r', Math.round(cw / 2 / Math.tan(Math.PI / N) * 1.08) + 'px'); };
  const sec = h('section', { class: 'p-mod p-deck' },
    h('div', { class: 'p-head' }, h('small', null, 'デッキ'), h('b', null, 'THE DECK'), h('span', null, 'DRAG TO SPIN · TAP THE FRONT CARD, GET A WORD')),
    stage, controls);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(stage);
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', sizeIt);
  requestAnimationFrame(() => { sizeIt(); paint(); });
  return sec;
}

function addDeck() {
  const P = $('.portal'); if (!P || $('.p-deck', P)) return;
  const after = $('.p-pop', P), sec = build(); if (!sec) return;
  if (after && after.nextSibling) P.insertBefore(sec, after.nextSibling); else P.insertBefore(sec, $('.p-foot', P));
}
const view = $('#view');
if (view) { new MutationObserver(() => addDeck()).observe(view, { childList: true }); addDeck(); }
})();
