/* SHEDITHERS — processing engine.
 * Pure functions over RGBA Uint8ClampedArray buffers. The whole function is serialized
 * with toString() into Web Workers, and also called on the main thread for metadata. */
function SHD_ENGINE() {
'use strict';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const TAU = Math.PI * 2;
function rng(seed) { let a = (seed | 0) ^ 0x9e3779b9; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, s) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = hash2(i, 0, s), b = hash2(i + 1, 0, s); return a + (b - a) * u; }
function vnoise2(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function hex(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const px = (v, c) => Math.max(1, Math.round(v * c.S));
const frac = x => x - Math.floor(x);

/* ---------- param descriptors ---------- */
const R = (k, l, min, max, def, step, u) => ({ k, l, t: 'r', min, max, def, step: step || 1, u: u || '' });
const SEL = (k, l, o, def) => ({ k, l, t: 's', o: o.map(x => Array.isArray(x) ? x : [x, String(x).toUpperCase()]), def });
const B = (k, l, def) => ({ k, l, t: 'b', def: !!def });
const C = (k, l, def) => ({ k, l, t: 'c', def });
const PAL = (k, l, def) => ({ k, l, t: 'p', def });
const SEED = () => R('seed', 'Seed', 0, 9999, 1337);
const ANIM = (d) => B('anim', 'Animate on video', d !== false);

const PALETTES = {
  mono: { n: '1-BIT MONO', c: ['#000000', '#ffffff'] },
  acid: { n: 'ACID TERMINAL', c: ['#0a0b0a', '#2b2f27', '#7d8a3a', '#d4ff00'] },
  phosphor: { n: 'PHOSPHOR', c: ['#020703', '#0d3a12', '#1f8a2c', '#5cff6a'] },
  amber: { n: 'AMBER CRT', c: ['#0a0500', '#4a2400', '#b36200', '#ffb000'] },
  handheld: { n: 'HANDHELD 4', c: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  cga: { n: 'CGA 1', c: ['#000000', '#55ffff', '#ff55ff', '#ffffff'] },
  sepia: { n: 'SEPIA PRINT', c: ['#1b120b', '#5a3e2b', '#a47c55', '#e8d9b9'] },
  blueprint: { n: 'BLUEPRINT', c: ['#0a1a3a', '#1f3f7a', '#6f9bd8', '#e6f0ff'] },
  vapor: { n: 'VAPOR', c: ['#1a1033', '#ff2a6d', '#05d9e8', '#d1f7ff'] },
  infra: { n: 'INFRARED', c: ['#000000', '#3b0f70', '#b5367a', '#fb8861', '#fcfdbf'] },
  news: { n: 'NEWSPRINT', c: ['#1a1a1a', '#e8e2d0'] },
  deep: { n: 'DEEP SPACE', c: ['#02030a', '#0b1a3d', '#2a4b8d', '#8fb3ff', '#e9f1ff'] },
  ega16: { n: '16-COLOR', c: ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'] },
};

/* ---------- shared helpers ---------- */
function quantizer(p) {
  const mode = p.pal || 'mono', n = clamp((p.colors | 0) || 2, 2, 256);
  if (mode === 'gray') { const st = 255 / (n - 1); return { spread: st, q(o, r, g, b) { const v = Math.round(clamp(lum(r, g, b), 0, 255) / st) * st; o[0] = o[1] = o[2] = v; } }; }
  if (mode === 'rgb') { const L = Math.max(2, Math.round(Math.cbrt(n))) - 1, st = 255 / L; return { spread: st, q(o, r, g, b) { o[0] = Math.round(clamp(r, 0, 255) / st) * st; o[1] = Math.round(clamp(g, 0, 255) / st) * st; o[2] = Math.round(clamp(b, 0, 255) / st) * st; } }; }
  const cols = ((p._pal && p._pal.length) ? p._pal : (PALETTES[mode] || PALETTES.mono).c).map(hex);
  const N = cols.length, lut = new Int16Array(32768).fill(-1);
  return {
    spread: 255 / (Math.max(2, Math.cbrt(N)) - 1),
    q(o, r, g, b) {
      r = clamp(r, 0, 255) | 0; g = clamp(g, 0, 255) | 0; b = clamp(b, 0, 255) | 0;
      const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3);
      let idx = lut[key];
      if (idx < 0) {
        const cr = (r & 248) + 4, cg = (g & 248) + 4, cb = (b & 248) + 4; let best = 1e12;
        for (let i = 0; i < N; i++) { const c = cols[i], rm = (cr + c[0]) / 2, dr = cr - c[0], dg = cg - c[1], db = cb - c[2]; const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db; if (d < best) { best = d; idx = i; } }
        lut[key] = idx;
      }
      const c = cols[idx]; o[0] = c[0]; o[1] = c[1]; o[2] = c[2];
    }
  };
}
function grid(src, w, h, p, c) {
  const bs = Math.max(1, Math.round((p.size || 1) * c.S)), gw = Math.ceil(w / bs), gh = Math.ceil(h / bs), buf = new Float32Array(gw * gh * 3);
  const con = (p.con ?? 100) / 100, add = (p.bri || 0) * 1.28 + (50 - (p.thr ?? 50)) * 2.55, nz = (p.noise || 0) * 2.55, Rn = nz ? rng(c.seed + 77) : null;
  for (let gy = 0; gy < gh; gy++) {
    const y0 = gy * bs, y1 = Math.min(h, y0 + bs);
    for (let gx = 0; gx < gw; gx++) {
      const x0 = gx * bs, x1 = Math.min(w, x0 + bs); let r = 0, g = 0, b = 0, n = 0;
      if (bs === 1) { const k = (y0 * w + x0) * 4; r = src[k]; g = src[k + 1]; b = src[k + 2]; n = 1; }
      else for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * w + x) * 4; r += src[k]; g += src[k + 1]; b += src[k + 2]; n++; }
      const i = (gy * gw + gx) * 3, ns = nz ? (Rn() - 0.5) * nz : 0;
      buf[i] = (r / n - 128) * con + 128 + add + ns; buf[i + 1] = (g / n - 128) * con + 128 + add + ns; buf[i + 2] = (b / n - 128) * con + 128 + add + ns;
    }
  }
  return { bs, gw, gh, buf };
}
function ungrid(dst, w, h, G, out) {
  const { bs, gw } = G;
  for (let y = 0; y < h; y++) { const row = ((y / bs) | 0) * gw; for (let x = 0; x < w; x++) { const i = (row + ((x / bs) | 0)) * 3, k = (y * w + x) * 4; dst[k] = out[i]; dst[k + 1] = out[i + 1]; dst[k + 2] = out[i + 2]; } }
}
function ordered(src, dst, w, h, p, c, map) {
  const G = grid(src, w, h, p, c), Q = quantizer(p), o = [0, 0, 0], sp = Q.spread * ((p.spread ?? 100) / 100);
  const { gw, gh, buf } = G, out = new Uint8ClampedArray(gw * gh * 3);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const i = (y * gw + x) * 3, t = (map(x, y) - 0.5) * sp;
    Q.q(o, buf[i] + t, buf[i + 1] + t, buf[i + 2] + t); out[i] = o[0]; out[i + 1] = o[1]; out[i + 2] = o[2];
  }
  ungrid(dst, w, h, G, out);
}
const KERNELS = {
  fs: { d: 16, p: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]] },
  atkinson: { d: 8, p: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]] },
  jarvis: { d: 48, p: [[1, 0, 7], [2, 0, 5], [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3], [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1]] },
  stucki: { d: 42, p: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2], [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1]] },
  burkes: { d: 32, p: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2]] },
  sierra: { d: 32, p: [[1, 0, 5], [2, 0, 3], [-2, 1, 2], [-1, 1, 4], [0, 1, 5], [1, 1, 4], [2, 1, 2], [-1, 2, 2], [0, 2, 3], [1, 2, 2]] },
  sierralite: { d: 4, p: [[1, 0, 2], [-1, 1, 1], [0, 1, 1]] },
};
function diffuse(src, dst, w, h, p, c, K) {
  const G = grid(src, w, h, p, c), Q = quantizer(p), o = [0, 0, 0], { gw, gh, buf } = G, out = new Uint8ClampedArray(gw * gh * 3);
  const pts = K.p, np = pts.length, str = (p.diff ?? 100) / 100 / K.d, serp = !!p.serp;
  for (let y = 0; y < gh; y++) {
    const rev = serp && (y & 1);
    for (let xi = 0; xi < gw; xi++) {
      const x = rev ? gw - 1 - xi : xi, i = (y * gw + x) * 3;
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      Q.q(o, r, g, b); out[i] = o[0]; out[i + 1] = o[1]; out[i + 2] = o[2];
      const er = clamp(r - o[0], -255, 255) * str, eg = clamp(g - o[1], -255, 255) * str, eb = clamp(b - o[2], -255, 255) * str;
      for (let k = 0; k < np; k++) {
        const pt = pts[k], nx = x + (rev ? -pt[0] : pt[0]), ny = y + pt[1];
        if (nx < 0 || nx >= gw || ny >= gh) continue;
        const j = (ny * gw + nx) * 3, wt = pt[2]; buf[j] += er * wt; buf[j + 1] += eg * wt; buf[j + 2] += eb * wt;
      }
    }
  }
  ungrid(dst, w, h, G, out);
}
function bayerMatrix(n) {
  let m = [[0]];
  while (m.length < n) { const s = m.length, nm = []; for (let y = 0; y < s * 2; y++) { nm[y] = []; for (let x = 0; x < s * 2; x++) nm[y][x] = m[y % s][x % s] * 4 + [[0, 2], [3, 1]][(y / s) | 0][(x / s) | 0]; } m = nm; }
  const N = n * n; return m.map(r => r.map(v => (v + 0.5) / N));
}
const BAYER = { 2: bayerMatrix(2), 4: bayerMatrix(4), 8: bayerMatrix(8), 16: bayerMatrix(16) };
let BN = null;
function blueNoise() {
  if (BN) return BN;
  const N = 64, NN = N * N, A = new Float32Array(NN), r = rng(4242); for (let i = 0; i < NN; i++) A[i] = r();
  const kr = 3, sig = 1.5, ker = []; for (let i = -kr; i <= kr; i++) ker.push(Math.exp(-i * i / (2 * sig * sig))); const ks = ker.reduce((a, b) => a + b, 0);
  const T = new Float32Array(NN), U = new Float32Array(NN), idx = new Array(NN);
  for (let it = 0; it < 8; it++) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let i = -kr; i <= kr; i++) s += A[y * N + ((x + i + N) % N)] * ker[i + kr]; T[y * N + x] = s / ks; }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let i = -kr; i <= kr; i++) s += T[((y + i + N) % N) * N + x] * ker[i + kr]; U[y * N + x] = s / ks; }
    for (let i = 0; i < NN; i++) { A[i] = A[i] - U[i]; idx[i] = i; }
    idx.sort((a, b) => A[a] - A[b]); for (let k = 0; k < NN; k++) A[idx[k]] = (k + 0.5) / NN;
  }
  return BN = A;
}
function clusterMap(cell) {
  const v = [], n = cell * cell;
  for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) { const u = (x + 0.5) / cell * TAU, w = (y + 0.5) / cell * TAU; v.push([-(Math.cos(u) + Math.cos(w)) + (x * 0.001 + y * 0.0007), y * cell + x]); }
  v.sort((a, b) => b[0] - a[0]); const m = new Float32Array(n); v.forEach((e, k) => m[e[1]] = (k + 0.5) / n); return m;
}
function boxPass(s, d, w, h, r, horiz) {
  const ia = 1 / (r + r + 1);
  if (horiz) {
    for (let y = 0; y < h; y++) { const row = y * w * 4; for (let ch = 0; ch < 4; ch++) { let acc = 0; for (let i = -r; i <= r; i++) acc += s[row + clamp(i, 0, w - 1) * 4 + ch]; for (let x = 0; x < w; x++) { d[row + x * 4 + ch] = acc * ia; acc += s[row + Math.min(x + r + 1, w - 1) * 4 + ch] - s[row + Math.max(x - r, 0) * 4 + ch]; } } }
  } else {
    const st = w * 4;
    for (let x = 0; x < w; x++) for (let ch = 0; ch < 4; ch++) { const base = x * 4 + ch; let acc = 0; for (let i = -r; i <= r; i++) acc += s[clamp(i, 0, h - 1) * st + base]; for (let y = 0; y < h; y++) { d[y * st + base] = acc * ia; acc += s[Math.min(y + r + 1, h - 1) * st + base] - s[Math.max(y - r, 0) * st + base]; } }
  }
}
function blur(src, w, h, rad) {
  const a = new Uint8ClampedArray(src); if (rad < 0.5) return a;
  const r = Math.max(1, Math.round(rad / 1.6)), b = new Uint8ClampedArray(src.length);
  for (let i = 0; i < 3; i++) { boxPass(a, b, w, h, r, true); boxPass(b, a, w, h, r, false); }
  return a;
}
function lutApply(s, d, lut) { for (let i = 0; i < s.length; i += 4) { d[i] = lut[s[i]]; d[i + 1] = lut[s[i + 1]]; d[i + 2] = lut[s[i + 2]]; } }
function mkLut(f) { const l = new Uint8ClampedArray(256); for (let i = 0; i < 256; i++) l[i] = f(i); return l; }
function samp(s, w, h, x, y, ch) { x = x < 0 ? 0 : x >= w ? w - 1 : x | 0; y = y < 0 ? 0 : y >= h ? h - 1 : y | 0; return s[(y * w + x) * 4 + ch]; }
function shiftRow(s, d, w, y, off, wrap) { const row = y * w * 4; for (let x = 0; x < w; x++) { let sx = x - off; sx = wrap ? ((sx % w) + w) % w : clamp(sx, 0, w - 1); const a = row + x * 4, b = row + sx * 4; d[a] = s[b]; d[a + 1] = s[b + 1]; d[a + 2] = s[b + 2]; d[a + 3] = s[b + 3]; } }
function shiftCol(s, d, w, h, x, off, wrap) { for (let y = 0; y < h; y++) { let sy = y - off; sy = wrap ? ((sy % h) + h) % h : clamp(sy, 0, h - 1); const a = (y * w + x) * 4, b = (sy * w + x) * 4; d[a] = s[b]; d[a + 1] = s[b + 1]; d[a + 2] = s[b + 2]; d[a + 3] = s[b + 3]; } }
function wave(kind, n, seed) { switch (kind) { case 'square': return Math.sin(n * TAU) >= 0 ? 1 : -1; case 'saw': return frac(n) * 2 - 1; case 'noise': return vnoise(n * 4, seed) * 2 - 1; case 'steps': return (Math.floor(vnoise(n * 2, seed) * 6) / 5) * 2 - 1; default: return Math.sin(n * TAU); } }
function coverage(shape, dark, du, dv, cs, ds) {
  if (dark <= 0.001) return 0; let r, dd;
  switch (shape) {
    case 'square': r = Math.sqrt(dark) * cs * 0.5 * ds; dd = Math.max(Math.abs(du), Math.abs(dv)); break;
    case 'diamond': r = Math.sqrt(dark) * cs * ds; dd = Math.abs(du) + Math.abs(dv); break;
    case 'line': r = dark * cs * 0.5 * ds; dd = Math.abs(dv); break;
    case 'cross': r = dark * cs * 0.3 * ds; dd = Math.min(Math.abs(du), Math.abs(dv)); break;
    case 'ellipse': r = Math.sqrt(dark) * cs * 0.62 * ds; dd = Math.sqrt(du * du * 0.6 + dv * dv * 1.6); break;
    default: r = Math.sqrt(dark) * cs * 0.7071 * ds; dd = Math.sqrt(du * du + dv * dv);
  }
  return clamp(r - dd + 0.5, 0, 1) * Math.min(1, r * 2);
}
function halftone(s, d, w, h, p, c) {
  const cs = Math.max(2, p.cell * c.S), ang = p.angle * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang), ds = p.dot / 100, con = p.con / 100;
  const ink = hex(p.ink), pap = hex(p.paper), srcCol = p.color === 'source', bl = blur(s, w, h, cs / 3), inv = !!p.inv;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x * ca + y * sa, v = -x * sa + y * ca, cu = (Math.floor(u / cs) + 0.5) * cs, cv = (Math.floor(v / cs) + 0.5) * cs;
    const sx = clamp(Math.round(cu * ca - cv * sa), 0, w - 1), sy = clamp(Math.round(cu * sa + cv * ca), 0, h - 1), k = (sy * w + sx) * 4;
    let l = clamp((lum(bl[k], bl[k + 1], bl[k + 2]) / 255 - 0.5) * con + 0.5, 0, 1); const dark = inv ? l : 1 - l;
    const cv2 = coverage(p.shape, dark, u - cu, v - cv, cs, ds), o = (y * w + x) * 4;
    const ir = srcCol ? bl[k] : ink[0], ig = srcCol ? bl[k + 1] : ink[1], ib = srcCol ? bl[k + 2] : ink[2];
    d[o] = pap[0] + (ir - pap[0]) * cv2; d[o + 1] = pap[1] + (ig - pap[1]) * cv2; d[o + 2] = pap[2] + (ib - pap[2]) * cv2;
  }
}
function keyOf(kind, r, g, b) {
  switch (kind) {
    case 'hue': { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn; if (!dl) return 0; let hh = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; return ((hh * 60 + 360) % 360) / 360 * 255; }
    case 'sat': { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx * 255 : 0; }
    case 'r': return r; case 'g': return g; case 'b': return b;
    default: return lum(r, g, b);
  }
}

/* ---------- dither param sets ---------- */
const DP = () => [PAL('pal', 'Palette', 'mono'), R('colors', 'Colors', 2, 256, 2), R('thr', 'Threshold', 0, 100, 50), R('size', 'Pattern size', 1, 64, 1, 1, 'px'), R('con', 'Contrast', 0, 200, 100, 1, '%'), R('bri', 'Brightness', -100, 100, 0), R('noise', 'Noise', 0, 100, 0)];
const ORD = (extra) => [...DP(), R('spread', 'Spread', 0, 200, 100, 1, '%'), ...(extra || [])];
const ED = (extra) => [...DP(), R('diff', 'Diffusion', 0, 100, 100, 1, '%'), B('serp', 'Serpentine scan', true), ...(extra || [])];
const HTP = (shape, cell, ang) => [R('cell', 'Frequency (cell)', 2, 80, cell, 1, 'px'), R('dot', 'Dot size', 10, 200, 100, 1, '%'), R('angle', 'Screen angle', 0, 180, ang, 1, '°'), R('con', 'Contrast', 0, 300, 100, 1, '%'), SEL('shape', 'Pattern', ['circle', 'square', 'diamond', 'line', 'ellipse', 'cross'], shape), B('inv', 'Invert pattern', false), SEL('color', 'Ink mode', [['ink', 'INK'], ['source', 'SOURCE']], 'ink'), C('ink', 'Ink', '#0b0c0b'), C('paper', 'Paper', '#f2f2ea')];

