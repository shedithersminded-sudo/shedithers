/* SHEDITHERS — core editor: state, media, rendering, view, stack ops, history, projects, input. */
const E = _ENGINE_MAIN;
const PV = new Pool('preview'), BG = new Pool('background');
const S = {
  media: null, library: [], stack: [], sel: null, override: null,
  pid: null, name: '', source: { aspect: 'orig', cx: 50, cy: 50, rot: 0, fh: false, fv: false, outW: 0 },
  video: { in: 0, out: 0, speed: 1, fps: 24, loop: true },
  view: { cmp: 'off', split: 50, bg: 'checker' },
  palettes: LS.get('shd.palettes', []), presets: LS.get('shd.presets', []), exports: LS.get('shd.exports', []),
  clip: null, motion: false, still: { t: 0, dur: 8, playing: false, t0: 0, wall: 0 }, snd: null, origAudio: true, monitor: true,
};
const SETTINGS = Object.assign({ skin: 'chrome', pmax: 1280, scan: true, grain: true, motion: true, autosave: true, boot: true }, LS.get('shd.settings', {}));
const cvB = $('#cvBefore'), cvA = $('#cvAfter'), bctx = cvB.getContext('2d', { willReadFrequently: true }), actx = cvA.getContext('2d', { willReadFrequently: true });
const viewport = $('#viewport'), stage = $('#stage');
const isVideo = () => !!(S.media && S.media.type === 'video');
const isTimed = () => !!S.media && (S.media.type === 'video' || !!S.motion);
const curTime = () => isVideo() ? S.media.el.currentTime : (S.motion ? S.still.t : 0);
const frameIdx = t => Math.round((t || 0) * S.video.fps);

/* ---------- feedback ---------- */
function toast(msg, type = 'ok', ms = 3200) {
  const lbl = { ok: 'OK', err: 'ERROR', info: 'SYS' }[type] || 'SYS';
  const t = h('div', { class: 'toast ' + type }, h('b', null, lbl), h('span', null, msg));
  $('#toasts').append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, ms);
}
let tipT = null;
document.addEventListener('mouseover', e => {
  const el = e.target.closest('[data-tip]'); clearTimeout(tipT); const tip = $('#tip'); tip.classList.add('hidden');
  if (!el) return;
  tipT = setTimeout(() => { if (!document.body.contains(el)) return; tip.textContent = el.dataset.tip; tip.classList.remove('hidden'); const r = el.getBoundingClientRect(), tw = tip.offsetWidth; let x = r.left + r.width / 2 - tw / 2; x = clampN(x, 6, innerWidth - tw - 6); let y = r.bottom + 6; if (y + 24 > innerHeight) y = r.top - 26; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }, 380);
});
document.addEventListener('mousedown', () => { clearTimeout(tipT); $('#tip').classList.add('hidden'); });
function showCtx(x, y, items) {
  const m = $('#ctx'); m.innerHTML = '';
  for (const it of items) {
    if (it === '-') { m.append(h('hr')); continue; }
    if (it.title) { m.append(h('div', { class: 'ctx-t' }, it.title)); continue; }
    m.append(h('button', { class: (it.dis ? 'dis ' : '') + (it.danger ? 'danger' : ''), onclick: () => { hideCtx(); it.act(); } }, it.label, it.kbd ? h('kbd', null, it.kbd) : null));
  }
  m.classList.remove('hidden'); const r = m.getBoundingClientRect();
  m.style.left = clampN(x, 4, innerWidth - r.width - 4) + 'px'; m.style.top = clampN(y, 4, innerHeight - r.height - 4) + 'px';
}
function hideCtx() { $('#ctx').classList.add('hidden'); }
document.addEventListener('mousedown', e => { if (!e.target.closest('#ctx')) hideCtx(); });
window.addEventListener('blur', hideCtx);
function openModal({ title, sub, body, foot, cls, onClose }) {
  const bg = h('div', { class: 'modal-bg' }), close = () => { bg.remove(); onClose && onClose(); document.removeEventListener('keydown', esc, true); };
  const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const m = h('div', { class: 'modal ' + (cls || '') }, h('div', { class: 'modal-h' }, h('div', null, h('b', null, title), sub ? h('span', null, sub) : null), h('button', { class: 'ib', onclick: close, 'data-tip': 'Close · Esc', html: '<svg><use href="#i-x"/></svg>' })), h('div', { class: 'modal-c' }, body), foot ? h('div', { class: 'modal-f' }, foot) : null);
  bg.append(m); bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  document.addEventListener('keydown', esc, true); $('#modalRoot').append(bg); return { el: m, close };
}
function promptModal(title, value, cb, label = 'NAME') {
  const inp = h('input', { class: 'inp', value: value || '', spellcheck: false });
  const go = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } md.close(); cb(v); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const md = openModal({ title, cls: 'sm', body: h('div', { class: 'field' }, h('label', null, label), inp), foot: [h('button', { class: 'btn', onclick: () => md.close() }, 'CANCEL'), h('button', { class: 'btn primary', onclick: go }, 'CONFIRM')] });
  setTimeout(() => { inp.focus(); inp.select(); }, 30);
}
function confirmModal(title, text, cb, okLabel = 'CONFIRM') {
  const md = openModal({ title, cls: 'sm', body: h('p', { class: 'note', style: { fontSize: '11px', color: 'var(--tx2)' } }, text), foot: [h('button', { class: 'btn', onclick: () => md.close() }, 'CANCEL'), h('button', { class: 'btn primary', onclick: () => { md.close(); cb(); } }, okLabel)] });
}
let busyT = null;
function setBusy(on, text) {
  clearTimeout(busyT); const b = $('#busy');
  if (on) busyT = setTimeout(() => { $('#busyText').textContent = text || 'PROCESSING'; b.classList.add('on'); }, 160); else b.classList.remove('on');
  $('.live').classList.toggle('on', !!on || (isVideo() && !S.media.el.paused)); $('#sState').textContent = on ? 'RENDERING' : (isVideo() && !S.media.el.paused ? 'PLAYING' : 'IDLE');
}

