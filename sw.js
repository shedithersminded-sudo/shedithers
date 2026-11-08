/* SHEDITHERS service worker — offline app shell. Bump VERSION when files change. */
const VERSION = 'shedithers-v2.7.2';
const SHELL = ['./', 'index.html', 'archive.html', 'css/archive.css', 'css/archive-plus.css', 'css/archive-edit.css', 'css/archive-portal.css', 'css/archive-artui.css', 'css/archive-pop.css', 'js/archive-pop.js', 'js/archive-watch.js', 'js/archive-portal.js', 'js/archive-artui.js', 'js/archive.js', 'js/archive-plus.js', 'js/archive-mess.js', 'js/archive-cute.js', 'css/archive-cute.css', 'css/archive-mess.css', 'manifest.webmanifest', 'css/app.css', 'css/skin-chrome.css', 'css/textures.css', 'js/engine.js', 'js/presets.js', 'js/util.js', 'js/app.js', 'js/panels.js', 'js/timeline.js', 'js/gif.js', 'js/brush.js', 'js/tools.js', 'js/export.js', 'js/config.js', 'js/support.js', 'js/artworks.js', 'js/intro.js', 'js/exhibit.js', 'css/exhibit.css', 'js/boot.js', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png'];
// install never fails because of one missing file
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const clean = async r => (r && r.redirected) ? new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers }) : r;
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url), cdn = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.host);
  if (url.origin !== location.origin && !cdn) return;
  // pages: let the browser follow redirects itself (e.g. /art → archive); cached copy only when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(async () => clean(await caches.match(req, { ignoreSearch: true }) || await caches.match('archive.html') || await caches.match('index.html')) || Response.error()));
    return;
  }
  // files: network-first (always fresh when online), cache fallback offline
  const fresh = url.origin === location.origin ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(fresh.then(async res => { if (res.ok && (res.type === 'basic' || res.type === 'cors')) { const cp = await clean(res.clone()); caches.open(VERSION).then(c => c.put(req, cp)); } return clean(res); }).catch(async () => clean(await caches.match(req, { ignoreSearch: true })) || Response.error()));
});