/* ---------- effect library ---------- */
const EFFECTS = [
  // DITHER
  { id: 'fs', cat: 'dither', name: 'Floyd–Steinberg', desc: 'Classic error diffusion', params: ED(), fn: (s, d, w, h, p, c) => diffuse(s, d, w, h, p, c, KERNELS.fs) },
  { id: 'atkinson', cat: 'dither', name: 'Atkinson', desc: 'Partial diffusion, crisp highlights', params: ED(), fn: (s, d, w, h, p, c) => diffuse(s, d, w, h, p, c, KERNELS.atkinson) },
  { id: 'diffusion', cat: 'dither', name: 'Error Diffusion+', desc: 'Jarvis / Stucki / Burkes / Sierra', params: ED([SEL('kern', 'Kernel', ['jarvis', 'stucki', 'burkes', 'sierra', ['sierralite', 'SIERRA LITE']], 'jarvis')]), fn: (s, d, w, h, p, c) => diffuse(s, d, w, h, p, c, KERNELS[p.kern] || KERNELS.jarvis) },
  { id: 'bayer', cat: 'dither', name: 'Ordered Bayer', desc: 'Selectable matrix order', params: ORD([SEL('m', 'Matrix', [['2', '2×2'], ['4', '4×4'], ['8', '8×8'], ['16', '16×16']], '4')]), fn: (s, d, w, h, p, c) => { const M = BAYER[p.m] || BAYER[4], n = M.length; ordered(s, d, w, h, p, c, (x, y) => M[y % n][x % n]); } },
  { id: 'bayer2', cat: 'dither', name: 'Bayer 2×2', desc: 'Coarse ordered pattern', params: ORD(), fn: (s, d, w, h, p, c) => ordered(s, d, w, h, p, c, (x, y) => BAYER[2][y & 1][x & 1]) },
  { id: 'bayer4', cat: 'dither', name: 'Bayer 4×4', desc: 'Standard ordered pattern', params: ORD(), fn: (s, d, w, h, p, c) => ordered(s, d, w, h, p, c, (x, y) => BAYER[4][y & 3][x & 3]) },
  { id: 'bayer8', cat: 'dither', name: 'Bayer 8×8', desc: 'Fine ordered pattern', params: ORD(), fn: (s, d, w, h, p, c) => ordered(s, d, w, h, p, c, (x, y) => BAYER[8][y & 7][x & 7]) },
  { id: 'random', cat: 'dither', name: 'Random', desc: 'White-noise threshold', params: ORD([SEED(), ANIM()]), fn: (s, d, w, h, p, c) => ordered(s, d, w, h, p, c, (x, y) => hash2(x, y, c.seed)) },
  { id: 'bluenoise', cat: 'dither', name: 'Blue Noise', desc: 'Void-and-cluster style mask', params: ORD([R('ox', 'Mask offset X', 0, 63, 0), R('oy', 'Mask offset Y', 0, 63, 0)]), fn: (s, d, w, h, p, c) => { const A = blueNoise(); ordered(s, d, w, h, p, c, (x, y) => A[((y + p.oy) & 63) * 64 + ((x + p.ox) & 63)]); } },
  { id: 'htdither', cat: 'dither', name: 'Halftone Dither', desc: 'Rotated screen threshold', params: ORD([R('cell', 'Screen cell', 2, 32, 6), R('angle', 'Screen angle', 0, 90, 45, 1, '°')]), fn: (s, d, w, h, p, c) => { const cs = p.cell, a = p.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a); ordered(s, d, w, h, p, c, (x, y) => { const u = (x * ca + y * sa) / cs * TAU, v = (-x * sa + y * ca) / cs * TAU; return clamp(0.5 - 0.25 * (Math.cos(u) + Math.cos(v)), 0, 0.999); }); } },
  { id: 'dotdither', cat: 'dither', name: 'Dot Dither', desc: 'Clustered-dot ordered', params: ORD([R('cell', 'Dot cell', 3, 24, 6)]), fn: (s, d, w, h, p, c) => { const n = p.cell | 0, M = clusterMap(n); ordered(s, d, w, h, p, c, (x, y) => M[(y % n) * n + (x % n)]); } },
  { id: 'crosshatch', cat: 'dither', name: 'Crosshatch', desc: 'Engraved line layers', params: [R('spacing', 'Line spacing', 2, 40, 6, 1, 'px'), R('width', 'Line width', 0.5, 10, 1, 0.5, 'px'), R('thr', 'Threshold', 0, 100, 50), R('con', 'Contrast', 0, 200, 100, 1, '%'), SEL('layers', 'Layers', [['2', '2'], ['3', '3'], ['4', '4']], '4'), C('ink', 'Ink', '#0b0c0b'), C('paper', 'Paper', '#e9eadf')],
    fn: (s, d, w, h, p, c) => {
      const sp = Math.max(2, p.spacing * c.S), lw = Math.max(0.5, p.width * c.S), ink = hex(p.ink), pap = hex(p.paper), con = p.con / 100, b = (50 - p.thr) / 100, L = +p.layers;
      const T = [0.82, 0.62, 0.42, 0.22].map(v => v + b);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4, l = (lum(s[k], s[k + 1], s[k + 2]) / 255 - 0.5) * con + 0.5;
        const on = (l < T[0] && ((x + y) % sp) < lw) || (L > 1 && l < T[1] && (((x - y) % sp + sp) % sp) < lw) || (L > 2 && l < T[2] && ((y + sp / 2) % sp) < lw) || (L > 3 && l < T[3] && ((x + sp / 2) % sp) < lw);
        const col = on ? ink : pap; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2];
      }
    } },

  // PIXEL
  { id: 'pixelate', cat: 'pixel', name: 'Pixelate', desc: 'Mosaic blocks', params: [R('size', 'Pixel size', 1, 100, 8, 1, 'px'), R('hs', 'Horizontal scale', 25, 400, 100, 1, '%'), R('vs', 'Vertical scale', 25, 400, 100, 1, '%'), SEL('shape', 'Pixel shape', ['square', 'circle', 'diamond', 'rounded'], 'square'), SEL('blend', 'Pixel blending', [['avg', 'AVERAGE'], ['center', 'NEAREST']], 'avg'), R('gap', 'Gap', 0, 50, 0, 1, '%'), C('bg', 'Gap color', '#000000')],
    fn: (s, d, w, h, p, c) => {
      const bw = px(p.size * p.hs / 100, c), bh = px(p.size * p.vs / 100, c), gap = p.gap / 100, bg = hex(p.bg), sh = p.shape;
      for (let by = 0; by < h; by += bh) for (let bx = 0; bx < w; bx += bw) {
        const x1 = Math.min(w, bx + bw), y1 = Math.min(h, by + bh); let r = 0, g = 0, b = 0, a = 0, n = 0;
        if (p.blend === 'center') { const k = (Math.min(h - 1, by + (bh >> 1)) * w + Math.min(w - 1, bx + (bw >> 1))) * 4; r = s[k]; g = s[k + 1]; b = s[k + 2]; a = s[k + 3]; n = 1; }
        else for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) { const k = (y * w + x) * 4; r += s[k]; g += s[k + 1]; b += s[k + 2]; a += s[k + 3]; n++; }
        r /= n; g /= n; b /= n; a /= n;
        const hw = bw / 2, hh = bh / 2, inner = 1 - gap;
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) {
          const u = (x - bx + 0.5 - hw) / hw, v = (y - by + 0.5 - hh) / hh; let ins;
          if (sh === 'circle') ins = u * u + v * v <= inner * inner; else if (sh === 'diamond') ins = Math.abs(u) + Math.abs(v) <= inner; else if (sh === 'rounded') { const q = Math.max(0, Math.abs(u) - inner * 0.6), t = Math.max(0, Math.abs(v) - inner * 0.6); ins = Math.abs(u) <= inner && Math.abs(v) <= inner && q * q + t * t <= (inner * 0.4) ** 2; } else ins = Math.abs(u) <= inner && Math.abs(v) <= inner;
          const k = (y * w + x) * 4;
          if (ins) { d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = a; } else { d[k] = bg[0]; d[k + 1] = bg[1]; d[k + 2] = bg[2]; d[k + 3] = 255; }
        }
      }
    } },
  { id: 'pixelsort', cat: 'pixel', name: 'Pixel Sort', desc: 'Sort spans by brightness/hue', params: [SEL('dir', 'Direction', [['h', 'HORIZONTAL'], ['v', 'VERTICAL']], 'h'), SEL('key', 'Sort by', [['luma', 'LUMA'], ['hue', 'HUE'], ['sat', 'SATURATION'], ['r', 'RED'], ['g', 'GREEN'], ['b', 'BLUE']], 'luma'), R('lo', 'Lower threshold', 0, 100, 25), R('hi', 'Upper threshold', 0, 100, 80), R('len', 'Max span', 1, 100, 100, 1, '%'), B('rev', 'Reverse order', false)],
    fn: (s, d, w, h, p, c) => {
      const vert = p.dir === 'v', L = vert ? h : w, M = vert ? w : h, lo = p.lo * 2.55, hi = p.hi * 2.55, maxl = Math.max(2, Math.round(L * p.len / 100));
      const keys = new Uint8Array(w * h); for (let i = 0, j = 0; i < keys.length; i++, j += 4) keys[i] = keyOf(p.key, s[j], s[j + 1], s[j + 2]);
      const tmp = new Float64Array(L), pos = vert ? (m, l) => l * w + m : (m, l) => m * w + l;
      const sortSpan = (m, a, b) => {
        const n = b - a; if (n < 2) return;
        for (let k = 0; k < n; k++) tmp[k] = keys[pos(m, a + k)] * 1e7 + k;
        const sub = tmp.subarray(0, n); sub.sort();
        for (let j = 0; j < n; j++) { const k = sub[p.rev ? n - 1 - j : j] % 1e7, si = pos(m, a + k) * 4, di = pos(m, a + j) * 4; d[di] = s[si]; d[di + 1] = s[si + 1]; d[di + 2] = s[si + 2]; d[di + 3] = s[si + 3]; }
      };
      for (let m = 0; m < M; m++) { let st = -1; for (let l = 0; l <= L; l++) { const inn = l < L && (() => { const kv = keys[pos(m, l)]; return kv >= lo && kv <= hi; })(); if (inn && st < 0) st = l; if (st >= 0 && (!inn || l - st >= maxl)) { sortSpan(m, st, l); st = inn ? l : -1; } } }
    } },
  { id: 'displace', cat: 'pixel', name: 'Pixel Displacement', desc: 'Offset blocks of pixels', params: [R('block', 'Block size', 2, 128, 16, 1, 'px'), R('amount', 'Amount', 0, 200, 24, 1, 'px'), R('density', 'Density', 0, 100, 50, 1, '%'), SEL('mode', 'Field', [['random', 'RANDOM'], ['flow', 'FLOW'], ['horizontal', 'HORIZ ONLY']], 'random'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const bs = px(p.block, c), am = p.amount * c.S, den = p.density / 100;
      for (let by = 0; by < h; by += bs) for (let bx = 0; bx < w; bx += bs) {
        const gx = bx / bs, gy = by / bs; if (hash2(gx, gy, c.seed + 9) > den) continue;
        let dx, dy; if (p.mode === 'flow') { const a = vnoise2(gx * 0.15, gy * 0.15, c.seed) * TAU * 2; dx = Math.cos(a) * am; dy = Math.sin(a) * am; } else { dx = (hash2(gx, gy, c.seed) - 0.5) * 2 * am; dy = p.mode === 'horizontal' ? 0 : (hash2(gx, gy, c.seed + 1) - 0.5) * 2 * am; }
        dx = Math.round(dx); dy = Math.round(dy);
        for (let y = by; y < Math.min(h, by + bs); y++) for (let x = bx; x < Math.min(w, bx + bs); x++) { const k = (y * w + x) * 4, sx = clamp(x + dx, 0, w - 1), sy = clamp(y + dy, 0, h - 1), j = (sy * w + sx) * 4; d[k] = s[j]; d[k + 1] = s[j + 1]; d[k + 2] = s[j + 2]; d[k + 3] = s[j + 3]; }
      }
    } },
  { id: 'stretch', cat: 'pixel', name: 'Pixel Stretch', desc: 'Smear a scanline outward', params: [SEL('dir', 'Direction', ['down', 'up', 'right', 'left'], 'down'), R('pos', 'Start position', 0, 100, 55, 1, '%'), R('len', 'Length', 0, 100, 30, 1, '%'), R('jag', 'Jagged edge', 0, 100, 40, 1, '%'), R('jw', 'Jag width', 1, 64, 6, 1, 'px'), SEED()],
    fn: (s, d, w, h, p, c) => {
      const vertDir = p.dir === 'down' || p.dir === 'up', L = vertDir ? h : w, M = vertDir ? w : h, p0 = Math.round(p.pos / 100 * (L - 1)), len = p.len / 100 * L, jw = px(p.jw, c), sign = (p.dir === 'down' || p.dir === 'right') ? 1 : -1;
      for (let m = 0; m < M; m++) {
        const ln = Math.round(len * (1 - hash2((m / jw) | 0, 0, c.seed) * p.jag / 100));
        const si = vertDir ? (p0 * w + m) * 4 : (m * w + p0) * 4;
        for (let t = 1; t <= ln; t++) { const l = p0 + t * sign; if (l < 0 || l >= L) break; const k = vertDir ? (l * w + m) * 4 : (m * w + l) * 4; d[k] = s[si]; d[k + 1] = s[si + 1]; d[k + 2] = s[si + 2]; d[k + 3] = s[si + 3]; }
      }
    } },
  { id: 'blocks', cat: 'pixel', name: 'Pixel Blocks', desc: 'Random corrupted rectangles', params: [R('count', 'Block count', 0, 300, 40), R('min', 'Min size', 2, 200, 8, 1, 'px'), R('max', 'Max size', 2, 400, 80, 1, 'px'), SEL('mode', 'Mode', ['mixed', 'shift', 'invert', 'swap', 'solid', 'repeat'], 'mixed'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const r = rng(c.seed), modes = ['shift', 'invert', 'swap', 'solid', 'repeat'];
      for (let i = 0; i < p.count; i++) {
        const bw = px(p.min + r() * Math.max(0, p.max - p.min), c), bh = px(p.min + r() * r() * Math.max(0, p.max - p.min), c), bx = (r() * w) | 0, by = (r() * h) | 0, mode = p.mode === 'mixed' ? modes[(r() * 5) | 0] : p.mode, off = ((r() - 0.5) * bw * 2) | 0;
        const x1 = Math.min(w, bx + bw), y1 = Math.min(h, by + bh), ck = (by * w + bx) * 4, sol = [s[ck], s[ck + 1], s[ck + 2]];
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) {
          const k = (y * w + x) * 4;
          if (mode === 'shift') { const j = (y * w + clamp(x + off, 0, w - 1)) * 4; d[k] = s[j]; d[k + 1] = s[j + 1]; d[k + 2] = s[j + 2]; }
          else if (mode === 'invert') { d[k] = 255 - s[k]; d[k + 1] = 255 - s[k + 1]; d[k + 2] = 255 - s[k + 2]; }
          else if (mode === 'swap') { d[k] = s[k + 2]; d[k + 1] = s[k]; d[k + 2] = s[k + 1]; }
          else if (mode === 'solid') { d[k] = sol[0]; d[k + 1] = sol[1]; d[k + 2] = sol[2]; }
          else { const j = (by * w + x) * 4; d[k] = s[j]; d[k + 1] = s[j + 1]; d[k + 2] = s[j + 2]; }
        }
      }
    } },
  { id: 'subpixel', cat: 'pixel', name: 'RGB Pixel Separation', desc: 'LCD sub-pixel triads', params: [R('size', 'Cell size', 3, 60, 9, 1, 'px'), R('grid', 'Grid darkness', 0, 100, 60, 1, '%'), R('glow', 'Glow', 0, 100, 25, 1, '%'), R('bright', 'Boost', 50, 300, 140, 1, '%'), SEL('layout', 'Layout', [['stripe', 'STRIPE'], ['offset', 'OFFSET']], 'stripe')],
    fn: (s, d, w, h, p, c) => {
      const cs = Math.max(3, Math.round(p.size * c.S)), sw = cs / 3, gl = p.glow / 100, gd = 1 - p.grid / 100, bo = p.bright / 100, gh = Math.max(1, Math.round(cs / 6));
      for (let by = 0; by < h + cs; by += cs) for (let bx0 = 0; bx0 < w; bx0 += cs) {
        const ofs = p.layout === 'offset' && ((bx0 / cs) & 1) ? cs >> 1 : 0, by0 = by - ofs; let r = 0, g = 0, b = 0, n = 0;
        for (let y = Math.max(0, by0); y < Math.min(h, by0 + cs); y++) for (let x = bx0; x < Math.min(w, bx0 + cs); x++) { const k = (y * w + x) * 4; r += s[k]; g += s[k + 1]; b += s[k + 2]; n++; }
        if (!n) continue; const av = [r / n * bo, g / n * bo, b / n * bo];
        for (let y = Math.max(0, by0); y < Math.min(h, by0 + cs); y++) for (let x = bx0; x < Math.min(w, bx0 + cs); x++) {
          const ch = Math.min(2, ((x - bx0) / sw) | 0), k = (y * w + x) * 4, edge = (y - by0) >= cs - gh || ((x - bx0) % sw) < 0.75 ? gd : 1;
          for (let q = 0; q < 3; q++) d[k + q] = (q === ch ? av[q] : av[q] * gl) * edge;
        }
      }
    } },

  // GLITCH
  { id: 'rgbsplit', cat: 'glitch', name: 'RGB Split', desc: 'Offset color channels', params: [R('r', 'Red channel offset', -100, 100, 12, 1, 'px'), R('g', 'Green channel offset', -100, 100, 0, 1, 'px'), R('b', 'Blue channel offset', -100, 100, -12, 1, 'px'), R('hx', 'Horizontal displacement', -100, 100, 100, 1, '%'), R('vy', 'Vertical displacement', -100, 100, 0, 1, '%'), SEL('edge', 'Edges', ['clamp', 'wrap'], 'clamp')],
    fn: (s, d, w, h, p, c) => {
      const o = [p.r, p.g, p.b].map(v => [Math.round(v * p.hx / 100 * c.S), Math.round(v * p.vy / 100 * c.S)]), wrap = p.edge === 'wrap';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; for (let ch = 0; ch < 3; ch++) { let sx = x - o[ch][0], sy = y - o[ch][1]; if (wrap) { sx = ((sx % w) + w) % w; sy = ((sy % h) + h) % h; } else { sx = clamp(sx, 0, w - 1); sy = clamp(sy, 0, h - 1); } d[k + ch] = s[(sy * w + sx) * 4 + ch]; } }
    } },
  { id: 'chroma', cat: 'glitch', name: 'Chromatic Aberration', desc: 'Radial lens fringing', params: [R('str', 'Strength', -100, 100, 25), R('cx', 'Center X', 0, 100, 50, 1, '%'), R('cy', 'Center Y', 0, 100, 50, 1, '%'), R('fall', 'Edge falloff', 0, 300, 100, 1, '%')],
    fn: (s, d, w, h, p, c) => {
      const k0 = p.str / 1000, cx = p.cx / 100 * w, cy = p.cy / 100 * h, md = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)), pw = p.fall / 100;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy, f = k0 * Math.pow(Math.hypot(dx, dy) / md, pw) * 1.5, k = (y * w + x) * 4;
        d[k] = samp(s, w, h, cx + dx * (1 - f), cy + dy * (1 - f), 0); d[k + 2] = samp(s, w, h, cx + dx * (1 + f), cy + dy * (1 + f), 2);
      }
    } },
  { id: 'distort', cat: 'glitch', name: 'Digital Distortion', desc: 'Torn slices + channel tears', params: [R('slices', 'Slice count', 0, 80, 14), R('shift', 'Max shift', 0, 300, 60, 1, 'px'), R('hmax', 'Max slice height', 1, 200, 30, 1, 'px'), B('chan', 'Channel tear', true), R('crush', 'Color crush', 0, 100, 0, 1, '%'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const r = rng(c.seed), tmp = new Uint8ClampedArray(d);
      for (let i = 0; i < p.slices; i++) {
        const y0 = (r() * h) | 0, hh = px(1 + r() * p.hmax, c), off = Math.round((r() - 0.5) * 2 * p.shift * c.S), ch = p.chan && r() < 0.5 ? (r() * 3) | 0 : -1, lv = 2 + ((1 - p.crush / 100) * 30 | 0);
        for (let y = y0; y < Math.min(h, y0 + hh); y++) {
          shiftRow(s, tmp, w, y, off, true);
          const row = y * w * 4;
          for (let x = 0; x < w; x++) { const k = row + x * 4; for (let q = 0; q < 3; q++) { let v = ch >= 0 && q !== ch ? s[k + q] : tmp[k + q]; if (p.crush) v = Math.round(v / 255 * (lv - 1)) / (lv - 1) * 255; d[k + q] = v; } }
        }
      }
    } },
  { id: 'hdisp', cat: 'glitch', name: 'Horizontal Displacement', desc: 'Wave-shift rows', params: [R('amp', 'Amplitude', 0, 300, 24, 1, 'px'), R('freq', 'Frequency', 0.1, 60, 6, 0.1), R('phase', 'Phase', 0, 360, 0, 1, '°'), SEL('wave', 'Waveform', ['sine', 'square', 'saw', 'noise', 'steps'], 'noise'), R('speed', 'Speed', 0, 10, 1, 0.1), SEL('edge', 'Edges', ['wrap', 'clamp'], 'wrap'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => { const ph = p.phase / 360 + (c.video && p.anim ? c.t * p.speed : 0), amp = p.amp * c.S; for (let y = 0; y < h; y++) shiftRow(s, d, w, y, Math.round(wave(p.wave, y / h * p.freq + ph, c.seed) * amp), p.edge === 'wrap'); } },
  { id: 'vdisp', cat: 'glitch', name: 'Vertical Displacement', desc: 'Wave-shift columns', params: [R('amp', 'Amplitude', 0, 300, 24, 1, 'px'), R('freq', 'Frequency', 0.1, 60, 6, 0.1), R('phase', 'Phase', 0, 360, 0, 1, '°'), SEL('wave', 'Waveform', ['sine', 'square', 'saw', 'noise', 'steps'], 'sine'), R('speed', 'Speed', 0, 10, 1, 0.1), SEL('edge', 'Edges', ['wrap', 'clamp'], 'wrap'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => { const ph = p.phase / 360 + (c.video && p.anim ? c.t * p.speed : 0), amp = p.amp * c.S; for (let x = 0; x < w; x++) shiftCol(s, d, w, h, x, Math.round(wave(p.wave, x / w * p.freq + ph, c.seed) * amp), p.edge === 'wrap'); } },
  { id: 'interference', cat: 'glitch', name: 'Signal Interference', desc: 'Rolling bands + tearing', params: [R('str', 'Strength', 0, 100, 50, 1, '%'), R('bands', 'Band count', 0, 40, 4, 0.5), R('tear', 'Line tearing', 0, 100, 30, 1, '%'), R('noise', 'Static', 0, 100, 25, 1, '%'), R('speed', 'Roll speed', 0, 10, 1.5, 0.1), C('tint', 'Interference tint', '#d4ff00'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const t = c.video && p.anim ? c.t * p.speed * 0.25 : 0, st = p.str / 100, tint = hex(p.tint), nz = p.noise * 1.6;
      for (let y = 0; y < h; y++) {
        const band = Math.sin((y / h * p.bands + t) * TAU), mod = 1 + band * st * 0.35, glow = Math.pow(Math.max(0, band), 12) * st;
        let off = 0; const hr = hash2((y / Math.max(1, 3 * c.S)) | 0, 3, c.seed); if (hr < p.tear / 100 * 0.12) off = Math.round((hash2(y, 5, c.seed) - 0.5) * w * 0.15 * st);
        shiftRow(s, d, w, y, off, true);
        const row = y * w * 4;
        for (let x = 0; x < w; x++) { const k = row + x * 4, n = nz ? (hash2(x, y, c.seed + 3) - 0.5) * nz : 0; d[k] = d[k] * mod + tint[0] * glow * 0.5 + n; d[k + 1] = d[k + 1] * mod + tint[1] * glow * 0.5 + n; d[k + 2] = d[k + 2] * mod + tint[2] * glow * 0.5 + n; }
      }
    } },
  { id: 'scanlines', cat: 'glitch', name: 'Scanlines', desc: 'CRT raster lines', params: [R('spacing', 'Spacing', 2, 24, 3, 1, 'px'), R('thick', 'Thickness', 5, 95, 40, 1, '%'), R('dark', 'Darkness', 0, 100, 55, 1, '%'), R('bloom', 'Bloom', 0, 100, 15, 1, '%'), SEL('orient', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), R('offset', 'Offset', 0, 24, 0, 1, 'px')],
    fn: (s, d, w, h, p, c) => {
      const sp = Math.max(2, p.spacing * c.S), th = sp * p.thick / 100, dk = 1 - p.dark / 100, bl = 1 + p.bloom / 100, vert = p.orient === 'vertical', of = p.offset * c.S;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const q = ((vert ? x : y) + of) % sp, m = q < th ? dk : bl, k = (y * w + x) * 4; d[k] = s[k] * m; d[k + 1] = s[k + 1] * m; d[k + 2] = s[k + 2] * m; }
    } },
  { id: 'datamosh', cat: 'glitch', name: 'Datamosh', desc: 'Macroblock smear (uses prior frame on video)', params: [R('block', 'Macroblock', 4, 64, 16, 1, 'px'), R('amount', 'Corruption', 0, 100, 45, 1, '%'), R('drift', 'Motion drift', 0, 100, 18, 1, 'px'), R('crush', 'Block crush', 0, 100, 40, 1, '%'), B('prev', 'Use previous frame', true), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const bs = px(p.block, c), am = p.amount / 100, dr = p.drift * c.S, cr = p.crush / 100, ref = p.prev && c.prev && c.prev.length === s.length ? c.prev : s;
      for (let by = 0; by < h; by += bs) for (let bx = 0; bx < w; bx += bs) {
        const gx = bx / bs, gy = by / bs; if (hash2(gx, gy, c.seed) > am) continue;
        const a = vnoise2(gx * 0.2, gy * 0.2, c.seed + 5) * TAU * 2, dx = Math.round(Math.cos(a) * dr), dy = Math.round(Math.sin(a) * dr);
        const x1 = Math.min(w, bx + bs), y1 = Math.min(h, by + bs); let r = 0, g = 0, b = 0, n = 0;
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) { const j = (clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)) * 4; r += ref[j]; g += ref[j + 1]; b += ref[j + 2]; n++; }
        r /= n; g /= n; b /= n;
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) { const k = (y * w + x) * 4, j = (clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)) * 4; d[k] = ref[j] + (r - ref[j]) * cr; d[k + 1] = ref[j + 1] + (g - ref[j + 1]) * cr; d[k + 2] = ref[j + 2] + (b - ref[j + 2]) * cr; }
      }
    } },
  { id: 'noise', cat: 'glitch', name: 'Digital Noise', desc: 'Sensor grain / static', params: [R('amount', 'Amount', 0, 100, 25, 1, '%'), R('grain', 'Grain size', 1, 16, 1, 1, 'px'), B('mono', 'Monochrome', true), SEL('mode', 'Blend', ['add', 'multiply', 'replace'], 'add'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const a = p.amount / 100, gs = px(p.grain, c);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const gx = (x / gs) | 0, gy = (y / gs) | 0, k = (y * w + x) * 4;
        for (let q = 0; q < 3; q++) { const n = hash2(gx, gy, c.seed + (p.mono ? 0 : q * 101)); d[k + q] = p.mode === 'multiply' ? s[k + q] * (1 - a + a * n * 1.5) : p.mode === 'replace' ? s[k + q] + (n * 255 - s[k + q]) * a : s[k + q] + (n - 0.5) * 255 * a; }
      }
    } },
  { id: 'vhs', cat: 'glitch', name: 'VHS Distortion', desc: 'Tape wobble, chroma bleed, tracking', params: [R('bleed', 'Chroma bleed', 0, 40, 8, 1, 'px'), R('shift', 'Chroma shift', -30, 30, 4, 1, 'px'), R('wobble', 'Wobble', 0, 40, 4, 1, 'px'), R('track', 'Tracking error', 0, 100, 40, 1, '%'), R('noise', 'Tape noise', 0, 100, 20, 1, '%'), R('sat', 'Saturation', 0, 200, 115, 1, '%'), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => {
      const t = c.video && p.anim ? c.t : 0, Y = new Float32Array(w), I = new Float32Array(w), Q = new Float32Array(w), I2 = new Float32Array(w), Q2 = new Float32Array(w);
      const br = Math.round(p.bleed * c.S), sh = Math.round(p.shift * c.S), sat = p.sat / 100, bandY = frac(t * 0.13 + hash2(1, 1, c.seed)) * h, bandH = h * 0.06 * p.track / 100;
      for (let y = 0; y < h; y++) {
        let off = (vnoise(y * 0.03 + t * 3, c.seed) - 0.5) * 2 * p.wobble * c.S; const inBand = Math.abs(y - bandY) < bandH;
        if (inBand) off += (hash2(y, 9, c.seed + (t * 30 | 0)) - 0.5) * w * 0.06;
        const row = y * w * 4;
        for (let x = 0; x < w; x++) { const sx = clamp(Math.round(x - off), 0, w - 1), k = row + sx * 4, r = s[k], g = s[k + 1], b = s[k + 2]; Y[x] = 0.299 * r + 0.587 * g + 0.114 * b; I[x] = 0.596 * r - 0.274 * g - 0.322 * b; Q[x] = 0.211 * r - 0.523 * g + 0.312 * b; }
        if (br > 0) { let ai = 0, aq = 0; const n = br * 2 + 1; for (let i = -br; i <= br; i++) { const xx = clamp(i, 0, w - 1); ai += I[xx]; aq += Q[xx]; } for (let x = 0; x < w; x++) { I2[x] = ai / n; Q2[x] = aq / n; const a = Math.min(w - 1, x + br + 1), b2 = Math.max(0, x - br); ai += I[a] - I[b2]; aq += Q[a] - Q[b2]; } } else { I2.set(I); Q2.set(Q); }
        for (let x = 0; x < w; x++) {
          const cx = clamp(x - sh, 0, w - 1), yy = Y[x] + (p.noise ? (hash2(x >> 1, y, c.seed + (t * 60 | 0)) - 0.5) * p.noise * (inBand ? 2.5 : 0.8) : 0), ii = I2[cx] * sat, qq = Q2[cx] * sat, k = row + x * 4;
          d[k] = yy + 0.956 * ii + 0.621 * qq; d[k + 1] = yy - 0.272 * ii - 0.647 * qq; d[k + 2] = yy - 1.106 * ii + 1.703 * qq;
        }
      }
    } },

  // IMAGE
  { id: 'posterize', cat: 'image', name: 'Posterize', desc: 'Reduce tonal levels', params: [R('levels', 'Levels', 2, 32, 5), SEL('mode', 'Mode', [['rgb', 'PER CHANNEL'], ['luma', 'LUMA']], 'rgb')],
    fn: (s, d, w, h, p) => { const L = p.levels - 1; if (p.mode === 'luma') { for (let i = 0; i < s.length; i += 4) { const l = lum(s[i], s[i + 1], s[i + 2]), q = Math.round(l / 255 * L) / L * 255, f = l > 0 ? q / l : 0; d[i] = s[i] * f; d[i + 1] = s[i + 1] * f; d[i + 2] = s[i + 2] * f; } } else lutApply(s, d, mkLut(v => Math.round(v / 255 * L) / L * 255)); } },
  { id: 'threshold', cat: 'image', name: 'Threshold', desc: 'Hard two-tone cut', params: [R('lvl', 'Level', 0, 255, 128), R('soft', 'Softness', 0, 64, 0), C('dark', 'Dark', '#000000'), C('light', 'Light', '#ffffff')],
    fn: (s, d, w, h, p) => { const a = hex(p.dark), b = hex(p.light); for (let i = 0; i < s.length; i += 4) { const l = lum(s[i], s[i + 1], s[i + 2]), t = p.soft ? clamp((l - p.lvl) / p.soft / 2 + 0.5, 0, 1) : l >= p.lvl ? 1 : 0; d[i] = a[0] + (b[0] - a[0]) * t; d[i + 1] = a[1] + (b[1] - a[1]) * t; d[i + 2] = a[2] + (b[2] - a[2]) * t; } } },
  { id: 'duotone', cat: 'image', name: 'Duotone', desc: 'Map tones to two inks', params: [C('sh', 'Shadows', '#101a10'), C('hi', 'Highlights', '#d4ff00'), R('con', 'Contrast', 0, 300, 100, 1, '%')],
    fn: (s, d, w, h, p) => { const a = hex(p.sh), b = hex(p.hi), cn = p.con / 100; for (let i = 0; i < s.length; i += 4) { const t = clamp((lum(s[i], s[i + 1], s[i + 2]) / 255 - 0.5) * cn + 0.5, 0, 1); d[i] = a[0] + (b[0] - a[0]) * t; d[i + 1] = a[1] + (b[1] - a[1]) * t; d[i + 2] = a[2] + (b[2] - a[2]) * t; } } },
  { id: 'tritone', cat: 'image', name: 'Tritone', desc: 'Shadow / mid / highlight inks', params: [C('sh', 'Shadows', '#07070c'), C('mid', 'Midtones', '#5b4bd6'), C('hi', 'Highlights', '#f2ffd0'), R('mp', 'Midpoint', 5, 95, 50, 1, '%')],
    fn: (s, d, w, h, p) => { const a = hex(p.sh), m = hex(p.mid), b = hex(p.hi), mp = p.mp / 100; for (let i = 0; i < s.length; i += 4) { const l = lum(s[i], s[i + 1], s[i + 2]) / 255; let x, y, t; if (l < mp) { x = a; y = m; t = l / mp; } else { x = m; y = b; t = (l - mp) / (1 - mp); } d[i] = x[0] + (y[0] - x[0]) * t; d[i + 1] = x[1] + (y[1] - x[1]) * t; d[i + 2] = x[2] + (y[2] - x[2]) * t; } } },
  { id: 'invert', cat: 'image', name: 'Invert', desc: 'Negative', params: [SEL('ch', 'Channels', [['rgb', 'RGB'], ['r', 'R'], ['g', 'G'], ['b', 'B'], ['luma', 'LUMA']], 'rgb')],
    fn: (s, d, w, h, p) => { for (let i = 0; i < s.length; i += 4) { if (p.ch === 'luma') { const l = lum(s[i], s[i + 1], s[i + 2]), dl = 255 - 2 * l; d[i] = s[i] + dl; d[i + 1] = s[i + 1] + dl; d[i + 2] = s[i + 2] + dl; } else for (let q = 0; q < 3; q++) if (p.ch === 'rgb' || 'rgb'[q] === p.ch) d[i + q] = 255 - s[i + q]; } } },
  { id: 'grayscale', cat: 'image', name: 'Grayscale', desc: 'Desaturate', params: [SEL('mode', 'Method', [['luma', 'LUMA'], ['avg', 'AVERAGE'], ['light', 'LIGHTNESS'], ['r', 'RED CH'], ['g', 'GREEN CH'], ['b', 'BLUE CH']], 'luma')],
    fn: (s, d, w, h, p) => { for (let i = 0; i < s.length; i += 4) { const r = s[i], g = s[i + 1], b = s[i + 2]; const v = p.mode === 'avg' ? (r + g + b) / 3 : p.mode === 'light' ? (Math.max(r, g, b) + Math.min(r, g, b)) / 2 : p.mode === 'r' ? r : p.mode === 'g' ? g : p.mode === 'b' ? b : lum(r, g, b); d[i] = d[i + 1] = d[i + 2] = v; } } },
  { id: 'contrast', cat: 'image', name: 'Contrast', desc: '', params: [R('amt', 'Contrast', -100, 100, 25)], fn: (s, d, w, h, p) => { const c = p.amt * 2.55, f = (259 * (c + 255)) / (255 * (259 - c)); lutApply(s, d, mkLut(v => f * (v - 128) + 128)); } },
  { id: 'brightness', cat: 'image', name: 'Brightness', desc: '', params: [R('amt', 'Brightness', -100, 100, 15)], fn: (s, d, w, h, p) => lutApply(s, d, mkLut(v => v + p.amt * 2.55)) },
  { id: 'saturation', cat: 'image', name: 'Saturation', desc: '', params: [R('amt', 'Saturation', 0, 300, 140, 1, '%')], fn: (s, d, w, h, p) => { const f = p.amt / 100; for (let i = 0; i < s.length; i += 4) { const l = lum(s[i], s[i + 1], s[i + 2]); d[i] = l + (s[i] - l) * f; d[i + 1] = l + (s[i + 1] - l) * f; d[i + 2] = l + (s[i + 2] - l) * f; } } },
  { id: 'exposure', cat: 'image', name: 'Exposure', desc: 'Stops of light', params: [R('ev', 'Exposure', -5, 5, 0.5, 0.05, 'EV')], fn: (s, d, w, h, p) => { const f = Math.pow(2, p.ev); lutApply(s, d, mkLut(v => 255 * Math.pow(Math.pow(v / 255, 2.2) * f, 1 / 2.2))); } },
  { id: 'gamma', cat: 'image', name: 'Gamma', desc: '', params: [R('g', 'Gamma', 0.1, 5, 1.4, 0.05)], fn: (s, d, w, h, p) => lutApply(s, d, mkLut(v => 255 * Math.pow(v / 255, 1 / p.g))) },
  { id: 'sharpen', cat: 'image', name: 'Sharpness', desc: 'Unsharp mask', params: [R('amt', 'Amount', 0, 400, 120, 1, '%'), R('rad', 'Radius', 1, 20, 2, 0.5, 'px')], fn: (s, d, w, h, p, c) => { const b = blur(s, w, h, p.rad * c.S * 1.6), f = p.amt / 100; for (let i = 0; i < s.length; i += 4) for (let q = 0; q < 3; q++) d[i + q] = s[i + q] + (s[i + q] - b[i + q]) * f; } },
  { id: 'blur', cat: 'image', name: 'Blur', desc: 'Gaussian-ish box blur', params: [R('rad', 'Radius', 0, 60, 6, 0.5, 'px')], fn: (s, d, w, h, p, c) => blur(s, w, h, p.rad * c.S * 1.6) },
  { id: 'edges', cat: 'image', name: 'Edge Detection', desc: 'Laplacian outline', params: [R('str', 'Strength', 0, 800, 200, 1, '%'), B('mono', 'Monochrome', true), B('inv', 'Invert', false), R('thr', 'Threshold', 0, 255, 0)],
    fn: (s, d, w, h, p) => { const f = p.str / 100; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; let vals = [0, 0, 0]; for (let q = 0; q < 3; q++) vals[q] = Math.abs(4 * s[k + q] - samp(s, w, h, x - 1, y, q) - samp(s, w, h, x + 1, y, q) - samp(s, w, h, x, y - 1, q) - samp(s, w, h, x, y + 1, q)) * f; if (p.mono) { const l = lum(vals[0], vals[1], vals[2]); vals = [l, l, l]; } for (let q = 0; q < 3; q++) { let v = vals[q]; if (p.thr) v = v >= p.thr ? 255 : 0; d[k + q] = p.inv ? 255 - v : v; } } } },
  { id: 'sobel', cat: 'image', name: 'Sobel', desc: 'Gradient magnitude edges', params: [R('str', 'Strength', 0, 500, 120, 1, '%'), SEL('mode', 'Render', [['mono', 'MONO'], ['color', 'COLOR EDGE'], ['ink', 'INK OVER'], ['angle', 'DIRECTION']], 'mono'), R('thr', 'Threshold', 0, 255, 0), B('inv', 'Invert', false)],
    fn: (s, d, w, h, p) => {
      const L = new Float32Array(w * h), f = p.str / 100; for (let i = 0, j = 0; i < L.length; i++, j += 4) L[i] = lum(s[j], s[j + 1], s[j + 2]);
      const g = (x, y) => L[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const gx = -g(x - 1, y - 1) - 2 * g(x - 1, y) - g(x - 1, y + 1) + g(x + 1, y - 1) + 2 * g(x + 1, y) + g(x + 1, y + 1), gy = -g(x - 1, y - 1) - 2 * g(x, y - 1) - g(x + 1, y - 1) + g(x - 1, y + 1) + 2 * g(x, y + 1) + g(x + 1, y + 1);
        let m = clamp(Math.sqrt(gx * gx + gy * gy) * f / 4, 0, 255); if (p.thr) m = m >= p.thr ? 255 : 0; if (p.inv) m = 255 - m; const k = (y * w + x) * 4;
        if (p.mode === 'color') { const t = m / 255; d[k] = s[k] * t; d[k + 1] = s[k + 1] * t; d[k + 2] = s[k + 2] * t; }
        else if (p.mode === 'ink') { const t = 1 - m / 255; d[k] = s[k] * t; d[k + 1] = s[k + 1] * t; d[k + 2] = s[k + 2] * t; }
        else if (p.mode === 'angle') { const a = Math.atan2(gy, gx), t = m / 255; d[k] = (Math.cos(a) * 0.5 + 0.5) * 255 * t; d[k + 1] = (Math.sin(a) * 0.5 + 0.5) * 255 * t; d[k + 2] = (1 - Math.abs(Math.cos(a))) * 255 * t; }
        else d[k] = d[k + 1] = d[k + 2] = m;
      }
    } },
  { id: 'vignette', cat: 'image', name: 'Vignette', desc: 'Darken edges', params: [R('amt', 'Amount', 0, 100, 50, 1, '%'), R('size', 'Size', 0, 100, 60, 1, '%'), R('soft', 'Softness', 1, 100, 50, 1, '%'), C('col', 'Color', '#000000')],
    fn: (s, d, w, h, p) => { const col = hex(p.col), a = p.amt / 100, r0 = p.size / 100, sf = Math.max(0.01, p.soft / 100); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x / w - 0.5) * 2, v = (y / h - 0.5) * 2, dd = Math.sqrt(u * u + v * v) / 1.4142, t = clamp((dd - r0 * 0.9) / sf, 0, 1) * a, k = (y * w + x) * 4; for (let q = 0; q < 3; q++) d[k + q] = s[k + q] + (col[q] - s[k + q]) * t; } } },
  { id: 'hue', cat: 'image', name: 'Hue Shift', desc: 'Rotate hue', params: [R('deg', 'Hue', -180, 180, 90, 1, '°')],
    fn: (s, d, w, h, p) => { const a = p.deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a); const m = [0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928, 0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283, 0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072]; for (let i = 0; i < s.length; i += 4) { const r = s[i], g = s[i + 1], b = s[i + 2]; d[i] = m[0] * r + m[1] * g + m[2] * b; d[i + 1] = m[3] * r + m[4] * g + m[5] * b; d[i + 2] = m[6] * r + m[7] * g + m[8] * b; } } },

  // HALFTONE
  { id: 'htcircle', cat: 'halftone', name: 'Circular Halftone', desc: 'Round dot screen', params: HTP('circle', 8, 45), fn: halftone },
  { id: 'htsquare', cat: 'halftone', name: 'Square Halftone', desc: 'Square dot screen', params: HTP('square', 8, 45), fn: halftone },
  { id: 'htline', cat: 'halftone', name: 'Line Halftone', desc: 'Variable-width line screen', params: HTP('line', 6, 30), fn: halftone },
  { id: 'newspaper', cat: 'halftone', name: 'Newspaper Print', desc: 'Coarse newsprint screen with grain', params: [...HTP('circle', 6, 45).map(q => q.k === 'paper' ? C('paper', 'Paper', '#e6dfcc') : q.k === 'ink' ? C('ink', 'Ink', '#1d1c1a') : q), R('grain', 'Paper grain', 0, 100, 35, 1, '%'), R('spread', 'Ink spread', 0, 100, 30, 1, '%')],
    fn: (s, d, w, h, p, c) => { halftone(s, d, w, h, p, c); const sp = p.spread / 100; const b = sp ? blur(d, w, h, 1.2 * c.S) : null; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, g = (hash2(x, y, 11) - 0.5) * p.grain * 0.9 + (vnoise2(x * 0.02 / c.S, y * 0.02 / c.S, 3) - 0.5) * p.grain * 0.6; for (let q = 0; q < 3; q++) { let v = d[k + q]; if (b) v = Math.min(v, v + (b[k + q] - v) * sp); d[k + q] = v + g; } } } },
  { id: 'cmyk', cat: 'halftone', name: 'CMYK Halftone', desc: 'Four rotated process screens', params: [R('cell', 'Frequency (cell)', 2, 80, 8, 1, 'px'), R('dot', 'Dot size', 10, 200, 100, 1, '%'), R('ac', 'Cyan angle', 0, 180, 15, 1, '°'), R('am', 'Magenta angle', 0, 180, 75, 1, '°'), R('ay', 'Yellow angle', 0, 180, 0, 1, '°'), R('ak', 'Black angle', 0, 180, 45, 1, '°'), R('gcr', 'Black generation', 0, 100, 80, 1, '%'), R('mis', 'Misregistration', 0, 30, 0, 0.5, 'px'), SEL('shape', 'Pattern', ['circle', 'square', 'diamond', 'line', 'ellipse'], 'circle'), C('paper', 'Paper', '#f4f1e8')],
    fn: (s, d, w, h, p, c) => {
      const cs = Math.max(2, p.cell * c.S), ds = p.dot / 100, bl = blur(s, w, h, cs / 3), pap = hex(p.paper), gcr = p.gcr / 100, mis = p.mis * c.S;
      const ch = [p.ac, p.am, p.ay, p.ak].map((a, i) => { const r = a * Math.PI / 180; return { ca: Math.cos(r), sa: Math.sin(r), ox: [mis, -mis, 0, 0][i], oy: [0, mis * 0.6, -mis, 0][i] }; });
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const cov = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
          const C2 = ch[i], X = x - C2.ox, Y = y - C2.oy, u = X * C2.ca + Y * C2.sa, v = -X * C2.sa + Y * C2.ca, cu = (Math.floor(u / cs) + 0.5) * cs, cv = (Math.floor(v / cs) + 0.5) * cs;
          const sx = clamp(Math.round(cu * C2.ca - cv * C2.sa), 0, w - 1), sy = clamp(Math.round(cu * C2.sa + cv * C2.ca), 0, h - 1), k = (sy * w + sx) * 4;
          const r = bl[k] / 255, g = bl[k + 1] / 255, b = bl[k + 2] / 255, K = (1 - Math.max(r, g, b)) * gcr, den = 1 - K || 1;
          const val = i === 0 ? (1 - r - K) / den : i === 1 ? (1 - g - K) / den : i === 2 ? (1 - b - K) / den : K;
          cov[i] = coverage(p.shape, clamp(val, 0, 1), u - cu, v - cv, cs, ds);
        }
        const k = (y * w + x) * 4, kk = 1 - cov[3];
        d[k] = pap[0] * (1 - cov[0]) * kk; d[k + 1] = pap[1] * (1 - cov[1]) * kk; d[k + 2] = pap[2] * (1 - cov[2]) * kk;
      }
    } },
];
/* ---------- LIGHT: HD glow + laser sweep ---------- */
function boxF(a, w, h, r, axis, ch) {
  // separable running-sum box blur on interleaved Float32 (ch channels), in place
  r = Math.max(1, Math.round(r)); const ia = 1 / (2 * r + 1), n = axis ? h : w, m = axis ? w : h, line = new Float32Array(n * ch);
  for (let o = 0; o < m; o++) {
    const base = axis ? o * ch : o * w * ch, st = axis ? w * ch : ch;
    for (let i = 0; i < n; i++) for (let q = 0; q < ch; q++) line[i * ch + q] = a[base + i * st + q];
    for (let q = 0; q < ch; q++) {
      let acc = 0; for (let i = -r; i <= r; i++) acc += line[clamp(i, 0, n - 1) * ch + q];
      for (let i = 0; i < n; i++) { a[base + i * st + q] = acc * ia; acc += line[Math.min(i + r + 1, n - 1) * ch + q] - line[Math.max(i - r, 0) * ch + q]; }
    }
  }
}
function blurF(a, w, h, r, ch, onlyAxis) { const rr = Math.max(1, r / 1.7); for (let i = 0; i < 3; i++) { if (onlyAxis !== 1) boxF(a, w, h, rr, 0, ch); if (onlyAxis !== 0) boxF(a, w, h, rr, 1, ch); } }
function hueRGB(hh) { hh = frac(hh) * 6; const x = 1 - Math.abs(hh % 2 - 1); return hh < 1 ? [1, x, 0] : hh < 2 ? [x, 1, 0] : hh < 3 ? [0, 1, x] : hh < 4 ? [0, x, 1] : hh < 5 ? [x, 0, 1] : [1, 0, x]; }
function glowFx(s, d, w, h, p, c) {
  const N = w * h, t = c.video && p.anim ? c.t : 0, L = new Float32Array(N), Wt = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) L[i] = lum(s[j], s[j + 1], s[j + 2]);
  const lo = p.thr - p.knee, hi = p.thr + p.knee, ss = x => { const u = clamp((x - lo) / ((hi - lo) || 1), 0, 1); return u * u * (3 - 2 * u); };
  if (p.src === 'edges') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const g = (xx, yy) => L[clamp(yy, 0, h - 1) * w + clamp(xx, 0, w - 1)]; const gx = g(x + 1, y - 1) + 2 * g(x + 1, y) + g(x + 1, y + 1) - g(x - 1, y - 1) - 2 * g(x - 1, y) - g(x - 1, y + 1), gy = g(x - 1, y + 1) + 2 * g(x, y + 1) + g(x + 1, y + 1) - g(x - 1, y - 1) - 2 * g(x, y - 1) - g(x + 1, y - 1); Wt[y * w + x] = ss(Math.min(255, Math.sqrt(gx * gx + gy * gy) / 2)); } }
  else for (let i = 0; i < N; i++) Wt[i] = ss(p.src === 'dark' ? 255 - L[i] : L[i]);
  // laser beam geometry
  const la = p.lang * Math.PI / 180, nx = -Math.sin(la), ny = Math.cos(la), pr = [0, w * nx, h * ny, w * nx + h * ny], dmin = Math.min(...pr), dmax = Math.max(...pr);
  const dl = dmin + (dmax - dmin) * frac(p.lpos / 100 + t * p.lspeed * 0.2), bw = Math.max(0.5, p.lw * c.S), amb = p.amb / 100, boost = p.lboost / 100;
  const flick = 1 - p.flick / 100 * hash2(c.frame, 1, c.seed);
  if (p.laser) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dd = (x * nx + y * ny - dl) / (bw * 10); Wt[y * w + x] *= amb + boost * Math.exp(-dd * dd); }
  else if (amb !== 1) for (let i = 0; i < N; i++) Wt[i] *= Math.max(amb, 1);
  const c1 = hex(p.c1).map(v => v / 255), c2 = hex(p.c2).map(v => v / 255), sat = p.sat / 100;
  const colAt = (j, out) => { if (p.mode === 'source') { const r = s[j] / 255, g = s[j + 1] / 255, b = s[j + 2] / 255, l = (r + g + b) / 3; out[0] = l + (r - l) * sat; out[1] = l + (g - l) * sat; out[2] = l + (b - l) * sat; } else { out[0] = 1; out[1] = 1; out[2] = 1; } };
  // half-res bright buffer
  const hw = Math.ceil(w / 2), hh2 = Math.ceil(h / 2), B = new Float32Array(hw * hh2 * 3), tmpc = [0, 0, 0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, wv = Wt[i] * 0.25; if (!wv) continue; colAt(i * 4, tmpc); const k = (((y >> 1) * hw) + (x >> 1)) * 3; B[k] += tmpc[0] * wv; B[k + 1] += tmpc[1] * wv; B[k + 2] += tmpc[2] * wv; }
  const A = new Float32Array(B.length), R0 = Math.max(1, p.radius * c.S / 2), lv = p.levels | 0, prism = p.prism / 100;
  const tint = k => { let col = p.mode === 'dual' ? [c2[0] + (c1[0] - c2[0]) * (lv > 1 ? k / (lv - 1) : 1), c2[1] + (c1[1] - c2[1]) * (lv > 1 ? k / (lv - 1) : 1), c2[2] + (c1[2] - c2[2]) * (lv > 1 ? k / (lv - 1) : 1)] : p.mode === 'tint' ? c1 : [1, 1, 1]; if (prism) { const hcol = hueRGB(k / Math.max(1, lv) + t * 0.1); col = col.map((v, q) => v * (1 - prism) + v * hcol[q] * prism * 1.6); } return col; };
  for (let k = 0; k < lv; k++) {
    const tmp = B.slice(); blurF(tmp, hw, hh2, R0 / Math.pow(2, k), 3); const tc = tint(k), wk = (1 + k * 0.35) / lv;
    for (let i = 0; i < tmp.length; i += 3) { A[i] += tmp[i] * tc[0] * wk; A[i + 1] += tmp[i + 1] * tc[1] * wk; A[i + 2] += tmp[i + 2] * tc[2] * wk; }
  }
  if (p.streak > 0) { const tmp = B.slice(); blurF(tmp, hw, hh2, Math.max(1, p.slen * c.S / 2), 3, p.sdir === 'v' ? 1 : 0); const tc = tint(lv - 1), f = p.streak / 100 * 2.5; for (let i = 0; i < tmp.length; i += 3) { A[i] += tmp[i] * tc[0] * f; A[i + 1] += tmp[i + 1] * tc[1] * f; A[i + 2] += tmp[i + 2] * tc[2] * f; } }
  const rays = +p.rays;
  if (rays > 0) {
    const taps = 18, len = p.rlen * c.S / 2, f = p.rint / 100 * 0.9, dirs = []; for (let r = 0; r < rays / 2; r++) { const a = (p.rang + r * 360 / rays) * Math.PI / 180; dirs.push([Math.cos(a), Math.sin(a)]); }
    const tc = tint(lv - 1), Rb = new Float32Array(B.length);
    for (let y = 0; y < hh2; y++) for (let x = 0; x < hw; x++) {
      let r = 0, g = 0, b = 0;
      for (const [dx, dy] of dirs) for (let q = 1; q <= taps; q++) { const wt = (1 - q / (taps + 1)) ** 2, st = q / taps * len; for (const sg of [1, -1]) { const sx = Math.round(x + dx * st * sg), sy = Math.round(y + dy * st * sg); if (sx < 0 || sy < 0 || sx >= hw || sy >= hh2) continue; const k = (sy * hw + sx) * 3; r += B[k] * wt; g += B[k + 1] * wt; b += B[k + 2] * wt; } }
      const k = (y * hw + x) * 3; Rb[k] = r * f / taps; Rb[k + 1] = g * f / taps; Rb[k + 2] = b * f / taps;
    }
    for (let i = 0; i < A.length; i += 3) { A[i] += Rb[i] * tc[0]; A[i + 1] += Rb[i + 1] * tc[1]; A[i + 2] += Rb[i + 2] * tc[2]; }
  }
  // composite (exponential screen keeps highlights HD, never clips harshly)
  const gi = p.int / 100 * 3 * flick, core = p.core / 100 * flick, lc = hex(p.lc).map(v => v / 255), li = p.laser ? p.lint / 100 : 0, ctc = tint(lv - 1);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(hh2 - 1.001, Math.max(0, y / 2 - 0.25)), y0 = fy | 0, ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(hw - 1.001, Math.max(0, x / 2 - 0.25)), x0 = fx | 0, tx = fx - x0, i = y * w + x, j = i * 4;
      const k00 = (y0 * hw + x0) * 3, k10 = k00 + 3, k01 = k00 + hw * 3, k11 = k01 + 3;
      let beam = 0; if (li) { const dd = (x * nx + y * ny - dl) / bw; beam = (Math.exp(-dd * dd) + 0.22 * Math.exp(-Math.abs(dd) / 6)) * li * flick; }
      colAt(j, tmpc);
      for (let q = 0; q < 3; q++) {
        const a = (A[k00 + q] * (1 - tx) + A[k10 + q] * tx) * (1 - ty) + (A[k01 + q] * (1 - tx) + A[k11 + q] * tx) * ty;
        const add = a * gi + Wt[i] * core * tmpc[q] * ctc[q] + beam * lc[q] + beam * beam * 0.35;
        const base = s[j + q] / 255; d[j + q] = (1 - (1 - base) * Math.exp(-add)) * 255;
      }
    }
  }
}
EFFECTS.push(
  { id: 'glow', cat: 'light', name: 'Glow / Laser', desc: 'HD bloom, streaks, star rays + sweeping laser', params: [
    SEL('src', 'Glow from', [['edges', 'EDGES'], ['bright', 'HIGHLIGHTS'], ['dark', 'DARK INK']], 'edges'), R('thr', 'Threshold', 0, 255, 70), R('knee', 'Softness', 1, 128, 45),
    R('radius', 'Glow size', 2, 400, 60, 1, 'px'), R('int', 'Intensity', 0, 500, 140, 1, '%'), R('core', 'Hot core (shine)', 0, 300, 90, 1, '%'), R('levels', 'Detail layers', 1, 6, 4),
    SEL('mode', 'Color mode', [['tint', 'TINT'], ['dual', 'GRADIENT'], ['source', 'SOURCE']], 'dual'), C('c1', 'Inner color', '#ff4fa3'), C('c2', 'Outer color', '#d4ff00'), R('sat', 'Source saturation', 0, 300, 150, 1, '%'), R('prism', 'Prism / rainbow', 0, 100, 0, 1, '%'),
    R('streak', 'Light streak', 0, 200, 35, 1, '%'), R('slen', 'Streak length', 4, 800, 220, 1, 'px'), SEL('sdir', 'Streak axis', [['h', 'HORIZONTAL'], ['v', 'VERTICAL']], 'h'),
    SEL('rays', 'Star rays', [['0', 'OFF'], ['4', '4'], ['6', '6'], ['8', '8']], '0'), R('rlen', 'Ray length', 4, 600, 120, 1, 'px'), R('rang', 'Ray angle', 0, 180, 45, 1, '°'), R('rint', 'Ray intensity', 0, 400, 120, 1, '%'),
    B('laser', 'Laser sweep', true), C('lc', 'Beam color', '#ff4fa3'), R('lang', 'Beam angle', -90, 90, -18, 1, '°'), R('lpos', 'Beam position', 0, 100, 38, 1, '%'), R('lw', 'Beam width', 0.5, 60, 3, 0.5, 'px'), R('lint', 'Beam intensity', 0, 400, 140, 1, '%'),
    R('lboost', 'Beam pickup', 0, 800, 350, 1, '%'), R('amb', 'Ambient glow', 0, 100, 35, 1, '%'), R('lspeed', 'Sweep speed', 0, 5, 0.5, 0.05), R('flick', 'Flicker', 0, 100, 0, 1, '%'), ANIM(), SEED()], fn: glowFx },
  { id: 'imglayer', cat: 'layer', name: 'Image Layer', desc: 'Stack another image with blend + mask', params: [{ k: 'img', l: 'Image', t: 'img', def: '' }, SEL('fit', 'Fit', ['contain', 'cover', 'stretch'], 'contain'), R('scale', 'Scale', 1, 400, 100, 1, '%'), R('x', 'Position X', -100, 100, 0, 1, '%'), R('y', 'Position Y', -100, 100, 0, 1, '%'), R('rot', 'Rotation', -180, 180, 0, 1, '°')],
    fn: (s, d, w, h, p, c) => { const im = p._img; if (!im || im.length !== s.length) return; const am = new Uint8Array(w * h); for (let i = 0, j = 0; i < am.length; i++, j += 4) { am[i] = im[j + 3]; if (im[j + 3]) { d[j] = im[j]; d[j + 1] = im[j + 1]; d[j + 2] = im[j + 2]; } } c.alphaMask = am; } },
  { id: 'fill', cat: 'layer', name: 'Color Fill', desc: 'Solid or gradient layer (use blend modes)', params: [SEL('type', 'Type', ['solid', 'linear', 'radial'], 'linear'), C('a', 'Color A', '#ff4fa3'), C('b', 'Color B', '#0b0c0b'), R('ang', 'Angle', 0, 360, 90, 1, '°')],
    fn: (s, d, w, h, p) => { const A2 = hex(p.a), B2 = hex(p.b), an = p.ang * Math.PI / 180, ca = Math.cos(an), sa = Math.sin(an), ext = Math.abs(w * ca) + Math.abs(h * sa); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let t2 = 0; if (p.type === 'linear') t2 = clamp(((x - w / 2) * ca + (y - h / 2) * sa) / ext + 0.5, 0, 1); else if (p.type === 'radial') t2 = clamp(Math.hypot(x / w - 0.5, y / h - 0.5) * 1.414, 0, 1); const k = (y * w + x) * 4; for (let q = 0; q < 3; q++) d[k + q] = A2[q] + (B2[q] - A2[q]) * t2; } } },
  { id: 'text', cat: 'layer', name: 'Text', desc: 'Type on your art — fonts, outline, glow', params: [
    { k: 'text', l: 'Text', t: 'txt', def: 'SHEDITHERS' }, SEL('style', 'Style', [['plain', 'PLAIN'], ['chrome', 'CHROME'], ['drip', 'DRIP'], ['sticker', 'STICKER'], ['glitch', 'GLITCH'], ['neon', 'NEON'], ['ransom', 'RANSOM NOTE'], ['bubble', 'BUBBLE'], ['label', 'LABEL MAKER'], ['extrude', '3D BLOCK'], ['gradient', 'GRADIENT'], ['scribble', 'SCRIBBLED']], 'plain'), SEL('font', 'Font', [['Barlow Condensed', 'CONDENSED'], ['Bebas Neue', 'BEBAS'], ['UnifrakturMaguntia', 'GOTHIC'], ['Rubik Glitch', 'GLITCH'], ['Permanent Marker', 'MARKER'], ['Special Elite', 'TYPEWRITER'], ['VT323', 'PIXEL'], ['Monoton', 'NEON TUBE'], ['Creepster', 'CREEPY'], ['Pacifico', 'SCRIPT'], ['JetBrains Mono', 'MONO'], ['Georgia', 'SERIF']], 'Barlow Condensed'),
    R('size', 'Size', 6, 800, 140, 1, 'px'), SEL('weight', 'Weight', [['400', 'REGULAR'], ['700', 'BOLD'], ['900', 'BLACK']], '700'), B('italic', 'Italic', false), SEL('case', 'Case', [['as', 'AS TYPED'], ['upper', 'UPPER'], ['lower', 'lower']], 'as'),
    SEL('align', 'Align', ['left', 'center', 'right'], 'center'), R('x', 'Position X', 0, 100, 50, 0.5, '%'), R('y', 'Position Y', 0, 100, 50, 0.5, '%'), R('rot', 'Rotation', -180, 180, 0, 1, '°'),
    R('spacing', 'Letter spacing', -20, 100, 4, 1, 'px'), R('lineh', 'Line height', 60, 250, 105, 1, '%'),
    C('fill', 'Fill', '#ff4fa3'), C('fill2', 'Second color', '#d4ff00'), R('arc', 'Arc / curve', -100, 100, 0, 1, '%'), R('depth', '3D depth / drip length', 0, 80, 18, 1, 'px'), C('stroke', 'Outline', '#070807'), R('strokeW', 'Outline width', 0, 40, 0, 0.5, 'px'), C('glowC', 'Glow color', '#ff4fa3'), R('glow', 'Glow', 0, 120, 18, 1, 'px')],
    fn: (s, d, w, h, p, c) => overlayImg(d, w, h, p, c) },
);
function overlayImg(d, w, h, p, c) { const im = p._img; if (!im || im.length !== d.length) return; const am = new Uint8Array(w * h); for (let i = 0, j = 0; i < am.length; i++, j += 4) { am[i] = im[j + 3]; if (im[j + 3]) { d[j] = im[j]; d[j + 1] = im[j + 1]; d[j + 2] = im[j + 2]; } } c.alphaMask = am; }

