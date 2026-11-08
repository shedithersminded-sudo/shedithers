/* SHEDITHERS — Y2K portal home (urbandesktop / Traffic / millennium-tech vibes), built from the artist's own art.
 * The artist allows their work to be used anywhere in the site's design; visitors still can't save/export it:
 * decorative uses are CSS backgrounds (no "save image"), and the viewer keeps showing untouched originals. */
window.SHD_PORTAL = function (view, X) {
  const { h, setHint, open, player } = X;
  const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const imgs = ARTWORKS.filter(a => a.type !== 'video'), vids = ARTWORKS.filter(a => a.type === 'video');
  const bgTile = (a, cls, extra) => h('button', { class: 'p-thumb ' + (cls || ''), style: `background-image:url('${a.src}')${extra || ''}`, title: a.title, 'aria-label': `View ${a.title}`, onclick: () => open(a.id) });
  const kana = (jp, en, sub) => h('div', { class: 'p-head' }, h('small', null, jp), h('b', null, en), sub ? h('span', null, sub) : null);
  setHint([['TAP ANY THUMB', null], ['THE EDIT ▸', () => location.hash = '#/works'], ['♪ MUSIC', () => player.expand()]]);

  /* full-bleed "render": the artist's work, pushed into lime light + motion streaks (decorative only) */
  const renderBg = h('div', { class: 'p-render', 'aria-hidden': 'true' });
  const bgPicks = ['are-we-alive-yet', 'when-you-rain', 'who-will-you-be', 'not-lonely', 'mad-women-and-poets'].map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean);
  bgPicks.forEach((a, i) => renderBg.append(h('i', { class: 'pr-layer' + (i === 0 ? ' on' : ''), style: `background-image:url('${a.src}')` })));
  renderBg.append(h('i', { class: 'pr-tint' }), h('i', { class: 'pr-streaks' }), h('i', { class: 'pr-grid' }));
  let bi = 0; const bgT = setInterval(() => { if (!document.body.contains(renderBg)) return clearInterval(bgT); const L = renderBg.querySelectorAll('.pr-layer'); L[bi].classList.remove('on'); bi = (bi + 1) % L.length; L[bi].classList.add('on'); }, 9000);

  const P = h('div', { class: 'portal' });

  /* logo block */
  P.append(h('section', { class: 'p-mod p-logo' },
    h('div', { class: 'pl-mark', html: '<img class="pl-logo" src="assets/ui/logo-paper-sm.png" alt="">' }),
    h('div', { class: 'pl-url' }, 'HTTP://SHEDITHERS.NETLIFY.APP/ART'),
    h('div', { class: 'pl-name' }, 'SHEDITHERS', h('span', { class: 'pl-cursor' }, '▮')),
    h('div', { class: 'pl-virus' }, 'NO IDENTITY CONTROL VIRUS.'),
    h('pre', { class: 'pl-fine' }, `ARCHIVE_01 // ${ARTWORKS.length} FILES // VIEW ONLY\nCOLLAGE · DRAWING · SIGNAL · MOTION\nI DON'T WANT ORDINARY. IT'S NOT IN MY NATURE.\nSHEDITHERS LOVES YOU`)));

  /* INSTANT-PHOTO: 8×2 thumbnail grid */
  const grid = h('div', { class: 'p-grid' }, imgs.slice(0, 16).map((a, i) => bgTile(a, '', `;--i:${i}`)));
  P.append(h('section', { class: 'p-mod p-instant' }, kana('インスタント・フォト', 'INSTANT-PHOTO'), grid));

  /* DITHER LAB — the photo / dither editor, right up front */
  const labArt = ARTWORKS.find(a => a.id === 'all-signs-yellow') || imgs[0];
  P.append(h('section', { class: 'p-mod p-lab' }, kana('ディザー・ラボ', 'DITHER LAB', 'PHOTO + VIDEO + DITHER EDITOR · FREE'),
    h('a', { class: 'pl-screen', href: 'index.html', 'aria-label': 'Open the Dither Lab editor' },
      h('i', { class: 'pls-art', style: `background-image:url('${labArt.src}')` }), h('i', { class: 'pls-dots' }), h('i', { class: 'pls-wipe' }),
      h('span', { class: 'pls-tag a' }, 'ORIGINAL'), h('span', { class: 'pls-tag b' }, 'DITHERED'),
      h('span', { class: 'pls-go' }, 'MAKE YOUR OWN ▸')),
    h('p', { class: 'pl-copy' }, '60+ effects: dither, glitch, glow, halftone, textures, GIF + video export. Bring your own photos — make something not ordinary.'),
    h('a', { class: 'pl-btn', href: 'index.html' }, '◎ OPEN THE LAB')));

  /* NEWS box */
  const tt = String(CFG.tiktok || '').replace(/^@/, ''), yt = String(CFG.youtube || '').replace(/^@/, ''), cash = String(CFG.cashapp || '').replace(/^\$/, '');
  const L = (href, txt, ext) => h('a', { href, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null }, txt);
  const news = [
    ['11/07/26', 'SHEDITHERS', ['the archive is open. ', L('#/works', 'THE EDIT'), ' plays everything on loop — ', ARTWORKS.length + ' files', ' and counting.']],
    ['11/07/26', 'NEW', ['new pieces: ', L('#/work/not-lonely', 'I stand alone but I’m not lonely'), ', ', L('#/work/shedithers-eyes', 'SHEDITHERS (eyes)'), ', ', L('#/work/prettier-in-fragments', 'I look prettier in fragments'), '.']],
    ['11/05/26', 'MOTION', ['moving pieces live in ', L('#/col/motion', 'MOTION'), ' — put your headphones on, load your own music (bottom right).']],
    ['11/03/26', 'TV', tt ? ['catch the tiktok TV on the wall or go straight to ', L(`https://www.tiktok.com/@${tt}`, '@' + tt, 1), '.'] : ['tune in soon.']],
    ['11/01/26', 'LAB', ['want to make your own glitch? the ', L('index.html', 'DITHER LAB'), ' is free.']],
    ['10/30/26', 'SECRETS', ['some things in here are hidden. type the name. hold the file label. look for the coffee ring.']],
    ...(cash ? [['10/09/26', 'TIP JAR', ['buy the artist a slushy → ', L(`https://cash.app/$${cash}`, '$' + cash, 1)]]] : []),
  ];
  P.append(h('section', { class: 'p-mod p-news' }, kana('ニュース', 'NEWS'),
    h('div', { class: 'pn-box' }, news.map(([d, tag, body]) => h('div', { class: 'pn-item' }, h('div', { class: 'pn-meta' }, h('span', null, d), h('b', null, tag)), h('p', null, ...body))))));

  /* NOW SHOWING — Traffic-style framed banner + stacked bars */
  const banner = ARTWORKS.find(a => a.id === 'shedithers-eyes') || imgs[0];
  P.append(h('section', { class: 'p-mod p-traffic' },
    h('button', { class: 'pt-banner', style: `background-image:url('${banner.src}')`, onclick: () => open(banner.id), 'aria-label': `View ${banner.title}` },
      h('span', { class: 'pt-cast' }, ['NO', 'IDENTITY', 'SHE', 'DITHERS'].map(w => h('b', null, w))), h('span', { class: 'pt-title' }, 'THE ARCHIVE', h('small', null, 'Directed by SHEDITHERS · Screenplay by static'))),
    ...[['NOW PLAYING IN THE EDIT EVERYWHERE', '#/works'], ['FOR MORE, VISIT THE DITHER LAB', 'index.html'], ['CLICK HERE TO VIEW MOVING PIECES', '#/col/motion'], ['WINNER! NOT ORDINARY • IT’S NOT IN MY NATURE • 45 FILES', '#/about']].map(([t, href]) => h('a', { class: 'pt-bar', href }, t)),
    h('div', { class: 'pt-row' },
      h('div', { class: 'pt-rating' }, h('b', null, 'S'), h('div', null, h('strong', null, 'RESTRICTED: VIEW ONLY'), h('span', null, 'Contains static, strong colors, feelings that don’t fit, and some hidden things.'))),
      h('a', { class: 'pt-clips', href: '#/col/motion' }, h('span', null, 'VIEW CLIPS'), h('b', null, 'CLIP 1   CLIP 2')))));

  /* speed globe: streaks rushing toward a glowing core (mirrored words) */
  P.append(h('section', { class: 'p-mod p-speed', 'aria-hidden': 'true' },
    ...[0, 1, 2, 3, 4, 5, 6].map(i => h('i', { class: 'ps-streak', style: `--i:${i}` })),
    h('span', { class: 'ps-core', html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }), h('span', { class: 'ps-ring' }), h('span', { class: 'ps-ring b' }),
    ...['becoming', 'unbecoming', 'not ordinary', 'no identity', 'shedithers'].map((w, i) => h('span', { class: 'ps-word', style: `--i:${i}` }, w))));

  /* INTERVIEW-style strips: one per collection */
  P.append(h('section', { class: 'p-mod p-strips' }, kana('コレクション', 'COLLECTIONS'),
    ...COLLECTIONS.map(c => { const w = ARTWORKS.filter(a => a.col === c.id && a.type !== 'video').slice(0, 6); if (!w.length) return null; return h('div', { class: 'ps-row' }, h('div', { class: 'ps-thumbs' }, w.map(a => bgTile(a))), h('a', { class: 'ps-label', href: `#/col/${c.id}` }, c.name, ' ▸')); })));

  /* LINKS dropdown */
  const sel = h('select', { 'aria-label': 'Links', onchange: e => { const v = e.target.value; e.target.selectedIndex = 0; if (!v) return; if (/^https?:/.test(v)) window.open(v, '_blank', 'noopener'); else location.href = v; } },
    h('option', { value: '' }, 'Best Links ------->'), h('option', { value: '#/works' }, 'THE EDIT'), h('option', { value: '#/about' }, 'ABOUT THE ARTIST'), h('option', { value: 'index.html' }, 'THE DITHER LAB'),
    tt ? h('option', { value: `https://www.tiktok.com/@${tt}` }, 'TIKTOK @' + tt) : null, yt ? h('option', { value: `https://www.youtube.com/@${yt}` }, 'YOUTUBE @' + yt) : null, cash ? h('option', { value: `https://cash.app/$${cash}` }, 'TIP JAR $' + cash) : null);
  P.append(h('section', { class: 'p-mod p-links' }, kana('リンク', 'LINKS', 'CLICK HERE FOR MORE LINKS'), sel));

  /* MOTION LAB: little video thumbs */
  P.append(h('section', { class: 'p-mod p-flash' }, kana('モーション・ラボ', 'MOTION LAB', 'MOVING PROJECT 2026 BY SHEDITHERS'),
    h('div', { class: 'pf-row' }, vids.slice(0, 4).map(a => { const v = h('video', { src: a.src, muted: true, loop: true, playsinline: true, preload: 'metadata', 'aria-label': a.title }); v.muted = true; v.addEventListener('contextmenu', e => e.preventDefault()); v.setAttribute('controlslist', 'nodownload'); const b = h('button', { class: 'pf-clip', onclick: () => open(a.id), 'aria-label': `View ${a.title}` }, v); b.addEventListener('mouseenter', () => v.play().catch(() => { })); b.addEventListener('mouseleave', () => v.pause()); return b; }))));

  /* WALLPAPER ART: the widescreen pieces */
  const wall = ARTWORKS.filter(a => a.col === 'screens' || a.w > a.h).slice(0, 6);
  P.append(h('section', { class: 'p-mod p-wall' }, kana('ウォールペーパー・アート', 'WALLPAPER ART'), h('div', { class: 'pw-row' }, wall.map(a => bgTile(a, 'wide')))));

  /* SIGN THE LIST: a note to the artist */
  const em = h('input', { type: 'email', placeholder: 'e-mail (optional)', 'aria-label': 'Your email (optional)' }), msg = h('input', { type: 'text', placeholder: 'say hi / leave a note', 'aria-label': 'Your note' }), st = h('span', { class: 'pm-st' });
  const send = async () => {
    const to = String(CFG.email || '').trim(); if (!msg.value.trim()) { msg.focus(); return; } if (!to) { st.textContent = 'not set up yet'; return; }
    st.textContent = 'sending…';
    try { const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: 'SHEDITHERS archive note ♥', _template: 'table', message: msg.value.trim(), email: em.value.trim() || 'not given', sent_from: location.href }) }); const j = await r.json().catch(() => ({})); if (!r.ok || String(j.success) === 'false') throw new Error(j.message || r.status); msg.value = ''; st.textContent = 'sent ♥ thank you'; }
    catch (_) { st.innerHTML = ''; st.append(h('a', { href: `mailto:${to}?subject=SHEDITHERS%20note&body=${encodeURIComponent(msg.value)}` }, 'email it instead ▸')); }
  };
  P.append(h('section', { class: 'p-mod p-mail' }, kana('サイン', 'SIGN THE LIST'), h('div', { class: 'pm-row' }, em), h('div', { class: 'pm-row' }, msg, h('button', { onclick: send }, 'submit')), st));

  /* footer badges */
  P.append(h('footer', { class: 'p-mod p-foot' },
    h('a', { href: '#/about', class: 'pf-badge' }, h('span', { html: '<svg viewBox="0 0 40 40"><use href="#mk"/></svg>' }), 'shedithers'),
    tt ? h('a', { href: `https://www.tiktok.com/@${tt}`, target: '_blank', rel: 'noopener', class: 'pf-badge' }, '♪ tiktok') : null,
    yt ? h('a', { href: `https://www.youtube.com/@${yt}`, target: '_blank', rel: 'noopener', class: 'pf-badge' }, '▶ youtube') : null,
    h('a', { href: 'index.html', class: 'pf-badge' }, '◎ ditherlab'), h('span', { class: 'pf-badge dim' }, '© all work view only')));

  view.append(renderBg, P);
};
