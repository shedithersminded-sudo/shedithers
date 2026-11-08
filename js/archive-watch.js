/* SHEDITHERS — TikTok theater (watch without leaving the site) + always-visible Dither Lab button.
 * Nothing loads from TikTok until a visitor opens the theater. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
const handle = String(CFG.tiktok || '').replace(/^@/, '').trim();
const ids = (CFG.tiktokVideos || []).map(u => (String(u).match(/(\d{8,})/) || [])[1]).filter(Boolean);

/* ---------------- TikTok theater ---------------- */
let theater = null, ch = 0;
function openTheater(start) {
  if (!handle) return; if (theater) return; ch = start || 0;
  const screen = h('div', { class: 'tt-screen' }), list = h('div', { class: 'tt-list' }), label = h('span', { class: 'tt-ch' });
  const play = i => {
    ch = (i + ids.length) % ids.length; screen.innerHTML = '';
    screen.append(h('iframe', { src: `https://www.tiktok.com/player/v1/${ids[ch]}?autoplay=1&loop=1&controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1&rel=0&description=1&music_info=1`, allow: 'autoplay; fullscreen; encrypted-media', allowfullscreen: true, title: `SHEDITHERS TikTok ${ch + 1}` }));
    label.textContent = `CH ${String(ch + 1).padStart(2, '0')} / ${String(ids.length).padStart(2, '0')}`;
    [...list.children].forEach((b, k) => b.classList.toggle('on', k === ch));
  };
  if (ids.length) { ids.forEach((id, i) => list.append(h('button', { onclick: () => play(i) }, 'CH ' + String(i + 1).padStart(2, '0')))); }
  else screen.append(h('iframe', { src: `https://www.tiktok.com/embed/@${handle}?lang=en`, title: 'SHEDITHERS on TikTok', allow: 'autoplay; encrypted-media', allowfullscreen: true }));
  theater = h('div', { class: 'tt', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'TikTok theater' },
    h('div', { class: 'tt-dots', 'aria-hidden': 'true' }),
    h('div', { class: 'tt-set' },
      h('div', { class: 'tt-top' }, h('span', { class: 'tt-tag' }, '♪ TIKTOK TV · @' + handle), label, h('button', { class: 'tt-x', 'aria-label': 'Close TikTok theater', onclick: close }, '✕')),
      h('div', { class: 'tt-body' }, h('button', { class: 'tt-k', 'aria-label': 'Previous video', onclick: () => ids.length && play(ch - 1), disabled: !ids.length }, '◂'), screen, h('button', { class: 'tt-k', 'aria-label': 'Next video', onclick: () => ids.length && play(ch + 1), disabled: !ids.length }, '▸')),
      ids.length ? list : h('p', { class: 'tt-note' }, 'watching @' + handle + ' right here ♥'),
      h('div', { class: 'tt-foot' }, h('span', null, 'you never leave the archive · '), h('a', { href: `https://www.tiktok.com/@${handle}`, target: '_blank', rel: 'noopener' }, 'follow on tiktok ▸'))));
  theater.addEventListener('click', e => { if (e.target === theater || e.target.classList.contains('tt-dots')) close(); });
  document.body.append(theater); document.body.classList.add('locked'); requestAnimationFrame(() => theater.classList.add('in'));
  if (ids.length) play(ch);
  document.addEventListener('keydown', key, true);
}
function key(e) { if (!theater) return; if (e.key === 'Escape') { e.stopPropagation(); close(); } }
function close() { if (!theater) return; const t = theater; theater = null; t.classList.remove('in'); document.body.classList.remove('locked'); document.removeEventListener('keydown', key, true); setTimeout(() => t.remove(), 300); }
window.SHD_WATCH = openTheater;

