/* SHEDITHERS — the way in: dusk, a broken-down street of old Japanese huts, and at the end of the road a warehouse
 * leaking lime light and bass. You're holding the flyer. Everything here is drawn in code (no photos), Little Guy is
 * the artist's own doodle mounted on a cut-paper standee. The gate also wears the inside's lime render. */
(() => {
'use strict';
const gate = document.getElementById('gate'); if (!gate || typeof ARTWORKS === 'undefined') return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; };
const abs = u => new URL(u, location.href).href;

/* 1) the gate wears the same lime render as the inside of the site */
const render = el('div', 'g-render'); render.setAttribute('aria-hidden', 'true');
['who-will-you-be', 'are-we-alive-yet', 'when-you-rain'].map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean)
  .forEach((a, i) => { const L = el('i', 'pr-layer' + (i === 0 ? ' on' : '')); L.style.backgroundImage = `url('${abs(a.src)}')`; render.append(L); });
render.append(el('i', 'pr-tint'), el('i', 'pr-streaks'), el('i', 'pr-grid'));
gate.prepend(render);
let gi = 0; const gT = setInterval(() => { if (!document.body.contains(render)) return clearInterval(gT); const L = render.querySelectorAll('.pr-layer'); L[gi].classList.remove('on'); gi = (gi + 1) % L.length; L[gi].classList.add('on'); }, 7000);

