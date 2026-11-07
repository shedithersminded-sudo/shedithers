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
  const k = w / Math.max(1, docDims().w), size = p.size * k, font = textFont(p, size);
  const key = JSON.stringify([p.text, p.font, p.weight, p.italic, p.case, p.align, p.x, p.y, p.rot, p.spacing, p.lineh, p.fill, p.stroke, p.strokeW, p.glowC, p.glow, size.toFixed(2), w, hh]);
  if (TEXTPX.has(key)) return TEXTPX.get(key);
  if (document.fonts && !document.fonts.check(font) && !FONTWAIT.has(p.font)) { FONTWAIT.add(p.font); document.fonts.load(font).then(() => { TEXTPX.clear(); requestRender(); }).catch(() => { }); }
  let txt = String(p.text || ''); if (p.case === 'upper') txt = txt.toUpperCase(); else if (p.case === 'lower') txt = txt.toLowerCase();
  const lines = txt.split('\n'), c = h_canvas(w, hh), cx = c.getContext('2d', { willReadFrequently: true });
  cx.font = font; cx.textBaseline = 'middle'; cx.textAlign = p.align || 'center';
  if ('letterSpacing' in cx) cx.letterSpacing = (p.spacing * k).toFixed(1) + 'px';
  const lh = size * p.lineh / 100, widths = lines.map(l => cx.measureText(l).width), bw = Math.max(1, ...widths), bh = lh * lines.length;
  cx.translate(p.x / 100 * w, p.y / 100 * hh); cx.rotate(p.rot * Math.PI / 180);
  const ax = p.align === 'left' ? -bw / 2 : p.align === 'right' ? bw / 2 : 0;
  const draw = (fn) => lines.forEach((l, i) => fn(l, ax, -bh / 2 + lh * (i + 0.5)));
  cx.lineJoin = 'round'; cx.miterLimit = 2;
  if (p.glow > 0) { cx.shadowColor = p.glowC; cx.shadowBlur = p.glow * k; cx.fillStyle = p.glowC; draw((l, x, y) => cx.fillText(l, x, y)); draw((l, x, y) => cx.fillText(l, x, y)); cx.shadowBlur = 0; cx.shadowColor = 'transparent'; }
  if (p.strokeW > 0) { cx.strokeStyle = p.stroke; cx.lineWidth = p.strokeW * 2 * k; draw((l, x, y) => cx.strokeText(l, x, y)); }
  cx.fillStyle = p.fill; draw((l, x, y) => cx.fillText(l, x, y));
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
