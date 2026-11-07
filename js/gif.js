/* SHEDITHERS — animated GIF encoder (quantize + LZW run in a Web Worker). */
function GIF_ENCODER() {
  'use strict';
  function quant(px, K) {
    const n = px.length >> 2, idx = new Uint8Array(n), exact = new Map(); let ok = true;
    for (let j = 0; j < px.length; j += 4) { const k = (px[j] << 16) | (px[j + 1] << 8) | px[j + 2]; if (!exact.has(k)) { if (exact.size >= K) { ok = false; break; } exact.set(k, exact.size); } }
    if (ok) { const pal = [...exact.keys()].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]); for (let i = 0, j = 0; i < n; i++, j += 4) idx[i] = exact.get((px[j] << 16) | (px[j + 1] << 8) | px[j + 2]); return { pal, idx }; }
    const cnt = new Uint32Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
    for (let j = 0; j < px.length; j += 4) { const b = ((px[j] >> 3) << 10) | ((px[j + 1] >> 3) << 5) | (px[j + 2] >> 3); cnt[b]++; sr[b] += px[j]; sg[b] += px[j + 1]; sb[b] += px[j + 2]; }
    const bins = []; for (let b = 0; b < 32768; b++) if (cnt[b]) bins.push(b); bins.sort((a, b) => cnt[b] - cnt[a]);
    const mean = b => [sr[b] / cnt[b], sg[b] / cnt[b], sb[b] / cnt[b]], pal = [], used = new Uint8Array(32768);
    for (const minD of [40, 22, 10, 0]) {
      for (const b of bins) { if (pal.length >= K) break; if (used[b]) continue; const m = mean(b); let far = true; for (const p of pal) { const d = (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2 + (p[2] - m[2]) ** 2; if (d < minD * minD) { far = false; break; } } if (far) { pal.push(m); used[b] = 1; } }
      if (pal.length >= K) break;
    }
    const P = pal.map(c => c.map(Math.round)), lut = new Int16Array(32768).fill(-1);
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const b = ((px[j] >> 3) << 10) | ((px[j + 1] >> 3) << 5) | (px[j + 2] >> 3); let v = lut[b];
      if (v < 0) { const r = px[j], g = px[j + 1], bl = px[j + 2]; let best = 1e9; for (let q = 0; q < P.length; q++) { const p = P[q], d = (p[0] - r) ** 2 * 2 + (p[1] - g) ** 2 * 4 + (p[2] - bl) ** 2 * 3; if (d < best) { best = d; v = q; } } lut[b] = v; }
      idx[i] = v;
    }
    return { pal: P, idx };
  }
  function frame(px, w, h, K, delay) {
    const { pal, idx } = quant(px, K);
    let bits = 1; while ((1 << bits) < pal.length) bits++; const minCode = Math.max(2, bits), tsize = 1 << bits;
    const out = []; const push = (...a) => { for (const v of a) out.push(v); };
    push(0x21, 0xF9, 4, 0x04, delay & 255, (delay >> 8) & 255, 0, 0); // GCE: disposal 1
    push(0x2C, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0x80 | (bits - 1));
    for (let i = 0; i < tsize; i++) { const c = pal[i] || [0, 0, 0]; push(c[0], c[1], c[2]); }
    push(minCode);
    // LZW
    const clear = 1 << minCode, eoi = clear + 1, bytes = []; let size = minCode + 1, next = eoi + 1, cur = 0, nb = 0; const dict = new Map();
    const emit = c => { cur |= c << nb; nb += size; while (nb >= 8) { bytes.push(cur & 255); cur >>>= 8; nb -= 8; } };
    emit(clear); let prefix = idx[0];
    for (let i = 1; i < idx.length; i++) {
      const k = idx[i], key = (prefix << 8) | k, hit = dict.get(key);
      if (hit !== undefined) { prefix = hit; continue; }
      emit(prefix);
      if (next === 4096) { emit(clear); dict.clear(); size = minCode + 1; next = eoi + 1; }
      else { if (next >= (1 << size)) size++; dict.set(key, next++); }
      prefix = k;
    }
    emit(prefix); emit(eoi); if (nb > 0) bytes.push(cur & 255);
    for (let i = 0; i < bytes.length; i += 255) { const n = Math.min(255, bytes.length - i); out.push(n); for (let j = 0; j < n; j++) out.push(bytes[i + j]); }
    out.push(0);
    return Uint8Array.from(out);
  }
  return { frame };
}
function gifHeader(w, h) {
  const s = 'GIF89a', a = [...s].map(c => c.charCodeAt(0));
  a.push(w & 255, w >> 8, h & 255, h >> 8, 0x70, 0, 0);
  a.push(0x21, 0xFF, 11, ...[...'NETSCAPE2.0'].map(c => c.charCodeAt(0)), 3, 1, 0, 0, 0);
  return Uint8Array.from(a);
}
class GifWorker {
  constructor() {
    const src = `${GIF_ENCODER.toString()}\nconst G=GIF_ENCODER();onmessage=e=>{const m=e.data;try{const b=G.frame(new Uint8ClampedArray(m.buf),m.w,m.h,m.k,m.delay);postMessage({id:m.id,b},[b.buffer])}catch(x){postMessage({id:m.id,err:String(x)})}}`;
    this.w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); this.n = 0; this.p = new Map();
    this.w.onmessage = e => { const j = this.p.get(e.data.id); this.p.delete(e.data.id); e.data.err ? j.rej(new Error(e.data.err)) : j.res(e.data.b); };
  }
  frame(px, w, h, k, delay) { return new Promise((res, rej) => { const id = ++this.n; this.p.set(id, { res, rej }); const buf = px.buffer.slice(0); this.w.postMessage({ id, buf, w, h, k, delay }, [buf]); }); }
  close() { this.w.terminate(); }
}
