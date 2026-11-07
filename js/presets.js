/* SHEDITHERS — built-in presets. Each stack entry: {id, mix, p} (p = param overrides). */
const BUILTIN_PRESETS = [
  { id: 'terminal', name: 'TERMINAL', desc: 'Phosphor bayer + raster', stack: [
    { id: 'contrast', p: { amt: 30 } }, { id: 'bayer4', p: { pal: 'phosphor', size: 2 } }, { id: 'scanlines', p: { spacing: 3, dark: 55 } }] },
  { id: 'signal', name: 'SIGNAL LOST', desc: 'Torn feed, rolling static', stack: [
    { id: 'rgbsplit', p: { r: 14, b: -14 } }, { id: 'hdisp', p: { amp: 30, wave: 'noise', freq: 9 } }, { id: 'interference', p: { str: 70, noise: 40 } }, { id: 'noise', p: { amount: 18 } }, { id: 'scanlines', p: { dark: 40 } }] },
  { id: 'mono', name: 'MONOCHROME', desc: '1-bit Atkinson', stack: [
    { id: 'grayscale' }, { id: 'contrast', p: { amt: 20 } }, { id: 'atkinson', p: { pal: 'mono' } }] },
  { id: 'crt', name: 'CRT DISPLAY', desc: 'Sub-pixel triads + fringing', stack: [
    { id: 'saturation', p: { amt: 130 } }, { id: 'subpixel', p: { size: 6, grid: 55, glow: 30 } }, { id: 'chroma', p: { str: 18 } }, { id: 'blur', mix: 35, p: { rad: 2 } }] },
  { id: 'news', name: 'NEWSPAPER', desc: 'Coarse newsprint screen', stack: [
    { id: 'contrast', p: { amt: 15 } }, { id: 'newspaper', p: { cell: 6 } }] },
  { id: 'cyber', name: 'CYBERSTATIC', desc: 'Sorted, split, acid-tinted', stack: [
    { id: 'pixelsort', p: { lo: 35, hi: 90 } }, { id: 'rgbsplit', p: { r: 8, b: -8 } }, { id: 'posterize', p: { levels: 6 } }, { id: 'duotone', mix: 70, p: { sh: '#0a0b10', hi: '#d4ff00' } }, { id: 'noise', p: { amount: 12 } }] },
  { id: 'lowres', name: 'LOW RES', desc: 'Chunky pixels, 16 colors', stack: [
    { id: 'pixelate', p: { size: 6 } }, { id: 'fs', p: { pal: 'ega16', size: 6 } }] },
  { id: 'decay', name: 'DIGITAL DECAY', desc: 'Datamosh + block rot', stack: [
    { id: 'datamosh', p: { amount: 50, drift: 22 } }, { id: 'blocks', p: { count: 30 } }, { id: 'distort', p: { slices: 10 } }, { id: 'posterize', p: { levels: 8 } }] },
  { id: 'industrial', name: 'INDUSTRIAL', desc: 'Engraved crosshatch', stack: [
    { id: 'grayscale' }, { id: 'contrast', p: { amt: 25 } }, { id: 'crosshatch', p: { spacing: 5, ink: '#121310', paper: '#b9bdb0' } }] },
  { id: 'vector', name: 'VECTOR', desc: 'Flat posterized cells + ink', stack: [
    { id: 'blur', p: { rad: 2 } }, { id: 'posterize', p: { levels: 4 } }, { id: 'sobel', mix: 55, p: { mode: 'ink', str: 160 } }] },
  { id: 'deep', name: 'DEEP SPACE', desc: 'Blue-noise starfield tones', stack: [
    { id: 'contrast', p: { amt: 20 } }, { id: 'bluenoise', p: { pal: 'deep' } }, { id: 'vignette', p: { amt: 60 } }] },
  { id: 'night', name: 'NIGHT VISION', desc: 'Intensified green phosphor', stack: [
    { id: 'grayscale' }, { id: 'exposure', p: { ev: 1.2 } }, { id: 'duotone', p: { sh: '#020a02', hi: '#8cff6a' } }, { id: 'noise', p: { amount: 22 } }, { id: 'vignette', p: { amt: 70, size: 55 } }, { id: 'scanlines', p: { dark: 30 } }] },
  { id: 'analog', name: 'ANALOG ERROR', desc: 'Worn tape transfer', stack: [
    { id: 'vhs', p: { bleed: 10, track: 60 } }, { id: 'hdisp', p: { amp: 6, wave: 'noise', freq: 20 } }, { id: 'chroma', p: { str: 14 } }] },
  { id: 'printfail', name: 'PRINT FAILURE', desc: 'Misregistered CMYK', stack: [
    { id: 'cmyk', p: { cell: 7, mis: 4 } }, { id: 'stretch', p: { pos: 70, len: 25 } }, { id: 'noise', p: { amount: 10 } }] },
  { id: 'archive', name: 'FUTURE ARCHIVE', desc: 'Amber microfiche', stack: [
    { id: 'grayscale' }, { id: 'dotdither', p: { pal: 'amber', cell: 5 } }, { id: 'rgbsplit', p: { r: 3, b: -3 } }, { id: 'scanlines', p: { spacing: 4, dark: 35 } }] },
  { id: 'laserlove', name: 'LASER LOVE', desc: 'Pink laser sweeping over ink', stack: [
    { id: 'contrast', p: { amt: 25 } }, { id: 'glow', p: { src: 'edges', mode: 'dual', c1: '#ff4fa3', c2: '#d4ff00', radius: 70, streak: 45, laser: true } }, { id: 'scanlines', mix: 40, p: { dark: 30 } }] },
  { id: 'starburst', name: 'STARBURST', desc: 'Highlight bloom + 8-point rays', stack: [
    { id: 'glow', p: { src: 'bright', thr: 170, mode: 'source', rays: '8', rint: 160, streak: 20, laser: false, amb: 100, radius: 50 } }] },
  { id: 'unbecoming', name: 'UNBECOMING', desc: 'Ink-on-paper collage dither', stack: [
    { id: 'grayscale' }, { id: 'contrast', p: { amt: 35 } }, { id: 'bluenoise', p: { pal: 'news', size: 2 } }, { id: 'noise', p: { amount: 6 } }] },
];
