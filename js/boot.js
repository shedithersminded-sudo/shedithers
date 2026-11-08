/* SHEDITHERS — startup. The empty workspace shows the artist's reel untouched in a monitor frame. */
const FEED = { v: null };
function startArtFeed() {
  const em = $('#empty'); if (!em) return;
  if (!FEED.v) {
    const a = artById('become-unmarketable');
    FEED.v = h('video', { src: a.src, loop: true, autoplay: true, playsInline: true, preload: 'metadata' }); FEED.v.muted = true;
    FEED.v.addEventListener('contextmenu', e => e.preventDefault());
    em.append(h('figure', { class: 'feed-frame', onclick: () => openExhibit('become-unmarketable') }, FEED.v, h('figcaption', null, h('b', null, '● NOW SHOWING'), ' BECOME UNMARKETABLE'), h('span', { class: 'feed-open' }, 'OPEN ARCHIVE ▸')));
    FEED.v.addEventListener('loadeddata', () => { $('#feedState').textContent = 'SIGNAL LOCKED · ARCHIVE FEED'; });
    setInterval(() => { if (FEED.v && !FEED.v.paused) $('#feedClock').textContent = fmtTime(FEED.v.currentTime, 24); }, 250);
  }
  FEED.v.play().catch(() => { });
}
function stopArtFeed() { if (FEED.v) FEED.v.pause(); }

/* empty-state buttons */
$('#emImport').onclick = openFile; $('#emExhibit').onclick = () => openExhibit(); $('#railExhibit').onclick = () => openExhibit();

/* boot sequence lives in intro.js */

/* startup */
(async function init() {
  applySettings();
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
