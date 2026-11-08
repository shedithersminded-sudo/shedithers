/* SHEDITHERS — panels: left sidebar tabs, effect stack, canvas pane, palettes, settings. */
let leftTab = 'import';
const pad2 = n => String(n).padStart(2, '0');
const CAT_NAME = Object.fromEntries(E.CATS);
const ART = { collage: 'assets/archive/no-identity.png', reel: 'assets/archive/become-unmarketable.mp4' };
/* plain-words help for every effect: what it does, no tech talk */
const FX_HELP = {
  fs: 'classic dot dither — soft and detailed', atkinson: 'crisp retro-computer dither, bright highlights', diffusion: 'dot dither with different spread styles', bayer: 'grid-pattern dither — pick the grid size',
  bayer2: 'big chunky grid dots', bayer4: 'classic grid-pattern dither', bayer8: 'fine grid-pattern dither', random: 'grainy random-dot dither', bluenoise: 'smooth, even grain dither',
  htdither: 'dither made of angled print lines', dotdither: 'clumped dots like old print', crosshatch: 'pen-drawn crosshatch lines',
  pixelate: 'big chunky pixels', pixelsort: 'drags pixels into long streaks', displace: 'knocks blocks out of place', stretch: 'smears one line across the picture', blocks: 'random broken rectangles', subpixel: 'old screen RGB dots up close',
  rgbsplit: 'pulls red, green and blue apart', chroma: 'rainbow edges like a cheap lens', distort: 'torn, sliced digital look', hdisp: 'wavy sideways shift', vdisp: 'wavy up-and-down shift', interference: 'bad TV signal bands', scanlines: 'old TV screen lines', datamosh: 'smeared broken-video blocks (best on video)', noise: 'static and grain', vhs: 'wobbly old VHS tape',
  posterize: 'fewer colours, flat poster look', threshold: 'pure black + white', duotone: 'two-colour print', tritone: 'three-colour print', invert: 'negative colours', grayscale: 'black and white', contrast: 'more or less punch', brightness: 'lighter or darker', saturation: 'more or less colour', exposure: 'like a camera’s exposure', gamma: 'brighten or darken the mid-tones', sharpen: 'crisper edges', blur: 'soft and blurry', edges: 'turns it into an outline drawing', sobel: 'glowing edge lines', vignette: 'dark corners', hue: 'shifts every colour',
  htcircle: 'round print dots', htsquare: 'square print dots', htline: 'print made of lines', newspaper: 'old newspaper print', cmyk: 'four-colour comic print',
  glow: 'glow, light streaks and star rays', ghost: 'ghostly echoes that drift — makes it move', texture: 'paper, grain, metal or holo surface',
  imglayer: 'put another picture on top', fill: 'colour or gradient over it', text: 'write words on it', bgremove: 'cut out the background',
  boil: 'hand-drawn wobble', shake: 'shaky camera', pulse: 'heartbeat zoom', wave: 'liquid ripple', huecycle: 'colours loop like a rainbow', strobe: 'flashing', flicker: 'random glitch flashes', sparkle: 'twinkling stars', particles: 'falling hearts, stars, snow or rain', rollbars: 'rolling TV bars', dithercrawl: 'moving dither pattern', zoomloop: 'endless zoom tunnel',
  // shedithers originals
  bloodink: 'dither in black, blood red + paper', stardither: 'shading made of tiny stars', heartdither: 'shading made of tiny hearts', scrawl: 'shading made of scribbled pen lines',
  tornpixels: 'chunky pixels with ripped paper edges', inkdrip: 'dark ink runs and drips down', starmosaic: 'your picture rebuilt out of stars',
  tornpaper: 'printed on cream paper, ripped edges', tape: 'masking tape on the corners', xerox: 'cheap photocopy: toner, streaks, grit', crumple: 'balled up and flattened out',
  redroom: 'darkroom red light: ink, blood, paper', lightleak: 'warm film light bleeding in', halo: 'a glowing saint ring',
  searchlight: 'a spotlight sweeping around — makes it move', leakdrift: 'light leaks drifting across — makes it move', flarepass: 'a lens flare streaking past — makes it move',
  eyes: 'little eyes that blink and look around', channelsurf: 'flips looks like changing TV channels', papertear: 'a ripped edge sweeps across', stopmotion: 'jumpy cut-paper animation', starrays: 'spinning rays bursting from behind',
};
const fxHelp = def => FX_HELP[def.id] || def.desc || '';
const fxMoves = def => def.cat === 'gif' || def.id === 'ghost' || !!def.moves;
const ORIGINALS = new Set(['bloodink', 'stardither', 'heartdither', 'scrawl', 'tornpixels', 'inkdrip', 'starmosaic', 'tornpaper', 'tape', 'xerox', 'crumple', 'redroom', 'lightleak', 'halo', 'searchlight', 'leakdrift', 'flarepass', 'eyes', 'channelsurf', 'papertear', 'stopmotion', 'starrays']);
/* the effects library, sorted by what they do to your work. art = the artwork whose scrap sits behind that section's banner */
const FX_SECTIONS = [
  { key: 'picture', star: '★', art: 'no-identity', title: 'PICTURE LOOKS', note: 'restyle it. stays a still picture.', groups: [['dither', 'Dithering', 'dots, stars, hearts + patterns'], ['halftone', 'Print', 'halftone dots + newspaper lines'], ['pixel', 'Pixel', 'blocks, drips + mosaics'], ['glitch', 'Glitch', 'broken signal, VHS, static'], ['image', 'Colour + tone', 'fix it, push it, recolour it'], ['texture', 'Texture', 'paper, tape, photocopy + grit']], only: id => !fxMoves(E.MAP[id]) },
  { key: 'motion', star: '▶', art: 'to-see-and-be-seen', title: 'MAKE IT MOVE', note: 'turns your picture into a looping GIF / video. export it as GIF or MP4.', groups: [['gif', 'Loops', 'eyes, sparkles, shakes + tears'], ['light', 'Moving light', 'spotlights, drifting leaks, flares']], only: id => fxMoves(E.MAP[id]) },
  { key: 'layers', star: '✚', art: 'when-you-rain', title: 'ADD ON TOP', note: 'text, pictures, colour, light and cut-outs.', groups: [['layer', 'Layers', 'text, pictures, colour + cut-outs'], ['light', 'Light', 'glows, red rooms, leaks + halos']], only: id => !fxMoves(E.MAP[id]) },
];
const GROUP_OPEN = (() => { try { return JSON.parse(localStorage.getItem('shd.fxOpen') || '{"picture:dither":true}'); } catch (_) { return { 'picture:dither': true }; } })();
const saveGroupOpen = () => { try { localStorage.setItem('shd.fxOpen', JSON.stringify(GROUP_OPEN)); } catch (_) { } };

function renderAll() { renderLeft(); renderStack(); renderCanvasPane(); layoutStage(); $('#roFx').textContent = pad2(S.stack.filter(f => f.on).length); }