/* 2) the walk (once per visit, only when the gate is showing) */
let seen = false; try { seen = sessionStorage.getItem('shd.archive.in') === '1' || sessionStorage.getItem('shd.walked') === '1'; } catch (_) { }
if (seen || /^#\/work\//.test(location.hash)) return;

const INK = '#0b0a09', PAPER = '#e9e3d1', BLOOD = '#c3141c', LIME = '#d4ff00', ORANGE = '#d9822b';
/* a broken old hut, drawn at the origin (bottom-left), 300 wide */
function hut(seed) {
  const r = (n => () => (n = (n * 9301 + 49297) % 233280) / 233280)(seed * 97 + 13);
  const hole = `M${60 + r() * 20} ${-95 + r() * 10} l${18 + r() * 10} ${-6} l${8} ${16 + r() * 8} l${-14} ${10} l${-10} ${-4}z`;
  const tiles = Array.from({ length: 7 }, (_, i) => `<path d="M${-20 + i * 48} -138 Q${0 + i * 48} ${-190 - r() * 6} ${20 + i * 48} -232" class="hl"/>`).join('');
  return `
  <rect x="0" y="-132" width="300" height="132" fill="url(#wkHutTex)" class="ol"/><rect x="0" y="-132" width="300" height="132" fill="#0b0a09" opacity=".55"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${18 + i * 32} -130 V0" class="hl"/>`).join('')}
  <rect x="38" y="-112" width="96" height="70" fill="#cfc4a6" class="ol"/>
  <path d="M38 -88 H134 M38 -65 H134 M70 -112 V-42 M102 -112 V-42" class="hl" stroke="#7a6a52"/>
  <path d="${hole}" fill="${INK}"/>
  <rect x="172" y="-120" width="74" height="120" fill="${INK}"/>
  <path d="M164 -96 L256 -40" stroke="#5a4636" stroke-width="10" stroke-linecap="square"/>
  <path d="M176 -120 h66 v34 l-8 -6 -8 8 -8 -7 -9 9 -8 -8 -9 7 -8 -6 -8 7z" fill="${BLOOD}" class="ol" opacity=".92"/>
  <path d="M-34 -130 Q150 -150 334 -130 L272 -232 Q150 -248 28 -232 Z" fill="url(#wkRoofTex)" class="ol"/>
  ${tiles}
  <path d="M${120 + r() * 60} -232 l18 26 l-10 18 l20 22 l-24 -6 l-16 -28 z" fill="#3a2a3e" opacity=".9"/>
  <path d="M28 -232 Q150 -262 272 -232" class="ol" fill="none"/>
  <circle cx="${150 + r() * 60}" cy="-112" r="11" fill="${BLOOD}" class="ol"/><path d="M${150} -124 v-8" class="hl"/>`;
}
const huts = [
  [-120, 830, 1.55, 3, 1], [215, 612, .82, 7, 1], [405, 520, .42, 11, 1],
  [1320, 830, 1.55, 5, -1], [985, 612, .82, 9, -1], [795, 520, .42, 2, -1]
].map(([x, y, s, seed, f]) => `<g transform="translate(${x} ${y}) scale(${s * f} ${s})">${hut(seed)}</g>`).join('');
const poles = [[945, 820, 1], [760, 560, .45], [688, 490, .2]].map(([x, y, s]) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-560 M-70 -520 H70 M-50 -480 H50" class="ol" stroke-width="9" fill="none"/><circle cx="-60" cy="-520" r="7" fill="${PAPER}"/><circle cx="60" cy="-520" r="7" fill="${PAPER}"/></g>`).join('');
const wires = `<path d="M875 302 Q760 360 728 308 Q700 360 674 389 M1015 302 Q880 380 788 312 Q740 370 702 394" fill="none" stroke="${INK}" stroke-width="2.4" opacity=".85"/>`;
const lasers = [-62, -38, -14, 12, 36, 58].map((a, i) => `<path class="beam b${i % 3}" d="M600 418 L${600 + Math.tan(a * Math.PI / 180) * 900} -480" stroke="${[LIME, BLOOD, '#4f9c95'][i % 3]}" stroke-width="${10 + (i % 2) * 8}" stroke-linecap="round" fill="none"/>`).join('');
const world = `<svg class="wk-world" viewBox="0 0 1200 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs>
  <linearGradient id="wkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0b14"/><stop offset=".55" stop-color="#2b1a2c"/><stop offset=".86" stop-color="#5a2a24"/><stop offset="1" stop-color="#8a5a1e"/></linearGradient>
  <radialGradient id="wkGlow" cx="600" cy="420" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${LIME}" stop-opacity=".75"/><stop offset=".35" stop-color="${LIME}" stop-opacity=".18"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
  <linearGradient id="wkDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2682a" stop-opacity="0"/><stop offset="1" stop-color="#2a0c0a" stop-opacity=".95"/></linearGradient>
  <linearGradient id="wkRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a1a"/><stop offset=".25" stop-color="#1a1714"/><stop offset="1" stop-color="#0e0c0a"/></linearGradient>
  <pattern id="wkHutTex" patternUnits="userSpaceOnUse" width="300" height="300"><image href="${abs('assets/ui/dither-tv.png')}" width="300" height="410" preserveAspectRatio="xMidYMid slice" style="image-rendering:pixelated"/></pattern>
  <pattern id="wkRoofTex" patternUnits="userSpaceOnUse" width="380" height="150"><rect width="380" height="150" fill="#120d0b"/><image href="${abs('assets/ui/dither-drink.png')}" width="380" height="520" opacity=".35" preserveAspectRatio="xMidYMid slice" style="image-rendering:pixelated"/></pattern>
  <filter id="wkHaze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="wkFog" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
  <filter id="wkInk"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
  <filter id="wkCut"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feFlood flood-color="${PAPER}"/><feComposite in2="d" operator="in" result="paper"/><feMerge><feMergeNode in="paper"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1200" height="860" fill="url(#wkSky)"/>
<image href="${abs('assets/ui/dither-sky.png')}" x="-60" y="-40" width="1320" height="520" preserveAspectRatio="xMidYMid slice" style="image-rendering:pixelated" opacity=".92"/>
<rect x="0" y="300" width="1200" height="170" fill="url(#wkDusk)"/>
<g class="wk-stars" fill="${PAPER}">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 233) % 1200}" cy="${(i * 97) % 300}" r="${i % 5 ? 1.2 : 2.2}" opacity="${.3 + (i % 4) * .15}"/>`).join('')}</g>
<g class="wk-lasers wk-haze" filter="url(#wkHaze)" opacity=".7">${lasers}</g><g class="wk-lasers" opacity=".45">${lasers}</g>
<g fill="#1c1622" class="ol"><rect x="250" y="300" width="22" height="160"/><rect x="300" y="330" width="16" height="130"/><rect x="920" y="320" width="18" height="140"/></g>
<path d="M262 300 q-30 -40 10 -70 q40 -30 0 -70 M308 330 q-26 -30 6 -56 M928 320 q24 -40 -8 -70" fill="none" stroke="#6b5a6e" stroke-width="10" stroke-linecap="round" opacity=".7"/>
<rect x="0" y="440" width="1200" height="420" fill="#120f0d"/>
<circle class="wk-pulse" cx="600" cy="420" r="420" fill="url(#wkGlow)"/>
<g class="wk-warehouse">
  <path d="M520 452 V392 l20 -18 20 18 20 -18 20 18 20 -18 20 18 20 -18 20 18 20 -18 20 18 V452z" fill="#16131a" class="ol"/>
  <rect x="540" y="402" width="120" height="8" fill="${LIME}" class="wk-strip"/>
  <rect x="586" y="420" width="28" height="32" fill="${LIME}" class="wk-door"/>
  <text x="600" y="398" text-anchor="middle" class="wk-sign">SHEDITHERS</text>
