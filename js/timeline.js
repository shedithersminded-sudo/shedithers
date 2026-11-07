/* SHEDITHERS — timeline: video + still "motion" clock, transport, trimming, soundtrack, keyframe lanes. */
const TL = { thumbsFor: null };
const tracksEl = $('#tracks'), clipEl = $('#clipTrack');
function vEl() { return S.media && S.media.el; }
function dur() { return isVideo() ? (S.media.duration || 0) : S.still.dur; }
function isPlaying() { return isVideo() ? !vEl().paused : S.still.playing; }
function togglePlay() { if (!isTimed()) return; isPlaying() ? pausePlay() : startPlay(); }
function startPlay() {
  const out = S.video.out || dur(); if (curTime() >= out - 0.01 || curTime() < S.video.in) seekTo(S.video.in);
  if (isVideo()) { vEl().play().catch(e => toast(e.message, 'err')); }
  else { S.still.playing = true; S.still.t0 = S.still.t; S.still.wall = performance.now(); stillLoop(); }
  sndPlay(); tlUpdate();
}
function pausePlay() { if (isVideo()) vEl().pause(); else S.still.playing = false; sndPause(); tlUpdate(); setBusy(false); }
function stillLoop() {
  if (!S.still.playing || isVideo()) return;
  let t = S.still.t0 + (performance.now() - S.still.wall) / 1000 * S.video.speed; const out = S.video.out || dur();
  if (t >= out) { if (S.video.loop) { t = S.video.in; S.still.t0 = t; S.still.wall = performance.now(); S.still.t = t; sndSeek(t); } else { S.still.t = out; pausePlay(); requestRender(); return; } }
  S.still.t = t; requestRender(); tlUpdate(); sndSync(); setTimeout(stillLoop, 16);
}
function seekTo(t) {
  t = clampN(t, 0, dur());
  if (isVideo()) vEl().currentTime = t; else { S.still.t = t; S.still.t0 = t; S.still.wall = performance.now(); requestRender(); }
  sndSeek(t); tlUpdate();
}
function stepFrame(n) { pausePlay(); seekTo(curTime() + n / S.video.fps); }
function setTrim(which, t) {
  t = clampN(t, 0, dur());
  if (which === 'in') S.video.in = Math.min(t, S.video.out - 1 / S.video.fps); else S.video.out = Math.max(t, S.video.in + 1 / S.video.fps);
  tlUpdate(); scheduleAutosave(); toast(`${which.toUpperCase()} point ${fmtTime(which === 'in' ? S.video.in : S.video.out, S.video.fps)}`, 'info', 1000);
}
function setMotion(on) {
  if (!S.media || isVideo()) return;
  S.motion = on; if (!on) { pausePlay(); S.still.t = 0; }
  if (on && (!S.video.out || S.video.out > S.still.dur)) { S.video.in = 0; S.video.out = S.still.dur; }
  tlOnMedia(); renderStack(); requestRender(); scheduleAutosave();
  if (on) toast('Motion on — animated effects now move over time. Add a sound, then EXPORT CLIP.', 'info', 4000);
}
function setStillDur(sec) { sec = clampN(+sec || 8, 0.5, 600); S.still.dur = sec; S.video.in = Math.min(S.video.in, sec - 0.1); S.video.out = sec; if (S.still.t > sec) S.still.t = 0; tlOnMedia(); scheduleAutosave(); }