/* ---------- LEFT ---------- */
$$('#rail button').forEach(b => b.onclick = () => { leftTab = b.dataset.tab; $$('#rail button').forEach(x => x.classList.toggle('on', x === b)); renderLeft(); });
function renderLeft() {
  const body = $('#leftBody'); body.innerHTML = ''; S.override = null;
  const titles = { import: 'IMPORT MEDIA', library: 'IMAGE LIBRARY', effects: 'EFFECTS LIBRARY', presets: 'PRESETS', projects: 'RECENT PROJECTS', history: 'EXPORT HISTORY' };
  $('#leftTitle').textContent = titles[leftTab]; $('#leftMeta').textContent = '';
  ({ import: leftImport, library: leftLibrary, effects: leftEffects, presets: leftPresets, projects: leftProjects, history: leftHistory })[leftTab](body);
  if (typeof stagger === 'function') setTimeout(() => stagger(body), 0);
}
function sec(title, ...kids) { return h('div', { class: 'sec' }, h('div', { class: 'sec-t' }, ...[].concat(title)), ...kids); }

async function loadArt(kind) {
  try {
    const r = await fetch(ART[kind]); if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.blob(); const f = new File([b], kind === 'reel' ? '01M.mp4' : 'SHEDITHERS_COLLAGE.png', { type: b.type || (kind === 'reel' ? 'video/mp4' : 'image/png') });
    await importFiles([f]);
  } catch (e) { toast('Artist files need the local server — run start.bat, then open http://localhost:8737 (' + e.message + ')', 'err', 8000); }
}
function leftImport(body) {
  const dz = h('div', { class: 'dropzone', onclick: openFile, html: '<svg><use href="#i-import"/></svg><b>DROP FILES HERE</b><span>OR CLICK TO BROWSE · CTRL+V TO PASTE</span>' });
  ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, () => dz.classList.add('over'))); ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('over')));
  body.append(
    sec('SOURCE', dz),
    archiveSection(),
    sec('PROJECT FILES', h('div', { class: 'btnrow' }, h('button', { class: 'btn sm', onclick: () => pickJSON() }, 'OPEN .JSON'), h('button', { class: 'btn sm', onclick: exportProjectFile, disabled: !S.media }, 'SAVE AS FILE'))),
    sec('FORMATS', h('div', { class: 'note', html: '<b>IMAGE</b> PNG · JPG · WEBP · TIFF (8-bit, none/LZW/PackBits)<br><b>VIDEO</b> MP4 · WEBM · MOV (codec support depends on browser)<br><b>EXPORT</b> PNG · JPG · WEBP · MP4 (H.264) · WEBM (VP9/VP8)<br><br>Drag files anywhere in the window.' })),
  );
}
const batchSel = new Set();
function leftLibrary(body) {
  $('#leftMeta').textContent = pad2(S.library.length) + ' ITEMS';
  if (!S.library.length) { body.append(h('div', { class: 'empty-note' }, 'LIBRARY EMPTY', h('br'), h('br'), h('button', { class: 'btn sm', onclick: openFile }, 'IMPORT'))); return; }
  const imgs = S.library.filter(i => i.type === 'image');
  body.append(h('div', { class: 'btnrow', style: { marginBottom: '10px' } },
    h('button', { class: 'btn sm', onclick: () => { if (batchSel.size === imgs.length) batchSel.clear(); else imgs.forEach(i => batchSel.add(i.id)); renderLeft(); } }, batchSel.size === imgs.length && imgs.length ? 'SELECT NONE' : 'SELECT ALL'),
    h('button', { class: 'btn sm primary', disabled: !batchSel.size, onclick: () => openBatch([...batchSel].map(id => S.library.find(i => i.id === id)).filter(Boolean)) }, `BATCH (${batchSel.size})`)));
  const g = h('div', { class: 'lib' });
  for (const it of S.library) {
    const chk = it.type === 'image' ? h('div', { class: 'chk' + (batchSel.has(it.id) ? ' on' : ''), 'data-tip': 'Select for batch processing', onclick: e => { e.stopPropagation(); batchSel.has(it.id) ? batchSel.delete(it.id) : batchSel.add(it.id); renderLeft(); } }, batchSel.has(it.id) ? '✓' : '') : null;
    const el = h('div', { class: 'lib-item' + (S.media && S.media.id === it.id ? ' active' : ''), style: { backgroundImage: `url(${it.thumb})` }, 'data-tip': `${it.name} · ${it.w}×${it.h}`, onclick: () => openLibItem(it) },
      h('span', { class: 'kind' }, it.type === 'video' ? 'VID' : 'IMG'), chk, h('span', { class: 'tag' }, it.name));
    el.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e.clientX, e.clientY, [{ label: 'Open', act: () => openLibItem(it) }, { label: 'Toggle batch select', dis: it.type !== 'image', act: () => { batchSel.has(it.id) ? batchSel.delete(it.id) : batchSel.add(it.id); renderLeft(); } }, '-', { label: 'Remove from library', danger: true, act: () => { S.library = S.library.filter(x => x !== it); batchSel.delete(it.id); DB.del('media', it.id).catch(() => { }); renderLeft(); toast('Removed from library', 'info'); } }]); });
    g.append(el);
  }
  body.append(g);
}
async function openLibItem(it) { if (S.media && S.media.id === it.id) return; try { await setMedia(it); } catch (e) { toast(e.message, 'err'); } }
function leftEffects(body) {
  $('#leftMeta').textContent = E.EFFECTS.length + ' MODULES';
  const q = h('input', { class: 'search', placeholder: 'SEARCH EFFECTS… (try “vhs”, “stars”, “dots”)', spellcheck: false });
  const list = h('div', { class: 'fx-lib' });
  const draw = () => {
    list.innerHTML = ''; const s = q.value.trim().toLowerCase(); let n = 0;
    for (const sec of FX_SECTIONS) {
      const groups = [];
      for (const [cat, gname, gwhat] of sec.groups) {
        const items = E.EFFECTS.filter(e => e.cat === cat && (sec.only ? sec.only(e.id) : true) && (!s || (e.name + ' ' + fxHelp(e) + ' ' + e.desc + ' ' + gname + ' ' + gwhat + ' ' + sec.title).toLowerCase().includes(s)));
        if (!items.length) continue;
        const key = sec.key + ':' + cat, open = !!s || !!GROUP_OPEN[key], fresh = items.filter(e => ORIGINALS.has(e.id)).length;
        const grp = h('div', { class: 'fx-cat cat-' + cat + (open ? ' open' : '') });
        const head = h('button', { type: 'button', class: 'fx-cat-h', 'aria-expanded': String(open), onclick: () => { const o = !grp.classList.contains('open'); grp.classList.toggle('open', o); head.setAttribute('aria-expanded', o); if (!s) { GROUP_OPEN[key] = o; saveGroupOpen(); } } },
          h('i', { class: 'chev' }, '▸'), h('span', { class: 'gt' }, h('b', null, gname), h('small', null, gwhat)), fresh ? h('em', { class: 'new' }, fresh + ' new') : null, h('span', { class: 'cnt' }, pad2(items.length)));
        grp.append(head, h('div', { class: 'fx-cat-b' }, items.map(e => {
          const it = h('div', { class: 'fx-item' + (fxMoves(e) ? ' moves' : '') + (ORIGINALS.has(e.id) ? ' orig' : ''), draggable: true, 'data-tip': fxMoves(e) ? 'Click to add — this makes your picture move (GIF / video)' : 'Click to add · or drag into your layers', onclick: () => addFx(e.id) },
            h('span', { class: 'ix' }, pad2(++n)), h('span', { class: 'nm' }, e.name, ORIGINALS.has(e.id) ? h('i', { class: 'orig-tag' }, '★ shedithers original') : null, h('span', { class: 'ds' }, fxHelp(e))), h('span', { class: 'add' }, fxMoves(e) ? '▶ add' : '+ add'));
          it.addEventListener('dragstart', ev => { ev.dataTransfer.setData('shd/add', e.id); ev.dataTransfer.effectAllowed = 'copy'; });
          return it;
        })));
        groups.push(grp);
      }
      const artUrl = (() => { const a = typeof artById === 'function' && artById(sec.art); return a ? `url('${new URL(a.src, location.href).href}')` : 'none'; })();
      if (groups.length) list.append(h('section', { class: 'fx-sec sec-' + sec.key }, h('header', { style: `--sec-art:${artUrl}` }, h('i', null, sec.star), h('div', null, h('b', null, sec.title), h('small', null, sec.note))), ...groups));
    }
    if (!n) list.append(h('div', { class: 'empty-note' }, 'nothing matches that ★ try another word'));
  };
  q.addEventListener('input', draw); body.append(q, list); draw(); setTimeout(() => q.focus(), 10);
}

