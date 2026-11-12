/* SHEDITHERS — the blob-tracking art screen used by the intros (archive walk, archive gate, Dither Lab opening).
 * The artist's pieces flash by on the beat, dithered to ink + paper, acid-yellow characters flicker on a grid,
 * and tracking boxes lock onto the brightest shapes in each piece, with labels and lines between them.
 * Inspo the artist picked: a crowd-tracking clip + a dithered night clip with yellow glyphs. Built from scratch.
 * SHD_BLOBSCREEN(host, { ids, bpm, beatsPer, glyphs }) → { stop() }   (ids default: SHD_INTRO_ART) */
(() => {
'use strict';
if (window.SHD_BLOBSCREEN) return;
const css = `
.bs-host{position:absolute;inset:0;overflow:hidden;background:#0b0a09}
.bs-host canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.bs-art{image-rendering:pixelated;image-rendering:crisp-edges}
.bs-ov{mix-blend-mode:normal}
`;
document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&*+=<>/\\[]{}()?!:;~^';
const WORDS = ['NO IDENTITY', 'SUBJECT: YOU', 'GHOST', 'LOOPING', 'SIGNAL WEAK', 'UNVERIFIED', 'REMEMBER TO FORGET', 'HUMAN?', 'conf .41', 'ERROR'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the tracking look (learned from the artist's references): chained thin lines, boxes, crops of the real piece,
 * red dots with x/y, little data cards, the artist's own words in small italics, a faint golden spiral */
  // the artist's own words, cut into short lines for the poem labels
const LINES = (typeof ARTWORKS !== 'undefined' ? ARTWORKS : []).map(a => String(a.words || '').trim()).filter(Boolean).flatMap(w => w.split(/[.,·?!]\s*/)).map(w => w.trim()).filter(w => w.length > 3 && w.length < 46);
const NAMES = ['SHEDITHERS', 'NO IDENTITY', 'GHOST', 'YOU', 'UNKNOWN', 'GUEST'], KINDS = ['poem', 'plain', 'dot', 'crop', 'num', 'plain', 'card', 'poem', 'dot', 'plain'];
let made = 0;
const newTrack = () => { const n = made++, d = new Date(); return { x: 0, y: 0, w: 0, h: 0, n: n % 40 + 1, kind: KINDS[n % KINDS.length], words: LINES.length ? LINES[(Math.random() * LINES.length) | 0] : 'i was never really here', num: String(100 + (Math.random() * 900 | 0)), name: NAMES[n % NAMES.length], time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, date: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` }; };
function paintTracks(ox, tracked, W, H, crop) {
    const C = e => [e.x + e.w / 2, e.y + e.h / 2];
  // a faint golden circle + spiral guide around the biggest shape (dancer reference)
  if (tracked[0]) { const [gx, gy] = C(tracked[0]), R = Math.min(W, H) * .32; ox.strokeStyle = 'rgba(233,227,209,.22)'; ox.lineWidth = 1; ox.beginPath(); ox.arc(gx, gy, R, 0, Math.PI * 2); ox.stroke();
    ox.beginPath(); let r = R, x0 = gx, y0 = gy; for (let q = 0; q < 6; q++) { ox.arc(x0, y0, r, q * Math.PI / 2, (q + 1) * Math.PI / 2); const nr = r * .618; x0 += Math.cos((q + 1) * Math.PI / 2) * (r - nr); y0 += Math.sin((q + 1) * Math.PI / 2) * (r - nr); r = nr; } ox.stroke(); }
  // thin white network: each shape joins its nearest neighbour, like a chain (touchdesigner reference)
  ox.lineWidth = 1; ox.beginPath();
  const left = tracked.slice(); let at = left.shift(), path = [at];
  while (left.length && at) { let bi = 0, bd = 1e9; left.forEach((e, i) => { const d = Math.hypot(C(e)[0] - C(at)[0], C(e)[1] - C(at)[1]); if (d < bd) { bd = d; bi = i; } }); at = left.splice(bi, 1)[0]; path.push(at); }
  path.forEach((e, i) => { if (!i) return; const a2 = C(path[i - 1]), b2 = C(e); ox.moveTo(a2[0], a2[1]); ox.lineTo(b2[0], b2[1]); });
  if (path.length > 4) { const a2 = C(path[0]), b2 = C(path[path.length - 1]); ox.moveTo(a2[0], a2[1]); ox.lineTo(b2[0], b2[1]); }
  ox.strokeStyle = 'rgba(11,10,9,.7)'; ox.lineWidth = 3; ox.stroke(); ox.strokeStyle = 'rgba(233,227,209,.8)'; ox.lineWidth = 1; ox.stroke();
  ox.shadowColor = 'rgba(0,0,0,.9)';
  tracked.forEach((e, i) => {
    const [cx, cy] = C(e); ox.shadowBlur = 0;
    // some boxes show a crop of the real piece inside (tree reference)
    if (e.kind === 'crop' && crop) crop(e);
    ox.strokeStyle = 'rgba(11,10,9,.85)'; ox.lineWidth = 3; ox.strokeRect(e.x + .5, e.y + .5, e.w, e.h); ox.strokeStyle = 'rgba(233,227,209,.95)'; ox.lineWidth = 1; ox.strokeRect(e.x + .5, e.y + .5, e.w, e.h);
    // centre: filled blood-red dot (dancer reference) or a small paper dot
    ox.beginPath(); ox.arc(cx, cy, e.kind === 'dot' ? Math.min(9, Math.max(4, e.w * .22)) : 2.5, 0, Math.PI * 2); ox.fillStyle = e.kind === 'dot' ? '#c3141c' : '#e9e3d1'; ox.fill();
    // labels: lines from the artist's own words, coordinates, or a little data card
    if (e.kind === 'poem') { ox.shadowBlur = 4; ox.font = 'italic 12px "Times New Roman", Georgia, serif'; ox.fillStyle = 'rgba(233,227,209,.92)'; ox.fillText(e.words, e.x + e.w + 6, e.y + 10); }
    else if (e.kind === 'dot') { ox.shadowBlur = 4; ox.font = '11px Arial, sans-serif'; ox.fillStyle = '#e9e3d1'; ox.fillText(`x: ${cx | 0}  y: ${cy | 0}`, e.x + e.w + 4, e.y + 10); }
    else if (e.kind === 'card') { ox.font = '9px "JetBrains Mono", monospace'; const l1 = `id: ${e.n}  Name: ${e.name}  Time: ${e.time}  Date: ${e.date}`, l2 = `Coordinates: ${(cx / W * 51.5).toFixed(4)} N, -${(cy / H * .0629).toFixed(5)} E`, tw = Math.max(ox.measureText(l1).width, ox.measureText(l2).width) + 10, bx = Math.min(W - tw - 4, e.x), by = e.y + e.h + 6;
      ox.fillStyle = 'rgba(11,10,9,.85)'; ox.fillRect(bx, by, tw, 26); ox.strokeStyle = 'rgba(233,227,209,.8)'; ox.strokeRect(bx + .5, by + .5, tw, 26); ox.fillStyle = '#e9e3d1'; ox.fillText(l1, bx + 5, by + 11); ox.fillText(l2, bx + 5, by + 22); }
    else if (e.kind === 'num') { ox.shadowBlur = 4; ox.font = '9px Arial, sans-serif'; ox.fillStyle = '#e9e3d1'; ox.fillText(e.num, e.x + 2, e.y - 3); }
  });
  ox.shadowBlur = 0;
}

window.SHD_BLOBSCREEN = (host, o = {}) => {
  const list = (o.ids || (typeof SHD_INTRO_ART !== 'undefined' ? SHD_INTRO_ART : [])).slice().sort(() => Math.random() - .5);
  const base = new URL('assets/ui/intro-art/', location.href).href, bpm = o.bpm || 130, beat = 60000 / bpm, per = o.beatsPer || 8;
  const wrap = document.createElement('div'); wrap.className = 'bs-host'; wrap.setAttribute('aria-hidden', 'true');
  const art = document.createElement('canvas'), ov = document.createElement('canvas'); art.className = 'bs-art'; ov.className = 'bs-ov';
  wrap.append(art, ov); host.append(wrap);
  const ax = art.getContext('2d', { willReadFrequently: true }), ox = ov.getContext('2d');
  // load the art a few at a time so the first piece shows fast
  const imgs = []; let loadAt = 0;
  const loadNext = () => { if (loadAt >= list.length) return; const im = new Image(); im.decoding = 'async'; im.src = base + list[loadAt++] + '.jpg'; im.onload = () => { imgs.push(im); if (imgs.length < 4) loadNext(); }; im.onerror = loadNext; };
  loadNext(); loadNext(); setTimeout(function more() { if (!alive) return; loadNext(); if (loadAt < list.length) setTimeout(more, 400); }, 900);
  let alive = true, raf = 0, last = 0, t0 = performance.now(), W = 0, H = 0, LW = 0, LH = 0, glyph = [], gcols = 0, grows = 0, tracked = [];
  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1); W = host.clientWidth || innerWidth; H = host.clientHeight || innerHeight;
    LW = W < 700 ? 180 : 260; LH = Math.max(1, Math.round(LW * H / W)); art.width = LW; art.height = LH;
    ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); ox.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gs = W < 700 ? 22 : 28; gcols = Math.ceil(W / gs); grows = Math.ceil(H / gs); glyph = new Array(gcols * grows).fill('');
  }
  size(); const onR = () => size(); addEventListener('resize', onR);

  function frame(now) {
    raf = 0; if (!alive) return;
    if (now - last < (reduce ? 400 : 50)) { raf = requestAnimationFrame(frame); return; } last = now;
    const t = now - t0, slot = Math.floor(t / (beat * per)), ph = (t % (beat * per)) / (beat * per);
    const im = imgs.length ? imgs[slot % imgs.length] : null, prevIm = imgs.length > 1 ? imgs[(slot - 1 + imgs.length) % imgs.length] : null;
    // 1) the art, cover-fit with a slow push in, dithered to ink + paper. No flashes: each piece slowly crossfades into the next.
    ax.fillStyle = '#0b0a09'; ax.fillRect(0, 0, LW, LH);
    let cur = null; const draw = (img, s2, q) => { const z = 1.04 + q * .12, k = Math.max(LW / img.width, LH / img.height) * z, dw = img.width * k, dh = img.height * k, dx = (LW - dw) / 2 + Math.sin(s2 * 2.1) * LW * .03, dy = (LH - dh) / 2 + Math.cos(s2 * 1.3) * LH * .03; ax.drawImage(img, dx, dy, dw, dh); if (img === im) cur = { img, dx, dy, k }; };
    const fade = Math.min(1, ph / .25);
    if (prevIm && fade < 1) { ax.globalAlpha = 1; draw(prevIm, slot - 1, 1 + ph); }
    if (im) { ax.globalAlpha = prevIm ? fade : 1; draw(im, slot, ph); ax.globalAlpha = 1; }
    const id = ax.getImageData(0, 0, LW, LH), p = id.data, L = new Float32Array(LW * LH), flash = false;
    for (let i = 0, k = 0; i < L.length; i++, k += 4) L[i] = (p[k] * .3 + p[k + 1] * .59 + p[k + 2] * .11) / 255;
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) { const i = y * LW + x, k = i * 4, th = BAYER[(y & 3) * 4 + (x & 3)] + (Math.random() - .5) * .06, on = (L[i] * 1.05 - .14 > th) !== flash; p[k] = on ? 233 : 11; p[k + 1] = on ? 227 : 10; p[k + 2] = on ? 209 : 9; p[k + 3] = 255; }
    ax.putImageData(id, 0, 0);
    // 2) find the bright shapes (blobs) and ease the boxes toward them so they glide, not jump
    const gw = 48, cw = LW / gw, gh = Math.max(4, Math.round(LH / cw)), ch = LH / gh, G = new Float32Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { let s = 0, n = 0; for (let y = Math.floor(gy * ch); y < Math.min(LH, (gy + 1) * ch); y++) for (let x = Math.floor(gx * cw); x < Math.min(LW, (gx + 1) * cw); x++) { s += L[y * LW + x]; n++; } G[gy * gw + gx] = n ? s / n : 0; }
    // find many small standout spots: cells brighter (or busier) than their neighbourhood, spaced apart
    const spots = [];
    for (let y = 2; y < gh - 2; y++) for (let x = 2; x < gw - 2; x++) { const i = y * gw + x; let s2 = 0, n2 = 0, mx = true;
      for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) { if (!xx && !yy) continue; const v = G[i + yy * gw + xx]; s2 += v; n2++; if (Math.abs(xx) <= 1 && Math.abs(yy) <= 1 && v > G[i]) mx = false; }
      const pop = Math.abs(G[i] - s2 / n2); if (mx && pop > .04) spots.push({ x, y, v: pop }); }
    spots.sort((a, b) => b.v - a.v);
    const chosen = [], maxN = W < 700 ? 14 : 22;
    for (const sp of spots) { if (chosen.length >= maxN) break; if (chosen.every(c2 => Math.hypot(c2.x - sp.x, c2.y - sp.y) >= 2.5)) chosen.push(sp); }
    const sx = W / gw, sy = H / gh;
    const want = chosen.map((sp, i) => { const r = 1 + Math.min(4, sp.v * 18) * (.6 + ((i * 7) % 5) / 6), ar = [1, 1.4, .7, 1.8, .55][i % 5]; const w = Math.max(14, r * sx * Math.sqrt(ar)), h = Math.max(14, r * sy / Math.sqrt(ar)); return { x: (sp.x + .5) * sx - w / 2, y: (sp.y + .5) * sy - h / 2, w, h }; });
    tracked = want.map(b => { let best = null, bd = 1e9; tracked.forEach(o2 => { const d = Math.hypot(o2.x - b.x, o2.y - b.y); if (d < bd && !o2.used) { bd = d; best = o2; } }); const e = best && bd < W * .12 ? best : Object.assign(newTrack(), { x: b.x, y: b.y, w: b.w, h: b.h }); e.used = true;
      e.x += (b.x - e.x) * .35; e.y += (b.y - e.y) * .35; e.w += (b.w - e.w) * .35; e.h += (b.h - e.h) * .35; return e; });
    tracked.forEach(e => e.used = false);
    // 3) overlay
    ox.clearRect(0, 0, W, H); const gs = W / gcols;
    if (o.glyphs !== false) { ox.font = `${Math.round(gs * .5)}px "JetBrains Mono", monospace`; ox.fillStyle = 'rgba(232,255,58,.75)';
      for (let i = 0; i < glyph.length; i++) { if (Math.random() < .01) glyph[i] = Math.random() < .08 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ''; if (glyph[i]) ox.fillText(glyph[i], (i % gcols) * gs + gs * .3, Math.floor(i / gcols) * gs + gs * .7); } }
    paintTracks(ox, tracked, W, H, cur ? e => { const ix = ((e.x * LW / W) - cur.dx) / cur.k, iy = ((e.y * LH / H) - cur.dy) / cur.k, iw = (e.w * LW / W) / cur.k, ih = (e.h * LH / H) / cur.k; try { ox.drawImage(cur.img, ix, iy, Math.max(4, iw), Math.max(4, ih), e.x, e.y, e.w, e.h); } catch (_) { } } : null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { el: wrap, stop() { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', onR); wrap.remove(); } };
};
/* the same tracking over a piece shown on the site (art viewer TRACK button). Overlay only: the art itself is never touched.
 * Spots are found on the small intro copy of the piece; crops come from the full piece on screen. */
window.SHD_TRACKOVER = (imgEl, id) => {
  const box = imgEl.parentElement, cv = document.createElement('canvas'); cv.className = 'track-over'; cv.setAttribute('aria-hidden', 'true'); box.append(cv);
  const x = cv.getContext('2d'); let alive = true, tracks = [], base = [], raf = 0, last = 0;
  const thumb = new Image(); thumb.src = new URL('assets/ui/intro-art/' + id + '.jpg', location.href).href;
  function place() { const r = imgEl.getBoundingClientRect(), pr = box.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); Object.assign(cv.style, { left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', width: r.width + 'px', height: r.height + 'px' }); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); return r; }
  function find() {
    const r = place(), W = r.width, H = r.height, gw = 40, c = document.createElement('canvas'), gh = Math.max(4, Math.round(gw * H / W)); c.width = gw; c.height = gh; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(thumb, 0, 0, gw, gh);
    const d = cx.getImageData(0, 0, gw, gh).data, G = new Float32Array(gw * gh); for (let i = 0; i < G.length; i++) G[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255;
    const spots = []; for (let y = 2; y < gh - 2; y++) for (let x2 = 2; x2 < gw - 2; x2++) { const i = y * gw + x2; let s2 = 0, n2 = 0, mx = true; for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) { if (!xx && !yy) continue; const v = G[i + yy * gw + xx]; s2 += v; n2++; if (Math.abs(xx) <= 1 && Math.abs(yy) <= 1 && v > G[i]) mx = false; } const pop = Math.abs(G[i] - s2 / n2); if (mx && pop > .04) spots.push({ x: x2, y, v: pop }); }
    spots.sort((a, b) => b.v - a.v); const chosen = []; for (const sp of spots) { if (chosen.length >= 18) break; if (chosen.every(q => Math.hypot(q.x - sp.x, q.y - sp.y) >= 2.5)) chosen.push(sp); }
    const sx = W / gw, sy = H / gh;
    base = chosen.map((sp, i) => { const rr = 1 + Math.min(4, sp.v * 18) * (.6 + ((i * 7) % 5) / 6), ar = [1, 1.4, .7, 1.8, .55][i % 5], w = Math.max(14, rr * sx * Math.sqrt(ar)), h = Math.max(14, rr * sy / Math.sqrt(ar)); return Object.assign(newTrack(), { x: (sp.x + .5) * sx - w / 2, y: (sp.y + .5) * sy - h / 2, w, h, ph: Math.random() * 6 }); });
    tracks = base.map(b => Object.assign({}, b));
  }
  function frame(now) { raf = 0; if (!alive) return; if (now - last > 80) { last = now; const r = imgEl.getBoundingClientRect(), W = r.width, H = r.height, t = now / 1000;
      tracks.forEach((e, i) => { const b = base[i]; e.x = b.x + Math.sin(t * .7 + b.ph) * 3; e.y = b.y + Math.cos(t * .6 + b.ph) * 3; });
      x.clearRect(0, 0, W, H); paintTracks(x, tracks, W, H, e => { const kx = imgEl.naturalWidth / W, ky = imgEl.naturalHeight / H; try { x.drawImage(imgEl, e.x * kx, e.y * ky, e.w * kx, e.h * ky, e.x, e.y, e.w, e.h); } catch (_) { } }); }
    raf = requestAnimationFrame(frame); }
  const go = () => { if (!alive) return; find(); raf = requestAnimationFrame(frame); };
  if (thumb.complete && thumb.naturalWidth && imgEl.complete) go(); else { let n = 0; const ok = () => { if (++n >= 2) go(); }; thumb.onload = ok; if (imgEl.complete) ok(); else imgEl.addEventListener('load', ok, { once: true }); }
  const onR = () => { if (alive && base.length) find(); }; addEventListener('resize', onR);
  return { stop() { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', onR); cv.remove(); } };
};
})();