function tlOnMedia() {
  const vid = isVideo(), on = vid || (S.media && S.motion);
  $('#timeline').classList.toggle('hidden', !on); $('#timeline').classList.toggle('still', !vid);
  $('#btnMotion').style.display = S.media && !vid ? '' : 'none'; $('#btnMotion').classList.toggle('on', !!S.motion);
  updSoundUI();
  if (!on) { setTimeout(fitView, 30); return; }
  if (!S.video.out || S.video.out > dur()) S.video.out = dur();
  $('#tSpeed').value = String(S.video.speed); $('#tFps').value = String(S.video.fps); $('#stillDur').value = S.still.dur;
  $('#tDur').textContent = fmtTime(dur(), S.video.fps);
  if (vid) { vEl().playbackRate = S.video.speed; $('#tSrcFps').textContent = '…'; estimateFps(vEl()); buildThumbs(); }
  else stillStrip();
  drawWave(); tlLanes(); tlUpdate(); setTimeout(fitView, 50);
}
function estimateFps(v) {
  if (!v.requestVideoFrameCallback) { $('#tSrcFps').textContent = 'N/A'; return; }
  const ts = []; let n = 0;
  const cb = (now, md) => { ts.push(md.mediaTime); if (++n < 12 && !v.paused) v.requestVideoFrameCallback(cb); else done(); };
  const done = () => { const d = []; for (let i = 1; i < ts.length; i++) { const x = ts[i] - ts[i - 1]; if (x > 0) d.push(x); } if (d.length) { d.sort((a, b) => a - b); $('#tSrcFps').textContent = '~' + (1 / d[d.length >> 1]).toFixed(2) + ' FPS'; } };
  v.addEventListener('play', function once() { v.removeEventListener('play', once); v.requestVideoFrameCallback(cb); });
  $('#tSrcFps').textContent = 'PLAY TO DETECT';
}
function stripCanvas() { const cv = $('#thumbStrip'), r = clipEl.getBoundingClientRect(); cv.width = Math.max(100, Math.round(r.width)); cv.height = 44; const cx = cv.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height); return { cv, cx }; }
function stillStrip() {
  TL.thumbsFor = null; const { cv, cx } = stripCanvas(); const el = S.media.el, tw = Math.round(44 * S.media.w / S.media.h);
  cx.filter = 'grayscale(1) contrast(1.3)'; for (let x = 0; x < cv.width; x += tw) { try { cx.drawImage(el, x, 0, tw, 44); } catch (_) { } cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(x, 0, 1, 44); } cx.filter = 'none';
}
async function buildThumbs() {
  const id = S.media.id; TL.thumbsFor = id; const { cv, cx } = stripCanvas();
  const v = h('video', { src: S.media.url, preload: 'auto' }); v.muted = true;
  try { await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = rej; }); } catch (_) { return; }
  const tw = Math.round(44 * S.media.w / S.media.h), n = Math.ceil(cv.width / tw);
  for (let i = 0; i < n; i++) {
    if (TL.thumbsFor !== id) break;
    const t = (i + 0.5) / n * dur(); await new Promise(res => { v.onseeked = res; v.currentTime = Math.min(t, dur() - 0.05); setTimeout(res, 1500); });
    try { cx.filter = 'grayscale(1) contrast(1.3)'; cx.drawImage(v, i * tw, 0, tw, 44); cx.filter = 'none'; cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(i * tw, 0, 1, 44); } catch (_) { }
  }
  v.removeAttribute('src'); v.load();
}
function tlX(t) { const r = clipEl.getBoundingClientRect(), tr = tracksEl.getBoundingClientRect(); return r.left - tr.left + (dur() ? t / dur() : 0) * r.width; }
function tlT(clientX) { const r = clipEl.getBoundingClientRect(); return clampN((clientX - r.left) / r.width, 0, 1) * dur(); }
function drawRuler() {
  const cv = $('#rulerCv'), r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = 20 * dpr; const cx = cv.getContext('2d'); cx.scale(dpr, dpr); cx.clearRect(0, 0, r.width, 20);
  const d = dur(); if (!d) return; const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300]; const st = steps.find(s => r.width / (d / s) >= 60) || 300;
  cx.font = '9px JetBrains Mono, monospace'; cx.fillStyle = '#5b6157'; cx.strokeStyle = '#3a3f38';
  for (let t = 0; t <= d + 1e-6; t += st / 5) { const x = Math.round(t / d * r.width) + 0.5, major = Math.abs(t / st - Math.round(t / st)) < 1e-6; cx.beginPath(); cx.moveTo(x, major ? 8 : 14); cx.lineTo(x, 20); cx.stroke(); if (major) cx.fillText(st >= 1 ? fmtTime(t, S.video.fps).slice(0, 5) : t.toFixed(2) + 's', x + 3, 9); }
}
function tlUpdate() {
  if (!isTimed() || $('#timeline').classList.contains('hidden')) return; const d = dur(), fps = S.video.fps, playing = isPlaying();
  $('#tCur').textContent = fmtTime(curTime(), fps);
  $('#tPlay').innerHTML = `<svg><use href="#i-${playing ? 'pause' : 'play'}"/></svg>`;
  const r = clipEl.getBoundingClientRect();
  $('#playhead').style.left = tlX(curTime()) + 'px';
  const inX = d ? S.video.in / d * r.width : 0, outX = d ? S.video.out / d * r.width : r.width;
  $('#trimIn').style.left = inX + 'px'; $('#trimOut').style.left = outX + 'px';
  $('#dimL').style.width = inX + 'px'; $('#dimR').style.width = Math.max(0, r.width - outX) + 'px';
  $('#tClip').textContent = `${(S.video.out - S.video.in).toFixed(2)}s · ${Math.round((S.video.out - S.video.in) / S.video.speed * fps)} FR`;
  $('#tLoop').classList.toggle('on', S.video.loop); $('#tMute').classList.toggle('on', S.monitor);
  if (S.stack.some(f => f.keys && Object.keys(f.keys).length)) syncControls();
  $('.live').classList.toggle('on', playing); $('#sState').textContent = playing ? 'PLAYING' : 'PAUSED';
}
function tlLanes() {
  const box = $('#keyLanes'); box.innerHTML = ''; if (!isTimed()) return;
  for (const f of S.stack) {
    const times = new Set(); for (const k in (f.keys || {})) f.keys[k].forEach(kf => times.add(kf.t.toFixed(4)));
    if (!times.size && f.uid !== S.sel) continue;
    const lane = h('div', { class: 'lane' }, h('span', { class: 'ln' }, E.MAP[f.id].name.toUpperCase()));
    const r = clipEl.getBoundingClientRect();
    for (const ts of times) {
      const t = +ts, kf = h('div', { class: 'kf', style: { left: (dur() ? t / dur() * r.width : 0) + 'px' }, 'data-tip': `${fmtTime(t, S.video.fps)} · click to jump · right-click to delete` });
      kf.onclick = e => { e.stopPropagation(); seekTo(t); };
      kf.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); showCtx(e.clientX, e.clientY, [{ label: 'Jump here', act: () => seekTo(t) }, { label: 'Delete keyframes at this time', danger: true, act: () => { for (const k in f.keys) { f.keys[k] = f.keys[k].filter(x => Math.abs(x.t - t) > 1e-3); if (!f.keys[k].length) delete f.keys[k]; } changed(false); syncControls(); } }]); };
      lane.append(kf);
    }
    lane.onclick = e => { S.sel = f.uid; seekTo(tlT(e.clientX)); renderStack(); };
    box.append(lane);
  }
  drawRuler(); tlUpdate();
}