/* ---------- media ---------- */
const extOf = n => (n.split('.').pop() || '').toLowerCase();
function kindOf(file) {
  const t = file.type || '', x = extOf(file.name || '');
  if (t.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(x)) return 'video';
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff', 'gif', 'bmp', 'avif'].includes(x)) return 'image';
  return null;
}
async function importFiles(files, { open = true } = {}) {
  let first = null, n = 0;
  for (const f of files) {
    const kind = kindOf(f); if (!kind) { toast(`${f.name}: unsupported file type`, 'err'); continue; }
    try {
      const item = { id: uid('m'), name: f.name || 'PASTED', type: kind, blob: f, added: Date.now() };
      const el = await makeElement(item); item.w = el.w; item.h = el.h; item.thumb = makeThumbFrom(el.el, el.w, el.h); item.duration = el.duration || 0;
      S.library.unshift(item); n++; DB.put('media', stripEl(item)).catch(() => { });
      if (!first) first = { item, el };
    } catch (e) { toast(`${f.name}: ${e.message}`, 'err', 6000); }
  }
  if (n) { toast(`${n} file${n > 1 ? 's' : ''} imported`); if (typeof renderLeft === 'function') renderLeft(); }
  if (first && open) await setMedia(first.item, { el: first.el });
}
const stripEl = it => ({ id: it.id, name: it.name, type: it.type, blob: it.blob, w: it.w, h: it.h, thumb: it.thumb, duration: it.duration, added: it.added });
async function makeElement(item) {
  const url = URL.createObjectURL(item.blob);
  if (item.type === 'video') {
    const v = h('video', { src: url, playsInline: true, preload: 'auto' }); v.muted = true; v.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('This browser cannot decode this video codec. Try MP4 (H.264) or WebM (VP9). MOV/HEVC needs Safari or a hardware decoder.')); setTimeout(() => rej(new Error('Video load timed out')), 20000); });
    return { el: v, url, w: v.videoWidth, h: v.videoHeight, duration: v.duration };
  }
  const x = extOf(item.name);
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('decode')); img.src = url; if (img.complete && img.naturalWidth) res(); setTimeout(() => rej(new Error('Image load timed out')), 20000); });
    return { el: img, url, w: img.naturalWidth, h: img.naturalHeight };
  } catch (e) {
    if (x === 'tif' || x === 'tiff' || item.blob.type === 'image/tiff') { const c = decodeTIFF(await item.blob.arrayBuffer()); return { el: c, url, w: c.width, h: c.height }; }
    throw new Error('Image could not be decoded');
  }
}
function makeThumbFrom(el, w, hh, size = 220) { const s = Math.min(1, size / Math.max(w, hh)), c = h_canvas(Math.max(1, Math.round(w * s)), Math.max(1, Math.round(hh * s))); try { c.getContext('2d').drawImage(el, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.7); } catch (_) { return ''; } }
async function setMedia(item, { el, keepProject } = {}) {
  S.still.playing = false; if (typeof sndPause === 'function') sndPause();
  if (S.media && S.media.type === 'video') { S.media.el.pause(); S.media.el.removeAttribute('src'); S.media.el.load(); }
  const E2 = el || await makeElement(item);
  S.media = { id: item.id, name: item.name, type: item.type, blob: item.blob, url: E2.url, el: E2.el, w: E2.w, h: E2.h, duration: E2.duration || 0 };
  if (!keepProject) {
    S.pid = uid('p'); S.name = item.name.replace(/\.[^.]+$/, '').toUpperCase().replace(/[^A-Z0-9_\-]+/g, '_').slice(0, 40) || 'UNTITLED';
    S.source.cx = 50; S.source.cy = 50; S.source.outW = 0;
    S.still.t = 0; S.still.playing = false; if (item.type === 'video') S.motion = false; else if (S.snd) S.motion = true;
    S.video = { in: 0, out: S.media.duration || S.still.dur, speed: S.video.speed, fps: S.video.fps, loop: true };
    H.reset();
  }
  $('#projName').value = S.name; $('#empty').classList.add('hidden'); stopArtFeed();
  $('#sMedia').textContent = `${item.type.toUpperCase()} · ${S.media.w}×${S.media.h}`;
  PV.reset('pv'); RS.srcDirty = true; S.fitPending = true;
  if (isVideo()) wireVideo(S.media.el);
  if (typeof tlOnMedia === 'function') tlOnMedia();
  if (typeof renderAll === 'function') renderAll();
  setSaveState(keepProject ? 'LOADED' : 'UNSAVED', keepProject ? 'ok' : '');
  requestRender(); scheduleAutosave();
}
function wireVideo(v) {
  v.loop = false; v.muted = !(S.monitor && S.origAudio); v.playbackRate = S.video.speed;
  v.addEventListener('seeked', () => { requestRender(); tlUpdate(); });
  v.addEventListener('play', () => { setBusy(false); playLoop(); tlUpdate(); });
  v.addEventListener('pause', () => { setBusy(false); tlUpdate(); if (typeof sndPause === 'function') sndPause(); });
}
function playLoop() {
  const v = S.media && S.media.el; if (!v || v.paused || !isVideo()) return;
  const out = S.video.out || v.duration;
  if (v.currentTime >= out - 0.001) { if (S.video.loop) { v.currentTime = S.video.in; } else { v.pause(); return; } }
  requestRender(); tlUpdate(); if (typeof sndSync === 'function') sndSync();
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(playLoop); else requestAnimationFrame(playLoop);
}

