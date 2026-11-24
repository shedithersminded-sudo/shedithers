/* SHEDITHERS — utilities: DOM helpers, storage, workers, TIFF decoding. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clampN = (v, a, b) => v < a ? a : v > b ? b : v;
const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') e.innerHTML = v; else if (k in e && k !== 'list' && k !== 'type' || k === 'value') { try { e[k] = v; } catch (_) { e.setAttribute(k, v); } } else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function fmtBytes(n) { if (n == null) return '—'; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'; return (n / 1048576).toFixed(2) + ' MB'; }
function fmtTime(t, fps = 30) { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = Math.floor(t % 60), f = Math.floor((t % 1) * fps); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`; }
function fmtDate(ts) { const d = new Date(ts); return d.toISOString().slice(0, 10) + ' ' + d.toTimeString().slice(0, 5); }
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } },
};
function download(blob, name) { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
function loadScript(src) { return new Promise((res, rej) => { const s = h('script', { src }); s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.append(s); }); }
function blobToDataURL(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); }); }
async function dataURLToBlob(u) { return (await fetch(u)).blob(); }

/* ---------- IndexedDB ---------- */
const DB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('IndexedDB unavailable'));
      const r = indexedDB.open('shedithers', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('projects', { keyPath: 'id' }); d.createObjectStore('media', { keyPath: 'id' }); };
      r.onsuccess = () => res(this.db = r.result); r.onerror = () => rej(r.error);
    });
  },
  async tx(store, mode, fn) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction(store, mode), s = t.objectStore(store); const q = fn(s); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); },
  put(store, v) { return this.tx(store, 'readwrite', s => s.put(v)); },
  get(store, k) { return this.tx(store, 'readonly', s => s.get(k)); },
  del(store, k) { return this.tx(store, 'readwrite', s => s.delete(k)); },
  all(store) { return this.tx(store, 'readonly', s => s.getAll()); },
};

/* ---------- Worker pool ---------- */
const WORKER_SRC = `${SHD_ENGINE.toString()}
const E = SHD_ENGINE(); const prev = {};
onmessage = async (ev) => {
  const m = ev.data;
  if (m.type === 'reset') { delete prev[m.chan]; return; }
  try {
    const t0 = performance.now(); const ctx = m.ctx || {};
    const px = new Uint8ClampedArray(m.buf);
    if (ctx.chan && prev[ctx.chan] && prev[ctx.chan].length === px.length) ctx.prev = prev[ctx.chan];
    const out = E.run(px, m.w, m.h, m.stack, ctx, m.progress ? (i, n) => postMessage({ jid: m.jid, type: 'prog', i, n }) : null);
    if (ctx.chan && ctx.keepPrev) prev[ctx.chan] = new Uint8ClampedArray(out);
    const ms = performance.now() - t0;
    if (m.encode && typeof OffscreenCanvas !== 'undefined') {
      const oc = new OffscreenCanvas(m.w, m.h), cx = oc.getContext('2d');
      const id = new ImageData(out, m.w, m.h);
      if (m.encode.flatten) { const tmp = new OffscreenCanvas(m.w, m.h); tmp.getContext('2d').putImageData(id, 0, 0); cx.fillStyle = m.encode.bg || '#000'; cx.fillRect(0, 0, m.w, m.h); cx.drawImage(tmp, 0, 0); }
      else cx.putImageData(id, 0, 0);
      const blob = await oc.convertToBlob({ type: m.encode.type, quality: m.encode.quality });
      postMessage({ jid: m.jid, type: 'done', blob, ms });
    } else postMessage({ jid: m.jid, type: 'done', buf: out.buffer, w: m.w, h: m.h, ms, raw: true }, [out.buffer]);
  } catch (e) { postMessage({ jid: m.jid, type: 'err', msg: String(e && e.message || e) }); }
};`;
const _ENGINE_MAIN = SHD_ENGINE();
class Pool {
  constructor(name) {
    this.name = name; this.jobs = new Map(); this.id = 0;
    try {
      this.w = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })));
      this.w.onmessage = e => { const m = e.data, j = this.jobs.get(m.jid); if (!j) return; if (m.type === 'prog') { j.prog && j.prog(m.i, m.n); return; } this.jobs.delete(m.jid); m.type === 'err' ? j.rej(new Error(m.msg)) : j.res(m); };
      this.w.onerror = e => { console.error(e); for (const j of this.jobs.values()) j.rej(new Error('Worker crashed')); this.jobs.clear(); };
    } catch (e) { console.warn('Worker unavailable, using main thread', e); this.w = null; this.prev = {}; }
  }
  get busy() { return this.jobs.size > 0; }
  reset(chan) { if (this.w) this.w.postMessage({ type: 'reset', chan }); else delete this.prev[chan]; }
  run(msg, transfer, prog) {
    if (!this.w) return new Promise((res, rej) => setTimeout(() => {
      try { const t0 = performance.now(), ctx = msg.ctx || {}; if (ctx.chan && this.prev[ctx.chan]) ctx.prev = this.prev[ctx.chan]; const out = _ENGINE_MAIN.run(new Uint8ClampedArray(msg.buf), msg.w, msg.h, msg.stack, ctx, prog); if (ctx.keepPrev) this.prev[ctx.chan] = new Uint8ClampedArray(out); res({ buf: out.buffer, w: msg.w, h: msg.h, ms: performance.now() - t0, raw: true }); } catch (e) { rej(e); }
    }, 0));
    return new Promise((res, rej) => { const jid = ++this.id; this.jobs.set(jid, { res, rej, prog }); this.w.postMessage(Object.assign({ jid, type: 'run', progress: !!prog }, msg), transfer || []); });
  }
}
/* Encode raw pixels on main thread when OffscreenCanvas is not available in the worker. */
async function resultToBlob(m, w, h, enc) {
  if (m.blob) return m.blob;
  const c = h_canvas(w, h), cx = c.getContext('2d');
  if (enc.flatten) { cx.fillStyle = enc.bg || '#000'; cx.fillRect(0, 0, w, h); const t = h_canvas(w, h); t.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.buf), w, h), 0, 0); cx.drawImage(t, 0, 0); }
  else cx.putImageData(new ImageData(new Uint8ClampedArray(m.buf), w, h), 0, 0);
  return new Promise(r => c.toBlob(r, enc.type, enc.quality));
}
function h_canvas(w, hh) { const c = document.createElement('canvas'); c.width = w; c.height = hh; return c; }