/* ---------- soundtrack ---------- */
let AC = null; const audioCtx = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
async function setSound(blob, name, o = {}) {
  const url = URL.createObjectURL(blob), el = new Audio(); el.src = url; el.preload = 'auto';
  await new Promise((res, rej) => { el.onloadedmetadata = res; el.onerror = () => rej(new Error('This audio format cannot be decoded by your browser (try MP3, WAV or M4A)')); setTimeout(() => rej(new Error('Audio load timed out')), 15000); });
  if (S.snd) { S.snd.el.pause(); URL.revokeObjectURL(S.snd.url); }
  S.snd = { name: name || 'SOUND', blob, url, el, dur: el.duration, start: o.start || 0, vol: o.vol ?? 100, peaks: null };
  audioCtx().decodeAudioData(await blob.arrayBuffer()).then(buf => { if (!S.snd || S.snd.blob !== blob) return; S.snd.peaks = peaksOf(buf); drawWave(); }).catch(() => { });
  if (S.media && !isVideo()) { S.motion = true; if (!o.keepDur) { const len = Math.min(180, Math.max(0.5, el.duration - S.snd.start)); S.still.dur = +len.toFixed(2); S.video.in = 0; S.video.out = S.still.dur; } }
  tlOnMedia(); updSoundUI(); scheduleAutosave();
}
function clearSound(silent) { if (S.snd) { S.snd.el.pause(); URL.revokeObjectURL(S.snd.url); } S.snd = null; updSoundUI(); drawWave(); if (!silent) { toast('Soundtrack removed', 'info'); scheduleAutosave(); } }
function peaksOf(buf) { const n = 2000, ch = buf.getChannelData(0), step = Math.max(1, Math.floor(ch.length / n)), out = new Float32Array(n); for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step, e = Math.min(ch.length, j + step); j < e; j += 4) { const v = Math.abs(ch[j]); if (v > m) m = v; } out[i] = m; } return { p: out, dur: buf.duration }; }
function drawWave() {
  const tr = $('#sndTrack'); tr.classList.toggle('on', !!S.snd); if (!S.snd) return;
  const cv = $('#waveCv'), r = tr.getBoundingClientRect(); if (!r.width) return; cv.width = Math.round(r.width); cv.height = 30; const cx = cv.getContext('2d'); cx.clearRect(0, 0, cv.width, 30);
  const pk = S.snd.peaks, d = dur(); cx.fillStyle = '#ff4fa3';
  if (!pk) { cx.font = '9px JetBrains Mono'; cx.fillText('DECODING…', 6, 18); return; }
  for (let x = 0; x < cv.width; x++) { const at = S.snd.start + x / cv.width * d; if (at > pk.dur) break; const v = pk.p[Math.min(pk.p.length - 1, Math.floor(at / pk.dur * pk.p.length))]; const hh = Math.max(1, v * 28); cx.fillRect(x, 15 - hh / 2, 1, hh); }
}
function updSoundUI() {
  const has = !!S.snd; $('#sndName').textContent = has ? `♪ ${S.snd.name} · ${S.snd.dur.toFixed(1)}s` : 'NO SOUNDTRACK'; $('#sndName').classList.toggle('on', has);
  $('#sndStart').value = has ? S.snd.start : 0; $('#sndVol').value = has ? S.snd.vol : 100; $('#sndVolV').textContent = has ? S.snd.vol : 100;
  $('#sndStart').disabled = $('#sndVol').disabled = $('#sndDel').disabled = !has;
  $('#sndOrig').textContent = 'ORIGINAL AUDIO: ' + (S.origAudio ? 'ON' : 'OFF'); $('#sndOrig').classList.toggle('on', S.origAudio);
  if (isVideo()) vEl().muted = !(S.monitor && S.origAudio);
}
function sndWant() { return S.snd ? S.snd.start + curTime() : 0; }
function sndSync() { if (!S.snd) return; const el = S.snd.el, want = sndWant(); el.volume = Math.min(1, S.snd.vol / 100); el.muted = !S.monitor; el.playbackRate = S.video.speed; if (isPlaying() && want < S.snd.dur) { if (Math.abs(el.currentTime - want) > 0.25) el.currentTime = want; if (el.paused) el.play().catch(() => { }); } else if (!el.paused && want >= S.snd.dur) el.pause(); }
function sndPlay() { if (!S.snd) return; S.snd.el.currentTime = Math.min(S.snd.dur, sndWant()); sndSync(); }
function sndPause() { if (S.snd) S.snd.el.pause(); }
function sndSeek(t) { if (S.snd) S.snd.el.currentTime = Math.min(S.snd.dur, S.snd.start + t); }