/* hook the little TV: big-screen button + double-tap */
function hookTV() {
  const tv = $('.tv'); if (!tv || tv.dataset.big) return; tv.dataset.big = '1';
  const panel = $('.tv-panel', tv); if (panel) panel.append(h('button', { class: 'tv-k tv-big', 'aria-label': 'Watch on the big screen', title: 'Big screen', onclick: e => { e.stopPropagation(); openTheater(); } }, '⛶'));
  const scr = $('.tv-screen', tv); if (scr) scr.addEventListener('dblclick', () => openTheater());
  const tag = $('.tv-tag', tv); if (tag) { tag.style.cursor = 'pointer'; tag.addEventListener('click', () => openTheater()); }
}
hookTV(); setTimeout(hookTV, 1500);

/* "watch here" entry points on the home page */
function hookHome() {
  const bars = document.querySelectorAll('.p-traffic .pt-bar'); if (!bars.length || $('.pt-bar.watch')) return;
  bars[0].before(h('a', { class: 'pt-bar watch', href: '#/', onclick: e => { e.preventDefault(); openTheater(); } }, '▶ WATCH SHEDITHERS TIKTOKS RIGHT HERE — NO NEED TO LEAVE'));
}
const view = $('#view'); if (view) { new MutationObserver(hookHome).observe(view, { childList: true }); hookHome(); }

/* ---------------- always-visible Dither Lab ---------------- */
const lab = h('a', { class: 'lab-float', href: 'index.html', 'aria-label': 'Open the Dither Lab photo and video editor' },
  h('span', { class: 'lf-icon', html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }), h('span', { class: 'lf-text' }, h('b', null, 'DITHER LAB'), h('small', null, 'edit your photos ▸')));
document.body.append(lab);
const gateBtn = $('#enter'); if (gateBtn) gateBtn.after(h('a', { class: 'gate-lab', href: 'index.html' }, 'or make your own art in the DITHER LAB ▸'));
})();

/* ---------------- intro song: plays once when a visitor presses ENTER (their tap = permission) ---------------- */
(() => {
  const gate = document.getElementById('gate'), enterBtn = document.getElementById('enter'); if (!gate || !enterBtn) return;
  let on = true; try { on = localStorage.getItem('shd.introSound') !== 'off'; } catch (_) { }
  const tog = document.createElement('button'); tog.className = 'pg-sound'; tog.type = 'button';
  const paint = () => { tog.textContent = on ? '♪ SOUND: ON' : '♪ SOUND: OFF'; tog.setAttribute('aria-pressed', on); };
  tog.onclick = e => { e.stopPropagation(); on = !on; try { localStorage.setItem('shd.introSound', on ? 'on' : 'off'); } catch (_) { } paint(); };
  paint(); enterBtn.parentNode.insertBefore(tog, enterBtn);
  enterBtn.addEventListener('click', () => {
    if (!on) return;
    let vol = 0.75; try { const v = parseFloat(localStorage.getItem('shd.introVol')); if (v >= 0 && v <= 1) vol = v; } catch (_) { }
    const a = new Audio('assets/ui/intro.mp3'); a.volume = vol; a.play().catch(() => { });
    a.title = 'Sorry — evo & crevo';
    try { if ('mediaSession' in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title: 'Sorry', artist: 'evo & crevo', album: 'SHEDITHERS ARCHIVE' }); } catch (_) { }
    const chip = document.createElement('div'); chip.className = 'intro-chip';
    chip.innerHTML = '<span class="ic-disc"></span><span class="ic-txt"><b>NOW PLAYING · SORRY</b><small>by evo &amp; crevo</small></span>';
    const mk = (cls, txt, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = txt; b.setAttribute('aria-label', label); b.title = label; return b; };
    const pp = mk('ic-pp', '❚❚', 'Pause the song');
    const mute = mk('ic-mute', '🔊', 'Mute the song');
    const slider = document.createElement('input'); slider.type = 'range'; slider.className = 'ic-vol'; slider.min = 0; slider.max = 100; slider.value = Math.round(vol * 100); slider.setAttribute('aria-label', 'Song volume');
    const stop = mk('ic-stop', '✕', 'Stop the song');
    chip.append(pp, mute, slider, stop);
    const paintPP = () => { const p = a.paused; pp.textContent = p ? '▶' : '❚❚'; pp.setAttribute('aria-label', p ? 'Play the song' : 'Pause the song'); pp.title = pp.getAttribute('aria-label'); chip.classList.toggle('paused', p); };
    const paintVol = () => { const m = a.muted || a.volume === 0; mute.textContent = m ? '🔇' : a.volume < 0.4 ? '🔉' : '🔊'; mute.setAttribute('aria-label', m ? 'Unmute the song' : 'Mute the song'); mute.title = mute.getAttribute('aria-label'); slider.value = a.muted ? 0 : Math.round(a.volume * 100); };
    pp.onclick = e => { e.stopPropagation(); a.paused ? a.play().catch(() => { }) : a.pause(); };
    mute.onclick = e => { e.stopPropagation(); if (a.volume === 0) { a.volume = 0.5; a.muted = false; } else a.muted = !a.muted; paintVol(); };
    slider.oninput = () => { a.volume = slider.value / 100; a.muted = false; try { localStorage.setItem('shd.introVol', a.volume); } catch (_) { } paintVol(); };
    a.addEventListener('play', paintPP); a.addEventListener('pause', paintPP);
    let gone = false;
    const end = () => { if (gone) return; gone = true; a.pause(); chip.classList.add('out'); setTimeout(() => chip.remove(), 400); };
    stop.onclick = end; a.addEventListener('ended', end); paintVol();
    const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P) P.audio.addEventListener('play', end, { once: true });
    chip.setAttribute('data-drag', ''); chip.setAttribute('data-grip', '');
    document.body.append(chip); if (window.SHD_MOVE) window.SHD_MOVE(chip, 'introchip', 'the song');
  }, true);
})();

