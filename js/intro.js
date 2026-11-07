/* SHEDITHERS — Marathon-style intro, artist gallery, ambient motion (stickers, ticker, reticle). */
const ART_GALLERY = [
  { src: 'assets/art/gallery/g1.jpg', name: 'NOT IN MY NATURE' },
  { src: 'assets/art/gallery/g3.jpg', name: 'CLICK TO BE SAVED' },
  { src: 'assets/art/gallery/g2.jpg', name: 'YOU KEEP FORGETTING' },
  { src: 'assets/art/gallery/g7.jpg', name: 'ALL SIGNS POINT TO YES' },
  { src: 'assets/art/gallery/g4.jpg', name: 'BLOOM' },
  { src: 'assets/art/gallery/g5.jpg', name: 'GOLD' },
  { src: 'assets/art/gallery/g6.jpg', name: 'THE END?' },
  { src: 'assets/art/collage.png', name: 'NO IDENTITY' },
];
const TICKER = ['SHEDITHERS LOVES YOU', 'I DON’T WANT ORDINARY. IT’S NOT IN MY NATURE.', 'BECOMING AND UNBECOMING', 'ERROR: NO IDENTITY', 'DREAMS AREN’T DREAMS', 'ALL SIGNS POINT TO YES', 'CLICK TO BE SAVED', 'YOU KEEP FORGETTING', 'DREAM WITHOUT ACTION IS HALLUCINATION', '@SHEDITHERS'];
const INTRO_QUOTE = 'BECOMING AND UNBECOMING SO I CAN BECOME WHO I ALWAYS HAVE BEEN AND NEVER WAS';
const INTRO_LOG = ['MOUNTING DITHER CORE ………… OK', `LOADING ${E.EFFECTS.length} EFFECT MODULES ………… OK`, 'SPAWNING WORKERS [PREVIEW / BACKGROUND] ………… OK', 'DECRYPTING ARTIST ARCHIVE ………… 8 FILES', 'IDENTITY CHECK ………… ERROR: NO IDENTITY', 'SHEDITHERS LOVES YOU ………… ♥'];

async function loadArtURL(url, name) {
  try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); const b = await r.blob(); await importFiles([new File([b], name, { type: b.type || 'image/jpeg' })]); }
  catch (e) { toast('Could not load that piece (' + e.message + ')', 'err'); }
}
function fillTicker(el, items) { const inner = $('.ticker-in', el); if (!inner) return; const run = items.map(t => `<span>${t}</span><b>✦</b>`).join(''); inner.innerHTML = run + run; }