/* ---------- TIFF (baseline 8-bit; none / PackBits / LZW; predictor 2) ---------- */
function decodeTIFF(buf) {
  const dv = new DataView(buf), le = dv.getUint16(0) === 0x4949, u16 = o => dv.getUint16(o, le), u32 = o => dv.getUint32(o, le);
  if (u16(2) !== 42) throw new Error('Not a TIFF file');
  const ifd = u32(4), n = u16(ifd), tags = {}, sz = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12, tag = u16(e), type = u16(e + 2), cnt = u32(e + 4), s = sz[type] || 1, off = cnt * s > 4 ? u32(e + 8) : e + 8, vals = [];
    for (let j = 0; j < Math.min(cnt, 100000); j++) vals.push(type === 3 ? u16(off + j * 2) : type === 4 ? u32(off + j * 4) : dv.getUint8(off + j));
    tags[tag] = vals;
  }
  const W = tags[256][0], H = tags[257][0], bps = (tags[258] || [1])[0], comp = (tags[259] || [1])[0], photo = (tags[262] || [2])[0], spp = (tags[277] || [1])[0], pred = (tags[317] || [1])[0];
  if (bps !== 8) throw new Error(`TIFF with ${bps}-bit samples is not supported (8-bit only)`);
  if (tags[322]) throw new Error('Tiled TIFF is not supported');
  const offs = tags[273], cnts = tags[279], data = new Uint8Array(W * H * spp); let pos = 0;
  for (let i = 0; i < offs.length; i++) {
    const raw = new Uint8Array(buf, offs[i], cnts[i]);
    const dec = comp === 1 ? raw : comp === 32773 ? packbits(raw) : comp === 5 ? lzw(raw) : null;
    if (!dec) throw new Error('Unsupported TIFF compression (' + comp + ')');
    const take = Math.min(dec.length, data.length - pos); data.set(dec.subarray(0, take), pos); pos += take;
  }
  if (pred === 2) for (let y = 0; y < H; y++) for (let x = 1; x < W; x++) for (let c = 0; c < spp; c++) { const i = (y * W + x) * spp + c; data[i] = (data[i] + data[i - spp]) & 255; }
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const k = i * 4, j = i * spp;
    if (photo <= 1) { let v = data[j]; if (photo === 0) v = 255 - v; out[k] = out[k + 1] = out[k + 2] = v; out[k + 3] = spp > 1 ? data[j + 1] : 255; }
    else { out[k] = data[j]; out[k + 1] = data[j + 1]; out[k + 2] = data[j + 2]; out[k + 3] = spp > 3 ? data[j + 3] : 255; }
  }
  const c = h_canvas(W, H); c.getContext('2d').putImageData(new ImageData(out, W, H), 0, 0); return c;
  function packbits(s) { const o = []; let i = 0; while (i < s.length) { const n2 = (s[i] << 24) >> 24; i++; if (n2 >= 0) { for (let j = 0; j <= n2; j++) o.push(s[i++]); } else if (n2 !== -128) { const b = s[i++]; for (let j = 0; j < 1 - n2; j++) o.push(b); } } return Uint8Array.from(o); }
  function lzw(src) {
    const out2 = []; let bit = 0, cw = 9; const dict = []; const total = src.length * 8;
    const read = () => { let v = 0; for (let i = 0; i < cw; i++) { v = (v << 1) | ((src[bit >> 3] >> (7 - (bit & 7))) & 1); bit++; } return v; };
    const reset = () => { dict.length = 0; for (let i = 0; i < 256; i++) dict[i] = [i]; dict[256] = dict[257] = null; cw = 9; };
    reset(); let prevE = null;
    while (bit + cw <= total) {
      const code = read(); if (code === 257) break; if (code === 256) { reset(); prevE = null; continue; }
      const entry = code < dict.length && dict[code] ? dict[code] : prevE.concat(prevE[0]);
      for (let i = 0; i < entry.length; i++) out2.push(entry[i]);
      if (prevE) dict.push(prevE.concat(entry[0]));
      prevE = entry; if (dict.length + 1 >= (1 << cw) && cw < 12) cw++;
    }
    return Uint8Array.from(out2);
  }
}
