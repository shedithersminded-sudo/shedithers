/* SHEDITHERS — per-layer brush masks, image-layer rendering, brush tool. */
const MASK = new Map();          // fx.uid -> {cv, src, ver, arr, key}
const BR = { mode: 'paint', size: 80, hard: 55, flow: 80, show: true };
S.tool = 'move';
const cvM = $('#cvMask'), mctx = cvM.getContext('2d');

function maskDims() { const d = docDims(), s = Math.min(1, 1024 / Math.max(d.w || 1, d.h || 1)); return { w: Math.max(1, Math.round(d.w * s)), h: Math.max(1, Math.round(d.h * s)) }; }
function maskEntry(f, create) {
  let m = MASK.get(f.uid);
  if (m && m.src === f.mask) return m;
  if (!f.mask && !create) return null;
  const { w, h: hh } = maskDims(), cv = h_canvas(w, hh), cx = cv.getContext('2d');
  cx.fillStyle = '#000'; cx.fillRect(0, 0, w, hh);
  m = { cv, src: f.mask, ver: 1, arr: null, key: '' }; MASK.set(f.uid, m);
  if (f.mask) { const img = new Image(); img.onload = () => { cx.drawImage(img, 0, 0, w, hh); m.ver++; requestRender(); drawMaskOverlay(); }; img.src = f.mask; }
  return m;
}
const _mt = h_canvas(1, 1), _mx = _mt.getContext('2d', { willReadFrequently: true });
function maskArray(f, w, hh) {
  if (!f.mask || f.maskOn === false || !w) return null;
  const m = maskEntry(f); if (!m) return null; const key = `${w}x${hh}:${m.ver}`;
  if (m.key === key) return m.arr;
  _mt.width = w; _mt.height = hh; _mx.imageSmoothingEnabled = true; _mx.drawImage(m.cv, 0, 0, w, hh);
  const d = _mx.getImageData(0, 0, w, hh).data, a = new Uint8Array(w * hh); for (let i = 0, j = 0; i < a.length; i++, j += 4) a[i] = d[j];
  if (f.maskInv) for (let i = 0; i < a.length; i++) a[i] = 255 - a[i];
  m.arr = a; m.key = key; return a;
}
function commitMask(f) { const m = MASK.get(f.uid); if (!m) return; f.mask = m.cv.toDataURL('image/png'); m.src = f.mask; if (f.maskOn === undefined) f.maskOn = true; m.key = ''; changed(true); }
function deleteMask(f) { delete f.mask; delete f.maskOn; delete f.maskInv; MASK.delete(f.uid); changed(true); drawMaskOverlay(); }
function maskOp(f, op) {
  const m = maskEntry(f, true), cx = m.cv.getContext('2d');
  if (op === 'fill') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, m.cv.width, m.cv.height); }
  else if (op === 'clear') { cx.fillStyle = '#000'; cx.fillRect(0, 0, m.cv.width, m.cv.height); }
  else if (op === 'invert') { cx.globalCompositeOperation = 'difference'; cx.fillStyle = '#fff'; cx.fillRect(0, 0, m.cv.width, m.cv.height); cx.globalCompositeOperation = 'source-over'; }
  m.ver++; commitMask(f); drawMaskOverlay(); requestRender();
}