/* ---------- geometry ---------- */
const ASPECTS = { orig: 0, '1:1': 1, '4:5': 4 / 5, '5:4': 5 / 4, '4:3': 4 / 3, '3:4': 3 / 4, '3:2': 3 / 2, '2:3': 2 / 3, '16:9': 16 / 9, '9:16': 9 / 16, '21:9': 21 / 9, '2:1': 2 };
function docDims() {
  const m = S.media; if (!m) return { w: 0, h: 0 };
  const rot = S.source.rot % 180 !== 0, mw = rot ? m.h : m.w, mh = rot ? m.w : m.h, a = ASPECTS[S.source.aspect] || 0;
  let cw = mw, ch = mh; if (a) { if (mw / mh > a) cw = mh * a; else ch = mw / a; }
  cw = Math.max(1, Math.round(cw)); ch = Math.max(1, Math.round(ch));
  const crop = { cw, ch, x: (mw - cw) * S.source.cx / 100, y: (mh - ch) * S.source.cy / 100, mw, mh };
  let w = cw, hh = ch; if (S.source.outW > 0) { w = Math.round(S.source.outW); hh = Math.max(1, Math.round(w * ch / cw)); }
  return { w, h: hh, crop };
}
function proxyDims() { const d = docDims(), cap = SETTINGS.pmax || 4096, s = Math.min(1, cap / Math.max(d.w, d.h)); return { w: Math.max(1, Math.round(d.w * s)), h: Math.max(1, Math.round(d.h * s)) }; }
function drawSource(cx, W, H2, el) {
  const d = docDims(), c = d.crop, m = S.media; el = el || m.el;
  cx.save(); cx.clearRect(0, 0, W, H2); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
  cx.scale(W / c.cw, H2 / c.ch); cx.translate(-c.x, -c.y); cx.translate(c.mw / 2, c.mh / 2);
  cx.rotate(S.source.rot * Math.PI / 180); cx.scale(S.source.fh ? -1 : 1, S.source.fv ? -1 : 1);
  cx.drawImage(el, -m.w / 2, -m.h / 2, m.w, m.h); cx.restore();
}

/* ---------- stack model ---------- */
function mkFx(id, p, mix) { const def = E.MAP[id]; if (!def) return null; return { uid: uid('fx'), id, on: true, mix: mix ?? 100, p: Object.assign(E.defaults(def), clone(p || {})), keys: {}, open: true }; }
function interp(ks, t) { if (t <= ks[0].t) return ks[0].v; const L = ks[ks.length - 1]; if (t >= L.t) return L.v; for (let i = 0; i < ks.length - 1; i++) { const a = ks[i], b = ks[i + 1]; if (t >= a.t && t <= b.t) { const u = (t - a.t) / ((b.t - a.t) || 1); return a.v + (b.v - a.v) * u; } } return L.v; }
function valAt(f, k, t) { const ks = f.keys && f.keys[k]; if (ks && ks.length && isTimed()) return interp(ks, t ?? curTime()); return k === 'mix' ? f.mix : f.p[k]; }
function palColors(id) { if (!id) return null; const c = S.palettes.find(p => p.id === id); return c ? c.c : null; }
function resolveP(f, t, w, hh) {
  const def = E.MAP[f.id], p = Object.assign({}, f.p);
  if (f.keys) for (const k in f.keys) if (k !== 'mix' && f.keys[k].length && isTimed()) p[k] = interp(f.keys[k], t);
  if (f.id === 'bgremove' && w && String(p.mode).startsWith('ai-') && typeof aiMask === 'function') p._ai = aiMask(p.mode, w, hh);
  for (const q of def.params) {
    if (q.t === 'p' && String(p[q.k]).startsWith('c_')) p._pal = palColors(p[q.k]) || ['#000000', '#ffffff'];
    if (q.t === 'img' && w && f.id === 'texture') { if (p.type === 'custom' && typeof texTilePixels === 'function') p._tex = texTilePixels(p, w, hh); continue; }
    if (q.t === 'img' && w && typeof layerPixels === 'function') p._img = layerPixels(p, w, hh);
    if (q.t === 'txt' && w && typeof textPixels === 'function') p._img = textPixels(p, w, hh);
  }
  return p;
}
function resolveStack(t, stack, w, hh) {
  stack = stack || S.override || S.stack;
  return stack.filter(f => f.on && E.MAP[f.id]).map(f => ({ id: f.id, mix: valAt(f, 'mix', t), p: resolveP(f, t, w, hh), blend: f.blend || 'normal', mask: w && typeof maskArray === 'function' ? maskArray(f, w, hh) : null }));
}
const hasMosh = st => st.some(f => f.id === 'datamosh' || (f.id === 'ghost' && (f.p.trail ?? 55) > 0));
function selFx() { return S.stack.find(f => f.uid === S.sel) || null; }
function addFx(id, at, p) { const f = mkFx(id, p); if (!f) return; if (at == null || at > S.stack.length) S.stack.push(f); else S.stack.splice(at, 0, f); S.sel = f.uid; changed(true); toast(`${E.MAP[id].name.toUpperCase()} added to stack`, 'info', 1600); return f; }
function removeFx(u) { const i = S.stack.findIndex(f => f.uid === u); if (i < 0) return; const [f] = S.stack.splice(i, 1); if (S.sel === u) S.sel = (S.stack[i] || S.stack[i - 1] || {}).uid || null; changed(true); toast(`${E.MAP[f.id].name.toUpperCase()} removed`, 'info', 1500); }
function dupFx(u) { const i = S.stack.findIndex(f => f.uid === u); if (i < 0) return; const c = clone(S.stack[i]); c.uid = uid('fx'); S.stack.splice(i + 1, 0, c); S.sel = c.uid; changed(true); }
function moveFx(u, to) { const i = S.stack.findIndex(f => f.uid === u); if (i < 0) return; const [f] = S.stack.splice(i, 1); if (to > i) to--; S.stack.splice(clampN(to, 0, S.stack.length), 0, f); changed(true); }
function resetFx(u) { const f = S.stack.find(x => x.uid === u); if (!f) return; f.p = E.defaults(E.MAP[f.id]); f.mix = 100; f.keys = {}; changed(true); }
function randomizeFx(f) {
  const def = E.MAP[f.id];
  for (const q of def.params) {
    if (q.k === 'seed') { f.p.seed = Math.floor(Math.random() * 9999); continue; }
    if (q.t === 'r') { const span = q.max - q.min, base = q.def; let v = Math.random() < 0.5 ? q.min + Math.random() * span : base + (Math.random() - 0.5) * span * 0.5; v = Math.round(clampN(v, q.min, q.max) / q.step) * q.step; f.p[q.k] = +v.toFixed(3); }
    else if (q.t === 's') f.p[q.k] = q.o[Math.floor(Math.random() * q.o.length)][0];
    else if (q.t === 'tex') f.p[q.k] = q.o[Math.floor(Math.random() * (q.o.length - 1))][0];
    else if (q.t === 'b' && q.k !== 'anim') f.p[q.k] = Math.random() < 0.5;
    else if (q.t === 'c') f.p[q.k] = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    else if (q.t === 'p') { const ids = ['mono', 'gray', 'rgb', ...Object.keys(E.PALETTES), ...S.palettes.map(p => p.id)]; f.p[q.k] = ids[Math.floor(Math.random() * ids.length)]; }
  }
}
function copyFx(f) { S.clip = { id: f.id, p: clone(f.p), mix: f.mix }; try { navigator.clipboard && navigator.clipboard.writeText(JSON.stringify({ shedithers: 'effect', ...S.clip })); } catch (_) { } toast(`${E.MAP[f.id].name.toUpperCase()} settings copied`, 'info', 1500); }
function pasteFx(f) {
  if (!S.clip) { toast('Nothing copied yet', 'err'); return; }
  if (f && f.id === S.clip.id) { f.p = clone(S.clip.p); f.mix = S.clip.mix; changed(true); toast('Settings pasted', 'info', 1500); }
  else { const n = addFx(S.clip.id, f ? S.stack.indexOf(f) + 1 : null, S.clip.p); if (n) n.mix = S.clip.mix; changed(true); toast('Pasted as new layer', 'info', 1500); }
}
/* structural change (re-render panel) or value change */
function changed(structural, live) {
  if (structural && typeof renderStack === 'function') renderStack();
  $('#roFx').textContent = String(S.stack.filter(f => f.on).length).padStart(2, '0');
  requestRender(); if (!live) H.commit();
  if (typeof tlLanes === 'function') tlLanes();
}