/* ---------- GHOST DRIFT: drifting translucent echoes + motion trails ---------- */
function ghostFx(s, d, w, h, p, c) {
  const N = w * h, anim = c.video && p.anim, t = anim ? c.t * p.speed : 0, phase = anim ? frac(t * 0.35) : 0.5;
  const g = p.blur > 0 ? blur(s, w, h, p.blur * c.S) : s;
  const key = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) { const l = lum(g[j], g[j + 1], g[j + 2]) / 255; key[i] = p.src === 'bright' ? clamp((l - 0.4) / 0.4, 0, 1) : p.src === 'dark' ? clamp((0.6 - l) / 0.4, 0, 1) : 1; }
  const tint = hex(p.tint), ta = p.tintAmt / 100, st = p.str / 100, a0 = p.angle * Math.PI / 180, dist = p.dist * c.S, chs = p.chroma * c.S, fade = p.fade / 100, n = p.copies | 0;
  const acc = new Float32Array(N * 3), cx = w / 2, cy = h / 2, mode = p.blendg;
  let wsum = 0;
  for (let k = 1; k <= n; k++) {
    const ke = k - 1 + phase;
    const ang = a0 + (p.curve / 100) * ke * 0.35 + (p.wobble / 100) * 0.6 * Math.sin(t * 1.3 + k * 0.9);
    const r = dist * ke * (1 + (p.wobble / 100) * 0.35 * Math.sin(t * 1.7 + k * 1.3));
    const ox = Math.cos(ang) * r, oy = Math.sin(ang) * r, sc = 1 + p.scale / 100 * ke, dx = Math.cos(ang), dy = Math.sin(ang);
    let wt = st * Math.pow(fade, ke) * clamp(ke * 2, 0.15, 1); if (k === n) wt *= (1 - phase * 0.9);
    if (wt < 0.004) continue; wsum += wt;
    const co = chs * (0.4 + ke * 0.3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const bx = cx + (x - cx - ox) / sc, by = cy + (y - cy - oy) / sc, i = y * w + x;
      for (let q = 0; q < 3; q++) {
        const sh = q === 0 ? co : q === 2 ? -co : 0, sx = Math.round(bx + dx * sh), sy = Math.round(by + dy * sh);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const si = sy * w + sx, v = (g[si * 4 + q] + (tint[q] - g[si * 4 + q]) * ta) / 255 * key[si] * wt, ai = i * 3 + q;
        acc[ai] = mode === 'screen' ? 1 - (1 - acc[ai]) * (1 - v) : mode === 'lighten' ? Math.max(acc[ai], v) : acc[ai] + v;
      }
    }
  }
  const prev = c.prev && c.prev.length === s.length && p.trail > 0 ? c.prev : null, tr = p.trail / 100;
  const tx = Math.round(Math.cos(a0) * dist * 0.12), ty = Math.round(Math.sin(a0) * dist * 0.12);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, j = i * 4;
    for (let q = 0; q < 3; q++) {
      const b = s[j + q] / 255; let a = acc[i * 3 + q]; if (mode === 'average') a = a / Math.max(1, wsum) * st;
      let o = mode === 'screen' ? 1 - (1 - b) * (1 - a) : mode === 'lighten' ? Math.max(b, a) : mode === 'add' ? b + a : b * (1 - st * 0.5) + a * 0.5;
      if (prev) { const px2 = clamp(x - tx, 0, w - 1), py2 = clamp(y - ty, 0, h - 1), pv = prev[(py2 * w + px2) * 4 + q] / 255 * tr; if (pv > o) o = o + (pv - o) * 0.85; }
      d[j + q] = o * 255;
    }
  }
}
EFFECTS.push({ id: 'ghost', cat: 'light', name: 'Ghost Drift', desc: 'Drifting spectral echoes + motion trails', params: [
  R('copies', 'Echo copies', 1, 16, 6), R('dist', 'Drift distance', 0, 300, 22, 1, 'px'), R('angle', 'Drift direction', 0, 360, 330, 1, '°'), R('curve', 'Drift curve', 0, 100, 35, 1, '%'),
  R('wobble', 'Wobble', 0, 100, 40, 1, '%'), R('scale', 'Expand', -20, 20, 2.5, 0.5, '%'), R('fade', 'Echo fade', 10, 95, 68, 1, '%'), R('str', 'Ghost strength', 0, 200, 85, 1, '%'),
  R('blur', 'Ghost softness', 0, 40, 5, 0.5, 'px'), SEL('src', 'Ghost from', [['full', 'WHOLE IMAGE'], ['bright', 'HIGHLIGHTS'], ['dark', 'SHADOWS / INK']], 'full'),
  C('tint', 'Ghost tint', '#bfe8ff'), R('tintAmt', 'Tint amount', 0, 100, 40, 1, '%'), R('chroma', 'Spectral split', 0, 30, 3, 0.5, 'px'),
  SEL('blendg', 'Combine', ['screen', 'lighten', 'add', 'average'], 'screen'), R('trail', 'Motion trails', 0, 98, 55, 1, '%'), R('speed', 'Drift speed', 0, 5, 0.8, 0.05), ANIM()], fn: ghostFx });
