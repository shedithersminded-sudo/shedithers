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

const DECK_SKIP = ['play-online']; // the artist asked for these to stay out of the deck
const PICK = ARTWORKS.filter(a => a.type !== 'video' && a.w && a.h && !DECK_SKIP.includes(a.id)).sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, 12);
const N = PICK.length; if (N < 3) return;
const STEP = 360 / N;
const INKS = ['red', 'black', 'paper', 'teal', 'mustard', 'plum'];
// readings: a riddle made from each piece, and its answer. pieces without one get a "finish the line" from their own words
const RIDDLES = {
  'untitled-faces': ['the words go round and round your head and never come out straight. what are they?', 'warped words. understanding me is understanding we.'],
  'untitled-spiral': ['i spin you around until you can\u2019t tell if you\u2019re lost or loved. what am i?', 'conloved. confused and loved at the same time.'],
  'untitled-red-sun': ['he burns all day about things that never happen. who is he?', 'wurrisum. a dude named worrisome.'],
  'untitled-map': ['i start as two and end as one, and i\u2019m drawn all over your head. what am i?', 'me, you, we.'],
  'untitled-wings': ['she sparkles and she hates the corners of your room. who is she?', 'fairy dust. she hates dust bunnies.'],
  'self-portrait-green': ['two faces, same glasses, only one of them is me. which one?', 'she, not me.'],
  'self-portrait-grey': ['same face with the color taken out. who\u2019s looking back?', 'she, not me.'],
  'i-dont-want-a-face': ['everyone looks at me first and still can\u2019t tell you who i am. what am i?', 'a face. you don\u2019t need one to be seen.'],
  'doing-it-scared': ['your hands shake and you do it anyway. what is that called?', 'brave. it was always just scared, still moving.'],
  'sky-lights': ['i burn every evening and nobody calls for help. what am i?', 'the sky. the lights below are just copying it.'],
  'nothing-hates-you': ['you swear it\u2019s watching you. it isn\u2019t even looking. what is it?', 'the thing you\u2019re scared of. nothing hates you.'],
  'when-you-rain': ['i don\u2019t drizzle. once i start i don\u2019t stop. what am i?', 'you, when you finally feel it. when you rain you pour.'],
  'im-sorry-again': ['the more you say me, the less i mean. what am i?', 'sorry. say it once and mean it.'],
  'i-stand-alone': ['there\u2019s only one of me in the room and i\u2019m not missing anyone. what am i?', 'alone. not lonely.'],
  'gold': ['i don\u2019t rust and i don\u2019t fade, and i was in the dirt the whole time. what am i?', 'gold. you, before anyone noticed.'],
  'the-end': ['i look like the last page but i\u2019m wearing a question mark. what am i?', 'the end? not yet.'],
  'dream-without-action': ['you see it every night with your eyes closed and never touch it. what is it?', 'a dream with no action. that\u2019s just hallucination.'],
  'not-lonely': ['i\u2019m by myself and i\u2019m fine. why does that scare you?', 'because you thought alone meant lonely.'],
  's-gems': ['i\u2019m one letter, covered in shine. what do i start?', 'shedithers.'],
};
function riddleFor(a) {
  if (RIDDLES[a.id]) return RIDDLES[a.id];
  const w = String(a.words || '').split(' \u00b7 ')[0].trim();
  const parts = w.split(/\s+/);
  if (parts.length >= 4) { const k = Math.ceil(parts.length / 2); return [`finish the line: \u201c${parts.slice(0, k).join(' ')} \u2026\u201d`, w.toLowerCase()]; }
  return ['no words on this one. what is it saying anyway?', 'whatever you heard. that\u2019s your reading.'];
}
// every line of words in the art, for the paper slips

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
  // tap the front card: it spins once, and a reading comes up. a riddle made from the piece, the answer hidden.
  let slip = null;
  function pull(card, a) {
    if (slip) { const old = slip; old.classList.add('gone'); setTimeout(() => old.remove(), 350); }
    const [q, ans] = riddleFor(a), n = PICK.indexOf(a) + 1;
    card.classList.remove('spin'); void card.offsetWidth; card.classList.add('spin');
    setTimeout(() => card.classList.remove('spin'), 1000);
    const close = h('button', { type: 'button', class: 'd3-slip-x', 'aria-label': 'Close the reading', onclick: e => { e.stopPropagation(); away(); } }, '\u2715');
    const answer = h('p', { class: 'd3-ans', hidden: true }, ans);
    const qEl = h('p', { class: 'd3-q', 'aria-label': q }, ...[...q].map((c, k) => h('span', { style: `--k:${k}`, 'aria-hidden': 'true' }, c)));
    const glyphs = h('i', { class: 'd3-glyphs', 'aria-hidden': 'true' }, ...'shedithers'.split('').map((c, k) => h('b', { style: `--k:${k};--x:${(k * 37 + 11) % 100}%` }, c)));
    const reveal = h('button', { type: 'button', class: 'd3-reveal', onclick: e => { e.stopPropagation(); answer.hidden = false; reveal.remove(); slip && slip.classList.add('told'); } }, 'turn it over \u25b8');
    slip = h('div', { class: 'd3-read', role: 'status', style: `--ra:url('${abs(a.src)}')` },
      close,
      h('div', { class: 'd3-read-top' }, h('small', null, '\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0'), h('span', null, `reading \u00b7 card ${String(n).padStart(2, '0')}`)),
      h('b', { class: 'd3-read-t' }, a.title.toLowerCase()),
      qEl, reveal, answer, glyphs, h('i', { class: 'd3-scan', 'aria-hidden': 'true' }),
      h('a', { href: `#/work/${a.id}`, class: 'd3-slip-from' }, 'look closer \u25b8'));
    setTimeout(() => { if (slip) stage.append(slip); }, 420);
    window.shdCount && window.shdCount('deck-reading', 'Got a reading from the deck');
  }
  function away() { if (!slip) return; const s = slip; slip = null; s.classList.add('gone'); setTimeout(() => s.remove(), 350); kick(); }
  function flip(card) { const on = !card.classList.contains('flipped'); cards.forEach(c => c.classList.remove('flipped')); card.classList.toggle('flipped', on); flipped = on ? card : null; }
  function frontIndex() { return ((Math.round(-angle / STEP) % N) + N) % N; }
  function paint() {
    ring.style.transform = `translateZ(calc(var(--r) * -1)) rotateX(${lean.y.toFixed(2)}deg) rotateY(${angle + lean.x}deg)`;
    const fi = frontIndex();
    cards.forEach((c, i) => { const on = i === fi; if (c.classList.contains('front') !== on) { c.classList.toggle('front', on); if (!on && c.classList.contains('flipped')) { c.classList.remove('flipped'); flipped = null; } } });
    count.textContent = `${String(fi + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  }
  let target = null, drawing = false; const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  function goTo(i) { const cur = -angle / STEP; let d = ((i - cur) % N + N) % N; if (d > N / 2) d -= N; target = angle - d * STEP; vel = 0; kick(); }
  function tick(t) {
    raf = 0; const dt = Math.min(48, t - (last || t)); last = t;
    if (drag) { /* finger moves it */ }
    else if (target != null) { const d = target - angle; angle += d * Math.min(1, dt / 120); if (Math.abs(d) < .05) { angle = target; target = null; if (drawing) { drawing = false; const fi = frontIndex(); setTimeout(() => pull(cards[fi], PICK[fi]), 120); } } }
    else if (Math.abs(vel) > .02) { angle += vel * dt / 16; vel *= Math.pow(drawing ? .955 : .92, dt / 16); if (Math.abs(vel) <= (drawing ? .4 : .02)) { vel = 0; goTo(frontIndex()); } }
    else if (auto && !flipped && !hover && !slip) angle -= .012 * dt;
    lean.x += (lean.tx - lean.x) * .08; lean.y += (lean.ty - lean.y) * .08;
    paint();
    if (visible && !document.hidden && (drag || target != null || Math.abs(vel) > .02 || Math.abs(lean.tx - lean.x) > .05 || Math.abs(lean.ty - lean.y) > .05 || (auto && !flipped && !hover && !slip))) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

  let hover = false, moved = false;
  const stage = h('div', { class: 'd3-stage', tabindex: '0', role: 'region', 'aria-label': 'The deck: 3D art cards. Use arrow keys to spin, Enter to flip.' }, ring);
  stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; } });
  stage.addEventListener('pointerleave', () => { hover = false; lean.tx = 0; lean.ty = 0; kick(); });
  stage.addEventListener('pointermove', e => { if (drag || e.pointerType !== 'mouse') return; const r = stage.getBoundingClientRect(); lean.tx = ((e.clientX - r.left) / r.width - .5) * 10; lean.ty = -((e.clientY - r.top) / r.height - .5) * 8; kick(); });
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
    h('button', { type: 'button', class: 'd3-btn d3-draw', onclick: () => { away(); drawing = true; target = null; vel = (Math.random() < .5 ? -1 : 1) * (14 + Math.random() * 10); kick(); } }, '✦ draw a card'),
    h('button', { type: 'button', class: 'd3-btn', onclick: () => goTo(Math.floor(Math.random() * N)) }, '★ shuffle'),
    autoBtn,
    h('button', { type: 'button', class: 'd3-btn red', onclick: () => flip(cards[frontIndex()]) }, '↻ flip'));
  const sizeIt = () => { const w = Math.min(stage.clientWidth || 600, 1000), cw = w < 560 ? 160 : Math.round(Math.min(260, Math.max(200, w * .3))); stage.style.setProperty('--cw', cw + 'px'); stage.style.setProperty('--r', Math.round(cw / 2 / Math.tan(Math.PI / N) * 1.08) + 'px'); };
  const sec = h('section', { class: 'p-mod p-deck' },
    h('div', { class: 'p-head' }, h('small', null, 'デッキ'), h('b', null, 'THE DECK'), h('span', null, 'DRAG TO SPIN · DRAW A CARD FOR A READING')),
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