/* ---------------- move the music players anywhere: mouse, finger, pencil or arrow keys ----------------
 * Drag the mini player, the big player's top bar/disc, or the intro-song chip. Positions are saved per device
 * as a share of the free space, so a player parked in a corner stays in that corner after rotating or resizing.
 * Double-tap the ⠿ grip to put it back. */
(() => {
  const KEY = 'shd.pos.', PAD = 8, NODRAG = 'input,select,textarea,a,.p-list,.p-note';
  const vw = () => document.documentElement.clientWidth, vh = () => window.innerHeight;
  function makeMovable(el, id, label) {
    if (!el || el.dataset.movable) return; el.dataset.movable = '1';
    let pos = null; try { pos = JSON.parse(localStorage.getItem(KEY + id)); } catch (_) { }
    const save = () => { try { pos ? localStorage.setItem(KEY + id, JSON.stringify(pos)) : localStorage.removeItem(KEY + id); } catch (_) { } };
    const free = () => { const r = el.getBoundingClientRect(); return { w: Math.max(0, vw() - r.width - PAD * 2), h: Math.max(0, vh() - r.height - PAD * 2) }; };
    const place = () => {
      if (!pos) { el.classList.remove('moved'); ['left', 'top', 'right', 'bottom'].forEach(k => el.style[k] = ''); return; }
      el.classList.add('moved'); el.style.right = 'auto'; el.style.bottom = 'auto';
      const f = free(), cl = v => Math.min(1, Math.max(0, +v || 0));
      el.style.left = PAD + cl(pos.x) * f.w + 'px'; el.style.top = PAD + cl(pos.y) * f.h + 'px';
    };
    const setXY = (x, y) => { const f = free(); pos = { x: f.w ? Math.min(1, Math.max(0, (x - PAD) / f.w)) : 0, y: f.h ? Math.min(1, Math.max(0, (y - PAD) / f.h)) : 1 }; place(); };
    // grips: visible handle + keyboard control
    [...(el.matches('[data-grip]') ? [el] : []), ...el.querySelectorAll('[data-grip]')].forEach(slot => {
      const g = document.createElement('button'); g.type = 'button'; g.className = 'mv-grip'; g.textContent = '⠿';
      g.setAttribute('aria-label', `Move ${label} (arrow keys; double-tap to reset)`); g.title = `Drag to move ${label} · double-tap to reset`;
      g.addEventListener('dblclick', e => { e.stopPropagation(); pos = null; save(); place(); });
      g.addEventListener('keydown', e => {
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!d) return;
        e.preventDefault(); e.stopPropagation(); const r = el.getBoundingClientRect(), s = e.shiftKey ? 80 : 24;
        setXY(r.left + d[0] * s, r.top + d[1] * s); save();
      });
      g.addEventListener('click', e => e.stopPropagation());
      slot.prepend(g);
    });
    // pointer drag (starts after a 6px move, so taps on buttons still work)
    let st = null, dragged = false;
    el.addEventListener('pointerdown', e => {
      if (e.button > 0 || e.target.closest(NODRAG) || !e.target.closest('[data-drag]')) return;
      const r = el.getBoundingClientRect(); st = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, on: false };
    });
    el.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      if (!st.on) { if (Math.hypot(e.clientX - st.sx, e.clientY - st.sy) < 6) return; st.on = true; dragged = true; try { el.setPointerCapture(e.pointerId); } catch (_) { } el.classList.add('dragging'); }
      e.preventDefault(); setXY(e.clientX - st.ox, e.clientY - st.oy);
    });
    const up = e => { if (!st || e.pointerId !== st.id) return; const was = st.on; st = null; el.classList.remove('dragging'); if (was) { save(); setTimeout(() => { dragged = false; }, 0); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    // stay on screen when the window, phone or tablet changes size, and when the player opens/closes
    addEventListener('resize', place); addEventListener('orientationchange', () => setTimeout(place, 250));
    if (window.ResizeObserver) new ResizeObserver(() => pos && place()).observe(el);
    place();
  }
  window.SHD_MOVE = makeMovable;
  const p = document.getElementById('player');
  if (p) {
    const mini = p.querySelector('.p-mini'), head = p.querySelector('.p-head'), relic = p.querySelector('.relic');
    [mini, head, relic].forEach(n => n && n.setAttribute('data-drag', ''));
    [mini, head].forEach(n => n && n.setAttribute('data-grip', ''));
    makeMovable(p, 'player', 'music player');
  }
})();

