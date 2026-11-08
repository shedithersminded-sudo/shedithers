/* SHEDITHERS — visitor + art counter (GoatCounter: free, no cookies, no personal data).
 * Turns on when `goatcounter` is set in js/config.js. Your stats: https://YOURNAME.goatcounter.com
 * Counts page visits, plus events: made-art/<format> (someone exported from the Dither Lab),
 * tip-jar-opened, suggestion-sent, tiktok-theater-opened. */
(() => {
  const CFG = typeof SHD_CONFIG !== 'undefined' ? SHD_CONFIG : {};
  const code = String(CFG.goatcounter || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\.goatcounter\.com.*$/, '');
  const queue = [];
  window.shdCount = (path, title) => {
    if (!code) return;
    const ev = { path: String(path).replace(/[^a-z0-9/_-]+/gi, '-').slice(0, 80), title: title || path, event: true };
    if (window.goatcounter && window.goatcounter.count) { try { window.goatcounter.count(ev); } catch (_) { } } else queue.push(ev);
  };
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(code) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  const s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  s.onload = () => { const t = setInterval(() => { if (window.goatcounter && window.goatcounter.count) { clearInterval(t); queue.splice(0).forEach(ev => { try { window.goatcounter.count(ev); } catch (_) { } }); } }, 300); setTimeout(() => clearInterval(t), 10000); };
  document.head.append(s);
})();
