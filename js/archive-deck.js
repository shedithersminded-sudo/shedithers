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
// readings: like a tarot pull. a card name (never the title), a cryptic verse from what’s in the piece,
// then turned over: what it means upright and reversed. the piece’s real title only shows at the very end.
const READ = {
 "its-all-in-your-head": [
  "the mender",
  "a status you never set. two chairs pulling one body in opposite directions. the box asks if you’re real and you hesitate.",
  "you hurt yourself first, so you’re the one who knows where to stitch. fix it before you throw it out.",
  "you keep proving you’re human to things that never asked nicely. stop checking the box."
 ],
 "distance": [
  "the stranger",
  "a receipt from a store that closed. a galaxy folded in the corner. something keeps asking, in another language, if you’re a robot.",
  "someone you lost still knows your face. let them be a memory, not a wound.",
  "you’re the stranger. you came back and the room still has your eyes."
 ],
 "circle-of-becoming": [
  "the wheel that eats",
  "four doors, one hallway. the angel holds the banner and won’t say which way is forward. everyone holds hands and nobody leads.",
  "you’re changing because you loved something. that’s the cost, and it’s worth it.",
  "you’re scared of the part where it devours. it already started. you’re still here."
 ],
 "inner-world": [
  "the mask",
  "a map of you, drawn by someone else. you stood in front of it so nobody could read the labels.",
  "the mask isn’t a lie. it’s the part of you that gets you through the door.",
  "you’ve worn the costume so long the face underneath forgot its lines."
 ],
 "sky-2": [
  "the open",
  "no words here. just light leaving. look up long enough and it stops being the sky.",
  "nothing is asked of you right now. breathe. it doesn’t need you to be anything.",
  "you’ve been looking at pictures of this instead of the thing itself. go outside."
 ],
 "i-dont-want-a-face": [
  "the unnamed",
  "a thumbprint left the room. the face stayed but got painted over. it’s still signed.",
  "you don’t owe anyone a version of you that’s easy to read.",
  "you erased yourself so they’d stop looking. they’re still looking. look back."
 ],
 "doing-it-scared": [
  "the small bird",
  "a bird waits on a plastic plant next to a note someone had to write down to believe. the smiley is crossed out and still smiling.",
  "the fear doesn’t leave first. you move, then it follows you out.",
  "you’re waiting to feel ready. that feeling isn’t coming. go anyway."
 ],
 "sky-lights": [
  "the parking lot",
  "the sun goes down behind the store lights. they switch on like they’re trying to help. it’s blurry because you were moving.",
  "something ordinary is being beautiful at you right now. you almost missed it.",
  "you copied the light instead of standing in it. turn the lamp off and watch."
 ],
 "the-encircled-one": [
  "the axis",
  "rings inside rings and she’s still in the middle. two angels hold the edges. a shadow reaches in and can’t find the door.",
  "you don’t need the answer to be the center. everything is already turning around you.",
  "someone wants you to explain yourself. you were never the puzzle. you’re the hinge."
 ],
 "i-sold-my-wings": [
  "the tray",
  "a hand holds you up like a dish being served. money falls and nobody bends down for it. it’s quiet. too quiet.",
  "you know what silence costs now. you won’t pay it twice.",
  "someone is carrying you and calling it support. check whose hand it is."
 ],
 "offline-is-the-new-luxury": [
  "the three buttons",
  "every button says ok. a fish sleeps in two open hands. a note asks if you swallow it or spit it out.",
  "logging off is the one choice that isn’t on the menu. take it.",
  "you keep clicking ok because the window won’t close. there’s always a corner. find the x."
 ],
 "sorry-i-disappeared": [
  "the echo",
  "321 of 699. a message rewritten until it said nothing. the tv holds its head while branches grow over the screen.",
  "leaving the familiar thing isn’t betrayal. it’s how you get found again.",
  "you left to figure it out and you’re still explaining why. you don’t have to."
 ],
 "untitled-faces": [
  "the chorus",
  "every face is saying the same word in a different shape. none of them agree on what it means.",
  "what you meant and what they heard can both be true.",
  "you keep translating yourself. some people need to learn the language."
 ],
 "untitled-spiral": [
  "the drain",
  "a spiral that could be pulling in or letting out. you can’t tell from here.",
  "being lost and being loved can feel the same at first. stay and find out which.",
  "you’ve been circling the same thought. it isn’t a road, it’s a loop."
 ],
 "untitled-red-sun": [
  "the worried sun",
  "it rises over things that haven’t happened yet and burns them anyway.",
  "the worry is just love with nowhere to go. give it somewhere.",
  "you’re living tomorrow’s fire today. it’s still dark out. sleep."
 ],
 "untitled-map": [
  "the crossing",
  "two roads drawn on one head. they meet where it hurts.",
  "the line between you and them is thinner than you think. cross it.",
  "you lost yourself in the we. walk back to the me first."
 ],
 "untitled-wings": [
  "the sweeper",
  "glitter in the corners where the dust should be. something soft is cleaning up after you.",
  "small magic counts. let it in.",
  "you keep sweeping the sparkle out with the dirt."
 ],
 "self-portrait-green": [
  "the double",
  "same glasses, different color, both looking at you. only one of them blinked.",
  "the version people describe isn’t you. it’s her. let her go.",
  "you’ve been arguing with a copy of yourself. the original is tired."
 ],
 "self-portrait-grey": [
  "the double",
  "the color drained out, the outline stayed. she still looks like she’s about to say something.",
  "the version people describe isn’t you. it’s her. let her go.",
  "you’ve been arguing with a copy of yourself. the original is tired."
 ]
};
const READ_ANY = ["the witness", "something is pinned here that isn’t written down. look at the edges, not the middle.", "what you notice first is what you needed.", "what you looked past is the part that was looking at you."];
const readFor = a => READ[a.id] || READ_ANY;
// every line of words in the art, for the paper slips