/* ---------------- art skins: the song chip + TikTok TV are cut from the artist's work (CSS backgrounds only) ---------------- */
(() => {
  if (typeof ARTWORKS === 'undefined') return;
  const abs = u => new URL(u, location.href).href, by = id => ARTWORKS.find(a => a.id === id);
  const url = id => { const a = by(id); return a ? `url('${abs(a.src)}')` : 'none'; };
  const root = document.documentElement.style;
  root.setProperty('--sk-disc', url('no-identity'));        // the same art as the intro CD
  root.setProperty('--sk-chip', url('when-you-rain'));      // song chip body
  root.setProperty('--sk-tv', url('to-see-and-be-seen'));   // TV casing (eyes + "to see and be seen")
  root.setProperty('--sk-tvscreen', url('shedithers-eyes')); // shows through the static on the TV screen
  const tv = document.querySelector('.tv');
  if (tv && window.SHD_MOVE) {
    const body = tv.querySelector('.tv-body'), panel = tv.querySelector('.tv-panel'), tag = tv.querySelector('.tv-tag');
    [body, tag].forEach(n => n && n.setAttribute('data-drag', '')); if (panel) panel.setAttribute('data-grip', '');
    window.SHD_MOVE(tv, 'tv', 'TikTok TV');
  }
})();

