/* SHEDITHERS — the home page as a weird puzzle.
 * Every block gets jigsaw knobs that stick out and sockets cut in, so the pieces look like they lock together.
 * Purely decoration: spans with aria-hidden, no layout changes. */
(() => {
'use strict';
const INKS = ['#c3141c', '#e9e3d1', '#d4ff00', '#e2682a', '#0b0a09'];
// knob: [edge, position along the edge in %], socket: same. Picked per block so no two look the same.
const SETS = [
  { k: [['r', 38], ['b', 62]], s: [['l', 55], ['t', 30]] },
  { k: [['b', 28], ['r', 70]], s: [['t', 64], ['l', 26]] },
  { k: [['r', 58]], s: [['l', 40], ['t', 72]] },
  { k: [['b', 46], ['r', 24]], s: [['t', 50]] },
  { k: [['r', 46], ['b', 80]], s: [['l', 68], ['t', 18]] },
];
function bit(cls, edge, at, ink) {
  const e = document.createElement('i'); e.className = `pz ${cls} pz-${edge}`; e.setAttribute('aria-hidden', 'true');
  e.style.setProperty('--at', at + '%'); if (ink) e.style.setProperty('--ink', ink); return e;
}
function cut() {
  const P = document.querySelector('.portal'); if (!P) return;
  [...P.children].forEach((m, i) => {
    if (!m.classList.contains('p-mod') || m.dataset.pz || m.classList.contains('p-foot')) return; m.dataset.pz = '1';
    const set = SETS[i % SETS.length];
    set.k.forEach(([e, at], j) => m.append(bit('pz-knob', e, at, INKS[(i + j) % INKS.length])));
    set.s.forEach(([e, at]) => m.append(bit('pz-sock', e, at)));
  });
}
const view = document.getElementById('view');
if (view) { new MutationObserver(cut).observe(view, { childList: true, subtree: true }); cut(); }
})();