</g>
<path d="M560 452 L640 452 L1340 860 L-140 860 Z" fill="url(#wkRoad)"/>
<path d="M596 460 l8 0 l6 28 l-20 0z M592 520 l16 0 l12 62 l-40 0z M582 640 l36 0 l26 130 l-88 0z" fill="${PAPER}" opacity=".55"/>
<g class="wk-fogs" filter="url(#wkFog)"><ellipse class="fg1" cx="300" cy="560" rx="380" ry="40" fill="#e2682a" opacity=".22"/><ellipse class="fg2" cx="900" cy="600" rx="420" ry="46" fill="#f2b234" opacity=".16"/><ellipse class="fg3" cx="600" cy="470" rx="300" ry="30" fill="#d4ff00" opacity=".16"/></g>
<g filter="url(#wkInk)">${huts}${poles}${wires}</g>
<g class="wk-cut" transform="translate(470 600) scale(.62) rotate(-4)">
  <clipPath id="wkCutShape"><path d="M-6 -46 C10 -70 44 -78 70 -66 C88 -96 150 -100 172 -70 C196 -78 232 -70 246 -46 C262 -30 256 -6 246 6 L-8 8 C-18 -10 -18 -32 -6 -46 Z"/></clipPath>
  <path d="M30 10 L-60 84 L300 88 L232 10z" fill="#000" opacity=".45"/>
  <path d="M-14 -52 C4 -80 44 -88 70 -76 C88 -108 152 -110 176 -78 C200 -88 240 -78 254 -52 C272 -32 266 -2 254 14 L-14 16 C-26 -6 -26 -34 -14 -52 Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
  <g clip-path="url(#wkCutShape)"><image href="${abs('assets/archive/little-guy.png')}" x="-22" y="-74" width="284" height="82" style="mix-blend-mode:multiply"/></g>
  <path d="M110 14 v26 M138 14 v26" stroke="#3a2a1e" stroke-width="7"/>
</g>
<g class="wk-cut2" transform="translate(300 700) rotate(5)">
  <path d="M10 0 L-70 46 L120 50 L96 0z" fill="#000" opacity=".45"/>
  <g filter="url(#wkCut)"><image href="${abs('assets/ui/flower-cut.png')}" x="-20" y="-235" width="130" height="240"/></g>