/* ---------- rendering ---------- */
const RS = { busy: false, pending: false, ms: 0, srcDirty: true };
function requestRender() { if (!S.media) return; if (RS.busy) { RS.pending = true; return; } doRender(); }
async function doRender() {
  RS.busy = true; RS.pending = false; setBusy(true);
  const { w, h: hh } = proxyDims();
  if (cvB.width !== w || cvB.height !== hh) { cvB.width = cvA.width = w; cvB.height = cvA.height = hh; RS.srcDirty = true; S.fitPending = true; }
  if (isVideo() || RS.srcDirty) { drawSource(bctx, w, hh); RS.srcDirty = false; }
  let id;
  try { id = bctx.getImageData(0, 0, w, hh); }
  catch (e) { RS.busy = false; setBusy(false); toast('Browser blocked pixel access (file:// security). Run start.bat and open http://localhost:8737', 'err', 8000); return; }
  const t = curTime(), stack = resolveStack(t, null, w, hh);
  try {
    const m = await PV.run({ buf: id.data.buffer, w, h: hh, stack, ctx: { S: w / docDims().w, t, frame: frameIdx(t), video: isTimed(), chan: 'pv', keepPrev: isTimed() && hasMosh(stack) } }, [id.data.buffer]);
    if (cvA.width === w && cvA.height === hh) actx.putImageData(new ImageData(new Uint8ClampedArray(m.buf), w, hh), 0, 0);
    RS.ms = m.ms;
  } catch (e) { console.error(e); toast('Render failed: ' + e.message, 'err'); }
  RS.busy = false; setBusy(false);
  if (S.fitPending) { S.fitPending = false; layoutStage(); fitView(); }
  if (S.tool === 'brush' && typeof drawMaskOverlay === 'function') drawMaskOverlay();
  $('#roMs').textContent = RS.ms.toFixed(0) + ' MS'; const d = docDims(); $('#roRes').textContent = `${d.w}×${d.h}`; $('#sProxy').textContent = `${w}×${hh}`;
  if (RS.pending) setTimeout(requestRender, 0);
}

