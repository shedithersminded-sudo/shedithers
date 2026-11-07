/* SHEDITHERS — export: image (worker-encoded), video (WebCodecs + muxer, MediaRecorder fallback), batch. */
const EX = { img: { fmt: 'png', q: 92, res: 'doc', scale: 100, cw: 0, ch: 0, alpha: true, bg: '#000000' }, vid: { fmt: 'auto', scale: 100, fps: 0, mbps: 8 } };
const MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', bmp: 'image/bmp', tiff: 'image/tiff' };
const EXT = { png: 'png', jpeg: 'jpg', webp: 'webp', avif: 'avif', gif: 'gif', bmp: 'bmp', tiff: 'tif' };
const PIC_FORMATS = [['png', 'PNG', 'Lossless · transparency'], ['jpeg', 'JPG', 'Small · photos'], ['webp', 'WEBP', 'Small · transparency'], ['avif', 'AVIF', 'Smallest · modern'], ['gif', 'GIF', 'Still GIF · 256 colors'], ['bmp', 'BMP', 'Uncompressed bitmap'], ['tiff', 'TIFF', 'Print · lossless']];
const CUSTOM_ENC = { gif: 1, bmp: 1, tiff: 1 };
const NO_ALPHA = { jpeg: 1, gif: 1, bmp: 1 };
let AVIF_OK = null;
async function avifSupported() { if (AVIF_OK !== null) return AVIF_OK; try { const c = h_canvas(2, 2); const b = await new Promise(r => c.toBlob(r, 'image/avif', 0.8)); AVIF_OK = !!b && b.type === 'image/avif'; } catch (_) { AVIF_OK = false; } return AVIF_OK; }
function openExport() { if (!S.media) return toast('Import media first', 'err'); return isTimed() ? openVideoExport() : openImageExport(); }
/* PICTURE / GIF / VIDEO tab bar shared by both export windows */
function exportTabs(active, close) {
  const go = tab => { if (tab === active) return; close();
    if (tab === 'picture') return openImageExport();
    if (!isVideo() && !S.motion) { setMotion(true); if (!S.snd && tab === 'gif' && S.still.dur === 8) setStillDur(4); }
    EX.vid.fmt = tab === 'gif' ? 'gif' : (EX.vid.fmt === 'gif' || EX.vid.fmt === 'pngseq' ? 'auto' : EX.vid.fmt); openVideoExport(); };
  return h('div', { class: 'ex-tabs' }, [['picture', '▣ PICTURE', isVideo() ? 'current frame' : 'PNG · JPG · WEBP · AVIF · GIF · BMP · TIFF'], ['gif', '◎ GIF', 'animated loop'], ['video', '▶ VIDEO', 'MP4 · WEBM · frames']].map(([k, l, sub]) => h('button', { class: k === active ? 'on' : '', onclick: () => go(k) }, h('b', null, l), h('small', null, sub))));
}
/* ---- extra picture encoders ---- */
function flattenPx(px, bg) { const c = E.hex(bg), o = new Uint8ClampedArray(px.length); for (let k = 0; k < px.length; k += 4) { const a = px[k + 3] / 255; o[k] = px[k] * a + c[0] * (1 - a); o[k + 1] = px[k + 1] * a + c[1] * (1 - a); o[k + 2] = px[k + 2] * a + c[2] * (1 - a); o[k + 3] = 255; } return o; }
function encBMP(px, W, H2) {
  const row = Math.ceil(W * 3 / 4) * 4, size = 54 + row * H2, b = new Uint8Array(size), dv = new DataView(b.buffer);
  b[0] = 66; b[1] = 77; dv.setUint32(2, size, true); dv.setUint32(10, 54, true); dv.setUint32(14, 40, true); dv.setInt32(18, W, true); dv.setInt32(22, H2, true); dv.setUint16(26, 1, true); dv.setUint16(28, 24, true); dv.setUint32(34, row * H2, true); dv.setInt32(38, 2835, true); dv.setInt32(42, 2835, true);
  for (let y = 0; y < H2; y++) { let o = 54 + (H2 - 1 - y) * row; for (let x = 0; x < W; x++, o += 3) { const k = (y * W + x) * 4; b[o] = px[k + 2]; b[o + 1] = px[k + 1]; b[o + 2] = px[k]; } }
  return new Blob([b], { type: 'image/bmp' });
}
function encTIFF(px, W, H2, alpha) {
  const spp = alpha ? 4 : 3, tags = alpha ? 13 : 12, ifd = 8, ifdLen = 2 + tags * 12 + 4, bpsOff = ifd + ifdLen, resOff = bpsOff + spp * 2, dataOff = resOff + 16, dataLen = W * H2 * spp;
  const b = new Uint8Array(dataOff + dataLen), dv = new DataView(b.buffer); b[0] = 0x49; b[1] = 0x49; dv.setUint16(2, 42, true); dv.setUint32(4, ifd, true); dv.setUint16(ifd, tags, true);
  let e = ifd + 2; const tag = (t, type, n, v) => { dv.setUint16(e, t, true); dv.setUint16(e + 2, type, true); dv.setUint32(e + 4, n, true); if (type === 3 && n === 1) dv.setUint16(e + 8, v, true); else dv.setUint32(e + 8, v, true); e += 12; };
  tag(256, 4, 1, W); tag(257, 4, 1, H2); tag(258, 3, spp, bpsOff); tag(259, 3, 1, 1); tag(262, 3, 1, 2); tag(273, 4, 1, dataOff); tag(277, 3, 1, spp); tag(278, 4, 1, H2); tag(279, 4, 1, dataLen); tag(282, 5, 1, resOff); tag(283, 5, 1, resOff + 8); tag(296, 3, 1, 2); if (alpha) tag(338, 3, 1, 2);
  dv.setUint32(e, 0, true); for (let i = 0; i < spp; i++) dv.setUint16(bpsOff + i * 2, 8, true);
  dv.setUint32(resOff, 300, true); dv.setUint32(resOff + 4, 1, true); dv.setUint32(resOff + 8, 300, true); dv.setUint32(resOff + 12, 1, true);
  if (alpha) b.set(px, dataOff); else { let o = dataOff; for (let k = 0; k < px.length; k += 4) { b[o++] = px[k]; b[o++] = px[k + 1]; b[o++] = px[k + 2]; } }
  return new Blob([b], { type: 'image/tiff' });
}
async function encGIFStill(px, W, H2) { const g = new GifWorker(); try { const fr = await g.frame(px, W, H2, 256, 0); return new Blob([gifHeader(W, H2), fr, Uint8Array.of(0x3B)], { type: 'image/gif' }); } finally { g.close(); } }
async function shareBlob(blob, file) {
  try { const f = new File([blob], file, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Made with SHEDITHERS', text: 'Made with SHEDITHERS ♥' }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  download(blob, file); toast('Direct sharing is not available on this device — the file was downloaded instead. Upload it to TikTok / Instagram from your files.', 'info', 6000);
}
const even = n => Math.max(2, Math.round(n / 2) * 2);
function seg(opts, val, cb) { const w = h('div', { class: 'seg', style: { width: '100%' } }); opts.forEach(([v, l]) => w.append(h('button', { class: v === val ? 'on' : '', style: { flex: 1 }, onclick: e => { $$('button', w).forEach(b => b.classList.toggle('on', b === e.currentTarget)); cb(v); } }, l))); return w; }
function rangeRow(label, min, max, val, unit, cb) { const r = h('input', { type: 'range', min, max, step: 1, value: val }), n = h('span', { class: 'u', style: { width: '40px', textAlign: 'right', color: 'var(--acid)' } }, val + unit); const set = () => { n.textContent = r.value + unit; r.style.setProperty('--p', ((r.value - min) / (max - min) * 100) + '%'); }; set(); r.oninput = () => { set(); cb(+r.value, true); }; r.onchange = () => cb(+r.value, false); return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, label), n), r); }
function stat(label, id) { return h('div', null, label, h('b', { id }, '—')); }