/* presets */
const thumbCache = new Map(); let thumbGen = 0;
function thumbSource() {
  const c = h_canvas(160, 120), cx = c.getContext('2d');
  if (S.media && cvB.width) { const s = Math.max(160 / cvB.width, 120 / cvB.height); cx.drawImage(cvB, (160 - cvB.width * s) / 2, (120 - cvB.height * s) / 2, cvB.width * s, cvB.height * s); return { c, key: S.media.id + JSON.stringify(S.source) + (isVideo() ? Math.round(curTime()) : '') }; }
  const art = null; if (art) { const s = Math.max(160 / art.naturalWidth, 120 / art.naturalHeight); cx.drawImage(art, (160 - art.naturalWidth * s) / 2, (120 - art.naturalHeight * s) / 2, art.naturalWidth * s, art.naturalHeight * s); return { c, key: 'art' }; }
  const g = cx.createLinearGradient(0, 0, 160, 120); g.addColorStop(0, '#203050'); g.addColorStop(.5, '#d07a3a'); g.addColorStop(1, '#f0e8c0'); cx.fillStyle = g; cx.fillRect(0, 0, 160, 120); cx.fillStyle = '#111'; cx.beginPath(); cx.arc(80, 60, 30, 0, 7); cx.fill(); return { c, key: 'grad' };
}
function leftPresets(body) {
  const all = [...S.presets, ...BUILTIN_PRESETS];
  $('#leftMeta').textContent = `${pad2(BUILTIN_PRESETS.length)} SYS · ${pad2(S.presets.length)} USER`;
  body.append(h('div', { class: 'btnrow', style: { marginBottom: '10px' } },
    h('button', { class: 'btn sm primary', onclick: saveStackAsPreset }, 'SAVE STACK'),
    h('button', { class: 'btn sm', onclick: () => pickJSON(o => importPresets(o)) }, 'IMPORT'),
    h('button', { class: 'btn sm', disabled: !S.presets.length, onclick: () => exportPresets() }, 'EXPORT')));
  body.append(h('div', { class: 'note', style: { marginBottom: '10px' } }, 'HOVER TO PREVIEW · CLICK TO APPLY · SHIFT+CLICK TO APPEND · RIGHT-CLICK FOR MORE'));
  const g = h('div', { class: 'presets' }); const jobs = [];
  for (const ps of all) {
    const cv = h('canvas', { width: 160, height: 120 });
    const card = h('div', { class: 'preset loading' }, cv, ps.custom ? h('span', { class: 'cust' }, 'USER') : null, h('div', { class: 'pn' }, h('b', null, ps.name), h('span', null, ps.desc || '')));
    card.onclick = e => applyPreset(ps, e.shiftKey);
    card.onmouseenter = () => { if (!S.media) return; S.override = presetToStack(ps); requestRender(); };
    card.onmouseleave = () => { if (!S.override) return; S.override = null; requestRender(); };
    card.oncontextmenu = e => {
      e.preventDefault();
      const items = [{ title: ps.name }, { label: 'Apply', act: () => applyPreset(ps) }, { label: 'Append to stack', act: () => applyPreset(ps, true) }, { label: 'Edit (load into stack)', act: () => { applyPreset(ps); toast(ps.custom ? 'Adjust the stack, then SAVE STACK with the same name to overwrite' : 'Adjust the stack, then SAVE STACK to keep it as your own preset', 'info', 5000); } }, { label: 'Export JSON', act: () => exportPresets([ps]) }];
      if (ps.custom) items.push('-', { label: 'Overwrite with current stack', act: () => { if (!S.stack.length) return toast('Stack is empty', 'err'); ps.stack = stackToPreset(S.stack); savePresets(); renderLeft(); toast('Preset updated'); } }, { label: 'Rename', act: () => promptModal('RENAME PRESET', ps.name, n => { ps.name = n.toUpperCase(); savePresets(); renderLeft(); }) }, { label: 'Delete preset', danger: true, act: () => confirmModal('DELETE PRESET', `Delete ${ps.name}? This cannot be undone.`, () => { S.presets = S.presets.filter(x => x !== ps); savePresets(); renderLeft(); toast('Preset deleted', 'info'); }, 'DELETE') });
      showCtx(e.clientX, e.clientY, items);
    };
    g.append(card); jobs.push([ps, cv, card]);
  }
  body.append(g); genThumbs(jobs);
}
async function genThumbs(jobs) {
  const gen = ++thumbGen, src = thumbSource();
  for (const [ps, cv, card] of jobs) {
    if (gen !== thumbGen) return;
    const key = src.key + '|' + JSON.stringify(ps.stack), cx = cv.getContext('2d');
    let bmp = thumbCache.get(key);
    if (!bmp) {
      try {
        const id = src.c.getContext('2d').getImageData(0, 0, 160, 120);
        const st = presetToStack(ps).map(f => ({ id: f.id, mix: f.mix, p: resolveP(f, 0), on: f.on })).filter(f => f.on);
        const m = await BG.run({ buf: id.data.buffer, w: 160, h: 120, stack: st, ctx: { S: 160 / 900, t: 0, frame: 0 } }, [id.data.buffer]);
        bmp = new ImageData(new Uint8ClampedArray(m.buf), 160, 120); thumbCache.set(key, bmp);
      } catch (e) { console.warn(e); continue; }
    }
    cx.putImageData(bmp, 0, 0); card.classList.remove('loading');
  }
}
async function leftProjects(body) {
  body.append(h('div', { class: 'btnrow', style: { marginBottom: '10px' } },
    h('button', { class: 'btn sm primary', onclick: () => saveProject(false), disabled: !S.media }, 'SAVE CURRENT'),
    h('button', { class: 'btn sm', onclick: () => pickJSON() }, 'OPEN FILE'),
    h('button', { class: 'btn sm', onclick: newProject }, 'NEW')));
  let list = [];
  try { list = (await DB.all('projects')).sort((a, b) => b.updated - a.updated); } catch (e) { body.append(h('div', { class: 'empty-note' }, 'STORAGE UNAVAILABLE')); return; }
  if (leftTab !== 'projects') return;
  $('#leftMeta').textContent = pad2(list.length) + ' SAVED';
  if (!list.length) { body.append(h('div', { class: 'empty-note' }, 'NO SAVED PROJECTS', h('br'), 'AUTOSAVE STORES YOUR WORK HERE')); return; }
  for (const p of list) {
    const it = h('div', { class: 'list-item' + (p.id === S.pid ? ' active' : ''), onclick: () => openProject(p.id) },
      h('div', { class: 'th', style: { backgroundImage: `url(${p.thumb})` } }),
      h('div', { class: 'meta' }, h('b', null, p.name), h('span', null, `${p.media.type.toUpperCase()} · ${p.state.stack.length} FX`), h('span', null, fmtDate(p.updated))),
      h('button', { class: 'ib', 'data-tip': 'Delete project', html: '<svg><use href="#i-trash"/></svg>', onclick: e => { e.stopPropagation(); confirmModal('DELETE PROJECT', `Permanently delete ${p.name} from this browser? This cannot be undone.`, async () => { await DB.del('projects', p.id); renderLeft(); toast('Project deleted', 'info'); }, 'DELETE'); } }));
    it.oncontextmenu = e => { e.preventDefault(); showCtx(e.clientX, e.clientY, [{ label: 'Open', act: () => openProject(p.id) }, { label: 'Rename', act: () => promptModal('RENAME PROJECT', p.name, async n => { p.name = n.toUpperCase(); await DB.put('projects', p); if (p.id === S.pid) { S.name = p.name; $('#projName').value = p.name; } renderLeft(); }) }, { label: 'Duplicate', act: async () => { await DB.put('projects', Object.assign({}, p, { id: uid('p'), name: p.name + '_COPY', updated: Date.now() })); renderLeft(); } }, '-', { label: 'Delete', danger: true, act: () => confirmModal('DELETE PROJECT', `Permanently delete ${p.name}?`, async () => { await DB.del('projects', p.id); renderLeft(); }, 'DELETE') }]); };
    body.append(it);
  }
}
function newProject() {
  if (!S.media) return toast('Already empty', 'info');
  S.pid = uid('p'); S.name = 'UNTITLED_' + new Date().toTimeString().slice(0, 5).replace(':', ''); S.stack = []; S.sel = null; $('#projName').value = S.name; H.reset(); renderAll(); requestRender(); toast('New project started on current media');
}
function leftHistory(body) {
  $('#leftMeta').textContent = pad2(S.exports.length) + ' EXPORTS';
  if (!S.exports.length) { body.append(h('div', { class: 'empty-note' }, 'NO EXPORTS YET')); return; }
  body.append(h('div', { class: 'btnrow', style: { marginBottom: '10px' } }, h('button', { class: 'btn sm danger', onclick: () => confirmModal('CLEAR HISTORY', 'Clear the export history list? Exported files are not affected.', () => { S.exports = []; LS.set('shd.exports', []); renderLeft(); }) }, 'CLEAR HISTORY')));
  for (const x of S.exports) {
    body.append(h('div', { class: 'list-item', 'data-tip': 'Click to re-apply this effect stack' , onclick: () => { if (!x.stack) return; S.stack = presetToStack({ stack: x.stack }); changed(true); toast('Stack from export re-applied'); } },
      h('div', { class: 'th', style: { backgroundImage: `url(${x.thumb || ''})` } }),
      h('div', { class: 'meta' }, h('b', null, x.file), h('span', null, `${x.fmt} · ${x.w}×${x.h} · ${fmtBytes(x.size)}`), h('span', null, fmtDate(x.at)))));
  }
}
function logExport(rec) { const t = cvA.width ? (() => { const c = h_canvas(80, Math.round(80 * cvA.height / cvA.width) || 60); c.getContext('2d').drawImage(cvA, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6); })() : ''; S.exports.unshift(Object.assign({ at: Date.now(), thumb: t, stack: stackToPreset(S.stack) }, rec)); S.exports = S.exports.slice(0, 60); LS.set('shd.exports', S.exports); if (leftTab === 'history') renderLeft(); if (typeof tipNudge === 'function') tipNudge(rec); if (window.shdCount) { const ext = (String(rec && rec.file || '').match(/\.([a-z0-9]+)$/i) || [])[1] || 'file'; window.shdCount('made-art/' + ext.toLowerCase(), 'Someone made art in the Dither Lab (' + ext.toUpperCase() + ')'); } }

