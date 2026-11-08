/* SHEDITHERS — THE COMMENT SECTION: a live-feeling wall of words that flash in like TikTok comments.
 * Only real words: the artist's own captions + profile quote, words from the artworks, and (if added)
 * real fan comments in SHD_CONFIG.tiktokComments = [{ user: 'name', text: '...' }]. Nothing is made up. */
(() => {
'use strict';
if (typeof ARTWORKS === 'undefined') return;
const $ = (s, r = document) => r.querySelector(s);
const abs = u => new URL(u, location.href).href;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
function h(tag, props, ...kids) { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); return e; }

const CAPTIONS = [ // from the artist's TikTok (bio, profile picture, captions)
  'to divide and scatter.', 'those who unravel are returned to the chaos from which they were made.', 'to disintegrate into nothingness.', 'remember to forget.',
  'ᴺᵉᵛᵉʳ ᵇᵉ ᵃᶠʳᵃⁱᵈ ᵗᵒ ᵇᵉᶜᵒᵐᵉ ʷⁱˢᵉ', 'I forget you can just scan your scribbles/doodles.', 'was lost in my iPad for so long I forgot I did this 😵‍💫', 'S e e d l i n g', '𝔰𝔥𝔢𝔡𝔦𝔱𝔥𝔢𝔯𝔰 ░▒', 'digital collage · photomontage · dither & glitch art',
];
const ART = ARTWORKS.filter(a => a.words && a.type !== 'video');
const FANS = (Array.isArray(CFG.tiktokComments) ? CFG.tiktokComments : []).filter(c => c && c.text).map(c => ({ who: '@' + String(c.user || 'someone').replace(/^@/, ''), tag: 'on tiktok', text: String(c.text), art: null, fan: true }));
const OWN = [
  ...CAPTIONS.map(t => ({ who: '@shedithers', tag: 'caption', text: t, art: null })),
  ...ART.map(a => ({ who: 'from the art', tag: a.title.toLowerCase(), text: a.words.split(' · ')[0], art: a })),
];
// real comments lead; one of the artist's own lines drops in every fifth
const feed = FANS.length ? FANS.flatMap((f, k) => (k % 4 === 3 ? [f, OWN[(k / 4 | 0) % OWN.length]] : [f])) : OWN;
const AV = ART.slice(0, 12);
// avatars: little stars, each person gets their own shape + ink (same name = same star every time)
const INKS = ['#c3141c', '#e2682a', '#f2b234', '#6f7d3a', '#2f6f6a', '#5c7896', '#6b3a5a', '#d4ff00', '#e9e3d1'];
const SHAPES = [[5, .44], [4, .36], [6, .5], [8, .6], [12, .74], [7, .48], [4, .62], [10, .55]];
const hashS = s => { let x = 7; for (const c of s) x = (x * 31 + c.codePointAt(0)) >>> 0; return x; };
function starAv(who) {
  const name = who.replace(/^@/, ''), x = hashS(name), [n, r] = SHAPES[x % SHAPES.length], ink = INKS[(x >> 4) % INKS.length];
  const pts = []; for (let k = 0; k < n * 2; k++) { const a = Math.PI * k / n - Math.PI / 2, d = k % 2 ? 22 * r : 22; pts.push((25 + d * Math.cos(a)).toFixed(1) + ',' + (25 + d * Math.sin(a)).toFixed(1)); }
  const dark = ['#e9e3d1', '#d4ff00', '#f2b234'].includes(ink), ch = (name.match(/[a-z0-9]/i) || ['✦'])[0].toUpperCase();
  const i = document.createElement('i'); i.className = 'vc-av'; i.setAttribute('aria-hidden', 'true'); i.style.setProperty('--tw', ((x >> 8) % 5 - 2) * 9 + 'deg');
  i.innerHTML = `<svg viewBox="0 0 50 50"><polygon points="${pts.join(' ')}" fill="${ink}" stroke="#0b0a09" stroke-width="2.5" stroke-linejoin="round"/><text x="25" y="25" dy=".36em" text-anchor="middle" fill="${dark ? '#0b0a09' : '#e9e3d1'}">${ch}</text></svg>`;
  return i;
}
let likes = {}; try { likes = JSON.parse(localStorage.getItem('shd.voiceLikes') || '{}'); } catch (_) { }
const FONTS = ['vf-wet', 'vf-hand', 'vf-glitch', 'vf-marker', 'vf-bebas', 'vf-serif', 'vf-mono'];

function build() {
  const list = h('div', { class: 'vc-list', 'aria-live': 'polite' });
  const big = h('div', { class: 'vc-big', 'aria-hidden': 'true' });
  let i = Math.floor(Math.random() * feed.length), timer = 0, paused = false;
  const bubble = (f, k) => {
    const id = (f.who + f.text).slice(0, 60);
    const heart = h('button', { type: 'button', class: 'vc-like' + (likes[id] ? ' on' : ''), 'aria-label': 'Like this' }, '♥', h('span', null, String(likes[id] || 0)));
    heart.onclick = e => { e.stopPropagation(); likes[id] = (likes[id] || 0) + 1; heart.classList.add('on', 'pop'); heart.querySelector('span').textContent = likes[id]; setTimeout(() => heart.classList.remove('pop'), 500); try { localStorage.setItem('shd.voiceLikes', JSON.stringify(likes)); } catch (_) { } };
    const b = h('div', { class: `vc-b ${FONTS[(k + i) % FONTS.length]}${f.fan ? ' fan' : ''}`, style: `--r:${((k * 37 + i * 13) % 9 - 4) * .6}deg`, tabindex: '0', role: 'button', 'aria-label': `${f.who}: ${f.text}. Tap to blow it up.` },
      starAv(f.who),
      h('div', { class: 'vc-tx' }, h('small', null, h('b', null, f.who), ' · ', f.tag), h('p', null, f.text)), heart);
    const blow = () => { big.textContent = f.text; big.className = 'vc-big on ' + FONTS[(k + i + 2) % FONTS.length]; clearTimeout(big._t); big._t = setTimeout(() => big.classList.remove('on'), 2600); };
    b.addEventListener('click', blow); b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blow(); } });
    return b;
  };
  const push = () => {
    const f = feed[i % feed.length]; i++;
    const b = bubble(f, list.childElementCount); b.classList.add('in'); list.prepend(b);
    while (list.childElementCount > 5) list.lastElementChild.remove();
  };
  for (let k = 0; k < 4; k++) push();
  const loop = () => { clearTimeout(timer); if (!sec.isConnected) return; if (!paused && !document.hidden) push(); timer = setTimeout(loop, reduce ? 6000 : 2600); };
  const sec = h('section', { class: 'p-mod p-voices' },
    h('div', { class: 'p-head' }, h('small', null, 'コメント'), h('b', null, 'THE COMMENT SECTION'), h('span', null, 'REAL COMMENTS FROM MY TIKTOKS · TAP ONE TO BLOW IT UP · ♥ IT')),
    h('div', { class: 'vc-wrap' }, h('div', { class: 'vc-strip', 'aria-hidden': 'true' }, ...AV.slice(0, 6).map(a => h('i', { style: `background-image:url('${abs(a.src)}')` }))), list, big,
      h('div', { class: 'vc-ctrl' }, h('button', { type: 'button', class: 'vc-btn', onclick: e => { paused = !paused; e.currentTarget.textContent = paused ? '▶ play' : '❚❚ pause'; } }, '❚❚ pause'), h('button', { type: 'button', class: 'vc-btn', onclick: push }, 'next ▸'), h('a', { class: 'vc-btn red', href: 'https://www.tiktok.com/@' + String(CFG.tiktok || 'shedithers').replace(/^@/, ''), target: '_blank', rel: 'noopener' }, 'say something on tiktok ▸'))));
  sec.addEventListener('mouseenter', () => { paused = true; }); sec.addEventListener('mouseleave', () => { paused = false; });
  const io = new IntersectionObserver(es => { if (!sec.isConnected) { clearTimeout(timer); io.disconnect(); return; } if (es[0].isIntersecting) loop(); else clearTimeout(timer); }); io.observe(sec);
  return sec;
}
function add() {
  const P = $('.portal'); if (!P || $('.p-voices', P)) return;
  const after = $('.p-deck', P) || $('.p-pop', P), sec = build();
  if (after && after.nextSibling) P.insertBefore(sec, after.nextSibling); else P.append(sec);
}
const view = $('#view'); if (view) { new MutationObserver(add).observe(view, { childList: true }); add(); }
})();
