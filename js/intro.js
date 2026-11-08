/* SHEDITHERS — intro sequence + ambient motion. Artwork is shown read-only (no filters on the art). */
const ART_GALLERY = ARTWORKS.filter(a => a.type !== 'video' && a.col !== 'objects').map(a => ({ src: a.src, name: a.title, id: a.id }));
const TICKER = ['SHEDITHERS LOVES YOU', 'I DON’T WANT ORDINARY. IT’S NOT IN MY NATURE.', 'BECOMING AND UNBECOMING', 'ERROR: NO IDENTITY', 'DREAMS AREN’T DREAMS', 'ALL SIGNS POINT TO YES', 'CLICK TO BE SAVED', 'YOU KEEP FORGETTING', 'DREAM WITHOUT ACTION IS HALLUCINATION', '@SHEDITHERS'];
const INTRO_QUOTE = 'BECOMING AND UNBECOMING SO I CAN BECOME WHO I ALWAYS HAVE BEEN AND NEVER WAS';
const INTRO_LOG = ['MOUNTING DITHER CORE ………… OK', `LOADING ${E.EFFECTS.length} EFFECT MODULES ………… OK`, 'SPAWNING WORKERS [PREVIEW / BACKGROUND] ………… OK', `OPENING ARTIST ARCHIVE ………… ${ARTWORKS.length} FILES · READ-ONLY`, 'IDENTITY CHECK ………… ERROR: NO IDENTITY', 'SHEDITHERS LOVES YOU ………… ♥'];

async function loadArtURL(url, name) {
  try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); const b = await r.blob(); await importFiles([new File([b], name, { type: b.type || 'image/png' })]); }
  catch (e) { toast('Could not load (' + e.message + ')', 'err'); }
}
function fillTicker(el, items) { const inner = $('.ticker-in', el); if (!inner) return; const run = items.map(t => `<span>${t}</span><b>✦</b>`).join(''); inner.innerHTML = run + run; }

/* ---- intro: boot log → framed artwork prints (untouched) → title card ---- */
function runBoot() {
  const boot = $('#boot'); let done = false; const tm = [];
  const later = (fn, ms) => tm.push(setTimeout(() => { if (!done) fn(); }, ms));
  const finish = () => { if (done) return; done = true; tm.forEach(clearTimeout); boot.classList.add('gone'); document.body.classList.add('ready'); document.removeEventListener('keydown', onKey, true); setTimeout(() => { boot.remove(); fitView(); }, 700); };
  const onKey = e => { if (e.key !== 'Tab') { e.preventDefault(); finish(); } };
  if (!SETTINGS.boot) { finish(); return; }
  boot.addEventListener('click', finish); document.addEventListener('keydown', onKey, true);
  fillTicker($('.boot-ticker'), TICKER);
  INTRO_LOG.forEach((l, k) => later(() => { $('#bootLog').append(h('div', null, '> ' + l)); $('#boot .boot-bar i').style.width = ((k + 1) / INTRO_LOG.length * 100) + '%'; }, 150 + k * 230));
  // framed prints: the artwork element itself is never filtered or transformed — only its frame moves
  const picks = ['not-in-my-nature', 'click-to-be-saved', 'you-keep-forgetting'].map(artById).filter(Boolean);
  const deck = h('div', { class: 'boot-deck' }); boot.insertBefore(deck, $('.boot-inner', boot));
  picks.forEach((a, i) => deck.append(h('figure', { class: 'boot-print', style: `--r:${[-6, 4, -2][i]}deg;--x:${[-34, 0, 34][i]}%` }, h('img', { src: a.src, alt: a.title, draggable: false }), h('figcaption', null, `FILE 0x${String(a.n).padStart(2, '0')} // ${a.title}`))));
  const SLOT = 900, START = 1650;
  picks.forEach((a, i) => later(() => { boot.classList.add('montage'); $$('.boot-print', deck).forEach((f, k) => f.classList.toggle('on', k <= i)); $('#bootFile').textContent = `FILE 0x${String(a.n).padStart(2, '0')} // READ-ONLY`; $('#bootCap').innerHTML = `<b>${a.title}</b><span>FROM THE ARCHIVE · ${a.date}</span>`; }, START + i * SLOT));
  let titled = false;
  function titleCard() {
    if (titled || done) return; titled = true; boot.classList.remove('montage'); boot.classList.add('title');
    $('#bootCap').innerHTML = ''; $('#bootFile').textContent = 'ARCHIVE // UNLOCKED';
    let i = 0; const q = $('#bootQuote'); const typer = setInterval(() => { if (done) return clearInterval(typer); q.textContent = INTRO_QUOTE.slice(0, ++i) + (i < INTRO_QUOTE.length ? '█' : ''); if (i >= INTRO_QUOTE.length) clearInterval(typer); }, 20);
    later(finish, 4200);
  }
  later(titleCard, START + SLOT * picks.length + 500);
}

/* ---- ambient motion on the empty workspace (interface only) ---- */
function buildAmbient() {
  const em = $('#empty'); if (!em || $('.floaters', em)) return;
  const fl = h('div', { class: 'floaters' });
  const heart = '<svg viewBox="0 0 40 40"><use href="#i-mark"/></svg>', star = '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.3 6.1 20l1.7-6.7L2.5 8.9l6.9-.5z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  [['heart', 12, 22, 62, 0.9], ['star', 70, 74, 30, 0.6], ['heart', 82, 18, 54, 1.2], ['heart', 8, 70, 34, 0.7], ['star', 24, 84, 26, 1.4], ['star', 88, 52, 20, 0.5], ['star', 46, 12, 16, 1.1], ['heart', 90, 86, 40, 1.5]].forEach(([kind, x, y, size, depth], i) =>
    fl.append(h('div', { class: 'floater ' + kind, style: `left:${x}%;top:${y}%;width:${size}px;--depth:${depth};--dur:${18 + (i * 7) % 17}s;--delay:-${i * 3}s` }, h('span', { html: kind === 'heart' ? heart : star }))));
  em.insertBefore(fl, $('.empty-card', em));
  em.insertBefore(h('div', { class: 'reticle', html: '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width=".4"/><path d="M100 0v14M100 186v14M0 100h14M186 100h14" stroke="currentColor" stroke-width="1"/><path d="M100 4a96 96 0 0 1 60 21" fill="none" stroke="#ff4fa3" stroke-width="2"/></svg>' }), $('.empty-card', em));
  const tk = h('div', { class: 'ticker empty-ticker' }, h('div', { class: 'ticker-in' })); em.append(tk); fillTicker(tk, TICKER);
  em.addEventListener('mousemove', e => { const r = em.getBoundingClientRect(); em.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); em.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
}
buildAmbient();