/* ---------- view ---------- */
const V = { z: 1, x: 0, y: 0, fit: true };
const GAP = 14;
function layoutStage() {
  stage.className = S.view.cmp === 'off' ? '' : S.view.cmp; stage.style.setProperty('--gap', GAP + 'px');
  const w = cvA.width;
  if (S.view.cmp === 'wipe') { $('#wrapAfter').style.clipPath = `inset(0 0 0 ${S.view.split}%)`; $('#wipe').style.left = (w * S.view.split / 100) + 'px'; }
  else $('#wrapAfter').style.clipPath = '';
  $$('#cmpSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view.cmp));
}
function stageSize() { const w = cvA.width, hh = cvA.height; return S.view.cmp === 'split' ? { w: w * 2 + GAP, h: hh } : { w, h: hh }; }
function fitView() { const r = viewport.getBoundingClientRect(), s = stageSize(); if (!s.w || !r.width) return; const z = Math.min((r.width - 48) / s.w, (r.height - 48) / s.h); V.z = z; V.x = (r.width - s.w * z) / 2; V.y = (r.height - s.h * z) / 2; V.fit = true; applyView(); }
function applyView() {
  stage.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.z})`; stage.style.setProperty('--inv', 1 / V.z);
  const d = docDims(), docZ = d.w ? V.z * cvA.width / d.w : V.z; $('#zLabel').textContent = Math.round(docZ * 100) + '%';
  const pix = V.z >= 1 ? 'pixelated' : 'auto'; cvA.style.imageRendering = cvB.style.imageRendering = pix;
}
function zoomAt(f, cx, cy) { const nz = clampN(V.z * f, 0.02, 64); V.x = cx - (cx - V.x) * nz / V.z; V.y = cy - (cy - V.y) * nz / V.z; V.z = nz; V.fit = false; applyView(); }
function zoomCenter(f) { const r = viewport.getBoundingClientRect(); zoomAt(f, r.width / 2, r.height / 2); }
function setDocZoom(pct) { const d = docDims(); if (!d.w) return; const target = pct / 100 * d.w / cvA.width; zoomCenter(target / V.z); }
function setCmp(m) { S.view.cmp = m; layoutStage(); if (V.fit || m === 'split') fitView(); }
viewport.addEventListener('wheel', e => { if (!S.media) return; e.preventDefault(); const r = viewport.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
let pan = null, wipeDrag = false;
viewport.addEventListener('mousedown', e => {
  if (!S.media || e.button === 2) return;
  if (e.target.closest('#wipe span')) { wipeDrag = true; e.preventDefault(); return; }
  if (e.target.closest('#empty')) return;
  if (S.tool === 'brush' && e.button === 0 && !e.altKey && typeof brushDown === 'function') { e.preventDefault(); brushDown(e); return; }
  if (S.tool === 'text' && e.button === 0 && !e.altKey && typeof textDown === 'function') { e.preventDefault(); textDown(e); return; }
  pan = { x: e.clientX - V.x, y: e.clientY - V.y }; viewport.classList.add('panning'); e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (wipeDrag) { const r = $('#wrapBefore').getBoundingClientRect(); S.view.split = clampN((e.clientX - r.left) / r.width * 100, 0, 100); layoutStage(); return; }
  if (pan) { V.x = e.clientX - pan.x; V.y = e.clientY - pan.y; V.fit = false; applyView(); }
});
window.addEventListener('mouseup', () => { pan = null; wipeDrag = false; viewport.classList.remove('panning'); });
viewport.addEventListener('mousemove', e => {
  if (!S.media) return; const r = cvA.getBoundingClientRect(); const px2 = Math.floor((e.clientX - r.left) / r.width * cvA.width), py = Math.floor((e.clientY - r.top) / r.height * cvA.height);
  if (px2 < 0 || py < 0 || px2 >= cvA.width || py >= cvA.height || S.view.cmp === 'orig') { $('#sx').textContent = $('#sy').textContent = $('#srgb').textContent = '—'; return; }
  const d = docDims(), f = d.w / cvA.width, p = actx.getImageData(px2, py, 1, 1).data;
  $('#sx').textContent = String(Math.floor(px2 * f)).padStart(4, '0'); $('#sy').textContent = String(Math.floor(py * f)).padStart(4, '0');
  $('#srgb').textContent = `${p[0]},${p[1]},${p[2]}`; $('#sswatch').style.background = `rgb(${p[0]},${p[1]},${p[2]})`;
});
viewport.addEventListener('dblclick', e => { if (S.media && !e.target.closest('#empty')) fitView(); });
viewport.addEventListener('contextmenu', e => {
  if (!S.media) return; e.preventDefault();
  showCtx(e.clientX, e.clientY, [
    { title: 'PREVIEW' }, { label: 'Fit to screen', kbd: 'F', act: fitView }, { label: 'Actual pixels', kbd: '0', act: () => setDocZoom(100) },
    '-', { label: 'Result only', act: () => setCmp('off') }, { label: 'Wipe compare', act: () => setCmp('wipe') }, { label: 'Split view', act: () => setCmp('split') }, { label: 'Show original', act: () => setCmp('orig') },
    '-', { label: 'Copy frame to clipboard', act: copyFrame }, { label: 'Export…', kbd: 'Ctrl+E', act: () => openExport() }, { label: 'Fullscreen', kbd: 'Shift+F', act: toggleFull },
  ]);
});
new ResizeObserver(() => { if (V.fit && S.media) fitView(); }).observe(viewport);
async function copyFrame() { try { const b = await new Promise(r => cvA.toBlob(r, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('Preview frame copied to clipboard'); } catch (e) { toast('Clipboard write not permitted: ' + e.message, 'err'); } }
function toggleFull() { const el = $('#center'); if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen && el.requestFullscreen().catch(e => toast(e.message, 'err')); }
document.addEventListener('fullscreenchange', () => setTimeout(fitView, 60));

/* ---------- history ---------- */
const H = {
  st: [], i: -1,
  snap() { return JSON.stringify({ stack: S.stack, source: S.source }); },
  reset() { this.st = [this.snap()]; this.i = 0; this.ui(); },
  commit() { const s = this.snap(); if (this.st[this.i] === s) return; this.st = this.st.slice(0, this.i + 1); this.st.push(s); if (this.st.length > 120) this.st.shift(); this.i = this.st.length - 1; this.ui(); scheduleAutosave(); setSaveState('UNSAVED'); },
  undo() { if (this.i <= 0) return toast('Nothing to undo', 'info', 1200); this.i--; this.restore(); toast('Undo', 'info', 900); },
  redo() { if (this.i >= this.st.length - 1) return toast('Nothing to redo', 'info', 1200); this.i++; this.restore(); toast('Redo', 'info', 900); },
  restore() { const o = JSON.parse(this.st[this.i]); const srcChanged = JSON.stringify(o.source) !== JSON.stringify(S.source); S.stack = o.stack; S.source = o.source; if (!S.stack.find(f => f.uid === S.sel)) S.sel = S.stack[0] && S.stack[0].uid; if (srcChanged) { RS.srcDirty = true; S.fitPending = true; } renderAll(); requestRender(); this.ui(); scheduleAutosave(); },
  ui() { $('#btnUndo').disabled = this.i <= 0; $('#btnRedo').disabled = this.i >= this.st.length - 1; },
};

/* ---------- projects & autosave ---------- */
function setSaveState(t, cls) { const el = $('#saveState'); el.textContent = t; el.className = 'pill ' + (cls || ''); }
const scheduleAutosave = debounce(() => { if (SETTINGS.autosave && S.media) saveProject(true); }, 1800);
async function saveProject(silent) {
  if (!S.media) { if (!silent) toast('Import media before saving', 'err'); return; }
  try {
    const thumb = cvA.width ? (() => { const s = Math.min(1, 200 / Math.max(cvA.width, cvA.height)), c = h_canvas(Math.round(cvA.width * s), Math.round(cvA.height * s)); c.getContext('2d').drawImage(cvA, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.7); })() : '';
    const rec = { id: S.pid || (S.pid = uid('p')), name: S.name || 'UNTITLED', updated: Date.now(), thumb, media: { id: S.media.id, name: S.media.name, type: S.media.type, blob: S.media.blob }, state: { stack: S.stack, source: S.source, video: S.video, view: S.view, motion: S.motion, still: { dur: S.still.dur }, origAudio: S.origAudio },
      snd: S.snd ? { name: S.snd.name, blob: S.snd.blob, start: S.snd.start, vol: S.snd.vol } : null, extra: layerBlobs() };
    await DB.put('projects', rec); LS.set('shd.last', rec.id);
    setSaveState((silent ? 'AUTOSAVED ' : 'SAVED ') + new Date().toTimeString().slice(0, 5), 'ok');
    if (!silent) toast(`Project ${rec.name} saved`);
    if (typeof leftTab !== 'undefined' && leftTab === 'projects') renderLeft();
  } catch (e) { setSaveState('SAVE FAILED', 'warn'); if (!silent) toast('Save failed: ' + e.message, 'err'); }
}
function layerBlobs() { const ids = new Set(); S.stack.forEach(f => { if (f.id === 'imglayer' && f.p.img) ids.add(f.p.img); }); return [...ids].map(id => S.library.find(x => x.id === id)).filter(Boolean).map(stripEl); }
async function openProject(id) {
  const r = await DB.get('projects', id); if (!r) return toast('Project not found', 'err');
  await applyProjectRecord(r);
  toast(`Project ${r.name} loaded`);
}
async function applyProjectRecord(r) {
  S.pid = r.id; S.name = r.name; S.source = Object.assign({ aspect: 'orig', cx: 50, cy: 50, rot: 0, fh: false, fv: false, outW: 0 }, r.state.source || {});
  S.stack = r.state.stack || []; S.video = Object.assign({ in: 0, out: 0, speed: 1, fps: 24, loop: true }, r.state.video || {});
  if (r.state.view) Object.assign(S.view, r.state.view);
  (r.extra || []).forEach(it => { if (!S.library.find(x => x.id === it.id)) { S.library.push(it); DB.put('media', it).catch(() => { }); } });
  S.motion = !!r.state.motion; S.origAudio = r.state.origAudio !== false; if (r.state.still) S.still.dur = r.state.still.dur || 8; S.still.t = 0;
  S.sel = S.stack[0] && S.stack[0].uid;
  if (typeof clearSound === 'function') clearSound(true);
  await setMedia({ id: r.media.id || uid('m'), name: r.media.name, type: r.media.type, blob: r.media.blob }, { keepProject: true });
  if (r.snd && r.snd.blob && typeof setSound === 'function') setSound(r.snd.blob, r.snd.name, { start: r.snd.start, vol: r.snd.vol, keepDur: true }).catch(e => toast('Soundtrack could not be restored: ' + e.message, 'err'));
  if (isVideo() && !S.video.out) S.video.out = S.media.duration;
  if (!isVideo()) { S.video.in = Math.min(S.video.in, S.still.dur); S.video.out = S.video.out && S.video.out <= S.still.dur ? S.video.out : S.still.dur; }
  tlOnMedia();
  H.reset(); layoutStage(); renderAll();
}
async function exportProjectFile() {
  if (!S.media) return toast('Nothing to export', 'err');
  setBusy(true, 'PACKING PROJECT');
  const data = { shedithers: 'project', version: 1, name: S.name, state: { stack: S.stack, source: S.source, video: S.video }, media: { name: S.media.name, type: S.media.type, data: await blobToDataURL(S.media.blob) } };
  setBusy(false); download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${S.name || 'project'}.shedithers.json`); toast('Project file exported');
}
async function importProjectFile(obj) {
  const blob = await dataURLToBlob(obj.media.data);
  await applyProjectRecord({ id: uid('p'), name: obj.name || 'IMPORTED', media: { name: obj.media.name, type: obj.media.type, blob }, state: obj.state });
  saveProject(true); toast('Project file opened');
}

