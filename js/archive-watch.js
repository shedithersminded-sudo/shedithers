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
  // scroll up and down like the TikTok app: buttons, mouse wheel, swipe, arrow keys
  let lock = 0;
  const go = d => { if (!ids.length || Date.now() < lock) return; lock = Date.now() + 450; screen.classList.remove('up', 'down'); void screen.offsetWidth; screen.classList.add(d > 0 ? 'up' : 'down'); play(ch + d); };
  screen.addEventListener('animationend', () => screen.classList.remove('up', 'down'));
  if (ids.length) { ids.forEach((id, i) => list.append(h('button', { onclick: () => play(i) }, 'CH ' + String(i + 1).padStart(2, '0')))); }
  else screen.append(h('iframe', { src: `https://www.tiktok.com/embed/@${handle}?lang=en`, title: 'SHEDITHERS on TikTok', allow: 'autoplay; encrypted-media', allowfullscreen: true }));
  theater = h('div', { class: 'tt', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'TikTok theater' },
    h('div', { class: 'tt-dots', 'aria-hidden': 'true' }),
    h('div', { class: 'tt-set' },
      h('div', { class: 'tt-top' }, h('span', { class: 'tt-tag' }, '♪ TIKTOK TV · @' + handle), label, h('button', { class: 'tt-x', 'aria-label': 'Close TikTok theater', onclick: close }, '✕')),
      h('div', { class: 'tt-body' }, screen, h('div', { class: 'tt-ud' }, h('button', { class: 'tt-k', 'aria-label': 'Previous video', title: 'Previous video', onclick: () => go(-1), disabled: !ids.length }, '▲'), h('button', { class: 'tt-k', 'aria-label': 'Next video', title: 'Next video', onclick: () => go(1), disabled: !ids.length }, '▼'))),
      ids.length ? list : h('p', { class: 'tt-note' }, 'watching @' + handle + ' right here ♥'),
      h('div', { class: 'tt-foot' }, h('span', null, 'you never leave the archive · '), h('a', { href: `https://www.tiktok.com/@${handle}`, target: '_blank', rel: 'noopener' }, 'follow on tiktok ▸'))));
  theater.addEventListener('wheel', e => { if (Math.abs(e.deltaY) < 12 || e.target.closest('.tt-list')) return; e.preventDefault(); go(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  let ty = null; theater.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  theater.addEventListener('touchend', e => { if (ty == null) return; const dy = ty - e.changedTouches[0].clientY; ty = null; if (Math.abs(dy) > 50) go(dy > 0 ? 1 : -1); }, { passive: true });
  theater.addEventListener('click', e => { if (e.target === theater || e.target.classList.contains('tt-dots')) close(); });
  document.body.append(theater); document.body.classList.add('locked'); requestAnimationFrame(() => theater.classList.add('in'));
  if (ids.length) play(ch);
  document.addEventListener('keydown', key, true);
}
function key(e) { if (!theater) return; if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); const b = theater.querySelectorAll('.tt-ud .tt-k')[e.key === 'ArrowDown' ? 1 : 0]; b && b.click(); } }
function close() { if (!theater) return; const t = theater; theater = null; t.classList.remove('in'); document.body.classList.remove('locked'); document.removeEventListener('keydown', key, true); setTimeout(() => t.remove(), 300); }
window.SHD_WATCH = s => { window.shdCount && !theater && window.shdCount('tiktok-theater-opened', 'Opened the TikTok theater'); openTheater(s); };

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
    let vol = 0.3; try { const v = parseFloat(localStorage.getItem('shd.introVol')); if (v >= 0 && v <= 1) vol = v; } catch (_) { }
    // the site's songs, played in order: "Follow Me To Heaven" by sinnceree (from SoundCloud), "Sorry" by evo & crevo, then "you kno u" by evo
    const SC = (typeof SHD_CONFIG !== 'undefined' && SHD_CONFIG.soundcloud) ? 'https://soundcloud.com/' + SHD_CONFIG.soundcloud : '';
    const SONG3 = (typeof SHD_CONFIG !== 'undefined' && SHD_CONFIG.soundcloudSong) || '';
    const SONGS = [{ src: 'assets/ui/intro.mp3', title: 'Sorry', artist: 'evo & crevo', link: SC }, { src: 'assets/ui/you-kno-u.mp3', title: 'you kno u', artist: 'evo', link: SC }];
    // songs that live on SoundCloud play through SoundCloud's own embed player (no file needed)
    const SIN = (typeof SHD_CONFIG !== 'undefined' && SHD_CONFIG.soundcloudSinnceree) ? 'https://soundcloud.com/' + SHD_CONFIG.soundcloudSinnceree : '';
    SONGS.forEach(s => s.profile = SC);
    if (SONG3) SONGS.unshift({ sc: SONG3, title: 'Follow Me To Heaven', artist: 'sinnceree', link: SONG3, profile: SIN });
    let track = 0;
    /* one remote for both kinds of song: a normal audio file, or the SoundCloud widget. The chip's buttons talk to this. */
    const au = new Audio(), on2 = {}; let onSC = false, sw = null, swLoading = null, swPaused = true, swVol = vol, swMuted = false;
    const fire = t => (on2[t] || []).forEach(f => f());
    const scVol = () => sw && sw.setVolume(swMuted ? 0 : Math.round(swVol * 100));
    function ensureSC(url) {
      if (sw) { sw.load(url, { auto_play: true, callback: () => { scVol(); sw.play(); } }); return Promise.resolve(sw); }
      if (swLoading) return swLoading;
      // the intro alley may already have this song going: pick up the same player so it carries on without restarting
      const W = window.SHD_SCW;
      if (W && W.widget && W.url === url) {
        sw = W.widget; const E = window.SC.Widget.Events;
        sw.bind(E.PLAY, () => { swPaused = false; fire('play'); }); sw.bind(E.PAUSE, () => { swPaused = true; fire('pause'); }); sw.bind(E.FINISH, () => { swPaused = true; fire('pause'); fire('ended'); });
        scVol(); sw.play(); swLoading = Promise.resolve(sw); return swLoading;
      }
      swLoading = new Promise(res => {
        const go = () => {
          const f = document.createElement('iframe'); f.className = 'sc-hidden'; f.allow = 'autoplay'; f.title = 'SoundCloud player';
          f.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=true&visual=false&show_artwork=false';
          f.style.cssText = 'position:fixed;left:-9999px;top:0;width:300px;height:166px;border:0'; document.body.append(f);
          sw = window.SC.Widget(f); const E = window.SC.Widget.Events;
          sw.bind(E.READY, () => { scVol(); sw.play(); res(sw); });
          sw.bind(E.PLAY, () => { swPaused = false; fire('play'); }); sw.bind(E.PAUSE, () => { swPaused = true; fire('pause'); }); sw.bind(E.FINISH, () => { swPaused = true; fire('pause'); fire('ended'); });
        };
        if (window.SC && window.SC.Widget) go(); else { const sc = document.createElement('script'); sc.src = 'https://w.soundcloud.com/player/api.js'; sc.onload = go; document.head.append(sc); }
      });
      return swLoading;
    }
    const a = {
      get paused() { return onSC ? swPaused : au.paused; },
      play() { if (onSC) { if (sw) sw.play(); else ensureSC(SONGS[track].sc); return Promise.resolve(); } return au.play(); },
      pause() { if (onSC) { sw && sw.pause(); } else au.pause(); },
      get volume() { return onSC ? swVol : au.volume; }, set volume(v) { swVol = v; au.volume = v; scVol(); },
      get muted() { return au.muted; }, set muted(m) { au.muted = m; swMuted = m; scVol(); },
      set currentTime(t) { if (onSC) { sw && sw.seekTo(t * 1000); } else au.currentTime = t; },
      set title(t) { au.title = t; },
      addEventListener(t, f) { au.addEventListener(t, f); (on2[t] = on2[t] || []).push(f); },
    };
    function setTrack() {
      const s = SONGS[track];
      if (s.sc) { au.pause(); onSC = true; swPaused = true; if (sw) ensureSC(s.sc); else ensureSC(s.sc); }
      else { if (sw) sw.pause(); onSC = false; au.src = s.src; au.play().catch(() => { }); }
    }
    // starts low; visitors turn it up with the slider if they want
    au.volume = vol; setTrack();
    let fading = false;
    const chip = document.createElement('div'); chip.className = 'intro-chip';
    chip.innerHTML = '<span class="ic-disc"></span><span class="ic-txt"><b></b><small></small></span>';
    const label = () => {
      const s = SONGS[track]; a.title = `${s.title} — ${s.artist}`;
      chip.querySelector('.ic-txt b').textContent = 'NOW PLAYING · ' + s.title.toUpperCase(); const sm = chip.querySelector('.ic-txt small'); sm.textContent = 'by ';
      // the artist name links to their SoundCloud profile
      if (s.profile) { const pl = document.createElement('a'); pl.href = s.profile; pl.target = '_blank'; pl.rel = 'noopener'; pl.className = 'ic-sc'; pl.textContent = s.artist; pl.addEventListener('click', e => e.stopPropagation()); sm.append(pl); } else sm.append(s.artist);
      // show where the song lives: a link to it on SoundCloud
      if (s.link && s.link !== s.profile) { sm.append(' · '); const l = document.createElement('a'); l.href = s.link; l.target = '_blank'; l.rel = 'noopener'; l.className = 'ic-sc'; l.textContent = 'on soundcloud ▸'; l.addEventListener('click', e => e.stopPropagation()); sm.append(l); }
      try { if ('mediaSession' in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title: s.title, artist: s.artist, album: 'SHEDITHERS ARCHIVE' }); } catch (_) { }
    };
    label();
    const mk = (cls, txt, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = txt; b.setAttribute('aria-label', label); b.title = label; return b; };
    const pp = mk('ic-pp', '❚❚', 'Pause the song');
    const mute = mk('ic-mute', '🔊', 'Mute the song');
    const slider = document.createElement('input'); slider.type = 'range'; slider.className = 'ic-vol'; slider.min = 0; slider.max = 100; slider.value = Math.round(vol * 100); slider.setAttribute('aria-label', 'Song volume');
    const stop = mk('ic-stop', '✕', 'Stop the song');
    const restart = mk('ic-restart', '⏮', 'Restart the song');
    const skip = mk('ic-skip', '⏭', 'Skip to the next song');
    const tipB = mk('ic-tip', '', 'Buy me a drink'); tipB.innerHTML = '<img src="assets/ui/drinks/cocktail.svg" alt="">'; tipB.onclick = e => { e.stopPropagation(); window.SHD_DRINK && window.SHD_DRINK(); };
    chip.append(restart, pp, skip, mute, slider, tipB, stop);
    const paintPP = () => { const p = a.paused; pp.textContent = p ? '▶' : '❚❚'; pp.setAttribute('aria-label', p ? 'Play the song' : 'Pause the song'); pp.title = pp.getAttribute('aria-label'); chip.classList.toggle('paused', p); };
    const paintVol = () => { const v = fading ? vol : a.volume, m = a.muted || v === 0; mute.textContent = m ? '🔇' : v < 0.4 ? '🔉' : '🔊'; mute.setAttribute('aria-label', m ? 'Unmute the song' : 'Mute the song'); mute.title = mute.getAttribute('aria-label'); slider.value = a.muted ? 0 : Math.round(v * 100); };
    pp.onclick = e => { e.stopPropagation(); a.paused ? a.play().catch(() => { }) : a.pause(); };
    mute.onclick = e => { e.stopPropagation(); if (fading) { fading = false; a.volume = vol; } if (a.volume === 0) { a.volume = 0.5; a.muted = false; } else a.muted = !a.muted; paintVol(); };
    slider.oninput = () => { fading = false; a.volume = slider.value / 100; a.muted = false; try { localStorage.setItem('shd.introVol', a.volume); } catch (_) { } paintVol(); };
    a.addEventListener('play', paintPP); a.addEventListener('pause', paintPP);
    let gone = false;
    const end = () => { if (gone) return; gone = true; a.pause(); chip.classList.add('out'); document.body.classList.remove('song-on'); setTimeout(() => chip.remove(), 400); };
    const next = () => { if (gone) return; if (track >= SONGS.length - 1) return end(); track++; label(); setTrack(); };
    restart.onclick = e => { e.stopPropagation(); a.currentTime = 0; a.play().catch(() => { }); };
    // skip goes to the next song; on the last one it loops back to the first
    skip.onclick = e => { e.stopPropagation(); track = (track + 1) % SONGS.length; label(); setTrack(); };
    stop.onclick = end; a.addEventListener('ended', next); paintVol();
    const P = window.SHD_ARCHIVE && window.SHD_ARCHIVE.player; if (P) P.audio.addEventListener('play', end, { once: true });
    chip.setAttribute('data-drag', ''); chip.setAttribute('data-grip', '');
    // one player at a time: while the intro song has its chip, the regular music player steps aside
    document.body.classList.add('song-on');
    document.body.append(chip); if (window.SHD_MOVE) window.SHD_MOVE(chip, 'introchip', 'the song');
    if (window.SHD_TUCK) window.SHD_TUCK(chip, null, 'the song', '♪');
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
    if (window.SHD_TUCK) window.SHD_TUCK(p, 'player', 'music', '♪');
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
    // a carry handle on top so it's clear you can pick the TV up and move it anywhere
    const handle = document.createElement('span'); handle.className = 'tv-handle'; handle.setAttribute('aria-hidden', 'true'); handle.innerHTML = '<i></i><b>pick me up</b>'; tv.prepend(handle);
    [body, tag, handle].forEach(n => n && n.setAttribute('data-drag', '')); if (panel) panel.setAttribute('data-grip', '');
    window.SHD_MOVE(tv, 'tv', 'TikTok TV');
    if (window.SHD_TUCK) window.SHD_TUCK(tv, 'tv', 'TikTok TV', '📺');
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
    const head = el('div', 'dk-head');
    // news-panel look: kana, loud orange title (letters bounce in), a dated meta row, then the tip line
    const h3 = el('h3'); h3.setAttribute('aria-label', 'BUY ME A DRINK'); [...'BUY ME A DRINK'].forEach((c, i) => { const sp = el('span', c === ' ' ? 'sp' : null, c === ' ' ? ' ' : c); sp.style.setProperty('--i', i); sp.setAttribute('aria-hidden', 'true'); h3.append(sp); });
    const d = new Date(), dd = [d.getMonth() + 1, d.getDate(), d.getFullYear() % 100].map(n => String(n).padStart(2, '0')).join('/');
    const meta = el('div', 'dk-meta'); meta.append(el('span', null, dd), el('b', null, 'TIP JAR'), el('span', null, '$' + tag.toUpperCase()));
    const note = el('div', 'dk-note'); (CFG.tipLines && CFG.tipLines.length ? CFG.tipLines : [['type', CFG.tipLine || 'buy me a drink ♥']]).forEach(([k, t], i) => { const ln = el('span', 'dn-' + k, t); ln.style.setProperty('--i', i); note.append(ln); });
    head.append(el('small', null, 'チップ・ジャー'), h3, meta, note);
    const tick = el('div', 'dk-tick'); tick.setAttribute('aria-hidden', 'true'); const tr = el('span'); tr.textContent = ('free to look ✦ no sign up ✦ straight to the artist ✦ keeps the lights on ✦ stay weird ✦ thank u ✦ ').repeat(2); tick.append(tr);
    const menu = el('div', 'dk-menu');
    (CFG.drinks || []).forEach((d, i) => { const a = el('a', 'dk-drink'); a.href = cashURL(d.amount); a.target = '_blank'; a.rel = 'noopener'; a.style.setProperty('--r', [-2, 1.5, -1, 2][i % 4] + 'deg'); const ic = el('i', d.icon ? 'dk-ico' : null, d.icon ? null : (d.emoji || '♥')); if (d.icon) { const im = el('img'); im.src = `assets/ui/drinks/${d.icon}.svg`; im.alt = ''; im.draggable = false; ic.append(im); } a.append(ic, el('b', null, d.label), el('span', null, '$' + d.amount)); menu.append(a); });
    const any = el('a', 'dk-any'); any.append(el('span', null, 'ANY AMOUNT · OPEN CASH APP'), el('i', null, '▸')); any.href = cashURL(); any.target = '_blank'; any.rel = 'noopener';
    const scan = el('div', 'dk-scan'); const box = el('div', 'dk-qr', 'loading QR…');
    scan.append(box, el('p', null, 'On a computer? Scan with your phone camera to tip in Cash App. Payments go straight to the artist — SHEDITHERS never sees your payment details.'));
    const art = id => { const w = typeof ARTWORKS !== 'undefined' && ARTWORKS.find(z => z.id === id); return w ? `url('${new URL(w.src, location.href).href}')` : 'none'; };
    card.style.setProperty('--tip-banner', art('no-identity')); card.style.setProperty('--tip-guy', `url('${new URL('assets/archive/little-guy.png', location.href).href}')`);
    ['i-love-shedithers', 'not-in-my-nature', 'when-you-rain', 'mad-women-and-poets'].forEach((id, i) => menu.children[i] && menu.children[i].style.setProperty('--art', art(id)));
    const banner = el('div', 'tip-banner'); banner.setAttribute('aria-hidden', 'true'); const guy = el('i', 'tip-guy'); guy.setAttribute('aria-hidden', 'true');
    const foot = el('div', 'dk-foot'); foot.append('SHEDITHERS LOVES YOU ', el('i', null, '♥'));
    card.append(guy, banner, x, head, tick, menu, any, scan, foot);
    // behind the panel: the artist's art, tinted acid yellow like the news board, drifting
    const bg = el('div', 'dk-bg'); bg.setAttribute('aria-hidden', 'true');
    ['are-we-alive-yet', 'who-will-you-be', 'mad-women-and-poets'].forEach((id, i) => { const L = el('i', 'dk-bgl' + (i ? '' : ' on')); L.style.backgroundImage = art(id); bg.append(L); });
    bg.append(el('i', 'dk-bgt')); modal.append(bg);
    let bi = 0; const bT = setInterval(() => { if (!bg.isConnected) return clearInterval(bT); const L = bg.querySelectorAll('.dk-bgl'); L[bi].classList.remove('on'); bi = (bi + 1) % L.length; L[bi].classList.add('on'); }, 5000);
    modal.append(card); modal.addEventListener('click', ev => { if (ev.target === modal) close(); });
    document.body.append(modal); { const m = modal; requestAnimationFrame(() => m.classList.add('in')); } document.addEventListener('keydown', key, true); x.focus(); qr(box);
  }
  const openCounted = e => { if (!modal && window.shdCount) window.shdCount('tip-jar-opened', 'Opened the tip jar'); open(e); };
  window.SHD_DRINK = openCounted;
  // the side tab: a hanging bar sign — tape on top, cocktail doodle, scrawled words, a drip
  const tab = el('button', 'drink-tab'); tab.type = 'button'; tab.setAttribute('aria-label', 'Buy me a drink');
  tab.innerHTML = '<span class="dt-tape"></span><img class="dt-ico" src="assets/ui/drinks/cocktail.svg" alt=""><b>buy me a drink</b><small>no pressure ♥</small><span class="dt-drip"></span>';
  tab.onclick = openCounted;
  document.body.append(tab);
  document.querySelectorAll('[data-drink]').forEach(a => a.addEventListener('click', openCounted));
  // little drink spots around the site
  const mini = (cls, html, label) => { const b = el('button', 'drink-spot ' + cls); b.type = 'button'; b.setAttribute('aria-label', label || 'Buy me a drink'); b.innerHTML = html; b.onclick = e => { e.preventDefault(); e.stopPropagation(); openCounted(); }; return b; };
  const place = () => {
    const row = document.querySelector('.p-pop .pp-row'); // home: a slushy sticker next to the spinning CD
    if (row && !row.querySelector('.ds-slushy')) row.append(mini('ds-slushy', '<img src="assets/ui/drinks/slushy.svg" alt=""><span>buy me<br>a slushy</span>'));
    const foot = document.querySelector('.p-foot'); // home footer links
    if (foot && !foot.querySelector('.ds-foot')) { const a = mini('ds-foot pf-badge', '🍹 buy me a drink'); const pf = foot.querySelector('.pf-badge.dim'); pf ? pf.before(a) : foot.append(a); }
    const ctrl = document.querySelector('.p-deck .d3-ctrl'); // the deck: a tip button with the cards
    if (ctrl && !ctrl.querySelector('.ds-deck')) ctrl.append(mini('ds-deck d3-btn', '<img src="assets/ui/drinks/fruit.svg" alt=""> tip the artist'));
    const va = document.querySelector('.v-actions'); // the viewer: "liked this one?"
    if (va && !va.querySelector('.ds-view')) va.append(mini('ds-view v-btn', '🍹 liked this one?', 'Liked this piece? Buy me a drink'));
    const about = document.querySelector('.about-card .rights'); // about page: a bottle sticker by the rights line
    if (about && !document.querySelector('.ds-about')) about.before(mini('ds-about', '<img src="assets/ui/drinks/bottle.svg" alt=""><span>round for the studio?</span>'));
  };
  place(); const view = document.getElementById('view'); if (view) new MutationObserver(place).observe(view, { childList: true, subtree: true });
})();
