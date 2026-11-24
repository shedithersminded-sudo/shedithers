/* SHEDITHERS — tuck any player out of the way.
 * Every player gets a small ⇤ button. Click it and the player slides away into a little tab on the left edge.
 * Click the tab and it comes back. Music keeps playing while it's tucked. Used on the archive and the Dither Lab.
 * SHD_TUCK(el, id, label, icon): id saves the choice on this device (null = don't remember). */
(() => {
'use strict';
if (window.SHD_TUCK) return;
const css = `
.tuck-x{position:absolute;top:-11px;right:-11px;z-index:9;display:grid;place-items:center;width:24px;height:24px;padding:0;border:2px solid #0b0a09;border-radius:50%;background:#e9e3d1;color:#0b0a09;font:700 12px/1 'JetBrains Mono',monospace;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.tuck-x:hover,.tuck-x:focus-visible{background:#c3141c;color:#e9e3d1}
.is-tucked{display:none!important}
.tuck-tray{position:fixed;left:0;top:38%;z-index:70;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.tuck-tab{pointer-events:auto;display:flex;align-items:center;gap:6px;padding:9px 10px 9px 8px;border:2px solid #0b0a09;border-left:0;border-radius:0 10px 10px 0;background:#c3141c;color:#e9e3d1;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.5);animation:tuckIn .35s cubic-bezier(.2,.9,.25,1.2)}
.tuck-tab i{font-style:normal;font-size:14px}
.tuck-tab:hover,.tuck-tab:focus-visible{padding-left:14px;background:#0b0a09}
.tuck-tab[hidden]{display:none}
@keyframes tuckIn{from{transform:translateX(-100%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.tuck-tab{animation:none}}
@media (max-width:760px){.tuck-tray{top:auto;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 120px)}.tuck-tab b{display:none}}
`;
document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
let tray = null; const all = [];
const getTray = () => { if (!tray) { tray = document.createElement('div'); tray.className = 'tuck-tray'; document.body.append(tray); } return tray; };
const KEY = 'shd.tuck.';
window.SHD_TUCK = (el, id, label, icon) => {
  if (!el || el.dataset.tuck) return; el.dataset.tuck = '1';
  const x = document.createElement('button'); x.type = 'button'; x.className = 'tuck-x'; x.textContent = '⇤';
  x.setAttribute('aria-label', `Tuck ${label} out of the way`); x.title = `Tuck ${label} away (it keeps playing)`;
  const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'tuck-tab'; tab.hidden = true;
  tab.setAttribute('aria-label', `Bring back ${label}`); tab.title = `Bring back ${label}`;
  tab.innerHTML = `<i></i><b></b>`; tab.querySelector('i').textContent = icon || '♪'; tab.querySelector('b').textContent = label;
  const set = t => {
    el.classList.toggle('is-tucked', t); tab.hidden = !t;
    if (id) try { t ? localStorage.setItem(KEY + id, '1') : localStorage.removeItem(KEY + id); } catch (_) { }
    if (!t) requestAnimationFrame(() => x.focus({ preventScroll: true }));
  };
  x.addEventListener('pointerdown', e => e.stopPropagation());
  x.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); set(true); tab.focus({ preventScroll: true }); });
  tab.addEventListener('click', () => set(false));
  el.append(x); getTray().append(tab); all.push({ el, tab });
  let saved = false; if (id) try { saved = localStorage.getItem(KEY + id) === '1'; } catch (_) { }
  if (saved) set(true);
};
// a player that goes away for good (like the song bar after the last song) takes its tab with it
new MutationObserver(() => { for (let i = all.length - 1; i >= 0; i--) if (!all[i].el.isConnected) { all[i].tab.remove(); all.splice(i, 1); } })
  .observe(document.body, { childList: true });
})();