/* ---------- STACK ---------- */
let SYNC = [];
$$('.rtabs button').forEach(b => b.onclick = () => { $$('.rtabs button').forEach(x => x.classList.toggle('on', x === b)); $('#rStack').classList.toggle('hidden', b.dataset.rt !== 'stack'); $('#rCanvas').classList.toggle('hidden', b.dataset.rt !== 'canvas'); if (b.dataset.rt === 'canvas') renderCanvasPane(); });
$('#stAdd').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); const items = []; for (const [cat, cn] of E.CATS) { items.push({ title: cn.toUpperCase() }); } showAddMenu(r.left - 160, r.bottom + 4); };
function showAddMenu(x, y) { leftTab = 'effects'; $$('#rail button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'effects')); renderLeft(); toast('Pick an effect from the library (click or drag)', 'info', 1800); }
$('#stSave').onclick = saveStackAsPreset;
$('#stReset').onclick = () => { if (!S.stack.length) return; S.stack.forEach(f => { f.p = E.defaults(E.MAP[f.id]); f.mix = 100; f.keys = {}; }); changed(true); toast('All effects reset to defaults', 'info'); };
$('#stClear').onclick = () => { if (!S.stack.length) return; confirmModal('CLEAR STACK', `Remove all ${S.stack.length} effects? (Undo with Ctrl+Z)`, () => { S.stack = []; S.sel = null; changed(true); }, 'CLEAR'); };
const list = $('#stackList');
let dropAt = -1;
function dropIndex(y) { const cards = $$('.fx:not(.pinned)', list); for (let i = 0; i < cards.length; i++) { const r = cards[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; } return cards.length; }
function showInd(i) { $$('.drop-ind', list).forEach(x => x.remove()); if (i < 0) return; const cards = $$('.fx:not(.pinned)', list), ind = h('div', { class: 'drop-ind' }); if (i < cards.length) list.insertBefore(ind, cards[i]); else list.append(ind); }
list.addEventListener('dragover', e => { const t = e.dataTransfer.types; if (!t.includes('shd/fx') && !t.includes('shd/add')) return; e.preventDefault(); const i = dropIndex(e.clientY); if (i !== dropAt) { dropAt = i; showInd(i); } });
list.addEventListener('dragleave', e => { if (!list.contains(e.relatedTarget)) { dropAt = -1; showInd(-1); } });
list.addEventListener('drop', e => { e.preventDefault(); const i = dropIndex(e.clientY); showInd(-1); dropAt = -1; const u = e.dataTransfer.getData('shd/fx'), a = e.dataTransfer.getData('shd/add'); if (u) moveFx(u, i); else if (a) addFx(a, i); });

function renderStack() {
  SYNC = []; list.innerHTML = ''; $('#stackCount').textContent = pad2(S.stack.length);
  if (!S.stack.length) { list.append(h('div', { class: 'stack-empty' }, h('b', null, 'STACK EMPTY'), 'ADD EFFECTS FROM THE LIBRARY', h('br'), 'OR APPLY A PRESET', h('br'), h('br'), h('button', { class: 'btn sm', onclick: showAddMenu }, '+ ADD EFFECT'))); return; }
  // the effect you're working on sits on top; the full list below keeps the real process order
  const sel = S.stack.find(f => f.uid === S.sel);
  if (sel && sel.open === undefined) sel.open = true;
  if (sel) {
    const si = S.stack.indexOf(sel), def = E.MAP[sel.id];
    list.append(h('div', { class: 'now-editing' }, h('i', null, '★'), h('b', null, 'NOW EDITING'), h('span', null, `layer ${pad2(si + 1)} of ${pad2(S.stack.length)}`)));
    const pin = fxCard(sel, si, true); pin.classList.add('pinned'); list.append(pin);
    list.append(h('div', { class: 'all-layers' }, h('b', null, 'ALL LAYERS'), h('span', null, 'top runs first · drag ⠿ to reorder')));
  }
  S.stack.forEach((f, i) => list.append(f === sel ? h('div', { class: 'fx fx-ph', 'data-uid': f.uid, onclick: () => { list.scrollTo({ top: 0, behavior: 'smooth' }); } }, h('span', { class: 'fx-idx' }, pad2(i + 1)), h('b', null, '★ ' + E.MAP[f.id].name), h('small', null, 'editing ↑')) : fxCard(f, i)));
}
const ico = (id, tip, fn) => h('button', { class: 'ib', 'data-tip': tip, html: `<svg><use href="#i-${id}"/></svg>`, onclick: e => { e.stopPropagation(); fn(e); } });
function fxMenu(f, x, y) {
  const i = S.stack.indexOf(f);
  showCtx(x, y, [{ title: E.MAP[f.id].name.toUpperCase() }, { label: f.on ? 'Disable' : 'Enable', kbd: 'H', act: () => { f.on = !f.on; changed(true); } }, { label: 'Duplicate', kbd: 'Ctrl+D', act: () => dupFx(f.uid) }, { label: 'Copy settings', kbd: 'Ctrl+C', act: () => copyFx(f) }, { label: 'Paste settings', kbd: 'Ctrl+V', dis: !S.clip, act: () => pasteFx(f) }, { label: 'Randomize', kbd: 'R', act: () => { randomizeFx(f); changed(true); } }, { label: 'Reset to defaults', act: () => resetFx(f.uid) }, { label: 'Clear keyframes', dis: !Object.keys(f.keys || {}).length, act: () => { f.keys = {}; changed(true); } }, '-', { label: 'Move to top', dis: i === 0, act: () => moveFx(f.uid, 0) }, { label: 'Move up', kbd: 'Alt+↑', dis: i === 0, act: () => moveFx(f.uid, i - 1) }, { label: 'Move down', kbd: 'Alt+↓', dis: i === S.stack.length - 1, act: () => moveFx(f.uid, i + 2) }, { label: 'Move to bottom', dis: i === S.stack.length - 1, act: () => moveFx(f.uid, S.stack.length) }, '-', { label: 'Remove', kbd: 'Del', danger: true, act: () => removeFx(f.uid) }]);
}
function fxCard(f, i, pinned) {
  const def = E.MAP[f.id], card = h('div', { class: 'fx' + (f.uid === S.sel ? ' sel' : '') + (f.on ? '' : ' off'), 'data-uid': f.uid });
  const grip = h('div', { class: 'grip', 'data-tip': 'Drag to reorder', html: '<svg><use href="#i-grip"/></svg>' });
  grip.addEventListener('mousedown', () => card.draggable = true);
  card.addEventListener('dragstart', e => { e.dataTransfer.setData('shd/fx', f.uid); e.dataTransfer.effectAllowed = 'move'; card.classList.add('dragging'); });
  card.addEventListener('dragend', () => { card.draggable = false; card.classList.remove('dragging'); showInd(-1); });
  const sw = h('div', { class: 'sw' + (f.on ? ' on' : ''), 'data-tip': 'Enable / disable · H', onclick: e => { e.stopPropagation(); f.on = !f.on; changed(true); } });
  const head = h('div', { class: 'fx-h', onclick: () => { if (S.sel === f.uid) f.open = !f.open; else { f.open = true; list.scrollTo({ top: 0, behavior: 'smooth' }); } S.sel = f.uid; renderStack(); if (typeof updBrushTarget === 'function') { updBrushTarget(); drawMaskOverlay(); tlLanes(); } } },
    grip, h('span', { class: 'fx-idx' }, pad2(i + 1)), sw,
    h('div', { class: 'fx-name' }, def.name, (f.mask || (f.blend && f.blend !== 'normal')) ? h('span', { class: 'fx-badges' }, f.blend && f.blend !== 'normal' ? h('i', { class: 'b' }, f.blend.toUpperCase()) : null, f.mask ? h('i', null, f.maskOn === false ? 'MASK OFF' : 'MASK') : null) : null, h('small', null, fxMoves(def) ? h('i', { class: 'mv-badge' }, '▶ MOVES') : null, `${fxHelp(def)} · ${Math.round(valAt(f, 'mix'))}%`)),
    ico('up', 'Move up', () => moveFx(f.uid, i - 1)), ico('down', 'Move down', () => moveFx(f.uid, i + 2)),
    ico('dup', 'Duplicate', () => dupFx(f.uid)), ico('dots', 'More actions', e => { const r = e.currentTarget.getBoundingClientRect(); fxMenu(f, r.left - 150, r.bottom + 2); }), ico('x', 'Remove', () => removeFx(f.uid)));
  head.addEventListener('contextmenu', e => { e.preventDefault(); S.sel = f.uid; fxMenu(f, e.clientX, e.clientY); });
  card.append(head);
  if (f.open) {
    const b = h('div', { class: 'fx-b' });
    b.append(h('p', { class: 'fx-help' }, h('b', null, 'what it does: '), fxHelp(def) + '.', fxMoves(def) ? h('span', null, ' this makes your picture move — export it as a GIF or video.') : null, h('span', { class: 'fx-help-2' }, ' intensity = how strong it is. blend = how it mixes with the layers under it.')));
    b.append(rangeCtl(f, { k: 'mix', l: 'Intensity', min: 0, max: 100, step: 1, def: 100, u: '%' }, true));
    b.append(layerRow(f));
    def.params.forEach(q => b.append(paramCtl(f, q)));
    b.append(h('div', { class: 'fx-f' },
      h('button', { class: 'tbtn', 'data-tip': 'Reset this effect', onclick: () => resetFx(f.uid) }, 'RESET'),
      h('button', { class: 'tbtn', 'data-tip': 'Randomize settings · R', onclick: () => { randomizeFx(f); changed(true); } }, 'RANDOM'),
      h('button', { class: 'tbtn', 'data-tip': 'Copy settings · Ctrl+C', onclick: () => copyFx(f) }, 'COPY'),
      h('button', { class: 'tbtn', 'data-tip': 'Paste settings · Ctrl+V', onclick: () => pasteFx(f) }, 'PASTE')));
    card.append(b);
  }
  return card;
}
const BLEND_LIST = [['normal', 'NORMAL'], ['screen', 'SCREEN'], ['multiply', 'MULTIPLY'], ['overlay', 'OVERLAY'], ['softlight', 'SOFT LIGHT'], ['hardlight', 'HARD LIGHT'], ['add', 'ADD'], ['subtract', 'SUBTRACT'], ['difference', 'DIFFERENCE'], ['lighten', 'LIGHTEN'], ['darken', 'DARKEN'], ['dodge', 'COLOR DODGE'], ['burn', 'COLOR BURN']];
function layerRow(f) {
  const wrap = h('div');
  const sel = h('select', { 'data-tip': 'Blend mode: how this layer mixes with the layers beneath', onchange: e => { f.blend = e.target.value; changed(true); } }, BLEND_LIST.map(([v, l]) => h('option', { value: v, selected: (f.blend || 'normal') === v }, l)));
  const paint = h('button', { class: 'tbtn pink', 'data-tip': 'Paint where this layer applies (B)', onclick: () => { S.sel = f.uid; renderStack(); setTool('brush'); } }, f.mask ? '✎ EDIT MASK' : '✎ PAINT MASK');
  wrap.append(h('div', { class: 'layer-row' }, h('span', { class: 'lbl' }, 'BLEND'), sel, paint));
  if (f.mask) {
    const th = h('canvas', { width: 68, height: 52 }); const m = maskEntry(f); if (m) th.getContext('2d').drawImage(m.cv, 0, 0, 68, 52);
    wrap.append(h('div', { class: 'mask-chip' }, th, h('span', null, f.maskOn === false ? 'MASK · OFF' : 'MASK · ON'),
      h('button', { class: 'tbtn', 'data-tip': 'Enable / disable mask', onclick: () => { f.maskOn = f.maskOn === false; changed(true); } }, f.maskOn === false ? 'ON' : 'OFF'),
      h('button', { class: 'tbtn', 'data-tip': 'Invert mask', onclick: () => maskOp(f, 'invert') }, 'INV'),
      h('button', { class: 'tbtn', 'data-tip': 'Delete mask (effect everywhere)', onclick: () => deleteMask(f) }, '✕')));
  }
  return wrap;
}
function paramCtl(f, q) {
  if (q.t === 'txt') {
    const ta = h('textarea', { class: 'inp txt-edit', rows: 3, spellcheck: false, value: f.p[q.k] || '' });
    ta.addEventListener('input', () => { f.p[q.k] = ta.value; changed(false, true); });
    ta.addEventListener('change', () => H.commit());
    ta.addEventListener('keydown', e => e.stopPropagation());
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l + ' — Enter for new line')), ta);
  }
  if (q.t === 'tex') return texPicker(f, q);
  if (q.t === 'img' && f.id === 'texture' && f.p.type !== 'custom') return h('div');
  if (q.t === 'img') {
    const imgs = S.library.filter(x => x.type === 'image');
    const sel = h('select', { onchange: e => { if (e.target.value === '__new') { _imgPick.fx = f; $('#imgLayerIn').click(); e.target.value = f.p.img || ''; return; } f.p.img = e.target.value; changed(true); } },
      h('option', { value: '' }, '— CHOOSE IMAGE —'), imgs.map(it => h('option', { value: it.id, selected: f.p.img === it.id }, it.name)), h('option', { value: '__new' }, '+ IMPORT IMAGE…'));
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l)), h('div', { class: 'img-pick' }, sel));
  }
  if (q.t === 'r') return rangeCtl(f, q, false);
  const set = (v, structural) => { f.p[q.k] = v; changed(!!structural); };
  if (q.t === 's') {
    if (q.o.length <= 4) { const segs = h('div', { class: 'segs' }, q.o.map(([v, l]) => h('button', { class: String(f.p[q.k]) === String(v) ? 'on' : '', onclick: e => { set(v); $$('button', e.currentTarget.parentNode).forEach(x => x.classList.toggle('on', x === e.currentTarget)); } }, l))); return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l)), segs); }
    const sel = h('select', { onchange: e => set(e.target.value) }, q.o.map(([v, l]) => h('option', { value: v, selected: String(f.p[q.k]) === String(v) }, l)));
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l)), sel);
  }
  if (q.t === 'b') { const sw = h('div', { class: 'sw' + (f.p[q.k] ? ' on' : '') }); return h('div', { class: 'ctl-bool', onclick: () => { f.p[q.k] = !f.p[q.k]; sw.classList.toggle('on', f.p[q.k]); changed(false); } }, h('span', null, q.l), sw); }
  if (q.t === 'c') {
    const hx = h('input', { class: 'hex', value: f.p[q.k], maxlength: 7, spellcheck: false }), ci = h('input', { type: 'color', value: f.p[q.k] });
    ci.addEventListener('input', () => { f.p[q.k] = ci.value; hx.value = ci.value; changed(false, true); }); ci.addEventListener('change', () => H.commit());
    hx.addEventListener('change', () => { let v = hx.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) { f.p[q.k] = v; ci.value = v; changed(false); } else hx.value = f.p[q.k]; });
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l)), h('div', { class: 'ctl-color' }, ci, hx));
  }
  if (q.t === 'p') {
    const v = f.p[q.k];
    const sel = h('select', { onchange: e => set(e.target.value, true) },
      h('optgroup', { label: 'MODES' }, [['mono', '1-BIT MONO'], ['gray', 'GRAYSCALE (N COLORS)'], ['rgb', 'RGB CUBE (N COLORS)']].map(([a, b]) => h('option', { value: a, selected: v === a }, b))),
      h('optgroup', { label: 'SYSTEM PALETTES' }, Object.entries(E.PALETTES).filter(([k]) => k !== 'mono').map(([k, p]) => h('option', { value: k, selected: v === k }, p.n))),
      S.palettes.length ? h('optgroup', { label: 'CUSTOM' }, S.palettes.map(p => h('option', { value: p.id, selected: v === p.id }, p.n))) : null);
    const cols = v === 'gray' ? Array.from({ length: Math.min(16, f.p.colors || 2) }, (_, i, a) => { const g = Math.round(i / (a.length - 1) * 255); return `rgb(${g},${g},${g})`; }) : v === 'rgb' ? ['#000', '#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#fff'] : (palColors(v) || (E.PALETTES[v] || E.PALETTES.mono).c);
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, q.l)), h('div', { class: 'pal-row' }, sel, h('button', { class: 'tbtn', 'data-tip': 'Create / edit custom palettes', onclick: () => openPalettes(f, q.k) }, 'EDIT')), h('div', { class: 'pal-strip' }, cols.map(c => h('i', { style: { background: c } }))));
  }
  return h('div');
}
const fmtV = (v, step) => { const dec = step >= 1 ? 0 : step >= 0.1 ? 1 : 2; return (+v).toFixed(dec); };
const KTOL = () => 0.5 / S.video.fps;
function findKey(ks, t) { return ks ? ks.findIndex(k => Math.abs(k.t - t) < KTOL()) : -1; }
function upsertKey(f, k, t, v) { f.keys[k] = f.keys[k] || []; const ks = f.keys[k], i = findKey(ks, t); if (i >= 0) ks[i].v = v; else { ks.push({ t, v }); ks.sort((a, b) => a.t - b.t); } }
function toggleKey(f, k) {
  if (!isTimed()) return toast('Keyframes need a video, or a still with MOTION on', 'info');
  const t = curTime(), ks = f.keys[k] || (f.keys[k] = []), i = findKey(ks, t);
  if (i >= 0) { ks.splice(i, 1); if (!ks.length) delete f.keys[k]; toast('Keyframe removed', 'info', 1000); }
  else { ks.push({ t, v: valAt(f, k, t) }); ks.sort((a, b) => a.t - b.t); toast(`Keyframe @ ${fmtTime(t, S.video.fps)}`, 'info', 1000); }
  syncControls(); changed(false);
}
function keySelectedMix() { const f = selFx(); if (!f) return toast('Select an effect first', 'err'); toggleKey(f, 'mix'); }
function rangeCtl(f, q, isMix) {
  const key = isMix ? 'mix' : q.k, wrap = h('div', { class: 'ctl' + (isMix ? ' mix' : '') });
  const r = h('input', { type: 'range', min: q.min, max: q.max, step: q.step });
  const num = h('input', { class: 'num', spellcheck: false });
  const kb = isTimed() ? h('button', { class: 'kfb', 'data-tip': 'Toggle keyframe at playhead', onclick: () => toggleKey(f, key) }, '◆') : null;
  const sync = () => { const v = valAt(f, key); r.value = v; num.value = fmtV(v, q.step); r.style.setProperty('--p', ((v - q.min) / (q.max - q.min) * 100) + '%'); if (kb) { const ks = f.keys[key]; kb.classList.toggle('has', !!(ks && ks.length)); kb.classList.toggle('at', findKey(ks, curTime()) >= 0); } };
  const set = (v, live) => {
    v = clampN(+v, q.min, q.max); if (isNaN(v)) return sync();
    if (isTimed() && f.keys[key] && f.keys[key].length) upsertKey(f, key, curTime(), v); else if (isMix) f.mix = v; else f.p[key] = v;
    sync(); if (isMix) { const sm = wrap.closest('.fx') && $('.fx-name small', wrap.closest('.fx')); if (sm) sm.textContent = `${CAT_NAME[E.MAP[f.id].cat].toUpperCase()} · ${Math.round(v)}%`; }
    changed(false, live);
  };
  r.addEventListener('input', () => set(r.value, true)); r.addEventListener('change', () => H.commit());
  r.addEventListener('dblclick', () => set(q.def, false));
  num.addEventListener('change', () => set(num.value, false)); num.addEventListener('keydown', e => { if (e.key === 'Enter') num.blur(); if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); set((+num.value || 0) + (e.key === 'ArrowUp' ? 1 : -1) * q.step * (e.shiftKey ? 10 : 1), false); } });
  wrap.append(h('div', { class: 'ctl-h' }, h('label', { 'data-tip': 'Double-click slider to reset' }, q.l), kb, num, h('span', { class: 'u' }, q.u || '')), r);
  sync(); SYNC.push(sync); return wrap;
}
function syncControls() { SYNC.forEach(fn => fn()); }

