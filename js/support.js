/* SHEDITHERS — support the artist: Cash App tips + Redbubble shop. Configured in js/config.js. */
const CFG = (typeof SHD_CONFIG !== 'undefined' && SHD_CONFIG) || {};
const cashtag = () => { const t = String(CFG.cashapp || '').trim().replace(/^\$+/, ''); return /^[A-Za-z][A-Za-z0-9_-]{0,19}$/.test(t) ? t : ''; };
const rbUser = () => { const u = String(CFG.redbubble || '').trim().replace(/^https?:\/\/(www\.)?redbubble\.com\/people\//i, '').split(/[/?#]/)[0]; return /^[A-Za-z0-9_-]{2,40}$/.test(u) ? u : ''; };
const cashURL = amt => `https://cash.app/$${cashtag()}${amt ? '/' + amt : ''}`;
const shopURL = () => `https://www.redbubble.com/people/${rbUser()}/shop`;
const openExt = url => window.open(url, '_blank', 'noopener');

async function qrSVG(text) {
  try { if (!window.qrcode) await loadScript('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'); const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
  catch (_) { return ''; }
}
function openTip() {
  if (!cashtag()) return toast('Tips are not set up yet', 'info');
  const qr = h('div', { class: 'tip-qr' }, h('span', { class: 'note' }, 'LOADING QR…'));
  const body = h('div', null,
    h('div', { class: 'tip-head' }, h('span', { class: 'tip-heart', html: '<svg viewBox="0 0 40 40"><use href="#i-mark"/></svg>' }), h('p', null, CFG.tipLine || 'Buy the artist a drink ♥')),
    h('div', { class: 'drinks' }, (CFG.drinks || []).map(d => h('button', { class: 'drink', onclick: () => openExt(cashURL(d.amount)) }, h('i', null, d.emoji || '♥'), h('b', null, d.label), h('span', null, '$' + d.amount)))),
    h('div', { class: 'tip-row' }, h('button', { class: 'btn primary', onclick: () => openExt(cashURL()) }, `OPEN CASH APP · $${cashtag()}`), rbUser() ? h('button', { class: 'btn pink', onclick: () => openExt(shopURL()) }, 'STICKERS & PRINTS') : null),
    h('div', { class: 'tip-scan' }, qr, h('p', { class: 'note' }, 'ON A COMPUTER? SCAN WITH YOUR PHONE CAMERA TO TIP IN CASH APP.', h('br'), h('br'), 'Payments go straight to the artist through Cash App. SHEDITHERS never sees your payment details.')));
  openModal({ title: 'BUY ME A DRINK', sub: '$' + cashtag().toUpperCase(), cls: 'sm', body, foot: h('span', { class: 'note' }, 'SHEDITHERS LOVES YOU ♥') }).el.style.width = 'min(560px,94vw)';
  qrSVG(cashURL()).then(svg => { qr.innerHTML = svg || '<span class="note">QR UNAVAILABLE OFFLINE</span>'; });
}
function openShop() { if (!rbUser()) return toast('Shop is not set up yet', 'info'); openExt(shopURL()); }
function supportUI() {
  const tip = !!cashtag(), shop = !!rbUser();
  $('#btnTip').classList.toggle('hidden', !tip); $('#btnShop').classList.toggle('hidden', !shop);
  $('#emTip').classList.toggle('hidden', !tip); $('#emShop').classList.toggle('hidden', !shop);
}
$('#btnTip').onclick = openTip; $('#btnShop').onclick = openShop; $('#emTip').onclick = openTip; $('#emShop').onclick = openShop;
supportUI();
/* gentle nudge after a successful export (at most once per session) */
let tipNudged = false;
function tipNudge() { if (tipNudged || !cashtag()) return; tipNudged = true; setTimeout(() => toast('Made something you love? ♥ TIP the artist or grab stickers in the shop', 'info', 6000), 1200); }