/* ---------- TEXTURES: procedural materials + bump/specular light shader ---------- */
const TEXTURES = [['grain', 'FILM GRAIN'], ['paper', 'PAPER'], ['canvas', 'CANVAS'], ['concrete', 'CONCRETE'], ['grunge', 'GRUNGE'], ['rust', 'RUST'], ['metal', 'BRUSHED METAL'], ['scratch', 'SCRATCH + DUST'], ['crt', 'CRT MASK'], ['lcd', 'LCD GRID'], ['carbon', 'CARBON FIBER'], ['static', 'TV STATIC'], ['xerox', 'XEROX TONER'], ['holo', 'HOLO FOIL'], ['marble', 'MARBLE'], ['cells', 'CELLS'], ['crumple', 'CRUMPLED'], ['glitter', 'GLITTER'], ['custom', 'YOUR IMAGE']];
function fbm(u, v, oct, seed) { let s = 0, a = 0.5, n = 0; for (let o = 0; o < oct; o++) { s += vnoise2(u, v, seed + o * 17) * a; n += a; u *= 2.03; v *= 2.03; a *= 0.5; } return s / n; }
function worley(u, v, seed) { const xi = Math.floor(u), yi = Math.floor(v); let f1 = 9, f2 = 9; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, px2 = cx + hash2(cx, cy, seed), py2 = cy + hash2(cx, cy, seed + 1), d = (px2 - u) ** 2 + (py2 - v) ** 2; if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; } return [Math.sqrt(f1), Math.sqrt(f2)]; }
const sstep = (a, b, x) => { const t = clamp((x - a) / ((b - a) || 1e-6), 0, 1); return t * t * (3 - 2 * t); };
/* returns height 0..1; writes colour (0..1) into col when the material has its own colour, else leaves col[3]=0 */
function texSample(type, u, v, d, oct, seed, fr, t, col, x, y) {
  col[3] = 0;
  switch (type) {
    case 'grain': return 0.5 + (hash2(x, y, seed + fr * 131) - 0.5) * (0.4 + d) + (vnoise2(u, v, seed) - 0.5) * 0.25;
    case 'paper': return clamp(0.58 + (fbm(u * 0.35, v * 0.35, oct, seed) - 0.5) * 0.55 + (vnoise2(u * 0.12, v * 2.6, seed + 9) - 0.5) * 0.35 * d + (hash2(x, y, seed) - 0.5) * 0.06, 0, 1);
    case 'canvas': { const over = ((Math.floor(u) + Math.floor(v)) & 1), th = over ? 0.5 + 0.5 * Math.sin(frac(v) * Math.PI) : 0.5 + 0.5 * Math.sin(frac(u) * Math.PI); return clamp(th * 0.7 + (vnoise2(u * 2, v * 2, seed) - 0.5) * 0.35 * d + 0.15, 0, 1); }
    case 'concrete': { let h = 0.35 + fbm(u * 0.25, v * 0.25, oct, seed) * 0.45 + (hash2(x, y, seed) - 0.5) * 0.12; if (hash2(Math.floor(u * 1.5), Math.floor(v * 1.5), seed + 3) < d * 0.05) h *= 0.35; return clamp(h, 0, 1); }
    case 'grunge': { const n = fbm(u * 0.18, v * 0.18, oct, seed), b = sstep(0.62 - d * 0.35, 0.7 - d * 0.35, n); return clamp(0.62 - b * 0.55 + (fbm(u * 1.5, v * 1.5, 3, seed + 5) - 0.5) * 0.3, 0, 1); }
    case 'rust': { const n = fbm(u * 0.22, v * 0.22, oct, seed), r = 1 - Math.abs(fbm(u * 0.6, v * 0.6, 4, seed + 3) * 2 - 1), m = sstep(0.42 - d * 0.3, 0.6 - d * 0.3, n); const h = clamp(0.3 + n * 0.5 + r * 0.25 * m, 0, 1); col[0] = 0.25 + m * (0.45 + r * 0.25); col[1] = 0.12 + m * (0.12 + r * 0.18); col[2] = 0.08 + m * 0.04; col[3] = 1; return h; }
    case 'metal': { const s = vnoise2(u * 0.02, v * 3.2, seed) * 0.55 + vnoise2(u * 0.006, v * 12, seed + 4) * 0.3 + (hash2(Math.floor(u * 0.05), y, seed) - 0.5) * 0.25 * d; const h = clamp(0.35 + s * 0.55, 0, 1); col[0] = col[1] = col[2] = 0.45 + h * 0.5; col[2] += 0.03; col[3] = 1; return h; }
    case 'scratch': { let h = 0.5; const r = Math.floor(v * 0.6 + vnoise(u * 0.004, seed) * 4); if (hash2(r, 0, seed) < d * 0.18 && frac(v * 0.6 + vnoise(u * 0.004, seed) * 4) < 0.07 && vnoise(u * 0.012 + r * 7.3, seed + 1) > 0.55) h = 0.95; if (hash2(Math.floor(u * 0.8), Math.floor(v * 0.8), seed + 2) < d * 0.012) h = hash2(x, y, seed) > 0.5 ? 0.98 : 0.05; return h; }
    case 'crt': { const ch = Math.floor(frac(u / 3) * 3), gap = frac(v) > 0.78 || frac(u) > 0.85; col[0] = ch === 0 ? 1 : 0.12; col[1] = ch === 1 ? 1 : 0.12; col[2] = ch === 2 ? 1 : 0.12; if (gap) col[0] = col[1] = col[2] = 0.05; col[3] = 1; return gap ? 0.15 : 0.7; }
    case 'lcd': return (frac(u) < 0.12 + d * 0.15 || frac(v) < 0.12 + d * 0.15) ? 0.18 : 0.66 + (hash2(Math.floor(u), Math.floor(v), seed) - 0.5) * 0.08;
    case 'carbon': { const cx = Math.floor(u / 2), cy = Math.floor(v / 2), dir = (cx + cy) & 1, g = dir ? frac(u / 2) : frac(v / 2), h = 0.2 + 0.55 * Math.sin(g * Math.PI); col[0] = col[1] = col[2] = 0.05 + h * 0.32; col[3] = 1; return h; }
    case 'static': { const band = sstep(0.55, 0.9, vnoise(v * 0.04 + t * 4, seed)); return clamp(hash2(x, y, seed + fr * 977) * (0.7 + d * 0.3) + band * 0.35 - 0.05, 0, 1); }
    case 'xerox': { const n = fbm(u * 0.08, v * 0.08, oct, seed), speck = hash2(x, y, seed + 5) < (0.02 + d * 0.12) * sstep(0.35, 0.75, n), streak = vnoise(u * 0.03, seed + 8) > 0.86 - d * 0.1; return speck ? 0.03 : streak ? 0.32 : 0.82 + (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.08; }
    case 'holo': { const n = fbm(u * 0.12, v * 0.12, oct, seed), c2 = hueRGB(n * 1.6 + (u + v) * 0.004 * d + t * 0.08); col[0] = 0.55 + c2[0] * 0.45; col[1] = 0.55 + c2[1] * 0.45; col[2] = 0.55 + c2[2] * 0.45; col[3] = 1; return 0.55 + n * 0.4; }
    case 'marble': { const w2 = Math.sin((u * 0.04 + v * 0.015 + fbm(u * 0.12, v * 0.12, oct, seed) * (3 + d * 6)) * Math.PI), vein = Math.pow(1 - Math.abs(w2), 10); return clamp(0.86 - vein * 0.7 + (fbm(u * 0.5, v * 0.5, 3, seed + 3) - 0.5) * 0.12, 0, 1); }
    case 'cells': { const [f1, f2] = worley(u * 0.12, v * 0.12, seed); return clamp(sstep(0.0, 0.06 + d * 0.15, f2 - f1) * 0.7 + f1 * 0.3, 0, 1); }
    case 'crumple': { const wx = fbm(u * 0.05, v * 0.05, 3, seed) * 4, r = 1 - Math.abs(fbm(u * 0.09 + wx, v * 0.09 - wx, oct, seed + 2) * 2 - 1); return clamp(0.25 + Math.pow(r, 1.5 + d * 3) * 0.75, 0, 1); }
    case 'glitter': { const cx = Math.floor(u), cy = Math.floor(v); if (hash2(cx, cy, seed) < d * 0.08) { const fx = frac(u) - 0.5, fy = frac(v) - 0.5, tw = 0.5 + 0.5 * Math.sin(t * 6 + hash2(cx, cy, seed + 1) * 40), s = Math.max(0, 1 - (Math.abs(fx) * Math.abs(fy)) * 60 - Math.hypot(fx, fy) * 2.2) * tw; const hc = hueRGB(hash2(cx, cy, seed + 2)); col[0] = 0.8 + hc[0] * 0.2; col[1] = 0.8 + hc[1] * 0.2; col[2] = 0.8 + hc[2] * 0.2; col[3] = s > 0.02 ? 1 : 0; return 0.5 + s * 0.5; } return 0.5; }
    default: return 0.5;
  }
}
function textureFx(s, d, w, h, p, c) {
  const N = w * h, draft = p.quality === 'draft', oct = draft ? 3 : p.quality === 'ultra' ? 7 : 5, step = draft ? 2 : 1;
  const tw = Math.ceil(w / step), th = Math.ceil(h / step), Hm = new Float32Array(tw * th), Cm = new Float32Array(tw * th * 3);
  const sc = Math.max(0.2, p.scale * c.S) / step, ang = p.rot * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang), dens = p.density / 100;
  const t = c.video && p.anim ? c.t : 0, dr = t * p.drift * 20 * c.S, con = p.con / 100, bri = p.bri / 100, tint = hex(p.tint).map(v => v / 255), ta = p.tintAmt / 100;
  const custom = p.type === 'custom' ? p._tex : null, col = [0, 0, 0, 0];
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const X = x * step, Y = y * step, rx = (X * ca + Y * sa) / sc + dr / sc, ry = (-X * sa + Y * ca) / sc;
    let hv, cr, cg, cb;
    if (custom) { const k = (Math.min(h - 1, Y) * w + Math.min(w - 1, X)) * 4; cr = custom[k] / 255; cg = custom[k + 1] / 255; cb = custom[k + 2] / 255; hv = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb; }
    else { hv = texSample(p.type, rx, ry, dens, oct, c.seed, c.frame, t, col, X, Y); if (col[3]) { cr = col[0]; cg = col[1]; cb = col[2]; } else cr = cg = cb = hv; }
    hv = clamp((hv - 0.5) * con + 0.5 + bri, 0, 1);
    cr = (cr - 0.5) * con + 0.5 + bri; cg = (cg - 0.5) * con + 0.5 + bri; cb = (cb - 0.5) * con + 0.5 + bri;
    if (ta) { const l = (cr + cg + cb) / 3; cr += (tint[0] * l * 1.6 - cr) * ta; cg += (tint[1] * l * 1.6 - cg) * ta; cb += (tint[2] * l * 1.6 - cb) * ta; }
    const i = y * tw + x; Hm[i] = hv; Cm[i * 3] = clamp(cr, 0, 1); Cm[i * 3 + 1] = clamp(cg, 0, 1); Cm[i * 3 + 2] = clamp(cb, 0, 1);
  }
  const bf = BLENDS[p.tmode] || BLENDS.overlay, op = p.opacity / 100;
  const az = p.lang * Math.PI / 180, el = p.lelev * Math.PI / 180, Lx = Math.cos(el) * Math.cos(az), Ly = Math.cos(el) * Math.sin(az), Lz = Math.sin(el);
  const Hx = Lx, Hy = Ly, Hz = Lz + 1, hl = Math.hypot(Hx, Hy, Hz), relief = p.relief / 100 * 6, ls = p.light / 100, spA = p.spec / 100, shin = 4 + p.shine * 1.2, lc = hex(p.lcol);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tx = Math.min(tw - 1, (x / step) | 0), ty = Math.min(th - 1, (y / step) | 0), i = ty * tw + tx;
    const hL = Hm[ty * tw + Math.max(0, tx - 1)], hR = Hm[ty * tw + Math.min(tw - 1, tx + 1)], hU = Hm[Math.max(0, ty - 1) * tw + tx], hD = Hm[Math.min(th - 1, ty + 1) * tw + tx];
    let nx = (hL - hR) * relief, ny = (hU - hD) * relief, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const ndl = nx * Lx + ny * Ly + nz * Lz, shade = 1 + ls * (ndl - Lz) * 1.6, spec = spA * Math.pow(Math.max(0, (nx * Hx + ny * Hy + nz * Hz) / hl), shin);
    const k = (y * w + x) * 4;
    for (let q = 0; q < 3; q++) {
      const base = s[k + q], tc = Cm[i * 3 + q] * 255, bl = bf(base, tc), mixed = base + (bl - base) * op;
      d[k + q] = mixed * shade + spec * lc[q];
    }
  }
}
EFFECTS.push({ id: 'texture', cat: 'texture', name: 'Texture', desc: 'Materials with a light shader — grain, paper, metal, holo…', params: [
  { k: 'type', l: 'Material', t: 'tex', def: 'paper', o: TEXTURES }, { k: 'img', l: 'Your texture image', t: 'img', def: '' },
  SEL('quality', 'Texture quality', [['draft', 'DRAFT'], ['high', 'HIGH'], ['ultra', 'ULTRA']], 'high'),
  R('opacity', 'Opacity', 0, 100, 70, 1, '%'), R('density', 'Density', 0, 100, 50, 1, '%'), R('scale', 'Scale', 1, 300, 24, 1, 'px'), R('rot', 'Rotation', 0, 180, 0, 1, '°'),
  R('con', 'Contrast', 0, 300, 110, 1, '%'), R('bri', 'Brightness', -50, 50, 0, 1, '%'), C('tint', 'Tint', '#ff4fa3'), R('tintAmt', 'Tint amount', 0, 100, 0, 1, '%'),
  SEL('tmode', 'Blend', [['overlay', 'OVERLAY'], ['softlight', 'SOFT LIGHT'], ['multiply', 'MULTIPLY'], ['screen', 'SCREEN'], ['hardlight', 'HARD LIGHT'], ['add', 'ADD'], ['difference', 'DIFFERENCE']], 'overlay'),
  R('light', 'Light / relief shading', 0, 200, 60, 1, '%'), R('relief', 'Relief depth', 0, 300, 100, 1, '%'), R('lang', 'Light angle', 0, 360, 225, 1, '°'), R('lelev', 'Light height', 5, 90, 45, 1, '°'),
  R('spec', 'Shine (specular)', 0, 300, 40, 1, '%'), R('shine', 'Shine tightness', 0, 100, 40, 1, '%'), C('lcol', 'Light color', '#ffffff'),
  R('drift', 'Drift speed', 0, 5, 0, 0.05), SEED(), ANIM()], fn: textureFx });
