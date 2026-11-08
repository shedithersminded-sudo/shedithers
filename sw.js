/* SHEDITHERS service worker — offline app shell. Bump VERSION when files change. */
const VERSION = 'shedithers-v2.3.0';
const SHELL = ['./', 'index.html', 'archive.html', 'css/archive.css', 'css/archive-plus.css', 'css/archive-edit.css', 'js/archive.js', 'js/archive-plus.js', 'js/archive-mess.js', 'js/archive-cute.js', 'css/archive-cute.css', 'css/archive-mess.css', 'manifest.webmanifest', 'css/app.css', 'css/skin-chrome.css', 'css/textures.css', 'js/engine.js', 'js/presets.js', 'js/util.js', 'js/app.js', 'js/panels.js', 'js/timeline.js', 'js/gif.js', 'js/brush.js', 'js/tools.js', 'js/export.js', 'js/config.js', 'js/support.js', 'js/artworks.js', 'js/intro.js', 'js/exhibit.js', 'css/exhibit.css', 'js/boot.js', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url), cdn = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.host);
  if (url.origin !== location.origin && !cdn) return;
  // network-first for app files (always fresh when online), cache fallback offline
  const fresh = url.origin === location.origin ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(fresh.then(res => { if (res.ok && (res.type === 'basic' || res.type === 'cors')) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