/* ---- image layers ---- */
const LAYERIMG = new Map();
function layerEl(id) {
  let e = LAYERIMG.get(id); if (e) return e.ready ? e.el : null;
  const it = S.library.find(x => x.id === id); if (!it) return null;
  e = { ready: false, el: null }; LAYERIMG.set(id, e);
  makeElement(it).then(r => { e.el = r.el; e.ready = true; requestRender(); }).catch(() => LAYERIMG.delete(id));
  return null;
}
const LAYERPX = new Map();
function layerPixels(p, w, hh) {
  if (!p.img) return null; const el = layerEl(p.img); if (!el) return null;
  const key = [p.img, w, hh, p.fit, p.scale, p.x, p.y, p.rot].join('|'); if (LAYERPX.has(key)) return LAYERPX.get(key);
  const iw = el.naturalWidth || el.videoWidth || el.width, ih = el.naturalHeight || el.videoHeight || el.height;
  const c = h_canvas(w, hh), cx = c.getContext('2d', { willReadFrequently: true });
  let sx = w / iw, sy = hh / ih; if (p.fit === 'contain') sx = sy = Math.min(sx, sy); else if (p.fit === 'cover') sx = sy = Math.max(sx, sy);
  const k = p.scale / 100; cx.translate(w / 2 + p.x / 100 * w / 2, hh / 2 + p.y / 100 * hh / 2); cx.rotate(p.rot * Math.PI / 180); cx.scale(sx * k, sy * k); cx.drawImage(el, -iw / 2, -ih / 2);
  const a = cx.getImageData(0, 0, w, hh).data; if (LAYERPX.size > 24) LAYERPX.clear(); LAYERPX.set(key, a); return a;
}
const _imgPick = { fx: null };
$('#imgLayerIn').addEventListener('change', async e => { const fs = Array.from(e.target.files); e.target.value = ''; if (!fs.length) return; const before = S.library.length; await importFiles(fs, { open: false }); if (S.library.length > before && _imgPick.fx) { _imgPick.fx.p.img = S.library[0].id; changed(true); } });