$('#sndAdd').onclick = () => { if (!S.media) return toast('Import a picture or video first', 'err'); $('#audioIn').click(); };
$('#audioIn').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { await setSound(f, f.name.replace(/\.[^.]+$/, '').toUpperCase()); toast(`Soundtrack ${f.name} attached`); } catch (x) { toast(x.message, 'err', 6000); } });
$('#sndDel').onclick = () => clearSound();
$('#sndStart').onchange = e => { if (!S.snd) return; S.snd.start = clampN(+e.target.value || 0, 0, Math.max(0, S.snd.dur - 0.1)); e.target.value = S.snd.start; sndSeek(curTime()); drawWave(); scheduleAutosave(); };
$('#sndVol').oninput = e => { if (!S.snd) return; S.snd.vol = +e.target.value; $('#sndVolV').textContent = e.target.value; sndSync(); };
$('#sndVol').onchange = () => scheduleAutosave();
$('#sndOrig').onclick = () => { S.origAudio = !S.origAudio; updSoundUI(); scheduleAutosave(); };
$('#vert916').onclick = () => { S.source.aspect = '9:16'; RS.srcDirty = true; S.fitPending = true; H.commit(); requestRender(); renderCanvasPane(); toast('Canvas cropped to 9:16 vertical — adjust position in the CANVAS tab', 'info'); };
$('#tExport').onclick = () => openExport();
$('#btnMotion').onclick = () => setMotion(!S.motion);
$('#stillDur').onchange = e => setStillDur(e.target.value);