/* ---------- EMBOSS: the picture pressed into a surface — stone, colour relief, metal, or blind-embossed paper ---------- */
EFFECTS.push({ id: 'emboss', cat: 'texture', name: 'Emboss', desc: 'Press the picture into stone, metal or paper', params: [
  SEL('mode', 'Look', [['stone', 'STONE'], ['color', 'COLOUR RELIEF'], ['metal', 'METAL'], ['paper', 'BLIND EMBOSS (PAPER)']], 'stone'),
  R('depth', 'Depth', 0, 400, 160, 1, '%'), R('dist', 'Edge width', 1, 10, 2, 1, 'px'), R('lang', 'Light angle', 0, 360, 135, 1, '°'),
  R('soft', 'Softness', 0, 4, 1, 1, 'px'), C('tint', 'Metal / paper colour', '#c9b37a'), R('mix', 'Mix with picture', 0, 100, 100, 1, '%')], fn: embossFx });
function embossFx(s, d, w, h, p, c) {
  const N = w * h, L = new Float32Array(N);
  for (let i = 0, k = 0; i < N; i++, k += 4) L[i] = s[k] * 0.3 + s[k + 1] * 0.59 + s[k + 2] * 0.11;
  // a little softening so the relief reads as pressed, not noisy
  const sr = Math.round(p.soft * (c.S || 1));
  if (sr > 0) { const T = new Float32Array(N);
    for (let y = 0; y < h; y++) { let acc = 0, n = 0; for (let x = -sr; x < w; x++) { if (x + sr < w) { acc += L[y * w + x + sr]; n++; } if (x - sr - 1 >= 0) { acc -= L[y * w + x - sr - 1]; n--; } if (x >= 0) T[y * w + x] = acc / n; } }
    for (let x = 0; x < w; x++) { let acc = 0, n = 0; for (let y = -sr; y < h; y++) { if (y + sr < h) { acc += T[(y + sr) * w + x]; n++; } if (y - sr - 1 >= 0) { acc -= T[(y - sr - 1) * w + x]; n--; } if (y >= 0) L[y * w + x] = acc / n; } } }
  const a = p.lang * Math.PI / 180, dd = Math.max(1, p.dist * (c.S || 1)), dx = Math.cos(a) * dd, dy = -Math.sin(a) * dd;
  const ox = Math.round(dx), oy = Math.round(dy), k2 = p.depth / 100, mix = p.mix / 100, tc = hex(p.tint);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, k = i * 4;
    const x1 = Math.min(w - 1, Math.max(0, x - ox)), y1 = Math.min(h - 1, Math.max(0, y - oy)), x2 = Math.min(w - 1, Math.max(0, x + ox)), y2 = Math.min(h - 1, Math.max(0, y + oy));
    const rel = (L[y1 * w + x1] - L[y2 * w + x2]) * k2;      // + lit side, - shadow side
    let r, g, b;
    if (p.mode === 'color') { r = s[k] + rel; g = s[k + 1] + rel; b = s[k + 2] + rel; }
    else if (p.mode === 'metal') { const v = 128 + rel, sh = Math.pow(Math.max(0, rel) / 255, 2) * 400; r = tc[0] * v / 160 + sh; g = tc[1] * v / 160 + sh; b = tc[2] * v / 160 + sh; }
    else if (p.mode === 'paper') { const v = 236 + rel * 0.7; r = tc[0] * 0.25 + v * 0.75; g = tc[1] * 0.25 + v * 0.75; b = tc[2] * 0.25 + v * 0.75; }
    else { const v = 128 + rel, n = (hash2(x, y, 11) - 0.5) * 18; r = g = b = v + n; }
    d[k] = s[k] + (r - s[k]) * mix; d[k + 1] = s[k + 1] + (g - s[k + 1]) * mix; d[k + 2] = s[k + 2] + (b - s[k + 2]) * mix; d[k + 3] = s[k + 3];
  }
  return d;
}
function texSwatch(type, size, seed) {
  const out = new Uint8ClampedArray(size * size * 4), col = [0, 0, 0, 0], sc = type === 'grain' || type === 'static' ? 1.5 : type === 'crt' || type === 'lcd' ? 3 : type === 'glitter' ? 6 : 5;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const hv = texSample(type, x / sc, y / sc, 0.5, 4, seed || 7, 0, 0.6, col, x, y), k = (y * size + x) * 4; const r = col[3] ? col[0] : hv, g = col[3] ? col[1] : hv, b = col[3] ? col[2] : hv; out[k] = r * 255; out[k + 1] = g * 255; out[k + 2] = b * 255; out[k + 3] = 255; }
  return out;
}