/* render the current document at W×H through the stack in the background worker */
async function renderStill(W, H2, enc, prog) {
  const c = h_canvas(W, H2), cx = c.getContext('2d', { willReadFrequently: true });
  drawSource(cx, W, H2);
  const id = cx.getImageData(0, 0, W, H2);
  const fmt = Object.keys(MIME).find(k => MIME[k] === enc.type), custom = CUSTOM_ENC[fmt];
  const m = await BG.run({ buf: id.data.buffer, w: W, h: H2, stack: resolveStack(curTime(), S.stack, W, H2), ctx: { S: W / docDims().w, t: curTime(), frame: frameIdx(curTime()), video: isTimed() }, encode: custom ? undefined : enc }, [id.data.buffer], prog);
  if (custom) {
    let px = new Uint8ClampedArray(m.buf); if (enc.flatten) px = flattenPx(px, enc.bg);
    return fmt === 'bmp' ? encBMP(px, W, H2) : fmt === 'tiff' ? encTIFF(px, W, H2, !enc.flatten) : encGIFStill(px, W, H2);
  }
  const blob = await resultToBlob(m, W, H2, enc);
  if (blob && enc.type === 'image/avif' && blob.type !== 'image/avif') throw new Error('This browser cannot encode AVIF — choose WEBP or PNG');
  return blob;
}
function exportDims(o) {
  const d = docDims();
  if (o.res === 'scale') return { w: Math.max(1, Math.round(d.w * o.scale / 100)), h: Math.max(1, Math.round(d.h * o.scale / 100)) };
  if (o.res === 'custom') return { w: clampN(o.cw || d.w, 1, 16384), h: clampN(o.ch || d.h, 1, 16384) };
  return { w: d.w, h: d.h };
}
function openImageExport() {
  const o = EX.img, d = docDims(); if (!o.cw) { o.cw = d.w; o.ch = d.h; }
  let blob = null, token = 0, url = null;
  const prevBox = h('div', { class: 'ex-prev checker' }), img = h('img'); prevBox.append(img);
  const prog = h('div', { class: 'prog' }, h('i')), status = h('div', { class: 'ex-status' }, 'READY');
  const name = h('input', { class: 'inp', value: o.lastName || (S.name || 'shedithers').toLowerCase(), spellcheck: false }); o.lastName = '';
  const cw = h('input', { class: 'inp', type: 'number', min: 1, max: 16384, value: o.cw }), ch = h('input', { class: 'inp', type: 'number', min: 1, max: 16384, value: o.ch });
  let lock = true; const lockB = h('button', { class: 'tbtn on', 'data-tip': 'Lock aspect ratio', onclick: () => { lock = !lock; lockB.classList.toggle('on', lock); } }, '⛓');
  cw.onchange = () => { o.cw = +cw.value; if (lock) { o.ch = Math.round(o.cw * d.h / d.w); ch.value = o.ch; } rerender(); };
  ch.onchange = () => { o.ch = +ch.value; if (lock) { o.cw = Math.round(o.ch * d.w / d.h); cw.value = o.cw; } rerender(); };
  const customRow = h('div', { class: 'row2', style: { marginTop: '6px' } }, cw, h('span', { class: 'note' }, '×'), ch, lockB);
  const scaleRow = rangeRow('Scale', 10, 400, o.scale, '%', (v, live) => { o.scale = v; if (!live) rerender(); else updDims(); });
  const qRow = rangeRow('Quality', 1, 100, o.q, '', (v, live) => { o.q = v; if (!live) rerender(); });
  const alphaSw = h('div', { class: 'sw' + (o.alpha ? ' on' : '') });
  const alphaRow = h('div', { class: 'ctl-bool', onclick: () => { o.alpha = !o.alpha; alphaSw.classList.toggle('on', o.alpha); rerender(); } }, h('span', null, 'Transparent background'), alphaSw);
  const bgIn = h('input', { type: 'color', value: o.bg, onchange: e => { o.bg = e.target.value; rerender(); } });
  const bgRow = h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, 'Background fill (JPG / alpha off)')), h('div', { class: 'ctl-color' }, bgIn));
  const fmtGrid = h('div', { class: 'fmt-grid' }, PIC_FORMATS.map(([v, l, sub]) => h('button', { 'data-v': v, class: v === o.fmt ? 'on' : '', onclick: () => { o.fmt = v; rerender(); } }, h('b', null, l), h('small', null, sub))));
  avifSupported().then(ok => { if (!ok) { const b = $('[data-v="avif"]', fmtGrid); if (b) { b.disabled = true; b.title = 'Not supported in this browser'; $('small', b).textContent = 'not in this browser'; } if (o.fmt === 'avif') { o.fmt = 'webp'; rerender(); } } });
  const vis = () => { customRow.style.display = o.res === 'custom' ? '' : 'none'; scaleRow.style.display = o.res === 'scale' ? '' : 'none'; qRow.style.display = ['jpeg', 'webp', 'avif'].includes(o.fmt) ? '' : 'none'; alphaRow.style.display = NO_ALPHA[o.fmt] ? 'none' : ''; prevBox.classList.toggle('checker', !NO_ALPHA[o.fmt] && o.alpha); $$('.fmt-grid button', fmtGrid).forEach(b => b.classList.toggle('on', b.dataset.v === o.fmt)); };
  const updDims = () => { const x = exportDims(o); $('#exDims').textContent = `${x.w}×${x.h}`; $('#exMp').textContent = (x.w * x.h / 1e6).toFixed(2) + ' MP'; };
  const rerender = debounce(async () => {
    vis(); updDims(); const my = ++token, x = exportDims(o);
    if (x.w * x.h > 120e6) { status.textContent = 'TOO LARGE — MAX 120 MEGAPIXELS'; return; }
    status.textContent = 'RENDERING FULL RESOLUTION…'; prog.querySelector('i').style.width = '0%'; $('#exGo').disabled = true;
    const t0 = performance.now();
    try {
      const enc = { type: MIME[o.fmt], quality: o.q / 100, flatten: !!NO_ALPHA[o.fmt] || !o.alpha, bg: o.bg };
      const b = await renderStill(x.w, x.h, enc, (i, n) => { if (my === token) prog.querySelector('i').style.width = (i / n * 100) + '%'; });
      if (my !== token) return; blob = b; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); img.src = url;
      prog.querySelector('i').style.width = '100%'; $('#exSize').textContent = fmtBytes(b.size); $('#exTime').textContent = Math.round(performance.now() - t0) + ' MS';
      status.textContent = 'PREVIEW = EXACT EXPORT OUTPUT'; $('#exGo').disabled = false;
    } catch (e) { if (my === token) { status.textContent = 'ERROR: ' + e.message; toast('Export render failed: ' + e.message, 'err'); } }
  }, 250);
  const go = () => {
    if (!blob) return; const x = exportDims(o), file = `${name.value.trim() || 'shedithers'}.${EXT[o.fmt]}`;
    download(blob, file); logExport({ file, fmt: o.fmt.toUpperCase(), w: x.w, h: x.h, size: blob.size }); toast(`Exported ${file} · ${fmtBytes(blob.size)}`); md.close();
  };
  const body = h('div', { class: 'ex-wrap' }), grid1 = h('div', { class: 'ex-grid' },
    h('div', null, prevBox, h('div', { class: 'ex-stats', style: { gridTemplateColumns: 'repeat(4,1fr)' } }, stat('OUTPUT', 'exDims'), stat('PIXELS', 'exMp'), stat('FILE SIZE', 'exSize'), stat('RENDER', 'exTime')), prog, status),
    h('div', null,
      h('div', { class: 'field' }, h('label', null, 'Picture format'), fmtGrid),
      h('div', { class: 'field' }, h('label', null, 'Resolution'), seg([['doc', 'ORIGINAL'], ['scale', 'SCALE'], ['custom', 'CUSTOM']], o.res, v => { o.res = v; rerender(); }), scaleRow, customRow,
        h('div', { class: 'btnrow', style: { marginTop: '6px' } }, [[50, '½×'], [100, '1×'], [200, '2×'], [400, '4×']].map(([s, l]) => h('button', { class: 'tbtn', onclick: () => { o.res = 'scale'; o.scale = s; md.close(); openImageExport(); } }, l))),
        h('label', { style: { marginTop: '10px' } }, 'Print-ready for Redbubble'),
        h('div', { class: 'print-presets' }, [['STICKER', 2800, 2800, 'max 2800 px'], ['T-SHIRT', 4500, 5400, '4500×5400'], ['POSTER / PRINT', 7632, 10800, '7632×10800']].map(([l, W, H, sub]) => h('button', { 'data-tip': `Scale up to fit ${W}×${H} as transparent PNG`, onclick: () => { const k = Math.min(W / d.w, H / d.h); o.res = 'custom'; o.cw = Math.round(d.w * k); o.ch = Math.round(d.h * k); o.fmt = 'png'; o.alpha = true; name.value = `${(S.name || 'shedithers').toLowerCase()}_${l.split(' ')[0].toLowerCase()}`; EX.img.lastName = name.value; md.close(); openImageExport(); } }, l, h('small', null, sub))))),
      h('div', { class: 'field' }, qRow), h('div', { class: 'field' }, alphaRow, bgRow),
      h('div', { class: 'field' }, h('label', null, 'File name'), name))); body.append(grid1);
  body.prepend(exportTabs('picture', () => md.close()));
  const md = openModal({ title: 'EXPORT', sub: `${isVideo() ? 'PICTURE OF CURRENT FRAME · ' : ''}${S.stack.filter(f => f.on).length} FX · ${d.w}×${d.h} DOC`, body, foot: [h('span', { class: 'note' }, 'Processed in a background worker.'), h('button', { class: 'btn', onclick: () => md.close() }, 'CANCEL'), h('button', { class: 'btn', onclick: () => { if (blob) shareBlob(blob, `${name.value.trim() || 'shedithers'}.${EXT[o.fmt]}`); } }, '♥ SHARE'), h('button', { class: 'btn primary', id: 'exGo', disabled: true, onclick: go, html: '<svg><use href="#i-export"/></svg>EXPORT' })], onClose: () => { token++; if (url) setTimeout(() => URL.revokeObjectURL(url), 5000); } });
  rerender();
}

