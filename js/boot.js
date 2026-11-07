/* SHEDITHERS — boot sequence, live dithered artist feed, startup. */
const FEED = { v: null, raf: 0, busy: false, last: 0, ok: true };
const FEED_STACK = [{ id: 'grayscale', mix: 100, p: {} }, { id: 'contrast', mix: 100, p: { amt: 35 } }, { id: 'bayer4', mix: 100, p: { pal: 'acid', size: 1, thr: 52 } }];
function stackFull(st) { return st.map(e => ({ id: e.id, mix: e.mix, p: Object.assign(E.defaults(E.MAP[e.id]), e.p) })); }
const tmpC = h_canvas(1, 1), tmpX = tmpC.getContext('2d', { willReadFrequently: true });
async function ditherTo(src, sw, sh, dst, W, stack) {
  const H2 = Math.max(1, Math.round(W * sh / sw)); tmpC.width = W; tmpC.height = H2; tmpX.drawImage(src, 0, 0, W, H2);
  const id = tmpX.getImageData(0, 0, W, H2);
  const m = await PV.run({ buf: id.data.buffer, w: W, h: H2, stack: stackFull(stack), ctx: { S: 1, t: 0, frame: 0 } }, [id.data.buffer]);
  dst.width = W; dst.height = H2; dst.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.buf), W, H2), 0, 0);
}
function startArtFeed() {
  const cv = $('#artFeed'); if (FEED.v) { FEED.v.play().catch(() => { }); loop(); return; }
  const v = h('video', { src: ART.reel, loop: true, playsInline: true, preload: 'auto' }); v.muted = true; FEED.v = v;
  v.addEventListener('loadeddata', () => { $('#feedState').textContent = 'SIGNAL LOCKED · BAYER 4×4 · ACID'; v.play().catch(() => { }); loop(); });
  v.addEventListener('error', () => { $('#feedState').textContent = 'NO SIGNAL'; });
  function loop() {
    cancelAnimationFrame(FEED.raf); if (S.media) return;
    FEED.raf = requestAnimationFrame(loop);
    const now = performance.now(); if (FEED.busy || now - FEED.last < 66 || v.readyState < 2) return; FEED.last = now;
    $('#feedClock').textContent = fmtTime(v.currentTime, 24);
    if (!FEED.ok) { cv.width = v.videoWidth; cv.height = v.videoHeight; cv.getContext('2d').drawImage(v, 0, 0); return; }
    FEED.busy = true;
    ditherTo(v, v.videoWidth, v.videoHeight, cv, 320, FEED_STACK).catch(() => { FEED.ok = false; cv.style.filter = 'grayscale(1) contrast(1.6) sepia(1) hue-rotate(30deg) saturate(3)'; $('#feedState').textContent = 'RAW SIGNAL (RUN START.BAT FOR LIVE DITHER)'; }).finally(() => FEED.busy = false);
  }
}
function stopArtFeed() { cancelAnimationFrame(FEED.raf); if (FEED.v) FEED.v.pause(); }

/* empty-state buttons */
$('#emImport').onclick = openFile; $('#emReel').onclick = () => loadArt('reel'); $('#emCollage').onclick = () => loadArt('collage');

/* boot sequence lives in intro.js */

/* startup */
(async function init() {
  applySettings();
  document.body.append(h('img', { id: 'artCacheImg', src: ART.collage, style: { display: 'none' }, alt: '' }));
  $('#projName').value = '';
  try { S.library = (await DB.all('media')).sort((a, b) => (b.added || 0) - (a.added || 0)); } catch (e) { console.warn('IndexedDB unavailable', e); }
  H.reset(); renderAll(); runBoot();
  const last = LS.get('shd.last');
  if (SETTINGS.autosave && last) {
    try { const r = await DB.get('projects', last); if (r) { await applyProjectRecord(r); toast(`Session restored · ${r.name}`, 'info'); } } catch (e) { console.warn(e); }
  }
  if (!S.media) startArtFeed();
  if (location.protocol === 'file:') toast('Opened from file:// — video export and artist files need the local server. Run start.bat.', 'info', 7000);
})();

/* ---------- share / install (PWA) ---------- */
let installEvt = null;
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e)));
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#btnInstall').classList.remove('hidden'); });
window.addEventListener('appinstalled', () => { $('#btnInstall').classList.add('hidden'); toast('SHEDITHERS installed ♥'); });
$('#btnInstall').onclick = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('#btnInstall').classList.add('hidden'); };
$('#btnShare').onclick = openShare;
function openShare() {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const url = location.origin + location.pathname;
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('Link copied ♥'); } catch (_) { toast('Copy failed — select the link manually', 'err'); } };
  const native = async () => { try { await navigator.share({ title: 'SHEDITHERS — Dither Lab', text: 'Make dithered, glitched, glowing art with SHEDITHERS ♥', url }); } catch (e) { if (e.name !== 'AbortError') copy(); } };
  const body = h('div', null,
    h('div', { class: 'field' }, h('label', null, 'App link'), h('div', { class: 'row2' }, h('input', { class: 'inp', value: url, readOnly: true, onclick: e => e.target.select() }), h('button', { class: 'btn sm', onclick: copy }, 'COPY'), navigator.share ? h('button', { class: 'btn sm pink', onclick: native }, 'SHARE') : null)),
    local ? h('p', { class: 'note', style: { color: 'var(--pink)', marginBottom: '12px' } }, 'You are running SHEDITHERS on this computer only (localhost) — friends cannot open this link yet. Put it online first (free), see below.') : null,
    h('div', { class: 'sec-t' }, 'PUT IT ONLINE · SELL IT'),
    h('div', { class: 'note', html: '<b>1. PACKAGE</b> — double-click <b>package.bat</b> in the shedithers folder. It builds <b>dist/shedithers-web.zip</b>.<br><br><b>2. SHARE FREE</b> — drag the zip (or the folder) onto <b>Netlify Drop</b>, or push it to <b>GitHub Pages</b>. You get a public link anyone can open; they can also INSTALL it as an app.<br><br><b>3. SELL</b> — upload the zip to <b>itch.io</b> as an HTML project (set a price or pay-what-you-want), or sell the zip on <b>Gumroad</b>.<br><br>Full step-by-step guide: <b>SHARING.md</b>.' }),
    h('div', { class: 'sec-t', style: { marginTop: '14px' } }, 'SHARE YOUR ART'),
    h('p', { class: 'note' }, 'Every export window has a ♥ SHARE button: on phones it opens the share sheet (TikTok, Instagram, Messages); on desktop it saves the file for upload.'));
  openModal({ title: 'SHARE SHEDITHERS', sub: 'FRIENDS · STORE', cls: 'sm', body, foot: h('span', { class: 'note' }, 'SHEDITHERS LOVES YOU ♥') }).el.style.width = 'min(560px,94vw)';
}
