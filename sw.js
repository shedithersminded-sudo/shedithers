/* SHEDITHERS service worker — offline app shell. Bump VERSION when files change. */
const VERSION = 'shedithers-v1.2.2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/engine.js', 'js/presets.js', 'js/util.js', 'js/app.js', 'js/panels.js', 'js/timeline.js', 'js/gif.js', 'js/brush.js', 'js/export.js', 'js/config.js', 'js/support.js', 'js/boot.js', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/art/collage.png', 'assets/art/01M.mp4'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url), cdn = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.host);
  if (url.origin !== location.origin && !cdn) return;
  // network-first for app files (always fresh when online), cache fallback offline
  e.respondWith(fetch(req).then(res => { if (res.ok && (res.type === 'basic' || res.type === 'cors')) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