/* ---------- CANVAS pane ---------- */
function renderCanvasPane() {
  const p = $('#rCanvas'); if (p.classList.contains('hidden')) return; p.innerHTML = '';
  if (!S.media) { p.append(h('div', { class: 'stack-empty' }, h('b', null, 'NO MEDIA'), 'IMPORT AN IMAGE OR VIDEO')); return; }
  const d = docDims(), src = S.source;
  const upd = (structural) => { RS.srcDirty = true; S.fitPending = true; H.commit(); requestRender(); if (structural) renderCanvasPane(); };
  const aspect = h('div', { class: 'aspect-grid' }, Object.keys(ASPECTS).map(a => h('button', { class: src.aspect === a ? 'on' : '', onclick: () => { src.aspect = a; upd(true); } }, a === 'orig' ? 'ORIG' : a)));
  const slider = (k, label) => { const r = h('input', { type: 'range', min: 0, max: 100, step: 1, value: src[k] }); r.style.setProperty('--p', src[k] + '%'); const n = h('span', { class: 'u', style: { width: '30px', textAlign: 'right' } }, src[k] + '%'); r.oninput = () => { src[k] = +r.value; n.textContent = r.value + '%'; r.style.setProperty('--p', r.value + '%'); RS.srcDirty = true; requestRender(); }; r.onchange = () => H.commit(); return h('div', { class: 'ctl' }, h('div', { class: 'ctl-h' }, h('label', null, label), n), r); };
  const wIn = h('input', { class: 'inp', type: 'number', min: 16, max: 16384, value: d.w });
  const hOut = h('span', { class: 'note' }, `× ${d.h}`);
  wIn.onchange = () => { const v = clampN(Math.round(+wIn.value || d.crop.cw), 16, 16384); src.outW = v === d.crop.cw ? 0 : v; upd(true); };
  p.append(
    h('div', { class: 'field' }, h('label', null, 'Aspect ratio / crop'), aspect),
    src.aspect !== 'orig' ? h('div', { class: 'field' }, slider('cx', 'Crop position X'), slider('cy', 'Crop position Y')) : null,
    h('div', { class: 'field' }, h('label', null, 'Transform'), h('div', { class: 'btnrow' },
      h('button', { class: 'btn sm', onclick: () => { src.rot = (src.rot + 270) % 360; upd(true); } }, '⟲ 90°'),
      h('button', { class: 'btn sm', onclick: () => { src.rot = (src.rot + 90) % 360; upd(true); } }, '⟳ 90°'),
      h('button', { class: 'btn sm' + (src.fh ? ' primary' : ''), onclick: () => { src.fh = !src.fh; upd(true); } }, 'FLIP H'),
      h('button', { class: 'btn sm' + (src.fv ? ' primary' : ''), onclick: () => { src.fv = !src.fv; upd(true); } }, 'FLIP V'))),
    h('div', { class: 'field' }, h('label', null, 'Document size (resize)'), h('div', { class: 'row2' }, wIn, hOut, h('button', { class: 'tbtn', onclick: () => { src.outW = 0; upd(true); } }, 'ORIGINAL')),
      h('div', { class: 'btnrow', style: { marginTop: '6px' } }, [0.25, 0.5, 2].map(s => h('button', { class: 'tbtn', onclick: () => { src.outW = Math.round(d.crop.cw * s); upd(true); } }, s * 100 + '%')))),
    h('div', { class: 'field' }, h('label', null, 'Preview resolution'), h('select', { onchange: e => { SETTINGS.pmax = +e.target.value; LS.set('shd.settings', SETTINGS); S.fitPending = true; requestRender(); } }, [[720, '720 PX — FASTEST'], [1280, '1280 PX — BALANCED'], [1920, '1920 PX'], [2560, '2560 PX'], [0, 'FULL RESOLUTION']].map(([v, l]) => h('option', { value: v, selected: SETTINGS.pmax === v }, l)))),
    h('div', { class: 'field' }, h('button', { class: 'btn sm', onclick: () => { Object.assign(src, { aspect: 'orig', cx: 50, cy: 50, rot: 0, fh: false, fv: false, outW: 0 }); upd(true); } }, 'RESET CANVAS')),
    h('div', { class: 'ex-stats' }, h('div', null, 'SOURCE', h('b', null, `${S.media.w}×${S.media.h}`)), h('div', null, 'DOCUMENT', h('b', null, `${d.w}×${d.h}`)), h('div', null, 'PREVIEW', h('b', null, `${proxyDims().w}×${proxyDims().h}`)), h('div', null, 'TYPE', h('b', null, S.media.type.toUpperCase()))),
  );
}