/* ---------------- VIDEO ---------------- */
const MUX = { mp4: 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js', webm: 'https://cdn.jsdelivr.net/npm/webm-muxer@5.0.3/build/webm-muxer.js' };
async function pickCodec(kind, w, hh, fps, bitrate) {
  if (!window.VideoEncoder) return null;
  const list = kind === 'mp4' ? ['avc1.640034', 'avc1.640033', 'avc1.640028', 'avc1.4d0034', 'avc1.42003e', 'avc1.42001f'] : kind === 'vp9' ? ['vp09.00.40.08', 'vp09.00.31.08', 'vp09.00.10.08'] : ['vp8'];
  for (const codec of list) { try { const r = await VideoEncoder.isConfigSupported({ codec, width: w, height: hh, bitrate, framerate: fps }); if (r.supported) return codec; } catch (_) { } }
  return null;
}
function recMime() { const c = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; return window.MediaRecorder ? c.find(m => MediaRecorder.isTypeSupported(m)) : null; }
async function detectVideoFormats(w, hh, fps, br) {
  const out = [];
  if (window.VideoEncoder && window.VideoFrame) {
    if (await pickCodec('mp4', w, hh, fps, br)) out.push(['mp4', 'MP4 · H.264 (WEBCODECS)']);
    if (await pickCodec('vp9', w, hh, fps, br)) out.push(['vp9', 'WEBM · VP9 (WEBCODECS)']);
    if (await pickCodec('vp8', w, hh, fps, br)) out.push(['vp8', 'WEBM · VP8 (WEBCODECS)']);
  }
  out.push(['gif', 'GIF · ANIMATED LOOP (NO AUDIO)']);
  out.push(['pngseq', 'PNG FRAME SEQUENCE · ZIP']);
  const rm = recMime(); if (rm) out.push(['rec', `${rm.includes('mp4') ? 'MP4' : 'WEBM'} · MEDIARECORDER (FALLBACK, NO AUDIO)`]);
  return out;
}
function openVideoExport() {
  const o = EX.vid, d = docDims(); if (!o.fps) o.fps = S.video.fps;
  let running = null;
  const status = h('div', { class: 'ex-status' }, 'DETECTING ENCODERS…'), prog = h('div', { class: 'prog' }, h('i'));
  const prevC = h('canvas'); const prevBox = h('div', { class: 'ex-prev' }, prevC);
  const fmtSel = h('select', { style: { width: '100%' }, onchange: e => { o.fmt = e.target.value; upd(); } });
  if (!o.gifColors) o.gifColors = 128;
  const gifSel = h('select', { style: { width: '100%' }, onchange: e => { o.gifColors = +e.target.value; } }, [16, 32, 64, 128, 256].map(n => h('option', { value: n, selected: n === o.gifColors }, n + ' COLORS')));
  const gifField = h('div', { class: 'field' }, h('label', null, 'GIF palette'), gifSel);
  let lastBlob = null, lastFile = '';
  const shareBtn = h('button', { class: 'btn', disabled: true, onclick: () => lastBlob && shareBlob(lastBlob, lastFile) }, '♥ SHARE');
  const name = h('input', { class: 'inp', value: (S.name || 'shedithers').toLowerCase(), spellcheck: false });
  const fpsSel = h('select', { style: { width: '100%' }, onchange: e => { o.fps = +e.target.value; upd(); } }, [6, 8, 12, 15, 24, 25, 30, 60].map(f => h('option', { value: f, selected: f === o.fps }, f + ' FPS')));
  const dims = () => ({ w: even(d.w * o.scale / 100), h: even(d.h * o.scale / 100) });
  const frames = () => Math.max(1, Math.floor((S.video.out - S.video.in) / S.video.speed * o.fps));
  const upd = () => { const x = dims(), sec = frames() / o.fps, gif = o.fmt === 'gif'; $('#vxDims').textContent = `${x.w}×${x.h}`; $('#vxDur').textContent = sec.toFixed(2) + 's'; $('#vxFr').textContent = frames(); $('#vxSize').textContent = gif ? 'AFTER RENDER' : '≈' + fmtBytes(Math.round((o.mbps * 1e6 + (S.snd || (isVideo() && S.origAudio) ? 192000 : 0)) * sec / 8)); gifField.style.display = gif ? '' : 'none'; brRow.style.display = gif ? 'none' : ''; $('#vxAudio').textContent = gif || o.fmt === 'rec' ? 'NONE' : S.snd ? '♪ ' + S.snd.name.slice(0, 14) + (isVideo() && S.origAudio ? ' + ORIG' : '') : isVideo() && S.origAudio ? 'ORIGINAL' : 'NONE'; };
  const scaleRow = rangeRow('Resolution scale', 10, 100, o.scale, '%', v => { o.scale = v; upd(); });
  const brRow = rangeRow('Bitrate', 1, 50, o.mbps, ' Mb', v => { o.mbps = v; upd(); });
  const goBtn = h('button', { class: 'btn primary', disabled: true, onclick: () => run(), html: '<svg><use href="#i-export"/></svg>RENDER VIDEO' });
  const cancelBtn = h('button', { class: 'btn', onclick: () => { if (running) { running.cancel = true; status.textContent = 'CANCELLING…'; } else md.close(); } }, 'CANCEL');
  async function run() {
    const x = dims(), fps = o.fps, n = frames(), step = S.video.speed / fps, bitrate = Math.round(o.mbps * 1e6);
    running = { cancel: false }; goBtn.disabled = true; fmtSel.disabled = true;
    const vid = isVideo(), v = vid ? h('video', { src: S.media.url, preload: 'auto' }) : null; if (v) v.muted = true;
    if (v) await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('video reload failed')); });
    const work = h_canvas(x.w, x.h), wcx = work.getContext('2d', { willReadFrequently: true });
    const out = h_canvas(x.w, x.h), ocx = out.getContext('2d');
    prevC.width = x.w; prevC.height = x.h; const pcx = prevC.getContext('2d');
    BG.reset('ex'); const t0 = performance.now();
    const renderFrame = async i => {
      const t = Math.min(S.video.in + i * step, dur() - 0.001);
      if (v) await new Promise(res => { if (Math.abs(v.currentTime - t) < 1e-4 && v.readyState >= 2) return res(); const f = () => { v.removeEventListener('seeked', f); res(); }; v.addEventListener('seeked', f); v.currentTime = t; });
      if (v || i === 0) drawSource(wcx, x.w, x.h, v || S.media.el);
      const id = wcx.getImageData(0, 0, x.w, x.h), st = resolveStack(t, S.stack, x.w, x.h);
      const m = await BG.run({ buf: id.data.buffer, w: x.w, h: x.h, stack: st, ctx: { S: x.w / d.w, t, frame: i, video: true, chan: 'ex', keepPrev: hasMosh(st) } }, [id.data.buffer]);
      ocx.putImageData(new ImageData(new Uint8ClampedArray(m.buf), x.w, x.h), 0, 0);
      if (i % 3 === 0) pcx.drawImage(out, 0, 0);
      const el = (performance.now() - t0) / 1000, eta = el / (i + 1) * (n - i - 1);
      prog.querySelector('i').style.width = ((i + 1) / n * 100) + '%'; status.textContent = `FRAME ${i + 1}/${n} · ${((i + 1) / el).toFixed(1)} FPS · ETA ${Math.ceil(eta)}s`;
    };
    try {
      let blob, ext;
      if (o.fmt === 'rec') { ({ blob, ext } = await encodeRecorder(out, renderFrame, n, fps, bitrate)); }
      else if (o.fmt === 'pngseq') {
        if (!window.JSZip) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        const zip = new JSZip(), pad = String(n).length;
        for (let i = 0; i < n; i++) { if (running.cancel) throw new Error('CANCELLED'); await renderFrame(i); const fb = await new Promise(r => out.toBlob(r, 'image/png')); zip.file(`frame_${String(i + 1).padStart(Math.max(4, pad), '0')}.png`, fb); }
        status.textContent = 'ZIPPING FRAMES…'; blob = await zip.generateAsync({ type: 'blob' }); ext = 'zip';
      }
      else if (o.fmt === 'gif') {
        const gw = new GifWorker(), parts = [gifHeader(x.w, x.h)], delay = Math.max(2, Math.round(100 / fps));
        try { for (let i = 0; i < n; i++) { if (running.cancel) throw new Error('CANCELLED'); await renderFrame(i); parts.push(await gw.frame(ocx.getImageData(0, 0, x.w, x.h).data, x.w, x.h, o.gifColors, delay)); } } finally { gw.close(); }
        parts.push(Uint8Array.of(0x3B)); blob = new Blob(parts, { type: 'image/gif' }); ext = 'gif';
      }
      else {
        const kind = o.fmt, codec = await pickCodec(kind, x.w, x.h, fps, bitrate); if (!codec) throw new Error('Encoder not supported at this size');
        status.textContent = 'MIXING AUDIO…';
        let A = null; try { const ab = await buildAudio(n / fps); if (ab) A = await encodeAudio(ab, kind === 'mp4' ? 'mp4' : 'webm'); if (ab && !A) toast('This browser cannot encode audio for this format — exporting silent video', 'info', 5000); } catch (e) { console.warn(e); toast('Audio skipped: ' + e.message, 'info', 5000); }
        status.textContent = 'LOADING MUXER…';
        const lib = kind === 'mp4' ? (window.Mp4Muxer || (await loadScript(MUX.mp4), window.Mp4Muxer)) : (window.WebMMuxer || (await loadScript(MUX.webm), window.WebMMuxer));
        if (!lib) throw new Error('Muxer library failed to load (offline?) — choose the MediaRecorder option instead');
        const aCfg = A ? { codec: A.mux, sampleRate: A.sr, numberOfChannels: A.ch } : undefined;
        const muxer = kind === 'mp4' ? new lib.Muxer({ target: new lib.ArrayBufferTarget(), video: { codec: 'avc', width: x.w, height: x.h, frameRate: fps }, audio: aCfg, fastStart: 'in-memory' }) : new lib.Muxer({ target: new lib.ArrayBufferTarget(), video: { codec: kind === 'vp9' ? 'V_VP9' : 'V_VP8', width: x.w, height: x.h, frameRate: fps }, audio: aCfg });
        let ai = 0; const flushAudio = ts => { if (!A) return; while (ai < A.chunks.length && (ts == null || A.chunks[ai][0].timestamp <= ts)) { muxer.addAudioChunk(A.chunks[ai][0], A.chunks[ai][1]); ai++; } };
        let encErr = null; const enc = new VideoEncoder({ output: (c, meta) => { flushAudio(c.timestamp); muxer.addVideoChunk(c, meta); }, error: e => encErr = e });
        enc.configure({ codec, width: x.w, height: x.h, bitrate, framerate: fps });
        for (let i = 0; i < n; i++) {
          if (running.cancel) throw new Error('CANCELLED'); if (encErr) throw encErr;
          await renderFrame(i);
          const fr = new VideoFrame(out, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
          enc.encode(fr, { keyFrame: i % (fps * 2) === 0 }); fr.close();
          while (enc.encodeQueueSize > 6) await sleep(4);
        }
        status.textContent = 'FINALIZING…'; await enc.flush(); enc.close(); flushAudio(null); muxer.finalize();
        blob = new Blob([muxer.target.buffer], { type: kind === 'mp4' ? 'video/mp4' : 'video/webm' }); ext = kind === 'mp4' ? 'mp4' : 'webm';
      }
      const file = `${name.value.trim() || 'shedithers'}.${ext}`; download(blob, file); lastBlob = blob; lastFile = file; shareBtn.disabled = false;
      logExport({ file, fmt: ext.toUpperCase(), w: x.w, h: x.h, size: blob.size });
      status.textContent = `DONE · ${fmtBytes(blob.size)} · ${((performance.now() - t0) / 1000).toFixed(1)}s`; toast(`Exported ${file} · ${fmtBytes(blob.size)}`);
    } catch (e) { status.textContent = e.message === 'CANCELLED' ? 'CANCELLED' : 'ERROR: ' + e.message; if (e.message !== 'CANCELLED') toast('Video export failed: ' + e.message, 'err', 7000); }
    if (v) { v.removeAttribute('src'); v.load(); } running = null; goBtn.disabled = false; fmtSel.disabled = false;
  }
  const body = h('div', { class: 'ex-wrap' }), grid2 = h('div', { class: 'ex-grid' },
    h('div', null, prevBox, h('div', { class: 'ex-stats', style: { gridTemplateColumns: 'repeat(4,1fr)' } }, stat('OUTPUT', 'vxDims'), stat('DURATION', 'vxDur'), stat('FRAMES', 'vxFr'), stat('EST. SIZE', 'vxSize')), h('div', { class: 'ex-stats', style: { gridTemplateColumns: '1fr', marginTop: '-1px' } }, stat('AUDIO TRACK', 'vxAudio')), prog, status),
    h('div', null,
      h('div', { class: 'field' }, h('label', null, 'Format / encoder'), fmtSel), gifField,
      h('div', { class: 'field' }, scaleRow), h('div', { class: 'field' }, h('label', null, 'Frame rate'), fpsSel), h('div', { class: 'field' }, brRow),
      h('div', { class: 'field' }, h('label', null, 'File name'), name),
      h('p', { class: 'note' }, `RANGE ${fmtTime(S.video.in, o.fps)} → ${fmtTime(S.video.out, o.fps)} · SPEED ${S.video.speed}× · Every frame is processed through all layers at output resolution, then encoded. MP4/WEBM include your soundtrack${isVideo() ? ' and/or the original audio' : ''}. Use 9:16 VERTICAL for TikTok / Reels.`)));
  body.append(grid2); body.prepend(exportTabs(o.fmt === 'gif' ? 'gif' : 'video', () => md.close()));
  if (!isVideo()) body.querySelector('.ex-grid > div:last-child').prepend(h('div', { class: 'field' }, h('label', null, 'Clip length (seconds)'), h('input', { class: 'inp', type: 'number', min: 0.5, max: 600, step: 0.5, value: S.still.dur, onchange: e => { setStillDur(e.target.value); upd(); } })));
  const md = openModal({ title: 'EXPORT', sub: isVideo() ? 'VIDEO · GIF · FRAMES' : 'ANIMATED STILL · GIF · VIDEO', body, foot: [cancelBtn, shareBtn, goBtn], onClose: () => { if (running) running.cancel = true; } });
  upd();
  (async () => {
    const x = dims(); const fm = await detectVideoFormats(x.w, x.h, o.fps, o.mbps * 1e6);
    if (!fm.length) { status.textContent = 'NO VIDEO ENCODER AVAILABLE IN THIS BROWSER. Use Chrome / Edge, or export individual frames as images.'; return; }
    fm.forEach(([v, l]) => fmtSel.append(h('option', { value: v }, l)));
    if (!fm.find(f => f[0] === o.fmt)) o.fmt = fm[0][0]; fmtSel.value = o.fmt;
    status.textContent = fm.some(f => f[0] !== 'rec') ? 'READY · WEBCODECS ENCODING AVAILABLE' : 'READY · WEBCODECS UNAVAILABLE — USING MEDIARECORDER (REAL-TIME PACED)'; goBtn.disabled = false;
    // first-frame preview at export resolution
    try { const pc = h_canvas(x.w, x.h), cx = pc.getContext('2d', { willReadFrequently: true }); drawSource(cx, x.w, x.h); const id = cx.getImageData(0, 0, x.w, x.h); const m = await BG.run({ buf: id.data.buffer, w: x.w, h: x.h, stack: resolveStack(curTime(), S.stack, x.w, x.h), ctx: { S: x.w / d.w, t: curTime(), frame: 0, video: true } }, [id.data.buffer]); prevC.width = x.w; prevC.height = x.h; prevC.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.buf), x.w, x.h), 0, 0); } catch (_) { }
  })();
}
/* ---- audio: mix soundtrack + original audio offline, then encode with WebCodecs ---- */
async function buildAudio(seconds) {
  const srcs = [];
  if (S.snd) srcs.push({ blob: S.snd.blob, offset: S.snd.start + S.video.in, gain: S.snd.vol / 100 });
  if (isVideo() && S.origAudio) srcs.push({ blob: S.media.blob, offset: S.video.in, gain: 1 });
  if (!srcs.length || !window.OfflineAudioContext) return null;
  const sr = 48000, oc = new OfflineAudioContext(2, Math.max(1, Math.ceil(seconds * sr)), sr); let any = false;
  for (const s2 of srcs) {
    let buf; try { buf = await oc.decodeAudioData(await s2.blob.arrayBuffer()); } catch (_) { continue; }
    if (s2.offset >= buf.duration) continue;
    const node = oc.createBufferSource(), g = oc.createGain(); node.buffer = buf; node.playbackRate.value = S.video.speed; g.gain.value = s2.gain;
    node.connect(g).connect(oc.destination); node.start(0, s2.offset); any = true;
  }
  return any ? oc.startRendering() : null;
}
async function encodeAudio(ab, kind) {
  if (!window.AudioEncoder) return null;
  const sr = ab.sampleRate, ch = ab.numberOfChannels, cands = kind === 'mp4' ? [['mp4a.40.2', 'aac'], ['opus', 'opus']] : [['opus', 'A_OPUS']];
  let cfg = null, mux = null;
  for (const [codec, m] of cands) { try { const c = { codec, sampleRate: sr, numberOfChannels: ch, bitrate: 192000 }; if ((await AudioEncoder.isConfigSupported(c)).supported) { cfg = c; mux = m; break; } } catch (_) { } }
  if (!cfg) return null;
  const chunks = []; let err = null; const enc = new AudioEncoder({ output: (c, meta) => chunks.push([c, meta]), error: e => err = e }); enc.configure(cfg);
  const F = 1024;
  for (let i = 0; i < ab.length; i += F) {
    const n = Math.min(F, ab.length - i), data = new Float32Array(n * ch);
    for (let c = 0; c < ch; c++) data.set(ab.getChannelData(c).subarray(i, i + n), c * n);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: ch, timestamp: Math.round(i / sr * 1e6), data }); enc.encode(ad); ad.close();
    if (err) throw err;
  }
  await enc.flush(); enc.close(); if (err) throw err;
  return { chunks, mux, sr, ch };
}
/* MediaRecorder fallback: pause the recorder while a frame is processed, resume for exactly one frame period. */
async function encodeRecorder(canvas, renderFrame, n, fps, bitrate) {
  const mime = recMime(); const stream = canvas.captureStream(0), track = stream.getVideoTracks()[0];
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate }), chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const stopped = new Promise(r => rec.onstop = r);
  rec.start(); rec.pause();
  for (let i = 0; i < n; i++) {
    await renderFrame(i);
    rec.resume(); track.requestFrame && track.requestFrame(); await sleep(1000 / fps); rec.pause();
  }
  rec.resume(); rec.stop(); await stopped;
  return { blob: new Blob(chunks, { type: mime.split(';')[0] }), ext: mime.includes('mp4') ? 'mp4' : 'webm' };
}