/* ---- brush tool ---- */
function setTool(t) {
  S.tool = t; $$('#toolSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  const on = t === 'brush'; $('#brushBar').classList.toggle('on', on); $('#center').classList.toggle('has-brush', on);
  viewport.classList.toggle('brushing', on); $('#brushRing').style.display = 'none';
  if (on) { const f = selFx(); if (!f) toast('Select a layer, then paint where you want its effect', 'info', 3500); else if (!f.mask) toast(`Painting reveals ${E.MAP[f.id].name.toUpperCase()} only where you brush`, 'info', 3000); }
  updBrushTarget(); drawMaskOverlay(); setTimeout(fitView, 30);
}
function updBrushTarget() { const f = selFx(); $('#brushTarget').textContent = f ? `TARGET › ${String(S.stack.indexOf(f) + 1).padStart(2, '0')} ${E.MAP[f.id].name.toUpperCase()}${f.mask ? ' · MASKED' : ''}` : 'NO LAYER SELECTED'; }
function drawMaskOverlay() {
  const f = selFx(), show = S.tool === 'brush' && BR.show && f && (f.mask || MASK.get(f.uid));
  cvM.style.display = show ? 'block' : 'none'; if (!show) return;
  const m = maskEntry(f, true); if (cvM.width !== m.cv.width || cvM.height !== m.cv.height) { cvM.width = m.cv.width; cvM.height = m.cv.height; }
  cvM.style.width = cvA.width + 'px'; cvM.style.height = cvA.height + 'px';
  mctx.globalCompositeOperation = 'source-over'; mctx.drawImage(m.cv, 0, 0); if (f.maskInv) { mctx.globalCompositeOperation = 'difference'; mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, cvM.width, cvM.height); }
  mctx.globalCompositeOperation = 'multiply'; mctx.fillStyle = '#ff4fa3'; mctx.fillRect(0, 0, cvM.width, cvM.height); mctx.globalCompositeOperation = 'source-over';
}
let stroke = null;
function maskPoint(e) { const r = cvA.getBoundingClientRect(), md = maskDims(); return { x: (e.clientX - r.left) / r.width * md.w, y: (e.clientY - r.top) / r.height * md.h, s: md.w / Math.max(1, docDims().w) }; }
function stamp(cx, x, y, rad) {
  const g = cx.createRadialGradient(x, y, 0, x, y, rad), col = BR.mode === 'paint' ? '255,255,255' : '0,0,0', a = BR.flow / 100, hd = BR.hard / 100;
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(Math.min(0.99, hd), `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, rad, 0, 7); cx.fill();
}
function brushDown(e) {
  const f = selFx(); if (!f) { toast('Select a layer to paint its mask', 'err'); return; }
  const m = maskEntry(f, true), cx = m.cv.getContext('2d'), p = maskPoint(e), rad = Math.max(0.5, BR.size / 2 * p.s);
  if (!f.mask && f.maskOn === undefined) f.maskOn = true;
  if (f.maskInv && BR.mode) { /* paint into the stored (pre-invert) mask: swap meaning */ }
  stroke = { f, m, cx, last: p, rad }; const mode = BR.mode; if (f.maskInv) BR.mode = mode === 'paint' ? 'erase' : 'paint';
  stamp(cx, p.x, p.y, rad); BR.mode = mode; m.ver++; f.mask = f.mask || 'pending'; m.src = f.mask; drawMaskOverlay(); requestRender();
}
function brushMove(e) {
  const ring = $('#brushRing');
  if (S.tool === 'brush' && S.media && viewport.contains(e.target)) { const vr = viewport.getBoundingClientRect(), r = cvA.getBoundingClientRect(), dpx = BR.size * r.width / Math.max(1, docDims().w); ring.style.display = 'block'; ring.style.left = (e.clientX - vr.left) + 'px'; ring.style.top = (e.clientY - vr.top) + 'px'; ring.style.width = ring.style.height = Math.max(4, dpx) + 'px'; ring.classList.toggle('erase', BR.mode === 'erase'); }
  if (!stroke) return;
  const p = maskPoint(e), l = stroke.last, dist = Math.hypot(p.x - l.x, p.y - l.y), step = Math.max(0.5, stroke.rad / 4), n = Math.ceil(dist / step);
  const mode = BR.mode; if (stroke.f.maskInv) BR.mode = mode === 'paint' ? 'erase' : 'paint';
  for (let i = 1; i <= n; i++) stamp(stroke.cx, l.x + (p.x - l.x) * i / n, l.y + (p.y - l.y) * i / n, stroke.rad);
  BR.mode = mode; stroke.last = p; stroke.m.ver++; drawMaskOverlay(); requestRender();
}
function brushUp() { if (!stroke) return; const f = stroke.f; stroke = null; commitMask(f); updBrushTarget(); }
window.addEventListener('mousemove', brushMove);
window.addEventListener('mouseup', brushUp);
viewport.addEventListener('mouseleave', () => $('#brushRing').style.display = 'none');
$$('#toolSeg button').forEach(b => b.onclick = () => setTool(b.dataset.v));
$$('#brushMode button').forEach(b => b.onclick = () => { BR.mode = b.dataset.v; $$('#brushMode button').forEach(x => x.classList.toggle('on', x === b)); });
[['brSize', 'size'], ['brHard', 'hard'], ['brFlow', 'flow']].forEach(([id, k]) => { const r = $('#' + id), v = $('#' + id + 'V'); const upd = () => { BR[k] = +r.value; v.textContent = r.value; r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }; r.oninput = upd; upd(); });
$('#brFill').onclick = () => { const f = selFx(); if (f) maskOp(f, 'fill'); else toast('Select a layer', 'err'); };
$('#brClear').onclick = () => { const f = selFx(); if (f) maskOp(f, 'clear'); else toast('Select a layer', 'err'); };
$('#brInv').onclick = () => { const f = selFx(); if (f) maskOp(f, 'invert'); else toast('Select a layer', 'err'); };
$('#brShow').onclick = e => { BR.show = !BR.show; e.currentTarget.classList.toggle('on', BR.show); drawMaskOverlay(); };

/* ---- text layers ---- */
const TEXTPX = new Map(), FONTWAIT = new Set();
function textFont(p, px) { return `${p.italic ? 'italic ' : ''}${p.weight || 700} ${Math.max(1, px).toFixed(1)}px "${p.font}", "Barlow Condensed", sans-serif`; }
function textPixels(p, w, hh) {
  const k = w / Math.max(1, docDims().w), size = p.size * k, style = p.style || 'plain';
  const key = JSON.stringify([p.text, p.font, p.weight, p.italic, p.case, p.align, p.x, p.y, p.rot, p.spacing, p.lineh, p.fill, p.fill2, p.stroke, p.strokeW, p.glowC, p.glow, style, p.arc, p.depth, size.toFixed(2), w, hh]);
  if (TEXTPX.has(key)) return TEXTPX.get(key);
  const RANSOM_FONTS = ['Bebas Neue', 'UnifrakturMaguntia', 'Permanent Marker', 'Special Elite', 'Georgia', 'Monoton', 'Creepster', 'VT323', 'Pacifico', 'Rubik Glitch'];
  const fontsNeeded = style === 'ransom' ? RANSOM_FONTS : [p.font];
  fontsNeeded.forEach(fn => { const f = textFont(Object.assign({}, p, { font: fn }), size); if (document.fonts && !document.fonts.check(f) && !FONTWAIT.has(fn)) { FONTWAIT.add(fn); document.fonts.load(f).then(() => { TEXTPX.clear(); requestRender(); }).catch(() => { }); } });
  let txt = String(p.text || ''); if (p.case === 'upper') txt = txt.toUpperCase(); else if (p.case === 'lower') txt = txt.toLowerCase();
  const lines = txt.split('\n'), c = h_canvas(w, hh), cx = c.getContext('2d', { willReadFrequently: true });
  const font = textFont(p, size); cx.font = font; cx.textBaseline = 'middle'; cx.textAlign = 'center';
  const sp = p.spacing * k; if ('letterSpacing' in cx) cx.letterSpacing = sp.toFixed(1) + 'px';
  const lh = size * p.lineh / 100, bh = lh * lines.length, rnd = (() => { let a = 7; for (const ch of txt) a = (a * 31 + ch.charCodeAt(0)) | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
  // layout every glyph (supports arc / curved text and per-letter ransom styling)
  const glyphs = []; const arc = (p.arc || 0) / 100;
  lines.forEach((ln, li) => {
    const chars = [...ln], rf = [], rs = []; const widths = chars.map((ch, ci) => { if (style === 'ransom') { rf[ci] = RANSOM_FONTS[Math.floor(rnd() * RANSOM_FONTS.length)]; rs[ci] = size * (0.85 + rnd() * 0.3); cx.font = textFont(Object.assign({}, p, { font: rf[ci] }), rs[ci]); return cx.measureText(ch).width + rs[ci] * 0.34 + sp; } return cx.measureText(ch).width + sp; }); cx.font = font;
    const lw = widths.reduce((a, b) => a + b, 0), x0 = p.align === 'left' ? 0 : p.align === 'right' ? -lw : -lw / 2, y0 = -bh / 2 + lh * (li + 0.5);
    let x = x0; chars.forEach((ch, i) => { const cxp = x + widths[i] / 2; x += widths[i];
      let gx = cxp, gy = y0, gr = 0;
      if (arc) { const R = (lw / Math.max(0.15, Math.abs(arc))) / Math.PI * 1.2, th = cxp / R; gx = Math.sin(th) * R; gy = y0 + (R - Math.cos(th) * R) * -Math.sign(arc); gr = th * Math.sign(arc); }
      glyphs.push({ ch, x: gx, y: gy, r: gr, i: glyphs.length, rf: rf[i], rs: rs[i] });
    });
  });
  cx.translate(p.x / 100 * w, p.y / 100 * hh); cx.rotate(p.rot * Math.PI / 180); cx.lineJoin = 'round'; cx.lineCap = 'round'; cx.miterLimit = 2;
  const each = fn => glyphs.forEach(g => { if (g.ch === ' ') return; cx.save(); cx.translate(g.x, g.y); cx.rotate(g.r); fn(g); cx.restore(); });
  const fillTxt = (g, ox = 0, oy = 0) => cx.fillText(g.ch, ox, oy), strokeTxt = (g, ox = 0, oy = 0) => cx.strokeText(g.ch, ox, oy);
  const vgrad = (a, b, stops) => { const gr = cx.createLinearGradient(0, -size / 2, 0, size / 2); (stops || [[0, a], [1, b]]).forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
  const depth = (p.depth || 0) * k;
  if (p.glow > 0 && style !== 'neon') { cx.shadowColor = p.glowC; cx.shadowBlur = p.glow * k; cx.fillStyle = p.glowC; each(g => fillTxt(g)); cx.shadowBlur = 0; cx.shadowColor = 'transparent'; }
  switch (style) {
    case 'chrome':
      cx.strokeStyle = '#0d0d0f'; cx.lineWidth = Math.max(2, size * 0.09); each(g => strokeTxt(g, size * 0.03, size * 0.04));
      cx.fillStyle = vgrad(0, 0, [[0, '#ffffff'], [0.42, '#c9cfd6'], [0.5, '#5a6169'], [0.56, '#2a2f35'], [0.75, '#9aa3ad'], [1, '#f2f5f8']]); each(g => fillTxt(g));
      cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = Math.max(1, size * 0.012); each(g => strokeTxt(g)); break;
    case 'drip':
      cx.fillStyle = p.fill; each(g => { fillTxt(g); const n = 1 + Math.floor(rnd() * 2), gw = cx.measureText(g.ch).width; for (let j = 0; j < n; j++) { const dx = (rnd() - 0.5) * gw * 0.7, len = (0.25 + rnd() * 0.75) * (depth || size * 0.4), wd = size * (0.05 + rnd() * 0.05); cx.beginPath(); cx.roundRect ? cx.roundRect(dx - wd / 2, size * 0.25, wd, len, wd / 2) : cx.rect(dx - wd / 2, size * 0.25, wd, len); cx.fill(); cx.beginPath(); cx.arc(dx, size * 0.25 + len, wd * 0.75, 0, 7); cx.fill(); } }); break;
    case 'sticker':
      cx.shadowColor = 'rgba(0,0,0,.45)'; cx.shadowBlur = size * 0.08; cx.shadowOffsetY = size * 0.04; cx.strokeStyle = '#ffffff'; cx.lineWidth = size * 0.28; each(g => strokeTxt(g));
      cx.shadowColor = 'transparent'; cx.strokeStyle = p.stroke; cx.lineWidth = size * 0.06; each(g => strokeTxt(g)); cx.fillStyle = p.fill; each(g => fillTxt(g)); break;
    case 'glitch': {
      cx.globalCompositeOperation = 'lighter'; const o = size * 0.05; cx.fillStyle = '#ff0040'; each(g => fillTxt(g, -o, 0)); cx.fillStyle = '#00e5ff'; each(g => fillTxt(g, o, 0)); cx.globalCompositeOperation = 'source-over';
      cx.fillStyle = p.fill; each(g => fillTxt(g)); cx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 6; i++) { const y = (rnd() - 0.5) * bh, hgt = size * (0.02 + rnd() * 0.05); cx.fillRect(-w, y, w * 2, hgt); } cx.globalCompositeOperation = 'source-over'; break; }
    case 'neon':
      cx.shadowColor = p.fill; for (const b of [40, 20, 8]) { cx.shadowBlur = b * k * (size / 140); cx.strokeStyle = p.fill; cx.lineWidth = size * 0.06; each(g => strokeTxt(g)); }
      cx.shadowBlur = 0; cx.strokeStyle = '#ffffff'; cx.lineWidth = size * 0.02; each(g => strokeTxt(g)); break;
    case 'ransom':
      each(g => { const f = g.rf || RANSOM_FONTS[0], s = g.rs || size; cx.font = textFont(Object.assign({}, p, { font: f }), s); cx.rotate((rnd() - 0.5) * 0.35); const mw = cx.measureText(g.ch).width, pd = s * 0.12, bgs = ['#f2eee2', '#111111', '#ff4fa3', '#d4ff00', '#e7dcc0', '#c8321e', '#ffffff'], bg = bgs[Math.floor(rnd() * bgs.length)]; cx.fillStyle = bg; cx.fillRect(-mw / 2 - pd, -s * 0.55, mw + pd * 2, s * 1.1); cx.fillStyle = bg === '#111111' || bg === '#c8321e' ? '#ffffff' : '#111111'; fillTxt(g); }); cx.font = font; break;
    case 'bubble':
      cx.strokeStyle = p.stroke; cx.lineWidth = size * 0.34; each(g => strokeTxt(g)); cx.strokeStyle = p.fill; cx.lineWidth = size * 0.24; each(g => strokeTxt(g));
      cx.fillStyle = p.fill2; each(g => fillTxt(g)); cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = size * 0.035; each(g => strokeTxt(g, -size * 0.03, -size * 0.04)); break;
    case 'label':
      cx.font = textFont(Object.assign({}, p, { font: 'VT323' }), size); lines.forEach((ln, li) => { const y0 = -bh / 2 + lh * (li + 0.5), mw = cx.measureText(ln).width, pd = size * 0.25; cx.fillStyle = '#111111'; cx.fillRect(-mw / 2 - pd, y0 - size * 0.5, mw + pd * 2, size); cx.fillStyle = '#f5f5f0'; cx.fillText(ln, 0, y0); }); break;
    case 'extrude':
      cx.fillStyle = p.fill2; for (let d = Math.max(1, depth || size * 0.12); d > 0; d -= Math.max(1, k)) each(g => fillTxt(g, d, d)); cx.strokeStyle = p.stroke; cx.lineWidth = Math.max(1, size * 0.03); each(g => strokeTxt(g)); cx.fillStyle = p.fill; each(g => fillTxt(g)); break;
    case 'gradient':
      cx.fillStyle = vgrad(p.fill, p.fill2); each(g => fillTxt(g)); break;
    case 'scribble':
      cx.fillStyle = p.fill; each(g => fillTxt(g)); cx.strokeStyle = p.fill2; cx.lineWidth = Math.max(2, size * 0.05); glyphs.forEach(g => { if (rnd() < 0.35) { cx.save(); cx.translate(g.x, g.y); cx.beginPath(); for (let i = 0; i < 4; i++) { cx.moveTo(-size * 0.35, (rnd() - 0.5) * size * 0.5); cx.lineTo(size * 0.35, (rnd() - 0.5) * size * 0.5); } cx.stroke(); cx.restore(); } }); break;
    default:
      if (p.strokeW > 0) { cx.strokeStyle = p.stroke; cx.lineWidth = p.strokeW * 2 * k; each(g => strokeTxt(g)); }
      cx.fillStyle = p.fill; each(g => fillTxt(g));
  }
  if (p.strokeW > 0 && !['plain', 'sticker', 'bubble', 'label', 'neon'].includes(style)) { cx.strokeStyle = p.stroke; cx.lineWidth = p.strokeW * k; each(g => strokeTxt(g)); }
  const a = cx.getImageData(0, 0, w, hh).data; if (TEXTPX.size > 16) TEXTPX.clear(); TEXTPX.set(key, a); return a;
}
/* Text tool: click the picture to drop a text layer there; drag to move the selected one. */
let textDrag = null;
function docPct(e) { const r = cvA.getBoundingClientRect(); return { x: clampN((e.clientX - r.left) / r.width * 100, 0, 100), y: clampN((e.clientY - r.top) / r.height * 100, 0, 100) }; }
function textDown(e) {
  const pt = docPct(e); let f = selFx();
  if (!f || f.id !== 'text') { f = addFx('text', null, { x: +pt.x.toFixed(1), y: +pt.y.toFixed(1), size: Math.round(Math.max(24, docDims().w / 9)) }); setTimeout(() => { const ta = $('.fx.sel textarea'); if (ta) { ta.focus(); ta.select(); } }, 60); return; }
  textDrag = { f, sx: pt.x - f.p.x, sy: pt.y - f.p.y }; textMove(e);
}
function textMove(e) { if (!textDrag) return; const pt = docPct(e); textDrag.f.p.x = +clampN(pt.x - textDrag.sx, 0, 100).toFixed(1); textDrag.f.p.y = +clampN(pt.y - textDrag.sy, 0, 100).toFixed(1); syncControls(); requestRender(); }
window.addEventListener('mousemove', textMove);
window.addEventListener('mouseup', () => { if (textDrag) { textDrag = null; H.commit(); } });
(function patchSetTool() {
  const base = setTool;
  setTool = function (t) { base(t); viewport.classList.toggle('texting', t === 'text'); if (t === 'text') { const f = selFx(); toast(f && f.id === 'text' ? 'Drag on the picture to move your text · edit words in the TEXT layer' : 'Click the picture where you want text', 'info', 3000); } };
})();