/* ---------- palettes ---------- */
function extractPalette(n) {
  const src = cvB.width ? bctx.getImageData(0, 0, cvB.width, cvB.height).data : null; if (!src) return null;
  const pts = []; const step = Math.max(1, Math.floor(src.length / 4 / 5000));
  for (let i = 0; i < src.length; i += 4 * step) pts.push([src[i], src[i + 1], src[i + 2]]);
  let cent = Array.from({ length: n }, (_, i) => pts[Math.floor(i / n * pts.length)].slice());
  for (let it = 0; it < 10; it++) { const acc = cent.map(() => [0, 0, 0, 0]); for (const p of pts) { let bi = 0, bd = 1e9; cent.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = j; } }); const a = acc[bi]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++; } cent = acc.map((a, j) => a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cent[j]); }
  return cent.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])).map(c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''));
}
function openPalettes(fx, key) {
  let cur = S.palettes.find(p => p.id === (fx && fx.p[key])) || S.palettes[0] || null;
  const body = h('div');
  const draw = () => {
    body.innerHTML = '';
    const left = h('div', { style: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' } });
    const lst = h('div');
    S.palettes.forEach(p => lst.append(h('div', { class: 'list-item' + (p === cur ? ' active' : ''), onclick: () => { cur = p; draw(); } }, h('div', { class: 'meta' }, h('b', null, p.n), h('div', { class: 'pal-strip' }, p.c.map(c => h('i', { style: { background: c } })))))));
    lst.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn sm', onclick: () => { cur = { id: 'c_' + uid(), n: 'CUSTOM ' + pad2(S.palettes.length + 1), c: ['#0b0c0b', '#d4ff00'] }; S.palettes.push(cur); savePalettes(); draw(); } }, '+ NEW')));
    const ed = h('div');
    if (cur) {
      const name = h('input', { class: 'inp', value: cur.n, onchange: e => { cur.n = e.target.value.toUpperCase() || 'CUSTOM'; savePalettes(); draw(); } });
      const cols = h('div', { class: 'pal-colors' });
      cur.c.forEach((c, i) => { const ci = h('input', { type: 'color', value: c }); ci.oninput = () => { cur.c[i] = ci.value; pc.style.background = ci.value; savePalettes(); requestRender(); }; const pc = h('div', { class: 'pc', style: { background: c } }, ci, h('button', { onclick: e => { e.stopPropagation(); if (cur.c.length <= 2) return toast('A palette needs at least 2 colors', 'err'); cur.c.splice(i, 1); savePalettes(); draw(); requestRender(); } }, '×')); cols.append(pc); });
      if (cur.c.length < 256) cols.append(h('div', { class: 'pc add', onclick: () => { cur.c.push('#808080'); savePalettes(); draw(); } }, '+'));
      const nSel = h('select', null, [2, 3, 4, 6, 8, 12, 16, 24, 32].map(n => h('option', { value: n, selected: n === 8 }, n + ' COLORS')));
      ed.append(h('div', { class: 'field' }, h('label', null, 'Name'), name), h('div', { class: 'field' }, h('label', null, `Colors (${cur.c.length}) — click a swatch to edit`), cols),
        h('div', { class: 'field' }, h('label', null, 'Extract from current image'), h('div', { class: 'row2' }, nSel, h('button', { class: 'btn sm', onclick: () => { const r = extractPalette(+nSel.value); if (!r) return toast('Load media first', 'err'); cur.c = r; savePalettes(); draw(); requestRender(); toast('Palette extracted'); } }, 'EXTRACT'))),
        h('div', { class: 'btnrow' }, fx ? h('button', { class: 'btn sm primary', onclick: () => { fx.p[key] = cur.id; md.close(); changed(true); } }, 'USE ON EFFECT') : null, h('button', { class: 'btn sm danger', onclick: () => confirmModal('DELETE PALETTE', `Delete ${cur.n}?`, () => { S.palettes = S.palettes.filter(p => p !== cur); savePalettes(); S.stack.forEach(f => Object.keys(f.p).forEach(k => { if (f.p[k] === cur.id) f.p[k] = 'mono'; })); cur = S.palettes[0] || null; draw(); renderStack(); requestRender(); }, 'DELETE') }, 'DELETE')));
    } else ed.append(h('div', { class: 'empty-note' }, 'NO CUSTOM PALETTES — CREATE ONE'));
    left.append(lst, ed); body.append(left);
  };
  const md = openModal({ title: 'COLOR PALETTES', sub: 'CUSTOM INK SETS', body, onClose: () => renderStack() }); draw();
}

/* ---------- settings ---------- */
function applySettings() { document.body.classList.toggle('skin-chrome', SETTINGS.skin !== 'marathon'); document.body.classList.toggle('no-scan', !SETTINGS.scan); document.body.classList.toggle('no-grain', !SETTINGS.grain); document.body.classList.toggle('no-motion', !SETTINGS.motion); LS.set('shd.settings', SETTINGS); }
function openSettings() {
  const tog = (k, label) => { const sw = h('div', { class: 'sw' + (SETTINGS[k] ? ' on' : '') }); return h('div', { class: 'ctl-bool', style: { padding: '6px 0', borderBottom: '1px dashed var(--ln)' }, onclick: () => { SETTINGS[k] = !SETTINGS[k]; sw.classList.toggle('on', SETTINGS[k]); applySettings(); } }, h('span', null, label), sw); };
  const body = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } },
    h('div', null, h('div', { class: 'sec-t' }, 'SKIN'), h('div', { class: 'seg', style: { width: '100%', marginBottom: '14px' } }, [['chrome', 'Y2K CHROME'], ['marathon', 'MARATHON FLAT']].map(([v, l]) => h('button', { class: (SETTINGS.skin !== 'marathon') === (v === 'chrome') ? 'on' : '', style: { flex: 1 }, onclick: e => { SETTINGS.skin = v; applySettings(); $$('button', e.currentTarget.parentNode).forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, l))), h('div', { class: 'sec-t' }, 'INTERFACE'), tog('scan', 'Scanline overlay'), tog('grain', 'Film grain overlay'), tog('motion', 'Interface animations'), tog('boot', 'Boot sequence on launch'),
      h('div', { class: 'sec-t', style: { marginTop: '16px' } }, 'PROJECT'), tog('autosave', 'Autosave to browser storage')),
    h('div', null, h('div', { class: 'sec-t' }, 'PERFORMANCE'),
      h('div', { class: 'field' }, h('label', null, 'Preview resolution cap'), h('select', { onchange: e => { SETTINGS.pmax = +e.target.value; applySettings(); S.fitPending = true; requestRender(); } }, [[720, '720 PX'], [1280, '1280 PX'], [1920, '1920 PX'], [2560, '2560 PX'], [0, 'FULL']].map(([v, l]) => h('option', { value: v, selected: SETTINGS.pmax === v }, l)))),
      h('p', { class: 'note' }, 'Effects run in Web Workers on a preview proxy; exports always process at full output resolution in a background worker.'),
      h('div', { class: 'sec-t', style: { marginTop: '16px' } }, 'DATA'),
      h('div', { class: 'btnrow' }, h('button', { class: 'btn sm', onclick: openShortcuts }, 'SHORTCUTS'), h('button', { class: 'btn sm danger', onclick: () => confirmModal('CLEAR ALL LOCAL DATA', 'Permanently delete all saved projects, library media, custom presets, palettes and export history from this browser? This cannot be undone.', async () => { try { DB.db && DB.db.close(); DB.db = null; await new Promise(r => { const q = indexedDB.deleteDatabase('shedithers'); q.onsuccess = q.onerror = q.onblocked = r; }); } catch (_) { } ['shd.presets', 'shd.palettes', 'shd.exports', 'shd.last'].forEach(k => localStorage.removeItem(k)); toast('Local data cleared — reloading'); setTimeout(() => location.reload(), 900); }, 'DELETE ALL') }, 'CLEAR DATA'))));
  openModal({ title: 'SETTINGS', sub: 'SYSTEM CONFIG', body, cls: 'sm', foot: h('span', { class: 'note' }, 'SHEDITHERS LOVES YOU ♥') }).el.style.width = 'min(640px,94vw)';
}