/* ---- intro: boot log → dithered art montage → title card ---- */
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const MONTAGE_PAL = [['#070807', '#d4ff00'], ['#0b0609', '#ff4fa3'], ['#0a0b0a', '#eef2e6'], ['#070807', '#d4ff00'], ['#0b0609', '#ff4fa3']];
function runBoot() {
  const boot = $('#boot'); let done = false; const tm = [];
  const later = (fn, ms) => tm.push(setTimeout(() => { if (!done) fn(); }, ms));
  const finish = () => { if (done) return; done = true; tm.forEach(clearTimeout); boot.classList.add('gone'); document.body.classList.add('ready'); document.removeEventListener('keydown', onKey, true); setTimeout(() => { boot.remove(); fitView(); }, 700); };
  const onKey = e => { if (e.key !== 'Tab') { e.preventDefault(); finish(); } };
  if (!SETTINGS.boot) { finish(); return; }
  boot.addEventListener('click', finish); document.addEventListener('keydown', onKey, true);
  fillTicker($('.boot-ticker'), TICKER);
  // phase 1 — boot log
  INTRO_LOG.forEach((l, k) => later(() => { $('#bootLog').append(h('div', null, '> ' + l)); $('#boot .boot-bar i').style.width = ((k + 1) / INTRO_LOG.length * 100) + '%'; }, 150 + k * 230));
  // phase 2 — art montage
  const picks = ART_GALLERY.slice(0, 5), imgs = picks.map(g => { const im = new Image(); im.src = g.src; return im; });
  const cv = $('#bootArt'), W = 220, Hh = 275; cv.width = W; cv.height = Hh; const cx = cv.getContext('2d');
  const tmp = h_canvas(W, Hh), tx = tmp.getContext('2d', { willReadFrequently: true });
  const SLOT = 760, START = 1650;
  later(() => {
    boot.classList.add('montage'); const t0 = performance.now();
    const frame = () => {
      if (done) return; const el = performance.now() - t0, idx = Math.floor(el / SLOT);
      if (idx >= picks.length) { titleCard(); return; }
      const u = (el % SLOT) / SLOT, im = imgs[idx], pal = MONTAGE_PAL[idx % MONTAGE_PAL.length].map(c => E.hex(c));
      $('#bootFile').textContent = `FILE 0x${String(idx + 1).padStart(2, '0')} // ${String(Math.round(u * 100)).padStart(3, '0')}%`;
      $('#bootCap').innerHTML = `<b>${picks[idx].name}</b><span>DECRYPTING · ${['BAYER 4×4', 'ACID / PINK', 'MONO', 'BAYER 4×4', 'PINK SIGNAL'][idx]}</span>`;
      if (im.complete && im.naturalWidth) {
        const s = Math.max(W / im.naturalWidth, Hh / im.naturalHeight); tx.drawImage(im, (W - im.naturalWidth * s) / 2, (Hh - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
        const id = tx.getImageData(0, 0, W, Hh), d = id.data, noise = Math.max(0, 1 - u * 1.6) * 0.9, glitch = u < 0.14 || u > 0.92;
        for (let y = 0; y < Hh; y++) {
          const sh = glitch && Math.random() < 0.08 ? ((Math.random() - 0.5) * 40) | 0 : 0;
          for (let x = 0; x < W; x++) {
            const sx = Math.min(W - 1, Math.max(0, x + sh)), k = (y * W + sx) * 4, o = (y * W + x) * 4;
            const l = (0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]) / 255 + (Math.random() - 0.5) * noise;
            const c = l > B4[(y & 3) * 4 + (x & 3)] ? pal[1] : pal[0]; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
          }
        }
        cx.putImageData(id, 0, 0);
        boot.style.setProperty('--gx', glitch ? ((Math.random() - 0.5) * 8).toFixed(1) + 'px' : '0px');
      }
      tm.push(setTimeout(frame, 55));
    };
    frame();
  }, START);
  // phase 3 — title card
  let titled = false;
  function titleCard() {
    if (titled || done) return; titled = true; boot.classList.remove('montage'); boot.classList.add('title');
    const art = imgs[0]; if (art.complete && art.naturalWidth) { const s = Math.max(W / art.naturalWidth, Hh / art.naturalHeight); tx.drawImage(art, (W - art.naturalWidth * s) / 2, (Hh - art.naturalHeight * s) / 2, art.naturalWidth * s, art.naturalHeight * s); const id = tx.getImageData(0, 0, W, Hh), d = id.data, a = E.hex('#070807'), b = E.hex('#d4ff00'); for (let i = 0, p = 0; i < d.length; i += 4, p++) { const x = p % W, y = (p / W) | 0, l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255, c = l > B4[(y & 3) * 4 + (x & 3)] ? b : a; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } cx.putImageData(id, 0, 0); }
    $('#bootCap').innerHTML = ''; $('#bootFile').textContent = 'ARCHIVE // UNLOCKED';
    let i = 0; const q = $('#bootQuote'); const typer = setInterval(() => { if (done) return clearInterval(typer); q.textContent = INTRO_QUOTE.slice(0, ++i) + (i < INTRO_QUOTE.length ? '█' : ''); if (i >= INTRO_QUOTE.length) clearInterval(typer); }, 20);
    later(finish, 4200);
  }
  later(titleCard, START + SLOT * picks.length + 400);
}

/* ---- ambient motion on the empty workspace ---- */
function buildAmbient() {
  const em = $('#empty'); if (!em || $('.floaters', em)) return;
  const fl = h('div', { class: 'floaters' });
  const items = [
    ['img', 'assets/art/gallery/sticker-gems.png', 12, 22, 70, 0.9], ['img', 'assets/art/gallery/sticker-doodle.png', 70, 74, 150, 0.6],
    ['heart', '', 82, 18, 54, 1.2], ['heart', '', 8, 70, 34, 0.7], ['star', '', 24, 84, 26, 1.4], ['star', '', 88, 52, 20, 0.5], ['star', '', 46, 12, 16, 1.1], ['img', 'assets/art/gallery/sticker-gems.png', 90, 86, 40, 1.5],
  ];
  items.forEach(([kind, src, x, y, size, depth], i) => {
    const el = kind === 'img' ? h('img', { src, alt: '' }) : h('span', { html: kind === 'heart' ? '<svg viewBox="0 0 40 40"><use href="#i-mark"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.3 6.1 20l1.7-6.7L2.5 8.9l6.9-.5z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' });
    const wrap = h('div', { class: 'floater ' + kind, style: `left:${x}%;top:${y}%;width:${size}px;--depth:${depth};--dur:${18 + (i * 7) % 17}s;--delay:-${i * 3}s` }, el);
    fl.append(wrap);
  });
  em.insertBefore(fl, $('.empty-card', em));
  em.insertBefore(h('div', { class: 'reticle', html: '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width=".4"/><path d="M100 0v14M100 186v14M0 100h14M186 100h14" stroke="currentColor" stroke-width="1"/><path d="M100 4a96 96 0 0 1 60 21" fill="none" stroke="#ff4fa3" stroke-width="2"/></svg>' }), $('.empty-card', em));
  const tk = h('div', { class: 'ticker empty-ticker' }, h('div', { class: 'ticker-in' })); em.append(tk); fillTicker(tk, TICKER);
  em.addEventListener('mousemove', e => { const r = em.getBoundingClientRect(); em.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); em.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
}
buildAmbient();