/* ---------------- BATCH ---------------- */
function openBatch(items) {
  if (!items.length) return toast('Select images in the library first', 'err');
  if (!S.stack.length) toast('Stack is empty — images will export unprocessed', 'info');
  const o = { fmt: 'png', q: 90, scale: 100, zip: true };
  const status = h('div', { class: 'ex-status' }, `${items.length} IMAGES QUEUED · CURRENT STACK (${S.stack.filter(f => f.on).length} FX) + CANVAS CROP`), prog = h('div', { class: 'prog' }, h('i'));
  let cancel = false, busy = false;
  const zipSw = h('div', { class: 'sw on' });
  const go = async () => {
    if (busy) return; busy = true; goBtn.disabled = true; cancel = false;
    let zip = null;
    if (o.zip) { try { if (!window.JSZip) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'); zip = new JSZip(); } catch (_) { toast('ZIP library unavailable offline — downloading files individually', 'info'); } }
    const prevMedia = S.media; let done = 0;
    for (const it of items) {
      if (cancel) break;
      status.textContent = `PROCESSING ${done + 1}/${items.length} · ${it.name}`;
      try {
        const e2 = await makeElement(it); S.media = { id: it.id, name: it.name, type: 'image', blob: it.blob, url: e2.url, el: e2.el, w: e2.w, h: e2.h };
        const dd = docDims(), W = Math.max(1, Math.round(dd.w * o.scale / 100)), H2 = Math.max(1, Math.round(dd.h * o.scale / 100));
        const b = await renderStill(W, H2, { type: MIME[o.fmt], quality: o.q / 100, flatten: o.fmt === 'jpeg', bg: '#000000' });
        const fn = it.name.replace(/\.[^.]+$/, '') + '_shd.' + EXT[o.fmt];
        if (zip) zip.file(fn, b); else { download(b, fn); await sleep(250); }
        URL.revokeObjectURL(e2.url);
      } catch (e) { toast(`${it.name}: ${e.message}`, 'err'); }
      S.media = prevMedia; done++; prog.querySelector('i').style.width = (done / items.length * 100) + '%';
    }
    S.media = prevMedia;
    if (zip && done) { status.textContent = 'ZIPPING…'; const zb = await zip.generateAsync({ type: 'blob' }); download(zb, 'shedithers-batch.zip'); logExport({ file: 'shedithers-batch.zip', fmt: 'ZIP', w: 0, h: 0, size: zb.size }); }
    status.textContent = cancel ? `CANCELLED AFTER ${done}` : `DONE · ${done} IMAGES`; toast(`Batch complete · ${done} images`); busy = false; goBtn.disabled = false;
  };
  const goBtn = h('button', { class: 'btn primary', onclick: go }, 'PROCESS BATCH');
  const body = h('div', null,
    h('div', { class: 'field' }, h('label', null, 'Format'), seg([['png', 'PNG'], ['jpeg', 'JPG'], ['webp', 'WEBP']], o.fmt, v => o.fmt = v)),
    h('div', { class: 'field' }, rangeRow('Scale', 10, 400, o.scale, '%', v => o.scale = v), rangeRow('Quality (JPG/WEBP)', 1, 100, o.q, '', v => o.q = v)),
    h('div', { class: 'ctl-bool', onclick: () => { o.zip = !o.zip; zipSw.classList.toggle('on', o.zip); } }, h('span', null, 'Bundle as ZIP'), zipSw),
    prog, status);
  openModal({ title: 'BATCH PROCESS', sub: `${items.length} IMAGES`, cls: 'sm', body, foot: [h('button', { class: 'btn', onclick: () => { cancel = true; } }, 'STOP'), goBtn], onClose: () => { cancel = true; } });
}