/* transport wiring */
$('#tPlay').onclick = togglePlay; $('#tStart').onclick = () => seekTo(S.video.in); $('#tEnd').onclick = () => seekTo(S.video.out);
$('#tBack').onclick = () => stepFrame(-1); $('#tFwd').onclick = () => stepFrame(1);
$('#tLoop').onclick = () => { S.video.loop = !S.video.loop; tlUpdate(); };
$('#tMute').onclick = () => { S.monitor = !S.monitor; updSoundUI(); sndSync(); tlUpdate(); toast(S.monitor ? 'Preview audio on' : 'Preview audio muted', 'info', 1000); };
$('#tSpeed').onchange = e => { S.video.speed = +e.target.value; if (isVideo()) vEl().playbackRate = S.video.speed; if (S.still.playing) { S.still.t0 = S.still.t; S.still.wall = performance.now(); } sndSync(); tlUpdate(); scheduleAutosave(); };
$('#tFps').onchange = e => { S.video.fps = +e.target.value; tlUpdate(); scheduleAutosave(); };
$('#tIn').onclick = () => setTrim('in', curTime()); $('#tOut').onclick = () => setTrim('out', curTime());
$('#tKey').onclick = keySelectedMix;
let scrub = null;
function startScrub(e, mode) { if (!isTimed()) return; e.preventDefault(); scrub = mode; pausePlay(); moveScrub(e); }
function moveScrub(e) { if (!scrub) return; const t = tlT(e.clientX); if (scrub === 'in' || scrub === 'out') { if (scrub === 'in') S.video.in = Math.min(t, S.video.out - 1 / S.video.fps); else S.video.out = Math.max(t, S.video.in + 1 / S.video.fps); seekTo(scrub === 'in' ? S.video.in : S.video.out); } else seekTo(t); }
$('#ruler').addEventListener('mousedown', e => startScrub(e, 'head'));
clipEl.addEventListener('mousedown', e => { if (e.target.classList.contains('trim')) return; startScrub(e, 'head'); });
$('#sndTrack').addEventListener('mousedown', e => startScrub(e, 'head'));
$('#trimIn').addEventListener('mousedown', e => { e.stopPropagation(); startScrub(e, 'in'); });
$('#trimOut').addEventListener('mousedown', e => { e.stopPropagation(); startScrub(e, 'out'); });
window.addEventListener('mousemove', moveScrub);
window.addEventListener('mouseup', () => { if (scrub === 'in' || scrub === 'out') scheduleAutosave(); scrub = null; });
new ResizeObserver(() => { if (isTimed()) { drawRuler(); drawWave(); tlLanes(); } }).observe(clipEl);
