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
    const a = new Audio('assets/ui/intro.mp3'); a.volume = 0.75; a.play().catch(() => { });
    const chip = document.createElement('div'); chip.className = 'intro-chip';
    chip.innerHTML = '<span class="ic-disc"></span><span><b>NOW PLAYING</b><small>SHEDITHERS · intro</small></span>';
    const stop = document.createElement('button'); stop.textContent = '✕'; stop.setAttribute('aria-label', 'Stop intro song'); chip.append(stop);
    const end = () => { a.pause(); chip.classList.add('out'); setTimeout(() => chip.remove(), 400); };
    stop.onclick = end; a.addEventListener('ended', end);
    const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P) P.audio.addEventListener('play', end, { once: true });
    document.body.append(chip);
  }, true);
})();
