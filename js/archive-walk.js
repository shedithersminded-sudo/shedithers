/* SHEDITHERS — the way in: you walk down the street toward the warehouse holding a flyer (the artist's WANTED drawing),
 * then the flyer fills your view and you're at the door (the gate). The gate also gets the same lime "render" as the inside. */
(() => {
'use strict';
const gate = document.getElementById('gate'); if (!gate || typeof ARTWORKS === 'undefined') return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; };

/* 1) the gate wears the same lime render as the inside of the site */
const render = el('div', 'g-render'); render.setAttribute('aria-hidden', 'true');
['who-will-you-be', 'are-we-alive-yet', 'when-you-rain'].map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean)
  .forEach((a, i) => { const L = el('i', 'pr-layer' + (i === 0 ? ' on' : '')); L.style.backgroundImage = `url('${new URL(a.src, location.href).href}')`; render.append(L); });
render.append(el('i', 'pr-tint'), el('i', 'pr-streaks'), el('i', 'pr-grid'));
gate.prepend(render);
let gi = 0; const gT = setInterval(() => { if (!document.body.contains(render)) return clearInterval(gT); const L = render.querySelectorAll('.pr-layer'); L[gi].classList.remove('on'); gi = (gi + 1) % L.length; L[gi].classList.add('on'); }, 7000);

/* 2) the walk-in (once per visit, only when the gate is actually showing) */
let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1' || sessionStorage.getItem('shd.walked') === '1'; } catch (_) { }
if (seen || /^#\/work\//.test(location.hash)) return;
const walk = el('div', 'walk' + (reduce ? ' still' : ''));
walk.setAttribute('role', 'dialog'); walk.setAttribute('aria-label', 'Walking to the SHEDITHERS warehouse. Tap the flyer to go in.');
walk.innerHTML = `
  <i class="wk-bg"></i><i class="wk-tint"></i>
  <div class="wk-hud"><b>SHEDITHERS WAREHOUSE</b><span class="wk-dist">0.4 MI ▸</span></div>
  <div class="wk-steps" aria-hidden="true"><span>you found a flyer.</span><span>follow it.</span></div>
  <i class="wk-fg"></i>
  <button class="wk-flyer" type="button" aria-label="Tap the flyer to go in"><span>tap the flyer ▸</span></button>
  <button class="wk-skip" type="button">skip ▸</button>
  <i class="wk-grain"></i>`;
document.body.append(walk); document.body.classList.add('walking');
let done = false, dist = 0.4;
const dEl = walk.querySelector('.wk-dist');
const tick = setInterval(() => { dist = Math.max(0, dist - 0.05); dEl.textContent = dist > 0.01 ? `${dist.toFixed(2)} MI ▸` : 'YOU’RE HERE ★'; }, 520);
function finish() {
  if (done) return; done = true; clearInterval(tick); clearTimeout(auto);
  try { sessionStorage.setItem('shd.walked', '1'); } catch (_) { }
  walk.classList.add('arrive'); document.body.classList.remove('walking');
  setTimeout(() => { walk.remove(); const b = document.getElementById('enter'); if (b) b.focus(); }, reduce ? 0 : 1100);
}
walk.querySelector('.wk-flyer').addEventListener('click', finish);
walk.querySelector('.wk-skip').addEventListener('click', finish);
walk.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') finish(); });
const auto = setTimeout(finish, reduce ? 999999 : 6500);
setTimeout(() => walk.querySelector('.wk-flyer').focus(), 50);
})();