/* ---------- drag & drop, paste, file inputs ---------- */
let dragDepth = 0;
const isFileDrag = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
window.addEventListener('dragenter', e => { if (!isFileDrag(e)) return; dragDepth++; $('#dropOverlay').classList.add('on'); });
window.addEventListener('dragleave', e => { if (!isFileDrag(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dropOverlay').classList.remove('on'); });
window.addEventListener('dragover', e => { if (isFileDrag(e)) e.preventDefault(); });
window.addEventListener('drop', e => { if (!isFileDrag(e)) return; e.preventDefault(); dragDepth = 0; $('#dropOverlay').classList.remove('on'); const fs = Array.from(e.dataTransfer.files); const json = fs.filter(f => /\.json$/i.test(f.name)); json.forEach(handleJSONFile); importFiles(fs.filter(f => !/\.json$/i.test(f.name))); });
window.addEventListener('paste', e => { if (e.target.matches('input,textarea')) return; const fs = Array.from(e.clipboardData.files || []); if (fs.length) { e.preventDefault(); importFiles(fs); } });
$('#fileIn').addEventListener('change', e => { importFiles(Array.from(e.target.files)); e.target.value = ''; });
let jsonCb = null;
function pickJSON(cb) { jsonCb = cb; $('#jsonIn').click(); }
$('#jsonIn').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleJSONFile(f, jsonCb); jsonCb = null; });
async function handleJSONFile(f, cb) {
  try {
    const o = JSON.parse(await f.text());
    if (cb) return cb(o);
    if (o.shedithers === 'project') return importProjectFile(o);
    if (o.shedithers === 'presets' || Array.isArray(o.presets)) return importPresets(o);
    toast('Unrecognized JSON file', 'err');
  } catch (e) { toast('Could not read JSON: ' + e.message, 'err'); }
}
function openFile() { $('#fileIn').click(); }

/* ---------- presets & palettes persistence ---------- */
function savePresets() { LS.set('shd.presets', S.presets); }
function savePalettes() { LS.set('shd.palettes', S.palettes); }
function stackToPreset(stack) { return stack.map(f => ({ id: f.id, mix: f.mix, on: f.on, p: clone(f.p) })); }
function presetToStack(ps) { return ps.stack.map(e => { const f = mkFx(e.id, e.p, e.mix); if (f && e.on === false) f.on = false; return f; }).filter(Boolean); }
function applyPreset(ps, append) { const st = presetToStack(ps); S.stack = append ? S.stack.concat(st) : st; S.sel = st[0] && st[0].uid; S.override = null; changed(true); toast(`Preset ${ps.name} ${append ? 'appended' : 'applied'}`); }
function saveStackAsPreset() {
  if (!S.stack.length) return toast('Stack is empty — add effects first', 'err');
  promptModal('SAVE PRESET', 'CUSTOM_' + String(S.presets.length + 1).padStart(2, '0'), name => {
    const ex = S.presets.find(p => p.name === name.toUpperCase());
    if (ex) { ex.stack = stackToPreset(S.stack); ex.updated = Date.now(); } else S.presets.unshift({ id: uid('u'), name: name.toUpperCase(), desc: S.stack.map(f => E.MAP[f.id].name).join(' + ').slice(0, 60), stack: stackToPreset(S.stack), custom: true, created: Date.now() });
    savePresets(); toast(`Preset ${name.toUpperCase()} ${ex ? 'updated' : 'saved'}`); if (leftTab === 'presets') renderLeft();
  }, 'PRESET NAME');
}
function exportPresets(list) { download(new Blob([JSON.stringify({ shedithers: 'presets', version: 1, presets: list || S.presets }, null, 1)], { type: 'application/json' }), 'shedithers-presets.json'); toast(`${(list || S.presets).length} preset(s) exported`); }
function importPresets(o) {
  const arr = (o.presets || []).filter(p => p && p.name && Array.isArray(p.stack)); let n = 0;
  for (const p of arr) { const st = p.stack.filter(e => E.MAP[e.id]); if (!st.length) continue; S.presets.unshift({ id: uid('u'), name: String(p.name).toUpperCase().slice(0, 40), desc: p.desc || '', stack: st, custom: true, created: Date.now() }); n++; }
  savePresets(); toast(n ? `${n} preset(s) imported` : 'No valid presets in file', n ? 'ok' : 'err'); if (leftTab === 'presets') renderLeft();
}

/* ---------- top bar wiring ---------- */
$('#btnUndo').onclick = () => H.undo(); $('#btnRedo').onclick = () => H.redo();
$('#btnSave').onclick = () => saveProject(false);
$('#btnExport').onclick = () => openExport();
$('#btnSettings').onclick = () => openSettings();
$('#projName').addEventListener('change', e => { S.name = e.target.value.trim().toUpperCase() || 'UNTITLED'; e.target.value = S.name; scheduleAutosave(); setSaveState('UNSAVED'); });
$('#projName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
$$('#cmpSeg button').forEach(b => b.onclick = () => setCmp(b.dataset.v));
$$('#bgSeg button').forEach(b => b.onclick = () => { S.view.bg = b.dataset.v; viewport.className = 'bg-' + b.dataset.v; $$('#bgSeg button').forEach(x => x.classList.toggle('on', x === b)); });
$('#zIn').onclick = () => zoomCenter(1.25); $('#zOut').onclick = () => zoomCenter(0.8);
$('#zFit').onclick = fitView; $('#z100').onclick = () => setDocZoom(100);
$('#zLabel').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); showCtx(r.left, r.bottom + 4, [{ title: 'ZOOM' }, ...[25, 50, 100, 200, 400, 800].map(z => ({ label: z + '%', act: () => setDocZoom(z) })), '-', { label: 'Fit', act: fitView }]); };
$('#btnFull').onclick = toggleFull;
$('#btnRandAll').onclick = () => randomizeAll();
function randomizeAll() { if (!S.stack.length) return toast('Stack is empty', 'err'); S.stack.forEach(randomizeFx); changed(true); toast('Stack randomized', 'info', 1400); }

/* ---------- keyboard ---------- */
const typing = e => e.target.matches('input:not([type=range]):not([type=checkbox]),textarea,select');
let holdOrig = null;
window.addEventListener('keydown', e => {
  if ($('#modalRoot').children.length) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey;
  if (mod && k.toLowerCase() === 's') { e.preventDefault(); saveProject(false); return; }
  if (mod && k.toLowerCase() === 'e') { e.preventDefault(); openExport(); return; }
  if (mod && k.toLowerCase() === 'o') { e.preventDefault(); openFile(); return; }
  if (typing(e)) return;
  if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? H.redo() : H.undo(); return; }
  if (mod && k.toLowerCase() === 'y') { e.preventDefault(); H.redo(); return; }
  const f = selFx();
  if (mod && k.toLowerCase() === 'c' && f) { e.preventDefault(); copyFx(f); return; }
  if (mod && k.toLowerCase() === 'v' && S.clip) { e.preventDefault(); pasteFx(f); return; }
  if (mod && k.toLowerCase() === 'd' && f) { e.preventDefault(); dupFx(f.uid); return; }
  if (mod) return;
  switch (k) {
    case ' ': if (isTimed()) { e.preventDefault(); togglePlay(); } break;
    case 'v': case 'V': setTool('move'); break;
    case 't': case 'T': setTool(S.tool === 'text' ? 'move' : 'text'); break;
    case 'x': case 'X': if (S.tool === 'brush') $$('#brushMode button').find(b => b.dataset.v !== BR.mode).click(); break;
    case '[': if (S.tool === 'brush') { BR.size = Math.max(2, Math.round(BR.size * 0.8)); $('#brSize').value = BR.size; $('#brSize').oninput(); } break;
    case ']': if (S.tool === 'brush') { BR.size = Math.min(600, Math.round(BR.size * 1.25)); $('#brSize').value = BR.size; $('#brSize').oninput(); } break;
    case 'f': case 'F': if (e.shiftKey) toggleFull(); else fitView(); break;
    case '0': setDocZoom(100); break;
    case '+': case '=': zoomCenter(1.25); break;
    case '-': case '_': zoomCenter(0.8); break;
    case 'c': case 'C': { const m = ['off', 'wipe', 'split', 'orig']; setCmp(m[(m.indexOf(S.view.cmp) + 1) % 4]); break; }
    case 'b': case 'B': setTool(S.tool === 'brush' ? 'move' : 'brush'); break;
    case '\\': if (!holdOrig && S.view.cmp !== 'orig') { holdOrig = S.view.cmp; setCmp('orig'); } break;
    case 'Delete': case 'Backspace': if (f) { e.preventDefault(); removeFx(f.uid); } break;
    case 'r': case 'R': if (e.shiftKey) randomizeAll(); else if (f) { randomizeFx(f); changed(true); } break;
    case 'h': case 'H': if (f) { f.on = !f.on; changed(true); } break;
    case 'ArrowUp': if (f && e.altKey) { e.preventDefault(); moveFx(f.uid, S.stack.indexOf(f) - 1); } else { e.preventDefault(); selectRel(-1); } break;
    case 'ArrowDown': if (f && e.altKey) { e.preventDefault(); moveFx(f.uid, S.stack.indexOf(f) + 2); } else { e.preventDefault(); selectRel(1); } break;
    case 'ArrowLeft': if (isTimed()) { e.preventDefault(); stepFrame(e.shiftKey ? -10 : -1); } break;
    case 'ArrowRight': if (isTimed()) { e.preventDefault(); stepFrame(e.shiftKey ? 10 : 1); } break;
    case 'Home': if (isTimed()) seekTo(S.video.in); break;
    case 'End': if (isTimed()) seekTo(S.video.out); break;
    case 'i': case 'I': if (isTimed()) setTrim('in', curTime()); break;
    case 'o': case 'O': if (isTimed()) setTrim('out', curTime()); break;
    case 'k': case 'K': if (isTimed()) keySelectedMix(); break;
    case '?': openShortcuts(); break;
    case 'Escape': hideCtx(); break;
  }
});
window.addEventListener('keyup', e => { if (e.key === '\\' && holdOrig) { setCmp(holdOrig); holdOrig = null; } });
function selectRel(d) { if (!S.stack.length) return; const i = S.stack.findIndex(f => f.uid === S.sel); S.sel = S.stack[clampN(i + d, 0, S.stack.length - 1)].uid; renderStack(); }
const SHORTCUTS = [['Import media', 'Ctrl+O'], ['Save project', 'Ctrl+S'], ['Export', 'Ctrl+E'], ['Undo / Redo', 'Ctrl+Z / Ctrl+Shift+Z'], ['Copy / paste effect', 'Ctrl+C / Ctrl+V'], ['Duplicate effect', 'Ctrl+D'], ['Delete effect', 'Del'], ['Toggle effect', 'H'], ['Randomize effect / stack', 'R / Shift+R'], ['Select prev / next', '↑ / ↓'], ['Move effect up / down', 'Alt+↑ / Alt+↓'], ['Cycle preview mode', 'C'], ['Hold to see original', '\\'], ['Brush / Text / Move tool', 'B / T / V'], ['Brush paint / erase', 'X'], ['Brush size', '[ / ]'], ['Fit / 100% zoom', 'F / 0'], ['Zoom in / out', '+ / −'], ['Fullscreen', 'Shift+F'], ['Play / pause', 'Space'], ['Step frame (×10)', '← → (Shift)'], ['Set in / out point', 'I / O'], ['Keyframe intensity', 'K'], ['Jump to in / out', 'Home / End'], ['This list', '?']];
function openShortcuts() { openModal({ title: 'KEYBOARD SHORTCUTS', sub: 'INPUT MAP', body: h('div', { class: 'kbd-grid' }, SHORTCUTS.map(([a, b]) => h('div', null, h('span', null, a), h('kbd', null, b)))) }); }
setInterval(() => { const d = new Date(); $('#railClock').textContent = d.toTimeString().slice(0, 5); }, 10000);