</g>
</svg>`;
const flyer = `<svg class="wk-hands" viewBox="0 0 1200 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g filter="url(#wkInk)">
<g class="wk-stick">
  <path d="M150 760 L250 560" stroke="${LIME}" stroke-width="22" stroke-linecap="round"/>
  <path d="M150 760 L250 560" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>
  <path d="M120 860 C110 790 130 730 175 710 C215 692 250 712 252 745 C256 790 236 830 230 860 Z" fill="#c3141c" stroke="${ORANGE}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M168 712 q34 -18 52 4 M176 738 q40 -14 62 8 M182 766 q38 -10 58 10" fill="none" stroke="${ORANGE}" stroke-width="6" stroke-linecap="round"/>
  <path d="M150 800 l60 -6 M146 830 l70 -4 M190 720 l8 18 M214 742 l6 16" stroke="${PAPER}" stroke-width="5" stroke-linecap="round" opacity=".9"/>
</g>
<g class="wk-flyer-g">
  <g transform="rotate(5 820 680)">
    <rect x="660" y="470" width="320" height="420" fill="${PAPER}" stroke="${BLOOD}" stroke-width="6"/>
    <rect x="672" y="482" width="296" height="396" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="820" y="548" text-anchor="middle" class="fl-title">SHEDITHERS</text>
    <text x="820" y="582" text-anchor="middle" class="fl-sub">WAREHOUSE ★ 01</text>
    <g transform="translate(820 670)">
      <path d="M0 52 C-70 10 -86 -40 -52 -62 C-30 -76 -6 -66 0 -44 C6 -66 30 -76 52 -62 C86 -40 70 10 0 52 Z" fill="${BLOOD}" stroke="${INK}" stroke-width="5"/>
      <path d="M-40 -14 Q0 -44 40 -14 Q0 16 -40 -14 Z" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <circle cx="0" cy="-14" r="11" fill="${INK}"/><circle cx="-4" cy="-18" r="3" fill="#fff"/>
      <path d="M0 -70 V-56 M0 28 V42 M-64 -14 H-50 M50 -14 H64" stroke="${INK}" stroke-width="4"/>
      <path d="M-58 -70 l6 -12 M58 -70 l-6 -12" stroke="${LIME}" stroke-width="6" stroke-linecap="round"/>
    </g>
    <text x="820" y="752" text-anchor="middle" class="fl-line">the archive + the dither lab</text>
    <text x="820" y="782" text-anchor="middle" class="fl-line">doors: now · free · all night</text>
    <text x="820" y="812" text-anchor="middle" class="fl-small">NO IDENTITY REQUIRED</text>
    <text x="820" y="842" text-anchor="middle" class="fl-line r">♪ evo &amp; crevo</text>
    <path d="M690 500 l8 -16 8 16 -16 -10 h16z" fill="${LIME}" stroke="${INK}" stroke-width="2"/>
  </g>
  <path d="M1010 860 C1000 800 985 760 950 735 C930 720 905 724 896 742 L870 704 C858 684 830 690 832 714 L848 760 C850 790 870 820 880 860 Z" fill="#c3141c" stroke="${ORANGE}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M952 600 q24 6 26 26 q-2 20 -24 22 M960 652 q26 6 26 26 q-2 20 -24 22 M962 704 q22 8 20 26" fill="#c3141c" stroke="${ORANGE}" stroke-width="7" stroke-linecap="round"/>
  <path d="M850 712 l14 28 M872 760 l40 -10 M900 790 l50 -6 M930 820 l50 0 M966 616 l8 14 M972 668 l8 14" stroke="${PAPER}" stroke-width="5" stroke-linecap="round" opacity=".9"/>
</g>
</g></svg>`;
const title = 'SHEDITHERS WAREHOUSE'.split('').map((ch, i) => ch === ' ' ? '<i class="sp"></i>' : `<span style="--d:${(i * 0.09).toFixed(2)}s">${ch}</span>`).join('');
const walk = el('div', 'walk' + (reduce ? ' still' : ''));
walk.setAttribute('role', 'dialog'); walk.setAttribute('aria-label', 'Walking to the SHEDITHERS warehouse. Tap the flyer to go in.');
walk.innerHTML = `${world}<i class="wk-vig"></i>${flyer}
  <div class="wk-hud"><b class="wk-title" aria-label="SHEDITHERS WAREHOUSE">${title}</b><span class="wk-dist">0.40 MI ▸</span></div>
  <div class="wk-steps" aria-hidden="true"><span>you found a flyer.</span><span>follow the bass.</span></div>
  <button class="wk-flyer" type="button" aria-label="Tap the flyer to go in"><span>tap the flyer ▸</span></button>
  <button class="wk-skip" type="button">skip ▸</button><i class="wk-grain"></i>
  <div class="wk-bar top" aria-hidden="true"></div>
  <div class="wk-bar bot" aria-hidden="true"><span class="wk-obs">shedithers</span><span class="wk-date">08✦11✦2026</span><span class="wk-check"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`;
document.body.append(walk); document.body.classList.add('walking');
let done = false, dist = 0.4;
const dEl = walk.querySelector('.wk-dist');
const tick = setInterval(() => { dist = Math.max(0, dist - 0.05); dEl.textContent = dist > 0.01 ? `${dist.toFixed(2)} MI ▸` : 'YOU’RE HERE ★'; }, 600);
function finish() {
  if (done) return; done = true; clearInterval(tick); clearTimeout(auto);
  try { sessionStorage.setItem('shd.walked', '1'); } catch (_) { }
  walk.classList.add('arrive'); document.body.classList.remove('walking');
  setTimeout(() => { walk.remove(); const b = document.getElementById('enter'); if (b) b.focus(); }, reduce ? 0 : 1100);
}
walk.querySelector('.wk-flyer').addEventListener('click', finish);
walk.querySelector('.wk-skip').addEventListener('click', finish);
walk.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') finish(); });
const auto = setTimeout(finish, reduce ? 999999 : 7200);
setTimeout(() => walk.querySelector('.wk-flyer').focus(), 50);
})();