/* ---------------- BUY ME A DRINK: the same drink menu as the Dither Lab, always visible on the archive ---------------- */
(() => {
  const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
  const tag = String(CFG.cashapp || '').trim().replace(/^\$+/, ''); if (!/^[A-Za-z][A-Za-z0-9_-]{0,19}$/.test(tag)) return;
  const cashURL = amt => `https://cash.app/$${tag}${amt ? '/' + amt : ''}`;
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  let modal = null;
  function qr(box) {
    const draw = () => { try { const q = window.qrcode(0, 'M'); q.addData(cashURL()); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (_) { box.textContent = 'QR unavailable'; } };
    if (window.qrcode) return draw();
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; s.onload = draw; s.onerror = () => { box.textContent = 'QR unavailable offline'; }; document.head.append(s);
  }
  function close() { if (!modal) return; const m = modal; modal = null; m.classList.remove('in'); document.removeEventListener('keydown', key, true); setTimeout(() => m.remove(), 250); }
  function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
  function open(e) {
    if (e) e.preventDefault(); if (modal) return;
    modal = el('div', 'dk'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Buy me a drink');
    const card = el('div', 'dk-card');
    const x = el('button', 'dk-x', '✕'); x.setAttribute('aria-label', 'Close'); x.onclick = close;
    const head = el('div', 'dk-head'); head.append(el('small', null, 'TIP JAR // $' + tag.toUpperCase()), el('h3', null, 'BUY ME A DRINK'), el('p', null, CFG.tipLine || 'Buy the artist a drink ♥'));
    const menu = el('div', 'dk-menu');
    (CFG.drinks || []).forEach((d, i) => { const a = el('a', 'dk-drink'); a.href = cashURL(d.amount); a.target = '_blank'; a.rel = 'noopener'; a.style.setProperty('--r', [-2, 1.5, -1, 2][i % 4] + 'deg'); a.append(el('i', null, d.emoji || '♥'), el('b', null, d.label), el('span', null, '$' + d.amount)); menu.append(a); });
    const any = el('a', 'dk-any', 'ANY AMOUNT · OPEN CASH APP ▸'); any.href = cashURL(); any.target = '_blank'; any.rel = 'noopener';
    const scan = el('div', 'dk-scan'); const box = el('div', 'dk-qr', 'loading QR…');
    scan.append(box, el('p', null, 'On a computer? Scan with your phone camera to tip in Cash App. Payments go straight to the artist — SHEDITHERS never sees your payment details.'));
    const art = id => { const w = typeof ARTWORKS !== 'undefined' && ARTWORKS.find(z => z.id === id); return w ? `url('${new URL(w.src, location.href).href}')` : 'none'; };
    card.style.setProperty('--tip-banner', art('no-identity')); card.style.setProperty('--tip-guy', `url('${new URL('assets/archive/little-guy.png', location.href).href}')`);
    ['i-love-shedithers', 'not-in-my-nature', 'when-you-rain', 'mad-women-and-poets'].forEach((id, i) => menu.children[i] && menu.children[i].style.setProperty('--art', art(id)));
    const banner = el('div', 'tip-banner'); banner.setAttribute('aria-hidden', 'true'); const guy = el('i', 'tip-guy'); guy.setAttribute('aria-hidden', 'true');
    card.append(guy, banner, x, head, menu, any, scan, el('div', 'dk-foot', 'SHEDITHERS LOVES YOU ♥'));
    modal.append(card); modal.addEventListener('click', ev => { if (ev.target === modal) close(); });
    document.body.append(modal); requestAnimationFrame(() => modal.classList.add('in')); document.addEventListener('keydown', key, true); x.focus(); qr(box);
  }
  window.SHD_DRINK = open;
  const tab = el('button', 'drink-tab'); tab.type = 'button'; tab.setAttribute('aria-label', 'Buy me a drink'); tab.innerHTML = '<i>🍹</i><b>BUY ME A DRINK</b>'; tab.onclick = open;
  document.body.append(tab);
  document.querySelectorAll('[data-drink]').forEach(a => a.addEventListener('click', open));
})();
