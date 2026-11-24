/* SHEDITHERS — the door check: "select all squares with YOU". A captcha cut from the artist's own work.
 * Nobody gets verified here: whatever you pick, the archive can't find an identity and lets you in. */
(() => {
'use strict';
const gate = document.getElementById('gate'), stage = gate && gate.querySelector('.pg-stage');
if (!stage || typeof ARTWORKS === 'undefined') return;
const abs = u => new URL(u, location.href).href;
const PIECES = ['no-identity', 'who-will-you-be', 'stop-asking'].map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean);
if (!PIECES.length) return;
let p = 0, picked = new Set();
const N = 4;
const el = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; };
const cap = el('div', 'cap');
cap.setAttribute('role', 'group'); cap.setAttribute('aria-label', 'Door check: select all squares with you');
cap.innerHTML = `
  <div class="cap-frame" aria-hidden="true"><i>★</i><i>✦</i><i>✦</i><i>★</i></div>
  <div class="cap-screen">
    <div class="cap-head"><small>select all squares with</small><b>YOU</b><span>if there are none, click END</span></div>
    <div class="cap-grid"></div>
    <div class="cap-foot">
      <button type="button" class="cap-ico cap-new" aria-label="Show a different piece">↻</button>
      <button type="button" class="cap-ico cap-info" aria-label="What is this?">i</button>
      <span class="cap-msg" role="status"></span>
      <button type="button" class="cap-end">END</button>
    </div>
  </div>`;
const grid = cap.querySelector('.cap-grid'), msg = cap.querySelector('.cap-msg');
function draw() {
  grid.innerHTML = ''; picked.clear(); msg.textContent = '';
  const a = PIECES[p % PIECES.length];
  for (let k = 0; k < N * N; k++) {
    const x = k % N, y = (k / N) | 0, t = el('button', 'cap-t');
    t.type = 'button'; t.setAttribute('aria-pressed', 'false'); t.setAttribute('aria-label', `square ${k + 1}`);
    const img = el('i', 'cap-img'); img.style.backgroundImage = `url('${abs(a.src)}')`; img.style.backgroundPosition = `${x / (N - 1) * 100}% ${y / (N - 1) * 100}%`; t.append(img);
    t.style.setProperty('--d', (k * 18) + 'ms');
    t.onclick = () => { const on = !picked.has(k); on ? picked.add(k) : picked.delete(k); t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); msg.textContent = picked.size ? `${picked.size} selected` : ''; };
    grid.append(t);
  }
}
cap.querySelector('.cap-new').onclick = () => { p++; draw(); };
cap.querySelector('.cap-info').onclick = () => { msg.textContent = 'this archive can’t verify anyone. that’s the point.'; };
cap.querySelector('.cap-end').onclick = () => {
  const none = !picked.size;
  cap.classList.add(none ? 'pass' : 'fail');
  msg.textContent = none ? '✓ no identity found. come in.' : 'ERROR: NO IDENTITY — that wasn’t you either.';
  cap.querySelector('.cap-head b').textContent = none ? 'NOBODY' : 'ERROR';
  setTimeout(() => { const e = document.getElementById('enter'); if (e) e.click(); }, none ? 900 : 1600);
};
draw();
stage.prepend(cap);
gate.classList.add('has-cap');
})();
