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
  const art = id => { const w = typeof artById === 'function' && artById(id); return w ? `url('${new URL(w.src, location.href).href}')` : 'none'; };
  $$('.drink', body).forEach((d, i) => d.style.setProperty('--art', art(['i-love-shedithers', 'not-in-my-nature', 'when-you-rain', 'mad-women-and-poets'][i % 4])));
  body.prepend(h('div', { class: 'tip-banner', 'aria-hidden': 'true' }));
  const md = openModal({ title: 'BUY ME A DRINK', sub: '$' + cashtag().toUpperCase(), cls: 'sm', body, foot: h('span', { class: 'note' }, 'SHEDITHERS LOVES YOU ♥') });
  md.el.style.width = 'min(580px,94vw)'; md.el.classList.add('tip-modal');
  md.el.style.setProperty('--tip-banner', art('no-identity')); md.el.style.setProperty('--tip-guy', `url('${new URL('assets/archive/little-guy.png', location.href).href}')`);
  md.el.prepend(h('i', { class: 'tip-guy', 'aria-hidden': 'true' }));
  qrSVG(cashURL()).then(svg => { qr.innerHTML = svg || '<span class="note">QR UNAVAILABLE OFFLINE</span>'; });
}
function openShop() { if (!rbUser()) return toast('Shop is not set up yet', 'info'); openExt(shopURL()); }
const tiktokUser = () => { const t = String(CFG.tiktok || '').trim().replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/^@/, '').split(/[/?#]/)[0]; return /^[A-Za-z0-9_.]{2,24}$/.test(t) ? t : ''; };
const tiktokURL = () => `https://www.tiktok.com/@${tiktokUser()}`;
const ytUser = () => { const t = String(CFG.youtube || '').trim().replace(/^https?:\/\/(www\.)?youtube\.com\/@?/i, '').replace(/^@/, '').split(/[/?#]/)[0]; return /^[A-Za-z0-9_.-]{2,40}$/.test(t) ? t : ''; };
const ytURL = () => `https://www.youtube.com/@${ytUser()}`;
function openYoutube() { if (ytUser()) openExt(ytURL()); }
function openTiktok() { if (tiktokUser()) openExt(tiktokURL()); }
let lastSuggest = 0;
function openSuggest() {
  const to = String(CFG.email || '').trim(); if (!to) return toast('Suggestions are not set up yet', 'info');
  let kind = 'IDEA';
  const kinds = h('div', { class: 'seg', style: { width: '100%' } }, ['IDEA', 'BUG', 'LOVE NOTE', 'COLLAB'].map((k, i) => h('button', { class: i ? '' : 'on', style: { flex: 1 }, onclick: e => { kind = k; $$('button', kinds).forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, k)));
  const name = h('input', { class: 'inp', maxLength: 60, placeholder: 'optional', spellcheck: false });
  const reply = h('input', { class: 'inp', type: 'email', maxLength: 120, placeholder: 'optional — only if you want a reply', spellcheck: false });
  const msg = h('textarea', { class: 'inp sug-msg', maxLength: 2000, placeholder: 'What should SHEDITHERS do next? New effects, bugs, ideas, love…' });
  const honey = h('input', { type: 'text', name: '_honey', tabIndex: -1, autocomplete: 'off', style: { position: 'absolute', left: '-9999px' } });
  const count = h('span', { class: 'note' }, '0 / 2000'); msg.addEventListener('input', () => count.textContent = `${msg.value.length} / 2000`);
  const status = h('div', { class: 'ex-status' });
  const mailto = () => `mailto:${to}?subject=${encodeURIComponent('SHEDITHERS ' + kind.toLowerCase())}&body=${encodeURIComponent(msg.value + (name.value ? '\n\n— ' + name.value : ''))}`;
  const send = async () => {
    const text = msg.value.trim(); if (text.length < 3) { msg.focus(); status.textContent = 'WRITE A MESSAGE FIRST'; return; }
    if (honey.value) return; if (Date.now() - lastSuggest < 45000) { status.textContent = 'THANKS — PLEASE WAIT A MOMENT BEFORE SENDING ANOTHER'; return; }
    if (reply.value && !reply.checkValidity()) { reply.focus(); status.textContent = 'THAT EMAIL LOOKS OFF — FIX IT OR LEAVE IT BLANK'; return; }
    sendBtn.disabled = true; status.textContent = 'SENDING…';
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: `SHEDITHERS ${kind.toLowerCase()} ♥`, _template: 'table', _captcha: 'false', type: kind, name: name.value.trim() || 'anonymous', email: reply.value.trim() || 'not given', message: text, sent_from: location.href }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'HTTP ' + r.status);
      lastSuggest = Date.now(); md.close(); toast('Suggestion sent — thank you ♥');
    } catch (e) { sendBtn.disabled = false; status.innerHTML = ''; status.append(/activat/i.test(e.message) ? 'THE ARTIST’S INBOX IS BEING SET UP — PLEASE ' : 'COULD NOT SEND (' + e.message + '). ', h('a', { href: mailto(), style: { color: 'var(--pink)' } }, 'EMAIL IT INSTEAD ▸')); }
  };
  const sendBtn = h('button', { class: 'btn primary', onclick: send }, '✉ SEND');
  const body = h('div', { style: { position: 'relative' } }, honey,
    h('p', { class: 'note', style: { marginBottom: '12px', color: 'var(--tx2)' } }, 'Tell the artist what you want next. Every message is read ♥'),
    h('div', { class: 'field' }, h('label', null, 'Type'), kinds),
    h('div', { class: 'field' }, h('label', null, 'Message'), msg, count),
    h('div', { class: 'row2', style: { gap: '10px' } }, h('div', { class: 'field', style: { flex: 1 } }, h('label', null, 'Your name'), name), h('div', { class: 'field', style: { flex: 1.4 } }, h('label', null, 'Your email'), reply)), status);
  const md = openModal({ title: 'SUGGESTION BOX', sub: 'STRAIGHT TO THE ARTIST', cls: 'sm', body, foot: [h('a', { class: 'note', href: mailto(), onclick: e => { e.currentTarget.href = mailto(); }, style: { marginRight: 'auto', color: 'var(--tx3)' } }, 'or open your email app'), h('button', { class: 'btn', onclick: () => md.close() }, 'CANCEL'), sendBtn] });
  md.el.style.width = 'min(560px,94vw)'; setTimeout(() => msg.focus(), 40);
}
function supportUI() {
  const tip = !!cashtag(), shop = !!rbUser(), tt = !!tiktokUser();
  $('#railYoutube').classList.toggle('hidden', !ytUser()); $('#emYoutube').classList.toggle('hidden', !ytUser());
  $('#railTiktok').classList.toggle('hidden', !tt); $('#emTiktok').classList.toggle('hidden', !tt);
  $('#railSuggest').classList.toggle('hidden', !CFG.email); $('#emSuggest').classList.toggle('hidden', !CFG.email);
  $('#btnTip').classList.toggle('hidden', !tip); $('#btnShop').classList.toggle('hidden', !shop);
  $('#emTip').classList.toggle('hidden', !tip); $('#emShop').classList.toggle('hidden', !shop);
}
$('#railYoutube').onclick = openYoutube; $('#emYoutube').onclick = openYoutube;
$('#railTiktok').onclick = openTiktok; $('#emTiktok').onclick = openTiktok; $('#railSuggest').onclick = openSuggest; $('#emSuggest').onclick = openSuggest;
$('#btnTip').onclick = openTip; $('#btnShop').onclick = openShop; $('#emTip').onclick = openTip; $('#emShop').onclick = openShop;
supportUI();
/* gentle nudge after a successful export (at most once per session) */
let tipNudged = false;
function tipNudge() { if (tipNudged || !cashtag()) return; tipNudged = true; setTimeout(() => toast('Made something you love? ♥ TIP the artist or grab stickers in the shop', 'info', 6000), 1200); }

/* ---- thank-you note after every export, in the SHEDITHERS collage style ---- */
const TY_LINES = ['thank u for making something with me', 'u made that. that’s yours forever', 'thank u for being here with me', 'look what u made', 'thank u for not being ordinary'];
function thankYou(rec) {
  const art = ART_GALLERY[Math.floor(Math.random() * ART_GALLERY.length)], line = TY_LINES[Math.floor(Math.random() * TY_LINES.length)], quote = TICKER[Math.floor(Math.random() * TICKER.length)];
  const link = (show, label, fn, cls) => show ? h('button', { class: 'btn sm ' + (cls || ''), onclick: fn }, label) : null;
  const card = h('div', { class: 'ty-card' },
    h('figure', { class: 'ty-print' }, h('img', { src: art.src, alt: art.name, draggable: false, oncontextmenu: e => e.preventDefault() })),
    h('i', { class: 'ty-tape a' }), h('i', { class: 'ty-tape b' }),
    h('div', { class: 'ty-paper' },
      h('div', { class: 'ty-hand' }, line, h('span', null, ' ♥')),
      h('div', { class: 'ty-file' }, `▸ ${rec && rec.file ? rec.file : 'your file'} saved`),
      h('div', { class: 'ty-quote' }, '“' + quote + '”'),
      h('div', { class: 'ty-sign' }, '— shedithers', h('span', { html: '<svg viewBox="0 0 40 40"><use href="#i-mark"/></svg>' }))),
    h('div', { class: 'badge-heart ty-badge' }, h('span', { html: '<svg viewBox="0 0 24 24"><use href="#i-heart"/></svg>' }), h('div', null, h('s', null, 'Shedithers'), h('b', null, 'LOVES YOU'))));
  const links = h('div', { class: 'ty-links' }, link(cashtag(), '♥ BUY ME A DRINK', openTip, 'pink'), link(rbUser(), 'STICKERS & PRINTS', openShop), link(tiktokUser(), '♪ TIKTOK', openTiktok), link(ytUser(), '▶ YOUTUBE', openYoutube), link(CFG.email, '✉ IDEAS', openSuggest));
  const md = openModal({ title: 'TRANSMISSION COMPLETE', sub: 'THANK YOU', cls: 'sm ty', body: h('div', null, card, links), foot: h('button', { class: 'btn primary', onclick: () => md.close() }, 'KEEP CREATING ▸') });
  md.el.style.width = 'min(560px,94vw)';
}
function tipNudge(rec) { setTimeout(() => thankYou(rec), 450); }