/* ---------- BACKGROUND REMOVER: edge-detected / colour key / AI mask → alpha ---------- */
function bgRemoveFx(s, d, w, h, p, c) {
  const N = w * h; let A = new Float32Array(N);   // alpha 0..1 (1 = keep)
  if (p.mode === 'ai-person' || p.mode === 'ai-object') {
    const m = p._ai; if (!m || m.length !== N) return;  // AI mask not ready yet → leave image untouched
    const th = p.aith / 100; for (let i = 0; i < N; i++) A[i] = sstep(th - 0.15, th + 0.15, m[i] / 255);
  } else {
    let keys;
    if (p.mode === 'color') keys = [hex(p.key)];
    else { // sample the border, take the dominant quantised colours
      const bins = new Map(), add = k => { const q = ((s[k] >> 4) << 8) | ((s[k + 1] >> 4) << 4) | (s[k + 2] >> 4), e = bins.get(q) || [0, 0, 0, 0]; e[0] += s[k]; e[1] += s[k + 1]; e[2] += s[k + 2]; e[3]++; bins.set(q, e); };
      for (let x = 0; x < w; x += 2) { add(x * 4); add(((h - 1) * w + x) * 4); } for (let y = 0; y < h; y += 2) { add(y * w * 4); add((y * w + w - 1) * 4); }
      const tot = [...bins.values()].reduce((a, e) => a + e[3], 0);
      keys = [...bins.values()].sort((a, b) => b[3] - a[3]).filter((e, i) => i === 0 || e[3] > tot * 0.12).slice(0, 3).map(e => [e[0] / e[3], e[1] / e[3], e[2] / e[3]]);
    }
    const tol = p.tol * 2.2, soft = Math.max(1, p.soft * 2.2), bgv = new Float32Array(N);
    for (let i = 0, k = 0; i < N; i++, k += 4) { let md = 1e9; for (const kc of keys) { const dr = s[k] - kc[0], dg = s[k + 1] - kc[1], db = s[k + 2] - kc[2], dd = Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11) * 1.7; if (dd < md) md = dd; } bgv[i] = 1 - sstep(tol, tol + soft, md); }
    if (p.connected) { // flood from the image border through background-like pixels so the subject's interior stays
      const reg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0; const push = i => { if (!reg[i] && bgv[i] > 0.35) { reg[i] = 1; q[qt++] = i; } };
      for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
      while (qh < qt) { const i = q[qh++], x = i % w; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (i >= w) push(i - w); if (i < N - w) push(i + w); }
      for (let i = 0; i < N; i++) A[i] = reg[i] ? 1 - bgv[i] : 1;
    } else for (let i = 0; i < N; i++) A[i] = 1 - bgv[i];
  }
  // choke / grow + feather
  const blurA = (r) => { if (r < 1) return; boxF(A, w, h, r, 0, 1); boxF(A, w, h, r, 1, 1); };
  if (p.choke) { blurA(Math.abs(p.choke) * c.S); const sh = p.choke > 0 ? 0.25 : -0.25; for (let i = 0; i < N; i++) A[i] = sstep(0.5 + sh - 0.12, 0.5 + sh + 0.12, A[i]); }
  if (p.feather > 0) blurA(p.feather * c.S);
  if (p.invert) for (let i = 0; i < N; i++) A[i] = 1 - A[i];
  // despill: pull edge colours away from the removed colour
  const ds = p.despill / 100, bgc = hex(p.bgcol), blurred = p.replace === 'blur' ? blur(s, w, h, p.bgblur * c.S) : null;
  for (let i = 0, k = 0; i < N; i++, k += 4) {
    const a = clamp(A[i], 0, 1);
    if (ds && a > 0 && a < 1) { const l = lum(s[k], s[k + 1], s[k + 2]); for (let q2 = 0; q2 < 3; q2++) d[k + q2] = s[k + q2] + (l - s[k + q2]) * ds * (1 - a); }
    if (p.replace === 'transparent') d[k + 3] = s[k + 3] * a;
    else { const bg = p.replace === 'blur' ? [blurred[k], blurred[k + 1], blurred[k + 2]] : bgc; for (let q2 = 0; q2 < 3; q2++) d[k + q2] = bg[q2] + (d[k + q2] - bg[q2]) * a; d[k + 3] = 255; }
  }
}
EFFECTS.push({ id: 'bgremove', cat: 'layer', name: 'Background Remover', desc: 'Auto edge detect, colour key, or AI cutout', params: [
  SEL('mode', 'Detect', [['auto', 'AUTO (EDGES)'], ['color', 'COLOR KEY'], ['ai-person', 'AI · PEOPLE'], ['ai-object', 'AI · OBJECTS']], 'auto'),
  C('key', 'Key color (color key)', '#ffffff'), R('tol', 'Tolerance', 0, 100, 18, 1, '%'), R('soft', 'Edge softness', 0, 100, 12, 1, '%'), B('connected', 'Only background touching edges', true),
  R('aith', 'AI confidence', 5, 95, 50, 1, '%'), R('choke', 'Shrink / grow edge', -20, 20, 0, 1, 'px'), R('feather', 'Feather', 0, 30, 1, 0.5, 'px'), R('despill', 'Despill edges', 0, 100, 30, 1, '%'), B('invert', 'Invert (keep background)', false),
  SEL('replace', 'New background', [['transparent', 'TRANSPARENT'], ['color', 'COLOR'], ['blur', 'BLUR']], 'transparent'), C('bgcol', 'Background color', '#ff4fa3'), R('bgblur', 'Background blur', 1, 80, 18, 1, 'px')], fn: bgRemoveFx });
/* ---------- GIF FX: loop-perfect animated effects (driven by c.prog 0..1 over the clip) ---------- */
const LOOP = (p, c) => frac((c.prog || 0) * Math.max(1, Math.round(p.cycles || 1)));            // smooth phase 0..1, repeats `cycles` times per clip
const STEP = (p, c) => Math.floor((c.prog || 0) * Math.max(1, Math.round(p.steps || 8)));        // stepped frame index (for boil / jitter)
const CYC = () => R('cycles', 'Loops per clip', 1, 12, 1);
function remapSample(s, d, w, h, fx) { // fx(x,y) -> [sx,sy]; nearest sampling with clamp
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const q = fx(x, y), sx = clamp(Math.round(q[0]), 0, w - 1), sy = clamp(Math.round(q[1]), 0, h - 1), k = (y * w + x) * 4, j = (sy * w + sx) * 4; d[k] = s[j]; d[k + 1] = s[j + 1]; d[k + 2] = s[j + 2]; d[k + 3] = s[j + 3]; }
}
const PARTICLE_SHAPES = {
  heart: (u, v) => { const x = u * 1.25, y = -v * 1.25 + 0.25, a = x * x + y * y - 0.55; return a * a * a - x * x * y * y * y < 0; },
  star: (u, v) => { const a = Math.atan2(v, u), r = Math.hypot(u, v), k = 0.55 + 0.45 * Math.cos(a * 5 + Math.PI / 2) ** 2; return r < 0.55 * (0.45 + 0.55 * Math.pow(Math.abs(Math.cos(a * 2.5)), 6)) + 0.12; },
  snow: (u, v) => Math.hypot(u, v) < 0.5,
  rain: (u, v) => Math.abs(u) < 0.08 && Math.abs(v) < 0.5,
  cross: (u, v) => (Math.abs(u) < 0.1 || Math.abs(v) < 0.1) && Math.hypot(u, v) < 0.55 || Math.abs(Math.hypot(u, v) - 0.33) < 0.07,
};
EFFECTS.push(
  { id: 'boil', cat: 'gif', name: 'Line Boil', desc: 'Hand-drawn wobble, redrawn each frame', params: [R('amt', 'Wobble', 0, 20, 2.5, 0.5, 'px'), R('scale', 'Noise scale', 2, 80, 18, 1, 'px'), R('steps', 'Drawings per loop', 2, 24, 6)],
    fn: (s, d, w, h, p, c) => { const st = STEP(p, c), a = p.amt * c.S, sc = Math.max(1, p.scale * c.S); remapSample(s, d, w, h, (x, y) => [x + (vnoise2(x / sc, y / sc, st * 31 + 1) - 0.5) * 2 * a, y + (vnoise2(x / sc, y / sc, st * 31 + 7) - 0.5) * 2 * a]); } },
  { id: 'shake', cat: 'gif', name: 'Shake', desc: 'Camera shake / jitter', params: [R('amt', 'Shake', 0, 60, 6, 1, 'px'), R('rot', 'Twist', 0, 10, 1, 0.5, '°'), R('steps', 'Jolts per loop', 2, 48, 12)],
    fn: (s, d, w, h, p, c) => { const st = STEP(p, c), dx = (hash2(st, 1, 9) - 0.5) * 2 * p.amt * c.S, dy = (hash2(st, 2, 9) - 0.5) * 2 * p.amt * c.S, an = (hash2(st, 3, 9) - 0.5) * 2 * p.rot * Math.PI / 180, ca = Math.cos(an), sa = Math.sin(an), cx = w / 2, cy = h / 2; remapSample(s, d, w, h, (x, y) => { const u = x - cx - dx, v = y - cy - dy; return [cx + u * ca + v * sa, cy - u * sa + v * ca]; }); } },
  { id: 'pulse', cat: 'gif', name: 'Pulse', desc: 'Heartbeat zoom + glow', params: [R('amt', 'Zoom', 0, 40, 6, 0.5, '%'), SEL('curve', 'Beat', [['sine', 'SMOOTH'], ['beat', 'HEARTBEAT'], ['bounce', 'BOUNCE']], 'beat'), R('flash', 'Flash', 0, 100, 25, 1, '%'), CYC()],
    fn: (s, d, w, h, p, c) => { const ph = LOOP(p, c); let k = p.curve === 'sine' ? 0.5 - 0.5 * Math.cos(ph * TAU) : p.curve === 'bounce' ? Math.abs(Math.sin(ph * Math.PI)) : Math.max(Math.exp(-((ph - 0.08) ** 2) / 0.002), 0.7 * Math.exp(-((ph - 0.24) ** 2) / 0.002)); const z = 1 + p.amt / 100 * k, cx = w / 2, cy = h / 2, fl = 1 + p.flash / 100 * k; remapSample(s, d, w, h, (x, y) => [cx + (x - cx) / z, cy + (y - cy) / z]); if (p.flash) for (let i = 0; i < d.length; i += 4) { d[i] *= fl; d[i + 1] *= fl; d[i + 2] *= fl; } } },
  { id: 'wave', cat: 'gif', name: 'Wave', desc: 'Flowing liquid ripple', params: [R('amp', 'Amplitude', 0, 60, 8, 0.5, 'px'), R('len', 'Wavelength', 10, 600, 140, 1, 'px'), SEL('dir', 'Direction', [['h', 'SIDEWAYS'], ['v', 'UP/DOWN'], ['ripple', 'RIPPLE']], 'h'), CYC()],
    fn: (s, d, w, h, p, c) => { const ph = LOOP(p, c) * TAU, a = p.amp * c.S, L = p.len * c.S, cx = w / 2, cy = h / 2; remapSample(s, d, w, h, (x, y) => { if (p.dir === 'ripple') { const r = Math.hypot(x - cx, y - cy) || 1, o = Math.sin(r / L * TAU - ph) * a; return [x + (x - cx) / r * o, y + (y - cy) / r * o]; } return p.dir === 'v' ? [x, y + Math.sin(x / L * TAU + ph) * a] : [x + Math.sin(y / L * TAU + ph) * a, y]; }); } },
  { id: 'huecycle', cat: 'gif', name: 'Hue Cycle', desc: 'Rainbow colour loop', params: [R('range', 'Hue range', 10, 360, 360, 1, '°'), R('sat', 'Saturation boost', 0, 200, 120, 1, '%'), CYC()],
    fn: (s, d, w, h, p, c) => { const a = (LOOP(p, c) * p.range) * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), sb = p.sat / 100; const m = [0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928, 0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283, 0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072]; for (let i = 0; i < s.length; i += 4) { const r = s[i], g = s[i + 1], b = s[i + 2]; let R2 = m[0] * r + m[1] * g + m[2] * b, G2 = m[3] * r + m[4] * g + m[5] * b, B2 = m[6] * r + m[7] * g + m[8] * b; const l = lum(R2, G2, B2); d[i] = l + (R2 - l) * sb; d[i + 1] = l + (G2 - l) * sb; d[i + 2] = l + (B2 - l) * sb; } } },
  { id: 'strobe', cat: 'gif', name: 'Strobe', desc: 'Flash / invert on the beat', params: [SEL('mode', 'Flash', [['white', 'WHITE'], ['color', 'COLOR'], ['invert', 'INVERT'], ['black', 'BLACKOUT']], 'color'), C('col', 'Flash color', '#ff4fa3'), R('duty', 'Flash length', 2, 60, 12, 1, '%'), R('amt', 'Strength', 0, 100, 70, 1, '%'), CYC()],
    fn: (s, d, w, h, p, c) => { const ph = LOOP(p, c); if (ph > p.duty / 100) return; const k = p.amt / 100 * (1 - ph / (p.duty / 100) * 0.6), col = p.mode === 'white' ? [255, 255, 255] : p.mode === 'black' ? [0, 0, 0] : hex(p.col); for (let i = 0; i < s.length; i += 4) for (let q = 0; q < 3; q++) { const v = p.mode === 'invert' ? 255 - s[i + q] : p.mode === 'color' ? BLENDS.screen(s[i + q], col[q]) : col[q]; d[i + q] = s[i + q] + (v - s[i + q]) * k; } } },
  { id: 'flicker', cat: 'gif', name: 'Glitch Flicker', desc: 'Random torn glitch frames', params: [R('chance', 'Glitch frames', 0, 100, 30, 1, '%'), R('amt', 'Tear', 0, 200, 50, 1, 'px'), R('split', 'RGB split', 0, 40, 8, 1, 'px'), R('steps', 'Frames per loop', 4, 48, 16)],
    fn: (s, d, w, h, p, c) => { const st = STEP(p, c); if (hash2(st, 5, 3) > p.chance / 100) return; const r = rng(st * 977 + 3), sp = Math.round(p.split * c.S * (r() * 2 - 0.5)); for (let y = 0; y < h; y++) { const band = Math.floor(y / Math.max(2, 18 * c.S)), off = hash2(band, st, 7) < 0.3 ? Math.round((hash2(band, st, 8) - 0.5) * 2 * p.amt * c.S) : 0; for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, sx = clamp(x - off, 0, w - 1), j = (y * w + sx) * 4, jr = (y * w + clamp(sx - sp, 0, w - 1)) * 4, jb = (y * w + clamp(sx + sp, 0, w - 1)) * 4; d[k] = s[jr]; d[k + 1] = s[j + 1]; d[k + 2] = s[jb + 2]; } } } },
  { id: 'sparkle', cat: 'gif', name: 'Sparkles', desc: 'Twinkling star glints', params: [R('count', 'Sparkles', 1, 400, 60), R('size', 'Size', 2, 80, 14, 1, 'px'), SEL('where', 'Placement', [['bright', 'ON HIGHLIGHTS'], ['any', 'ANYWHERE']], 'bright'), C('col', 'Color', '#ffffff'), C('col2', 'Accent', '#ff4fa3'), CYC(), SEED()],
    fn: (s, d, w, h, p, c) => { const ph = LOOP(p, c), cA = hex(p.col), cB = hex(p.col2), r = rng(c.seed); let placed = 0, tries = 0;
      while (placed < p.count && tries < p.count * 40) { tries++; const x0 = (r() * w) | 0, y0 = (r() * h) | 0, k0 = (y0 * w + x0) * 4, ofs = r(), col = r() < 0.3 ? cB : cA; if (p.where === 'bright' && lum(s[k0], s[k0 + 1], s[k0 + 2]) < 170) continue; placed++;
        const tw = Math.max(0, Math.sin((ph + ofs) * TAU)), R0 = p.size * c.S * (0.5 + r() * 0.8) * tw; if (R0 < 1) continue; const rr = Math.ceil(R0);
        for (let y = Math.max(0, y0 - rr); y < Math.min(h, y0 + rr + 1); y++) for (let x = Math.max(0, x0 - rr); x < Math.min(w, x0 + rr + 1); x++) { const u = Math.abs(x - x0) / R0, v = Math.abs(y - y0) / R0, a = clamp(Math.max(0, 1 - u * 6) * Math.max(0, 1 - v) + Math.max(0, 1 - v * 6) * Math.max(0, 1 - u) + Math.max(0, 1 - Math.hypot(u, v) * 2.2) * 0.8, 0, 1); if (a <= 0) continue; const k = (y * w + x) * 4; for (let q = 0; q < 3; q++) d[k + q] = BLENDS.screen(d[k + q], col[q] * a); } } } },
  { id: 'particles', cat: 'gif', name: 'Falling Particles', desc: 'Hearts, stars, snow, rain', params: [SEL('shape', 'Particle', [['heart', 'HEARTS'], ['star', 'STARS'], ['snow', 'SNOW'], ['rain', 'RAIN'], ['cross', 'CROSSHAIRS']], 'heart'), R('count', 'Amount', 1, 300, 40), R('size', 'Size', 2, 120, 22, 1, 'px'), R('drift', 'Side drift', 0, 100, 25, 1, '%'), SEL('dir', 'Direction', [['down', 'FALL'], ['up', 'RISE']], 'down'), C('col', 'Color', '#ff4fa3'), C('col2', 'Second color', '#d4ff00'), R('alpha', 'Opacity', 5, 100, 85, 1, '%'), CYC(), SEED()],
    fn: (s, d, w, h, p, c) => { const ph = LOOP(p, c), r = rng(c.seed), shp = PARTICLE_SHAPES[p.shape] || PARTICLE_SHAPES.heart, A = p.alpha / 100, cA = hex(p.col), cB = hex(p.col2);
      for (let i = 0; i < p.count; i++) { const sz = p.size * c.S * (0.5 + r()), x00 = r() * w, off = r(), sp = 1 + Math.floor(r() * 2), col = r() < 0.5 ? cA : cB, wob = r() * TAU;
        let yy = frac(off + ph * sp) * (h + sz * 2) - sz; if (p.dir === 'up') yy = h - yy; const xx = x00 + Math.sin(ph * TAU * sp + wob) * p.drift / 100 * sz * 2, hs = (p.shape === 'rain' ? sz * 1.6 : sz) / 2;
        for (let y = Math.max(0, Math.floor(yy - hs)); y < Math.min(h, Math.ceil(yy + hs)); y++) for (let x = Math.max(0, Math.floor(xx - hs)); x < Math.min(w, Math.ceil(xx + hs)); x++) { if (!shp((x - xx) / (hs * 2), (y - yy) / (hs * 2))) continue; const k = (y * w + x) * 4; for (let q = 0; q < 3; q++) d[k + q] = d[k + q] + (col[q] - d[k + q]) * A; } } } },
  { id: 'rollbars', cat: 'gif', name: 'Rolling Bars', desc: 'Looping CRT roll bars', params: [R('bars', 'Bars', 1, 8, 2), R('thick', 'Thickness', 2, 60, 16, 1, '%'), R('dark', 'Darkness', 0, 100, 45, 1, '%'), R('glow', 'Glow edge', 0, 100, 30, 1, '%'), CYC()],
    fn: (s, d, w, h, p, c) => { const ph = LOOP(p, c), th = p.thick / 100, dk = p.dark / 100, gl = p.glow / 100 * 90; for (let y = 0; y < h; y++) { const u = frac(y / h * p.bars - ph), inBar = u < th, edge = Math.max(0, 1 - Math.abs(u - th) * 30), m = inBar ? 1 - dk * Math.sin(u / th * Math.PI) : 1; for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; for (let q = 0; q < 3; q++) d[k + q] = s[k + q] * m + edge * gl; } } } },
  { id: 'dithercrawl', cat: 'gif', name: 'Dither Crawl', desc: 'Animated marching dither pattern', params: [PAL('pal', 'Palette', 'acid'), R('size', 'Pattern size', 1, 16, 2, 1, 'px'), SEL('m', 'Matrix', [['4', '4×4'], ['8', '8×8']], '4'), SEL('move', 'Motion', [['diag', 'DIAGONAL'], ['h', 'SIDEWAYS'], ['v', 'DOWN'], ['shimmer', 'SHIMMER']], 'diag'), CYC()],
    fn: (s, d, w, h, p, c) => { const M = BAYER[p.m] || BAYER[4], n = M.length, ph = LOOP(p, c), sh = Math.floor(ph * n); p.colors = 2; p.thr = 50; p.con = 100; p.bri = 0; p.noise = 0; ordered(s, d, w, h, p, c, (x, y) => p.move === 'shimmer' ? frac(M[y % n][x % n] + ph) : M[(y + (p.move !== 'h' ? sh : 0)) % n][(x + (p.move !== 'v' ? sh : 0)) % n]); } },
  { id: 'zoomloop', cat: 'gif', name: 'Infinite Zoom', desc: 'Endless zoom tunnel loop', params: [R('depth', 'Zoom depth', 105, 300, 160, 1, '%'), SEL('dir', 'Direction', [['in', 'IN'], ['out', 'OUT']], 'in'), R('spin', 'Spin', 0, 180, 0, 1, '°'), CYC()],
    fn: (s, d, w, h, p, c) => { let ph = LOOP(p, c); if (p.dir === 'out') ph = 1 - ph; const Z = p.depth / 100, cx = w / 2, cy = h / 2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; let acc = [0, 0, 0], wsum = 0; for (let l = 0; l < 2; l++) { const z = Math.pow(Z, ph - l), an = (ph - l) * p.spin * Math.PI / 180, ca = Math.cos(an), sa = Math.sin(an), u = (x - cx) / z, v = (y - cy) / z, sx = Math.round(cx + u * ca - v * sa), sy = Math.round(cy + u * sa + v * ca); if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue; const j = (sy * w + sx) * 4, wt = l === 0 ? 1 - ph : ph; acc[0] += s[j] * wt; acc[1] += s[j + 1] * wt; acc[2] += s[j + 2] * wt; wsum += wt; } if (wsum) { d[k] = acc[0] / wsum; d[k + 1] = acc[1] / wsum; d[k + 2] = acc[2] / wsum; } } } },
);