function build() {
  let angle = 0, vel = 0, drag = null, flipped = null, auto = !reduce, visible = false, raf = 0, last = 0;
  const ring = h('div', { class: 'd3-ring', style: `--step:${STEP}deg` });
  const cards = PICK.map((a, i) => {
    const words = String(a.words || '').split(' · ')[0];
    const front = h('div', { class: 'd3-face d3-front' },
      h('i', { class: 'd3-art' + (a.w / a.h < .6 || a.w / a.h > .92 ? ' d3-fit' : ''), style: `background-image:url('${abs(a.src)}')`, 'aria-hidden': 'true' }, h('b', { class: 'd3-fitbg', style: `background-image:url('${abs(a.src)}')` })),
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
    const [name, verse, up, down] = readFor(a), n = PICK.indexOf(a) + 1, rev = Math.random() < .42;
    card.classList.remove('spin'); void card.offsetWidth; card.classList.add('spin');
    setTimeout(() => card.classList.remove('spin'), 1000);
    const close = h('button', { type: 'button', class: 'd3-slip-x', 'aria-label': 'Close the reading', onclick: e => { e.stopPropagation(); away(); } }, '\u2715');
    const qEl = h('p', { class: 'd3-q', 'aria-label': verse }, ...[...verse].map((c, k) => h('span', { style: `--k:${k}`, 'aria-hidden': 'true' }, c)));
    const answer = h('div', { class: 'd3-ans d3-turned', hidden: true },
      h('small', { class: 'd3-way' }, rev ? 'you drew it reversed' : 'you drew it upright'),
      h('p', { class: 'd3-mean' }, rev ? down : up),
      h('p', { class: 'd3-other' }, h('i', null, rev ? 'upright: ' : 'reversed: '), rev ? up : down),
      h('p', { class: 'd3-piece' }, h('i', null, 'the piece \u00b7 '), a.title.toLowerCase()));
    const glyphs = h('i', { class: 'd3-glyphs', 'aria-hidden': 'true' }, ...'shedithers'.split('').map((c, k) => h('b', { style: `--k:${k};--x:${(k * 37 + 11) % 100}%` }, c)));
    const reveal = h('button', { type: 'button', class: 'd3-reveal', onclick: e => { e.stopPropagation(); answer.hidden = false; reveal.remove(); slip && slip.classList.add('told'); } }, 'turn it over \u25b8');
    slip = h('div', { class: 'd3-read' + (rev ? ' rev' : ''), role: 'status', style: `--ra:url('${abs(a.src)}')` },
      close,
      h('div', { class: 'd3-read-t' + '' , 'aria-hidden': 'false' }),
      qEl, reveal, answer, glyphs, h('i', { class: 'd3-scan', 'aria-hidden': 'true' }),
      h('a', { href: `#/work/${a.id}`, class: 'd3-slip-from' }, 'look closer \u25b8'));
    const top = h('div', { class: 'd3-read-top' }, h('small', null, '\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0'), h('span', null, `reading \u00b7 card ${String(n).padStart(2, '0')}`));
    const nm = h('b', { class: 'd3-read-t' }, name, rev ? h('em', { class: 'd3-rv', 'aria-label': 'reversed' }, ' \u21c5') : null);
    slip.querySelector('div.d3-read-t').replaceWith(top, nm);
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
