/* SHEDITHERS — texture swatches, image textures, AI background masks (MediaPipe, Apache-2.0). */

/* ---- texture swatch picker ---- */
const SWATCH = new Map();
function swatchURL(type) {
  if (SWATCH.has(type)) return SWATCH.get(type);
  const n = 56, c = h_canvas(n, n), cx = c.getContext('2d');
  if (type === 'custom') { cx.fillStyle = '#16191b'; cx.fillRect(0, 0, n, n); cx.fillStyle = '#ff4fa3'; cx.font = '700 26px Barlow Condensed'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('+', n / 2, n / 2 - 2); }
  else cx.putImageData(new ImageData(E.texSwatch(type, n, 7), n, n), 0, 0);
  const u = c.toDataURL(); SWATCH.set(type, u); return u;
}
function texPicker(f, q) {
  const grid = h('div', { class: 'tex-grid' }, q.o.map(([v, l]) => h('button', { class: 'tex-sw' + (f.p[q.k] === v ? ' on' : ''), 'data-tip': l, onclick: () => { f.p[q.k] = v; if (v === 'custom' && !f.p.img) { _imgPick.fx = f; $('#imgLayerIn').click(); } changed(true); } }, h('img', { src: swatchURL(v), alt: l }), h('span', null, l))));
  return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l + ' · ' + (q.o.find(o => o[0] === f.p[q.k]) || ['', ''])[1])), grid);
}

/* ---- your own image as a tiling texture ---- */
const TEXIMG = new Map();
function texTilePixels(p, w, hh) {
  if (!p.img) return null; const el = layerEl(p.img); if (!el) return null;
  const k = w / Math.max(1, docDims().w), key = [p.img, w, hh, p.scale, p.rot].join('|'); if (TEXIMG.has(key)) return TEXIMG.get(key);
  const iw = el.naturalWidth || el.width, ih = el.naturalHeight || el.height, tile = Math.max(8, p.scale * 10 * k), s = tile / iw;
  const c = h_canvas(w, hh), cx = c.getContext('2d', { willReadFrequently: true }), t = h_canvas(Math.max(1, Math.round(iw * s)), Math.max(1, Math.round(ih * s)));
  t.getContext('2d').drawImage(el, 0, 0, t.width, t.height);
  cx.translate(w / 2, hh / 2); cx.rotate(p.rot * Math.PI / 180); cx.fillStyle = cx.createPattern(t, 'repeat'); const R2 = Math.hypot(w, hh); cx.fillRect(-R2, -R2, R2 * 2, R2 * 2);
  const a = cx.getImageData(0, 0, w, hh).data; if (TEXIMG.size > 8) TEXIMG.clear(); TEXIMG.set(key, a); return a;
}

/* ---- AI cutout masks ---- */
const MP_VER = '0.10.14', MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const MP_MODELS = { 'ai-person': 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite', 'ai-object': 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite' };
const AI = { seg: {}, masks: new Map(), busy: false, lib: null, failed: false };
async function aiSegmenter(mode) {
  if (AI.seg[mode]) return AI.seg[mode];
  if (!AI.lib) AI.lib = await import(`${MP_BASE}/vision_bundle.mjs`);
  const files = await AI.lib.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
  const make = delegate => AI.lib.ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: MP_MODELS[mode], delegate }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true });
  try { AI.seg[mode] = await make('GPU'); } catch (_) { AI.seg[mode] = await make('CPU'); }
  return AI.seg[mode];
}
function aiKey(mode) { return [S.media && S.media.id, JSON.stringify(S.source), mode, isVideo() ? Math.round(curTime() * 2) : 0].join('|'); }
async function aiCompute(mode, key) {
  AI.busy = true; setBusy(true, 'AI CUTOUT');
  if (!AI.seg[mode]) toast('Loading AI cutout model (first time only, a few MB)…', 'info', 4000);
  try {
    const seg = await aiSegmenter(mode), d = docDims(), s = Math.min(1, 1024 / Math.max(d.w, d.h)), W = Math.max(1, Math.round(d.w * s)), H2 = Math.max(1, Math.round(d.h * s));
    const c = h_canvas(W, H2); drawSource(c.getContext('2d'), W, H2);
    const r = seg.segment(c), cm = r.confidenceMasks[0], fl = cm.getAsFloat32Array(), mw = cm.width, mh = cm.height;
    const out = h_canvas(mw, mh), ox = out.getContext('2d'), id = ox.createImageData(mw, mh);
    for (let i = 0; i < fl.length; i++) { const v = mode === 'ai-person' ? fl[i] : 1 - fl[i], b = Math.round(Math.max(0, Math.min(1, v)) * 255); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255; }
    ox.putImageData(id, 0, 0); r.confidenceMasks.forEach(m => m.close && m.close());
    if (AI.masks.size > 6) AI.masks.clear(); AI.masks.set(key, { cv: out, arrs: new Map() });
    toast('AI cutout ready ♥', 'ok', 1500);
  } catch (e) { console.warn(e); AI.failed = true; toast('AI cutout could not load (' + (e.message || e) + '). Try AUTO or COLOR KEY mode.', 'err', 7000); }
  AI.busy = false; setBusy(false); requestRender();
}
function aiMask(mode, w, hh) {
  const key = aiKey(mode), m = AI.masks.get(key);
  if (!m) { if (!AI.busy && !AI.failed) aiCompute(mode, key); return null; }
  const k2 = w + 'x' + hh; if (m.arrs.has(k2)) return m.arrs.get(k2);
  const c = h_canvas(w, hh), cx = c.getContext('2d', { willReadFrequently: true }); cx.imageSmoothingQuality = 'high'; cx.drawImage(m.cv, 0, 0, w, hh);
  const d = cx.getImageData(0, 0, w, hh).data, a = new Uint8Array(w * hh); for (let i = 0; i < a.length; i++) a[i] = d[i * 4];
  m.arrs.set(k2, a); return a;
}
