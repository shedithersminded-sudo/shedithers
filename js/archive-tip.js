/* SHEDITHERS — buy me a drink (v3.7.0). Rebuilt from the artist's own art, no emoji anywhere.
 * Left: "meet me in my dreams" (the artist's video) in a taped frame, the leaves branch swaying over it.
 * Right: the lined-paper note, four drinks wearing the artist's pieces, and the QR. The cashtag stays hidden
 * unless the visitor asks for it. Behind: the artist's sky photo drifting, their own leaves falling.
 * Drinks come from SHD_CONFIG.drinks ({ label, amount, art }); art = file in assets/ui/art2/. */
(() => {
'use strict';
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
const tag = String(CFG.cashapp || '').trim().replace(/^\$+/, ''); if (!/^[A-Za-z][A-Za-z0-9_-]{0,19}$/.test(tag)) return;
const cashURL = amt => `https://cash.app/$${tag}${amt ? '/' + amt : ''}`;
const A = f => new URL('assets/ui/art2/' + f, location.href).href;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
let modal = null, leafT = 0;

function qr(box) {
  const draw = () => { try { const q = window.qrcode(0, 'M'); q.addData(cashURL()); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }); } catch (_) { box.textContent = 'qr unavailable'; } };
  if (window.qrcode) return draw();
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; s.onload = draw; s.onerror = () => { box.textContent = 'qr unavailable offline'; }; document.head.append(s);
}
function close() {
  if (!modal) return; const m = modal; modal = null; clearInterval(leafT);
  m.classList.remove('in'); document.removeEventListener('keydown', key, true); document.body.classList.remove('tp-open');
  setTimeout(() => m.remove(), 320);
}
function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

function open(e) {
  if (e && e.preventDefault) e.preventDefault(); if (modal) return;
  modal = el('div', 'tp'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Keep me dreaming');
  modal.innerHTML = `
  <div class="tp-sky" aria-hidden="true"><i style="background-image:url('${A('sky.webp')}')"></i></div>
  <div class="tp-fall" aria-hidden="true"></div>
  <div class="tp-card">
    <button class="tp-x" type="button" aria-label="Close">✕</button>
    <figure class="tp-film" aria-hidden="true">
      <i class="tp-tape t1"></i>
      <video muted loop playsinline preload="metadata" poster="${A('dreams.jpg')}"><source src="${A('dreams.mp4')}" type="video/mp4"></video>
      <figcaption>meet me in my dreams</figcaption>
      <img class="tp-branch" src="${A('leaves.webp')}" alt="" draggable="false">
    </figure>
    <div class="tp-main">
      <small class="tp-kana">ドリーム・ジャー</small>
      <h3 class="tp-title" aria-label="keep me dreaming">${(() => { let i = 0; return 'keep me dreaming'.split(' ').map(w => `<span class="tw" aria-hidden="true">${[...w].map(c => `<span style="--i:${i++}">${c}</span>`).join('')}</span>`).join(' '); })()}</h3>
      <div class="tp-note"></div>
      <div class="tp-menu"></div>
      <div class="tp-pay">
        <div class="tp-qr"><b>loading…</b></div>
        <div class="tp-how">
          <p><b>scan with your phone camera.</b><br>it opens cash app.</p>
          <p class="tp-phone">on your phone? tap a drink.</p>
          <button class="tp-reveal" type="button" aria-expanded="false">show my cash app name</button>
          <div class="tp-tag" hidden><span>$${tag}</span><a href="${cashURL()}" target="_blank" rel="noopener">open cash app ▸</a></div>
        </div>
      </div>
      <p class="tp-foot">it goes straight to me. i never see your card.</p>
    </div>
  </div>`;
  const $ = s => modal.querySelector(s);
  // the note, on lined paper, each line in its own hand
  const lines = CFG.tipLines && CFG.tipLines.length ? CFG.tipLines : [['marker', 'all of this is free.']];
  lines.forEach(([k, t], i) => { const s = el('span', 'tn-' + k, t); s.style.setProperty('--i', i); $('.tp-note').append(s); });
  // the drinks: each one wears a piece
  (CFG.drinks || []).forEach((d, i) => {
    const a = el('a', 'tp-drink'); a.href = cashURL(d.amount); a.target = '_blank'; a.rel = 'noopener'; a.style.setProperty('--i', i);
    a.setAttribute('aria-label', `${d.label}, $${d.amount}, opens Cash App`);
    const pic = el('span', 'tp-pic' + (d.fit === 'cover' ? ' cover' : '')); pic.setAttribute('aria-hidden', 'true');
    if (d.art) pic.style.backgroundImage = `url('${A(d.art)}')`;
    a.append(pic, el('b', null, d.label), el('em', null, '$' + d.amount));
    a.addEventListener('click', () => { if (window.shdCount) window.shdCount('tip-' + d.amount, 'Picked a drink'); });
    $('.tp-menu').append(a);
  });
  $('.tp-x').onclick = close;
  $('.tp-reveal').onclick = ev => { const b = ev.currentTarget, t = $('.tp-tag'); t.hidden = !t.hidden; b.setAttribute('aria-expanded', String(!t.hidden)); b.textContent = t.hidden ? 'show my cash app name' : 'hide it'; };
  modal.addEventListener('click', ev => { if (ev.target === modal) close(); });
  document.body.append(modal); document.body.classList.add('tp-open');
  const v = $('video'); if (!reduce) v.play().catch(() => { });
  requestAnimationFrame(() => modal && modal.classList.add('in'));
  document.addEventListener('keydown', key, true); $('.tp-x').focus({ preventScroll: true });
  qr($('.tp-qr'));
  // falling leaves: the artist's own leaves, cut from the branch photo
  if (!reduce) {
    const fall = $('.tp-fall'), drop = () => {
      if (!fall.isConnected) return clearInterval(leafT);
      if (fall.childElementCount > 14) return;
      const l = el('i'); l.style.backgroundImage = `url('${A('leaf' + (Math.random() * 3 | 0) + '.webp')}')`;
      const s = 18 + Math.random() * 26, dur = 9 + Math.random() * 8;
      l.style.cssText += `left:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${(Math.random() * 2 - 1) * 160}px;--r:${(Math.random() * 2 - 1) * 540}deg;animation-duration:${dur}s,${2 + Math.random() * 2}s`;
      l.addEventListener('animationend', ev => { if (ev.animationName === 'tpFall') l.remove(); });
      fall.append(l);
    };
    for (let i = 0; i < 5; i++) setTimeout(drop, i * 500);
    leafT = setInterval(drop, 1100);
  }
}
window.SHD_TIP = open;
// tip links anywhere on the site (no cashtag shown) open this window
document.addEventListener('click', e => { const a = e.target.closest('a[href="#/tip"]'); if (!a) return; e.preventDefault(); (window.SHD_DRINK || open)(e); }, true);
})();