/* ---------- SHEDITHERS originals: effects made from the artist's world (blood red, ink, paper, eyes, stars) ---------- */
const INK = [11, 10, 9], BLOOD = [195, 20, 28], PAPER = [233, 227, 209];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ramp3 = t => t < 0.5 ? lerp3(INK, BLOOD, t * 2) : lerp3(BLOOD, PAPER, (t - 0.5) * 2);
const starIn = (u, v, s) => { const a = Math.atan2(v, u), r = Math.hypot(u, v), k = 0.5 + 0.5 * Math.cos(5 * a - Math.PI / 2); return r <= s * (0.2 + 0.3 * Math.pow(k, 1.8)); };
const heartIn = (u, v, s) => { const x = u / s * 2.5, y = -v / s * 2.5 + 0.35, a = x * x + y * y - 1; return a * a * a - x * x * y * y * y <= 0; };
function shapeMatrix(n, inside) { const M = []; for (let j = 0; j < n; j++) { const row = []; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5, v = (j + 0.5) / n - 0.5; let s = 1; for (let k = 1; k <= 24; k++) { if (inside(u, v, k / 24)) { s = k / 24; break; } } row.push(s); } M.push(row); } return M; }
const SHP = { star: n => shapeMatrix(n, starIn), heart: n => shapeMatrix(n, heartIn) };
const inkDither = (p, pal, colors) => Object.assign({}, p, { pal: 'custom', _pal: pal, colors, thr: 50, noise: p.noise || 0, size: p.size || 1 });
const SHED_PAL = ['#0b0a09', '#c3141c', '#e9e3d1'];
function addGlow(d, k, col, a) { for (let q = 0; q < 3; q++) d[k + q] = d[k + q] + (255 - d[k + q]) * (col[q] / 255) * a; }
function eyeAt(d, w, h, cx, cy, R, open, look, iris) { // almond eye with lashes, open 0..1
  const x0 = Math.max(0, Math.floor(cx - R * 1.2)), x1 = Math.min(w, Math.ceil(cx + R * 1.2)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(h, Math.ceil(cy + R));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const u = (x - cx) / R, v = (y - cy) / R, k = (y * w + x) * 4, lid = Math.max(0.02, open) * 0.55 * (1 - u * u);
    if (Math.abs(u) > 1) continue;
    const edge = Math.abs(Math.abs(v) - lid);
    if (Math.abs(v) < lid) { // inside the eye
      const iu = u - look[0] * 0.35, iv = v - look[1] * 0.2, ir = Math.hypot(iu, iv);
      const col = ir < 0.14 ? INK : ir < 0.32 ? iris : PAPER; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2];
      if (ir > 0.05 && ir < 0.09 && iu < 0 && iv < 0) { d[k] = d[k + 1] = d[k + 2] = 255; }
    } else if (edge < 0.09) { d[k] = INK[0]; d[k + 1] = INK[1]; d[k + 2] = INK[2]; }
    else if (v < -lid && v > -lid - 0.35 && open > 0.3 && Math.abs((u * 5) - Math.round(u * 5)) < 0.12 && Math.abs(u) < 0.8) { d[k] = INK[0]; d[k + 1] = INK[1]; d[k + 2] = INK[2]; } // lashes
  }
}
EFFECTS.push(
  // ---- DITHER ----
  { id: 'bloodink', cat: 'dither', name: 'Blood Ink', desc: 'Dither in black, blood red and paper', params: [R('size', 'Dot size', 1, 16, 2, 1, 'px'), SEL('m', 'Pattern', [['8', 'FINE'], ['4', 'CLASSIC'], ['2', 'CHUNKY']], '8'), R('con', 'Contrast', 0, 200, 120, 1, '%'), R('bri', 'Brightness', -100, 100, 0), R('spread', 'Grain', 0, 200, 100, 1, '%')],
    fn: (s, d, w, h, p, c) => { const M = BAYER[p.m] || BAYER[8], n = M.length; ordered(s, d, w, h, inkDither(p, SHED_PAL, 3), c, (x, y) => M[y % n][x % n]); } },
  { id: 'stardither', cat: 'dither', name: 'Star Screen', desc: 'Dither made of little stars', params: [PAL('pal', 'Palette', 'mono'), R('colors', 'Colors', 2, 16, 2), R('cell', 'Star size', 4, 40, 10, 1, 'px'), R('con', 'Contrast', 0, 200, 110, 1, '%'), R('bri', 'Brightness', -100, 100, 0), R('spread', 'Spread', 0, 200, 100, 1, '%')],
    fn: (s, d, w, h, p, c) => { const n = Math.max(4, Math.round(p.cell * c.S)), M = SHP.star(n); ordered(s, d, w, h, Object.assign({}, p, { size: 1, thr: 50, noise: 0 }), c, (x, y) => M[y % n][x % n]); } },
  { id: 'heartdither', cat: 'dither', name: 'Love Letter', desc: 'Dither made of tiny hearts', params: [PAL('pal', 'Palette', 'mono'), R('colors', 'Colors', 2, 16, 2), R('cell', 'Heart size', 4, 40, 10, 1, 'px'), R('con', 'Contrast', 0, 200, 110, 1, '%'), R('bri', 'Brightness', -100, 100, 0), R('spread', 'Spread', 0, 200, 100, 1, '%')],
    fn: (s, d, w, h, p, c) => { const n = Math.max(4, Math.round(p.cell * c.S)), M = SHP.heart(n); ordered(s, d, w, h, Object.assign({}, p, { size: 1, thr: 50, noise: 0 }), c, (x, y) => M[y % n][x % n]); } },
  { id: 'scrawl', cat: 'dither', name: 'Scrawl', desc: 'Shading made of scribbled pen lines', params: [R('line', 'Line spacing', 2, 24, 5, 1, 'px'), R('wild', 'Messiness', 0, 100, 55, 1, '%'), C('ink', 'Ink', '#0b0a09'), C('paper', 'Paper', '#e9e3d1'), R('con', 'Contrast', 0, 200, 115, 1, '%'), SEED()],
    fn: (s, d, w, h, p, c) => { const L = Math.max(2, p.line * c.S), ik = hex(p.ink), pp = hex(p.paper), wl = p.wild / 100, cn = p.con / 100, sc = 60 * c.S;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, l = clamp(((lum(s[k], s[k + 1], s[k + 2]) / 255) - 0.5) * cn + 0.5, 0, 1), th = vnoise2(x / sc, y / sc, c.seed) * Math.PI, wob = (vnoise2(x / (9 * c.S), y / (9 * c.S), c.seed + 3) - 0.5) * wl * 1.6, t = frac((x * Math.cos(th) + y * Math.sin(th)) / L + wob), tri = 1 - Math.abs(2 * t - 1);
        let on = tri > l * 1.05; if (l < 0.45) { const t2 = frac((x * Math.cos(th + 1.3) + y * Math.sin(th + 1.3)) / L + wob), tri2 = 1 - Math.abs(2 * t2 - 1); on = on || tri2 > l * 2.2; }
        const col = on ? ik : pp; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; } } },
  // ---- PIXEL ----
  { id: 'tornpixels', cat: 'pixel', name: 'Torn Pixels', desc: 'Chunky pixels with ripped paper edges', params: [R('size', 'Pixel size', 4, 80, 16, 1, 'px'), R('rough', 'Rip', 0, 50, 22, 1, '%'), C('gap', 'Gap colour', '#e9e3d1'), SEED()],
    fn: (s, d, w, h, p, c) => { const b = Math.max(2, Math.round(p.size * c.S)), bw = Math.ceil(w / b), bh = Math.ceil(h / b), avg = new Float32Array(bw * bh * 3), cnt = new Uint32Array(bw * bh), g = hex(p.gap), rr = p.rough / 100;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const bi = ((y / b) | 0) * bw + ((x / b) | 0), k = (y * w + x) * 4; avg[bi * 3] += s[k]; avg[bi * 3 + 1] += s[k + 1]; avg[bi * 3 + 2] += s[k + 2]; cnt[bi]++; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const bx = (x / b) | 0, by = (y / b) | 0, bi = by * bw + bx, lx = x - bx * b, ly = y - by * b, k = (y * w + x) * 4, jx = hash2(bx * 31 + ly, by, c.seed) * rr * b, jy = hash2(bx, by * 31 + lx, c.seed + 1) * rr * b;
        if (lx < jx || ly < jy) { d[k] = g[0]; d[k + 1] = g[1]; d[k + 2] = g[2]; } else { const n = cnt[bi] || 1; d[k] = avg[bi * 3] / n; d[k + 1] = avg[bi * 3 + 1] / n; d[k + 2] = avg[bi * 3 + 2] / n; } } } },
  { id: 'inkdrip', cat: 'pixel', name: 'Ink Drip', desc: 'Dark ink runs and drips down', params: [R('len', 'Drip length', 2, 300, 60, 1, 'px'), R('thr', 'What drips (darkness)', 5, 95, 35, 1, '%'), SEL('col', 'Drip colour', [['source', 'ITS OWN INK'], ['blood', 'BLOOD RED'], ['black', 'BLACK']], 'blood'), R('var', 'Uneven', 0, 100, 70, 1, '%'), SEED()],
    fn: (s, d, w, h, p, c) => { const th = p.thr / 100 * 255, vr = p.var / 100;
      for (let x = 0; x < w; x++) { const L = Math.max(1, p.len * c.S * (1 - vr + vr * Math.pow(vnoise(x / (6 * c.S), c.seed), 2) * 2)); let run = 0, col = INK;
        for (let y = 0; y < h; y++) { const k = (y * w + x) * 4, l = lum(s[k], s[k + 1], s[k + 2]);
          if (l < th) { run = L; col = p.col === 'source' ? [s[k], s[k + 1], s[k + 2]] : p.col === 'black' ? INK : BLOOD; if (p.col !== 'source') { d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; } }
          else if (run > 0) { const a = Math.min(1, run / L * 1.4); d[k] = s[k] + (col[0] - s[k]) * a; d[k + 1] = s[k + 1] + (col[1] - s[k + 1]) * a; d[k + 2] = s[k + 2] + (col[2] - s[k + 2]) * a; run--; } } } } },
  { id: 'starmosaic', cat: 'pixel', name: 'Star Mosaic', desc: 'Your picture rebuilt out of stars', params: [R('size', 'Star size', 6, 80, 18, 1, 'px'), R('fill', 'Star fullness', 40, 140, 100, 1, '%'), C('bg', 'Background', '#0b0a09')],
    fn: (s, d, w, h, p, c) => { const b = Math.max(4, Math.round(p.size * c.S)), bw = Math.ceil(w / b), bh = Math.ceil(h / b), avg = new Float32Array(bw * bh * 3), cnt = new Uint32Array(bw * bh), bg = hex(p.bg), f = p.fill / 100;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const bi = ((y / b) | 0) * bw + ((x / b) | 0), k = (y * w + x) * 4; avg[bi * 3] += s[k]; avg[bi * 3 + 1] += s[k + 1]; avg[bi * 3 + 2] += s[k + 2]; cnt[bi]++; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const bx = (x / b) | 0, by = (y / b) | 0, bi = by * bw + bx, k = (y * w + x) * 4, u = (x - bx * b) / b - 0.5, v = (y - by * b) / b - 0.5, n = cnt[bi] || 1;
        if (starIn(u, v, f)) { d[k] = avg[bi * 3] / n; d[k + 1] = avg[bi * 3 + 1] / n; d[k + 2] = avg[bi * 3 + 2] / n; } else { d[k] = bg[0]; d[k + 1] = bg[1]; d[k + 2] = bg[2]; } } } },
  // ---- TEXTURE ----
  { id: 'tornpaper', cat: 'texture', name: 'Torn Paper', desc: 'Printed on cream paper with ripped edges', params: [R('tint', 'Paper tint', 0, 100, 45, 1, '%'), R('fiber', 'Fibers', 0, 100, 40, 1, '%'), R('edge', 'Rip depth', 0, 12, 4, 0.5, '%'), C('bg', 'Behind the paper', '#0b0a09'), SEED()],
    fn: (s, d, w, h, p, c) => { const tn = p.tint / 100, fb = p.fiber / 100, ed = p.edge / 100 * Math.min(w, h), sc = 3 * c.S;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, rip = ed * (0.4 + 0.6 * vnoise((x + y) / (14 * c.S), c.seed)), dEdge = Math.min(x, y, w - 1 - x, h - 1 - y);
        if (dEdge < rip) { const bg = hex(p.bg); d[k] = bg[0]; d[k + 1] = bg[1]; d[k + 2] = bg[2]; continue; }
        const fib = (vnoise2(x / sc, y / (sc * 6), c.seed) - 0.5) * fb * 60 + (hash2(x, y, c.seed) - 0.5) * fb * 18, sh = dEdge < rip + 6 * c.S ? 0.85 : 1;
        for (let q = 0; q < 3; q++) d[k + q] = clamp((s[k + q] * (1 - tn) + s[k + q] * PAPER[q] / 255 * tn + fib) * sh, 0, 255); } } },
  { id: 'tape', cat: 'texture', name: 'Tape Strips', desc: 'Masking tape stuck on the corners', params: [R('n', 'Strips', 1, 4, 2), R('wid', 'Tape width', 4, 30, 12, 1, '%'), R('alpha', 'See-through', 0, 90, 30, 1, '%'), C('col', 'Tape colour', '#e9e3d1'), SEED()],
    fn: (s, d, w, h, p, c) => { const r = rng(c.seed), col = hex(p.col), a = 1 - p.alpha / 100, tw = p.wid / 100 * Math.min(w, h), corners = [[0.08, 0.06], [0.92, 0.06], [0.08, 0.94], [0.92, 0.94]];
      for (let i = 0; i < p.n; i++) { const [fx, fy] = corners[i], cx = fx * w, cy = fy * h, an = (i % 2 ? -1 : 1) * (0.6 + r() * 0.4), ca = Math.cos(an), sa = Math.sin(an), len = tw * 3.2;
        for (let y = Math.max(0, (cy - len) | 0); y < Math.min(h, cy + len); y++) for (let x = Math.max(0, (cx - len) | 0); x < Math.min(w, cx + len); x++) { const u = (x - cx) * ca + (y - cy) * sa, v = -(x - cx) * sa + (y - cy) * ca, jag = (hash2(Math.round(v), i, 5) - 0.5) * tw * 0.12;
          if (Math.abs(u) < len / 2 + jag && Math.abs(v) < tw / 2) { const k = (y * w + x) * 4, n = 0.92 + hash2(x, y, i) * 0.08; for (let q = 0; q < 3; q++) d[k + q] = d[k + q] * (1 - a) + col[q] * n * a; } } } } },
  { id: 'xerox', cat: 'texture', name: 'Photocopy', desc: 'Cheap copy machine: toner, streaks, grit', params: [R('con', 'Contrast', 50, 400, 220, 1, '%'), R('toner', 'Toner specks', 0, 100, 35, 1, '%'), R('streak', 'Streaks', 0, 100, 30, 1, '%'), R('shift', 'Misprint', 0, 20, 3, 1, 'px'), B('paper', 'Paper tint', true), SEED(), ANIM()],
    fn: (s, d, w, h, p, c) => { const cn = p.con / 100, sh = Math.round(p.shift * c.S), r = rng(c.seed), streaks = []; for (let i = 0; i < 6; i++) streaks.push([r() * w, r() * 3 + 1]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, sx = clamp(x - sh, 0, w - 1), j = (y * w + sx) * 4; let l = (lum(s[j], s[j + 1], s[j + 2]) - 128) * cn + 128;
        if (hash2(x, y, c.seed) < p.toner / 100 * 0.03) l = 20; for (const [sx2, sw] of streaks) if (Math.abs(x - sx2) < sw * c.S) l -= p.streak * 0.9 * (0.5 + 0.5 * vnoise(y / 30, c.seed));
        l = clamp(l, 0, 255); const t = p.paper ? PAPER : [255, 255, 255]; d[k] = l / 255 * t[0]; d[k + 1] = l / 255 * t[1]; d[k + 2] = l / 255 * t[2]; } } },
  { id: 'crumple', cat: 'texture', name: 'Crumpled', desc: 'Like it was balled up and flattened', params: [R('amt', 'Creases', 0, 100, 55, 1, '%'), R('scale', 'Crease size', 20, 400, 120, 1, 'px'), R('light', 'Light angle', 0, 360, 135, 1, '°'), SEED()],
    fn: (s, d, w, h, p, c) => { const sc = p.scale * c.S, a = p.amt / 100, la = p.light * Math.PI / 180, lx = Math.cos(la), ly = Math.sin(la), H = (x, y) => Math.abs(vnoise2(x / sc, y / sc, c.seed) - 0.5) + 0.5 * Math.abs(vnoise2(x / sc * 2.3, y / sc * 2.3, c.seed + 9) - 0.5);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, nx = H(x + 1, y) - H(x - 1, y), ny = H(x, y + 1) - H(x, y - 1), sh = 1 + (nx * lx + ny * ly) * a * sc * 0.9; for (let q = 0; q < 3; q++) d[k + q] = clamp(s[k + q] * sh, 0, 255); } } },
  // ---- LIGHT (stays still) ----
  { id: 'redroom', cat: 'light', name: 'Red Room', desc: 'Darkroom red light: ink, blood, paper', params: [R('amt', 'Strength', 0, 100, 85, 1, '%'), R('con', 'Contrast', 50, 250, 130, 1, '%'), R('vig', 'Dark corners', 0, 100, 45, 1, '%')],
    fn: (s, d, w, h, p, c) => { const a = p.amt / 100, cn = p.con / 100, vg = p.vig / 100, cx = w / 2, cy = h / 2, md = Math.hypot(cx, cy);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, t = clamp((lum(s[k], s[k + 1], s[k + 2]) / 255 - 0.5) * cn + 0.5, 0, 1), col = ramp3(t), v = 1 - vg * Math.pow(Math.hypot(x - cx, y - cy) / md, 2); for (let q = 0; q < 3; q++) d[k + q] = (s[k + q] + (col[q] - s[k + q]) * a) * v; } } },
  { id: 'lightleak', cat: 'light', name: 'Light Leak', desc: 'Warm film light bleeding in from the edge', params: [R('amt', 'Strength', 0, 100, 60, 1, '%'), SEL('side', 'From', [['left', 'LEFT'], ['right', 'RIGHT'], ['top', 'TOP'], ['corner', 'CORNER']], 'right'), C('col', 'Colour', '#ff3b1f'), C('col2', 'Hot centre', '#ffd27a'), SEED()],
    fn: (s, d, w, h, p, c) => { const a = p.amt / 100, c1 = hex(p.col), c2 = hex(p.col2);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, u = x / w, v = y / h; let e = p.side === 'left' ? 1 - u : p.side === 'top' ? 1 - v : p.side === 'corner' ? Math.max(0, 1 - Math.hypot(1 - u, v) * 0.9) : u; e = Math.pow(clamp(e + (vnoise2(u * 3, v * 3, c.seed) - 0.5) * 0.35, 0, 1), 2.2) * a; const hot = Math.pow(e, 2); addGlow(d, k, [c1[0] + (c2[0] - c1[0]) * hot, c1[1] + (c2[1] - c1[1]) * hot, c1[2] + (c2[2] - c1[2]) * hot], e); } } },
  { id: 'halo', cat: 'light', name: 'Halo', desc: 'A glowing saint ring', params: [R('x', 'Across', 0, 100, 50, 1, '%'), R('y', 'Down', 0, 100, 22, 1, '%'), R('rad', 'Size', 2, 60, 14, 1, '%'), R('thick', 'Ring width', 1, 40, 10, 1, '%'), R('glow', 'Glow', 0, 100, 70, 1, '%'), C('col', 'Colour', '#ffe7a8')],
    fn: (s, d, w, h, p, c) => { const cx = p.x / 100 * w, cy = p.y / 100 * h, R0 = p.rad / 100 * Math.min(w, h), th = Math.max(1, R0 * p.thick / 100), col = hex(p.col), gl = p.glow / 100;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x - cx) / R0, dy = (y - cy) / (R0 * 0.38), r = Math.hypot(dx, dy) * R0, e = Math.abs(r - R0); let a = e < th ? 1 - e / th * 0.3 : gl * Math.exp(-(((e - th) / (th * 2.5)) ** 2)) * 0.8; if (a > 0.01) addGlow(d, (y * w + x) * 4, col, clamp(a, 0, 1)); } } },
  // ---- MOVING LIGHT (makes it move) ----
  { id: 'searchlight', cat: 'light', moves: true, name: 'Searchlight', desc: 'A spotlight sweeping over your picture', params: [R('size', 'Light size', 5, 80, 28, 1, '%'), R('dark', 'Darkness around', 0, 100, 70, 1, '%'), R('soft', 'Soft edge', 1, 100, 40, 1, '%'), SEL('path', 'Path', [['eight', 'FIGURE 8'], ['sweep', 'SWEEP'], ['circle', 'CIRCLE']], 'eight'), C('col', 'Light colour', '#fff1d6'), CYC()],
    fn: (s, d, w, h, p, c) => { const t = LOOP(p, c) * TAU, cx = w / 2 + w * 0.32 * (p.path === 'sweep' ? Math.sin(t) : Math.cos(t)), cy = h / 2 + h * 0.28 * (p.path === 'eight' ? Math.sin(2 * t) : p.path === 'circle' ? Math.sin(t) : 0), R0 = p.size / 100 * Math.min(w, h), sf = Math.max(0.01, p.soft / 100), dk = p.dark / 100, col = hex(p.col);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, r = Math.hypot(x - cx, y - cy) / R0, lit = clamp((1 + sf - r) / sf, 0, 1), m = 1 - dk * (1 - lit); for (let q = 0; q < 3; q++) d[k + q] = s[k + q] * m * (1 + lit * 0.25 * col[q] / 255); } } },
  { id: 'leakdrift', cat: 'light', moves: true, name: 'Leak Drift', desc: 'Light leaks that drift across', params: [R('amt', 'Strength', 0, 100, 55, 1, '%'), C('col', 'Colour', '#ff2a1f'), C('col2', 'Second colour', '#ffb36b'), CYC(), SEED()],
    fn: (s, d, w, h, p, c) => { const t = LOOP(p, c), a = p.amt / 100, c1 = hex(p.col), c2 = hex(p.col2), bx = [frac(t + 0.1), frac(t * 1 + 0.6)], by = [0.3 + 0.2 * Math.sin(t * TAU), 0.7 - 0.2 * Math.cos(t * TAU)];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, u = x / w, v = y / h; for (let i = 0; i < 2; i++) { let du = Math.abs(u - (bx[i] * 1.6 - 0.3)); const e = Math.exp(-(du * du) / 0.02 - ((v - by[i]) ** 2) / 0.12) * a; if (e > 0.01) addGlow(d, k, i ? c2 : c1, e); } } } },
  { id: 'flarepass', cat: 'light', moves: true, name: 'Flare Pass', desc: 'A lens flare streaking across', params: [R('amt', 'Brightness', 0, 100, 70, 1, '%'), R('y', 'Height', 0, 100, 40, 1, '%'), R('len', 'Streak length', 10, 100, 60, 1, '%'), C('col', 'Colour', '#ff4b3a'), CYC()],
    fn: (s, d, w, h, p, c) => { const t = LOOP(p, c), a = p.amt / 100, cx = (t * 1.4 - 0.2) * w, cy = p.y / 100 * h, col = hex(p.col), L = p.len / 100 * w, core = Math.min(w, h) * 0.05;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, dx = x - cx, dy = y - cy, streak = Math.exp(-(dy * dy) / (core * core * 0.04)) * Math.exp(-(dx * dx) / (L * L)), glow = Math.exp(-(dx * dx + dy * dy) / (core * core * 2)), ring = Math.exp(-((Math.hypot(x - (w - cx), y - (h - cy)) - core * 1.6) ** 2) / (core * core * 0.08)) * 0.35;
        const e = (streak + glow + ring) * a; if (e > 0.01) addGlow(d, k, glow > streak ? [255, 240, 220] : col, clamp(e, 0, 1)); } } },
  // ---- LOOPS ----
  { id: 'eyes', cat: 'gif', name: 'Watching Eyes', desc: 'Little eyes that open, blink and look around', params: [R('n', 'How many eyes', 1, 30, 7), R('size', 'Eye size', 10, 160, 46, 1, 'px'), C('iris', 'Iris colour', '#c3141c'), R('blink', 'Blinks per loop', 0, 6, 2), CYC(), SEED()],
    fn: (s, d, w, h, p, c) => { const t = LOOP(p, c), r = rng(c.seed), iris = hex(p.iris);
      for (let i = 0; i < p.n; i++) { const cx = r() * w, cy = r() * h, R0 = p.size * c.S * (0.6 + r() * 0.8), off = r(), bl = frac(t * Math.max(0, p.blink) + off), open = p.blink > 0 && bl < 0.08 ? Math.abs(bl / 0.04 - 1) : 1, la = (t + off) * TAU; eyeAt(d, w, h, cx, cy, R0, open, [Math.cos(la), Math.sin(la * 2) * 0.6], iris); } } },
  { id: 'channelsurf', cat: 'gif', name: 'Channel Surf', desc: 'Flips through looks like changing TV channels', params: [R('steps', 'Channels per loop', 2, 24, 6), R('static', 'Static between', 0, 100, 40, 1, '%'), SEED()],
    fn: (s, d, w, h, p, c) => { const st = STEP(p, c), sub = frac((c.prog || 0) * Math.max(1, p.steps)), mode = Math.floor(hash2(st, 1, c.seed) * 4), stat = sub < p.static / 100 * 0.35;
      for (let i = 0; i < s.length; i += 4) { const l = lum(s[i], s[i + 1], s[i + 2]) / 255; if (stat) { const n = hash2(i, st, 9) * 255; d[i] = d[i + 1] = d[i + 2] = n; continue; }
        const col = mode === 0 ? [s[i], s[i + 1], s[i + 2]] : mode === 1 ? ramp3(l) : mode === 2 ? [255 - s[i], 255 - s[i + 1], 255 - s[i + 2]] : (l > 0.5 ? PAPER : INK); d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; } } },
  { id: 'papertear', cat: 'gif', name: 'Paper Tear', desc: 'A ripped edge sweeps across, revealing red', params: [R('rip', 'Rip roughness', 0, 100, 50, 1, '%'), SEL('under', 'Underneath', [['red', 'BLOOD RED'], ['ink', 'INK'], ['invert', 'NEGATIVE']], 'red'), CYC(), SEED()],
    fn: (s, d, w, h, p, c) => { const t = LOOP(p, c), pos = (t * 1.3 - 0.15) * (w + h), rr = p.rip / 100 * Math.min(w, h) * 0.08;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, e = x + y * 0.6 + (vnoise(y / (8 * c.S), c.seed) - 0.5) * rr * 2 + (hash2(y, 3, c.seed) - 0.5) * rr * 0.4 - pos, l = lum(s[k], s[k + 1], s[k + 2]) / 255;
        if (e < 0) { const col = p.under === 'invert' ? [255 - s[k], 255 - s[k + 1], 255 - s[k + 2]] : p.under === 'ink' ? lerp3(INK, PAPER, l) : ramp3(l * 0.6); d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; }
        else if (e < 7 * c.S) { d[k] = PAPER[0]; d[k + 1] = PAPER[1]; d[k + 2] = PAPER[2]; } } } },
  { id: 'stopmotion', cat: 'gif', name: 'Stop Motion', desc: 'Jumpy cut-paper animation feel', params: [R('steps', 'Frames per loop', 2, 24, 8), R('jump', 'Jump', 0, 30, 6, 1, 'px'), R('twist', 'Twist', 0, 6, 1.2, 0.1, '°'), R('grain', 'Paper grain', 0, 100, 30, 1, '%')],
    fn: (s, d, w, h, p, c) => { const st = STEP(p, c), dx = (hash2(st, 1, 4) - 0.5) * 2 * p.jump * c.S, dy = (hash2(st, 2, 4) - 0.5) * 2 * p.jump * c.S, an = (hash2(st, 3, 4) - 0.5) * 2 * p.twist * Math.PI / 180, ca = Math.cos(an), sa = Math.sin(an), cx = w / 2, cy = h / 2, g = p.grain / 100 * 30;
      remapSample(s, d, w, h, (x, y) => { const u = x - cx - dx, v = y - cy - dy; return [cx + u * ca + v * sa, cy - u * sa + v * ca]; });
      if (g) for (let i = 0; i < d.length; i += 4) { const n = (hash2(i, st, 2) - 0.5) * g; d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n, 0, 255); } } },
  { id: 'starrays', cat: 'gif', name: 'Star Rays', desc: 'Spinning rays bursting from behind', params: [R('n', 'Rays', 3, 32, 12), R('amt', 'Strength', 0, 100, 45, 1, '%'), R('x', 'Centre across', 0, 100, 50, 1, '%'), R('y', 'Centre down', 0, 100, 45, 1, '%'), C('col', 'Colour', '#c3141c'), CYC()],
    fn: (s, d, w, h, p, c) => { const t = LOOP(p, c), cx = p.x / 100 * w, cy = p.y / 100 * h, col = hex(p.col), a = p.amt / 100, md = Math.hypot(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, an = Math.atan2(y - cy, x - cx) + t * TAU / p.n, ray = Math.pow(Math.max(0, Math.cos(an * p.n / 2)), 8), fall = 1 - Math.hypot(x - cx, y - cy) / md; const e = ray * fall * a; if (e > 0.01) for (let q = 0; q < 3; q++) d[k + q] = d[k + q] + (col[q] - d[k + q]) * e; } } },
);

/* ---------- BLOB TRACKING: finds shapes in the picture (bright spots, dark shapes, detail, or movement on video)
 * and locks boxes onto them like a computer watching a crowd: boxes, centre marks, lines between them, tiny labels ---------- */
const BT_FONT = { A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [6, 1, 2, 4, 7], '3': [6, 1, 2, 1, 6], '4': [5, 5, 7, 1, 1], '5': [7, 4, 6, 1, 6], '6': [3, 4, 7, 5, 7], '7': [7, 1, 1, 2, 2], '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 6], '.': [0, 0, 0, 0, 2], ':': [0, 2, 0, 2, 0], '-': [0, 0, 7, 0, 0], '#': [5, 7, 5, 7, 5], '?': [6, 1, 2, 0, 2], '/': [1, 1, 2, 4, 4], ' ': [0, 0, 0, 0, 0] };
const BT_WORDS = ['NO IDENTITY', 'SUBJECT', 'GHOST', 'YOU', 'UNKNOWN', 'LOOPING', 'SIGNAL', 'ERROR', 'HUMAN?', 'REMEMBER'];
EFFECTS.push({ id: 'blobtrack', cat: 'glitch', name: 'Blob Tracking', desc: 'Boxes lock onto shapes like a computer watching a crowd', params: [
  SEL('mode', 'Track', [['bright', 'BRIGHT SPOTS'], ['dark', 'DARK SHAPES'], ['detail', 'DETAIL / EDGES'], ['motion', 'MOVEMENT (VIDEO)']], 'bright'),
  R('thr', 'Sensitivity', 0, 100, 55, 1, '%'), R('max', 'Most boxes', 1, 60, 12), R('grid', 'Detail of the search', 12, 140, 56), R('minsz', 'Ignore blobs smaller than', 0, 20, 2, 1, '%'),
  SEL('style', 'Box style', [['box', 'BOX'], ['corners', 'CORNERS'], ['circle', 'CIRCLE'], ['cross', 'CROSSHAIR']], 'box'),
  C('col', 'Box colour', '#e9e3d1'), C('col2', 'Dot colour', '#c3141c'), R('thick', 'Line width', 1, 8, 1, 1, 'px'),
  SEL('net', 'Lines between them', [['chain', 'CHAIN (NEAREST)'], ['web', 'WEB'], ['none', 'NONE']], 'chain'), B('dots', 'Filled centre dots', true), B('labels', 'Labels', true), SEL('ltext', 'Label text', [['id', 'ID NUMBER'], ['xy', 'X / Y'], ['conf', 'CONFIDENCE'], ['words', 'WORDS']], 'id'),
  R('lsize', 'Label size', 1, 6, 2), B('fill', 'Tint inside boxes', false), R('dim', 'Darken the picture', 0, 90, 0, 1, '%'), SEED(), ANIM()], fn: blobTrackFx });
function blobTrackFx(s, d, w, h, p, c) {
  const S = c.S || 1, gw = Math.max(8, p.grid | 0), cell = w / gw, gh = Math.max(4, Math.round(h / cell)), G = new Float32Array(gw * gh), prev = c.prev && c.prev.length === s.length ? c.prev : null;
  // 1) average each grid cell
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const x0 = Math.floor(gx * cell), x1 = Math.min(w, Math.floor((gx + 1) * cell)), y0 = Math.floor(gy * h / gh), y1 = Math.min(h, Math.floor((gy + 1) * h / gh)); let sum = 0, n = 0, mot = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) { const k = (y * w + x) * 4, L = lum(s[k], s[k + 1], s[k + 2]); sum += L; n++; if (prev) mot += Math.abs(L - lum(prev[k], prev[k + 1], prev[k + 2])); }
    G[gy * gw + gx] = p.mode === 'dark' ? 255 - sum / Math.max(1, n) : p.mode === 'motion' && prev ? Math.min(255, mot / Math.max(1, n) * 4) : sum / Math.max(1, n);
  }
  if (p.mode === 'detail' || (p.mode === 'motion' && !prev)) { const E = new Float32Array(gw * gh); for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) { const i = y * gw + x; E[i] = Math.min(255, (Math.abs(G[i + 1] - G[i - 1]) + Math.abs(G[i + gw] - G[i - gw])) * 1.5); } G.set(E); }
  // 2) threshold against the picture's own spread, so it works on dark and light pictures alike
  let mean = 0; for (let i = 0; i < G.length; i++) mean += G[i]; mean /= G.length; let sd = 0; for (let i = 0; i < G.length; i++) sd += (G[i] - mean) ** 2; sd = Math.sqrt(sd / G.length) || 1;
  const cut = mean + sd * (1.6 - p.thr / 100 * 2.2), M = new Uint8Array(gw * gh); for (let i = 0; i < G.length; i++) M[i] = G[i] > cut ? 1 : 0;
  // 3) group touching cells into blobs
  const lab = new Int32Array(gw * gh).fill(-1), blobs = [], st = [];
  for (let i = 0; i < M.length; i++) { if (!M[i] || lab[i] >= 0) continue; const b = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, n: 0, sx: 0, sy: 0, v: 0 }; lab[i] = blobs.length; st.push(i);
    while (st.length) { const j = st.pop(), x = j % gw, y = (j / gw) | 0; b.n++; b.sx += x; b.sy += y; b.v += G[j]; if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; const q = ny * gw + nx; if (M[q] && lab[q] < 0) { lab[q] = blobs.length; st.push(q); } } }
    blobs.push(b); }
  const minN = Math.max(1, gw * gh * p.minsz / 100 / 10);
  const pick = blobs.filter(b => b.n >= minN).sort((a, b) => b.n - a.n).slice(0, p.max | 0);
  // 4) draw: picture (optionally darkened), then boxes, lines, labels
  const dm = 1 - p.dim / 100; for (let k = 0; k < s.length; k += 4) { d[k] = s[k] * dm; d[k + 1] = s[k + 1] * dm; d[k + 2] = s[k + 2] * dm; d[k + 3] = s[k + 3]; }
  const A = hex(p.col), B2 = hex(p.col2), T = Math.max(1, Math.round(p.thick * S)), ink = [11, 10, 9];
  const put = (x, y, col, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = (y * w + x) * 4; if (a == null) { d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; } else { d[k] += (col[0] - d[k]) * a; d[k + 1] += (col[1] - d[k + 1]) * a; d[k + 2] += (col[2] - d[k + 2]) * a; } };
  const dot = (x, y, col) => { for (let a = 0; a < T; a++) for (let b = 0; b < T; b++) put(x + a - (T >> 1), y + b - (T >> 1), col); };
  const line = (x0, y0, x1, y1, col, dash) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) { if (dash && (i / (4 * S) | 0) % 2) continue; dot(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), col); } };
  const text = (str, x, y, sc, col, bg) => { str = String(str).toUpperCase(); const cw = 4 * sc, wd = str.length * cw + sc, ht = 7 * sc;
    if (bg) for (let yy = 0; yy < ht; yy++) for (let xx = 0; xx < wd; xx++) put(x + xx, y + yy, bg);
    for (let i = 0; i < str.length; i++) { const g = BT_FONT[str[i]] || BT_FONT['?']; for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r] & (4 >> q)) for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) put(x + sc + i * cw + q * sc + a, y + sc + r * sc + b, col); } };
  const rnd = rng(c.seed), ch = h / gh, centres = [];
  pick.forEach((b, i) => {
    const col = A, X0 = Math.max(0, b.x0 * cell - cell * .5), Y0 = Math.max(0, b.y0 * ch - ch * .5), X1 = Math.min(w - 1, (b.x1 + 1.5) * cell), Y1 = Math.min(h - 1, (b.y1 + 1.5) * ch), cx = (b.sx / b.n + .5) * cell, cy = (b.sy / b.n + .5) * ch;
    centres.push([cx, cy, col]);
    if (p.fill) for (let y = Y0 | 0; y < Y1; y++) for (let x = X0 | 0; x < X1; x++) put(x, y, col, .18);
    if (p.style === 'circle') { const r = Math.max(X1 - X0, Y1 - Y0) / 2, n = Math.max(24, r * 2 | 0); for (let k = 0; k < n; k++) { const t = k / n * TAU; dot(cx + Math.cos(t) * r, cy + Math.sin(t) * r, col); } }
    else if (p.style === 'corners') { const lx = (X1 - X0) * .25, ly = (Y1 - Y0) * .25; [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]].forEach(([x, y, sx, sy]) => { line(x, y, x + lx * sx, y, col); line(x, y, x, y + ly * sy, col); }); }
    else if (p.style === 'cross') { const r = Math.max(6 * S, Math.min(X1 - X0, Y1 - Y0) / 2); line(cx - r, cy, cx + r, cy, col); line(cx, cy - r, cx, cy + r, col); }
    else { line(X0, Y0, X1, Y0, col); line(X1, Y0, X1, Y1, col); line(X1, Y1, X0, Y1, col); line(X0, Y1, X0, Y0, col); }
    if (p.style !== 'cross') { const r = 3 * S; line(cx - r, cy, cx + r, cy, col); line(cx, cy - r, cx, cy + r, col); }
    if (p.labels) { const sc = Math.max(1, Math.round(p.lsize * S)), id = (Math.floor(rnd() * 4096)).toString(16).toUpperCase().padStart(3, '0');
      const t = p.ltext === 'xy' ? `X${cx | 0} Y${cy | 0}` : p.ltext === 'conf' ? `CONF .${(60 + rnd() * 39) | 0}` : p.ltext === 'words' ? BT_WORDS[(i + (c.seed % 7)) % BT_WORDS.length] : `ID #${id}`;
      text(t, X0, Math.max(0, Y0 - 7 * sc), sc, ink, col); }
  });
  if (p.net === 'web' && centres.length > 1) for (let i = 0; i < centres.length; i++) { const a = centres[i], b = centres[(i * 3 + 1) % centres.length]; if (a !== b) line(a[0], a[1], b[0], b[1], A, true); }
  if (p.net === 'chain' && centres.length > 1) { const left = centres.slice(); let at = left.shift(); while (left.length) { let bi = 0, bd = 1e12; left.forEach((q, i) => { const dd = (q[0] - at[0]) ** 2 + (q[1] - at[1]) ** 2; if (dd < bd) { bd = dd; bi = i; } }); const nx = left.splice(bi, 1)[0]; line(at[0], at[1], nx[0], nx[1], A); at = nx; } }
  // filled dots on every third shape (the dancer-reference look)
  if (p.dots) centres.forEach((q, i) => { if (i % 3) return; const r = Math.max(3, 5 * S); for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) put(q[0] + x, q[1] + y, B2); });
  return d;
}

const CATS = [['layer', 'Layers'], ['gif', 'GIF FX'], ['light', 'Light'], ['texture', 'Textures'], ['dither', 'Dithering'], ['pixel', 'Pixel'], ['glitch', 'Glitch'], ['image', 'Image'], ['halftone', 'Halftone']];
const MAP = {}; EFFECTS.forEach(e => MAP[e.id] = e);
function defaults(def) { const o = {}; def.params.forEach(q => o[q.k] = q.def); return o; }
const BLENDS = {
  screen: (a, b) => 255 - (255 - a) * (255 - b) / 255, multiply: (a, b) => a * b / 255, overlay: (a, b) => a < 128 ? 2 * a * b / 255 : 255 - 2 * (255 - a) * (255 - b) / 255,
  softlight: (a, b) => { const A2 = a / 255, B2 = b / 255; return 255 * (B2 < 0.5 ? A2 - (1 - 2 * B2) * A2 * (1 - A2) : A2 + (2 * B2 - 1) * ((A2 < 0.25 ? ((16 * A2 - 12) * A2 + 4) * A2 : Math.sqrt(A2)) - A2)); },
  hardlight: (a, b) => b < 128 ? 2 * a * b / 255 : 255 - 2 * (255 - a) * (255 - b) / 255, add: (a, b) => a + b, subtract: (a, b) => a - b, difference: (a, b) => Math.abs(a - b),
  lighten: (a, b) => a > b ? a : b, darken: (a, b) => a < b ? a : b, dodge: (a, b) => b >= 255 ? 255 : Math.min(255, a * 255 / (255 - b)), burn: (a, b) => b <= 0 ? 0 : Math.max(0, 255 - (255 - a) * 255 / b),
};

/* stack: [{id, mix, p, blend?, mask?}] (resolved, enabled only). img is consumed. */
function run(img, w, h, stack, ctx, onProg) {
  let cur = img; const N = w * h;
  for (let i = 0; i < stack.length; i++) {
    const e = stack[i], def = MAP[e.id]; if (!def) continue;
    const p = Object.assign(defaults(def), e.p || {});
    const c = { S: ctx.S || 1, t: ctx.t || 0, prog: ctx.prog || 0, frame: ctx.frame || 0, video: !!ctx.video, prev: ctx.prev, seed: ((p.seed ?? 0) + (p.anim && ctx.video ? (ctx.frame || 0) * 7919 : 0) + i * 31) | 0 };
    const dst = new Uint8ClampedArray(cur);
    const out = def.fn(cur, dst, w, h, p, c) || dst;
    const bf = e.blend && e.blend !== 'normal' ? BLENDS[e.blend] : null;
    if (bf) for (let j = 0; j < out.length; j += 4) { out[j] = bf(cur[j], out[j]); out[j + 1] = bf(cur[j + 1], out[j + 1]); out[j + 2] = bf(cur[j + 2], out[j + 2]); }
    const m = (e.mix ?? 100) / 100, mk = e.mask && e.mask.length === N ? e.mask : null, am = c.alphaMask && c.alphaMask.length === N ? c.alphaMask : null;
    if (m < 0.999 || mk || am) for (let k = 0, j = 0; k < N; k++, j += 4) { let wt = m; if (mk) wt *= mk[k] / 255; if (am) wt *= am[k] / 255; if (wt >= 0.999) continue; for (let q = 0; q < 4; q++) out[j + q] = cur[j + q] + (out[j + q] - cur[j + q]) * wt; }
    cur = out;
    if (onProg) onProg(i + 1, stack.length);
  }
  return cur;
}
return { EFFECTS, MAP, CATS, PALETTES, defaults, run, hex, BLENDS, TEXTURES, texSwatch };
}
if (typeof self !== 'undefined' && typeof window === 'undefined' && typeof importScripts === 'function') { /* worker context handled by app */ }
