// Use this service worker's scope, not the domain root.
// GitHub Pages hosts project sites under /<repository>/.
const CACHE = 'acc-bts-shell-v4';
const BASE = new URL(self.registration.scope);
const SHELL = [
  '', 'index.html', 'manifest.webmanifest', 'icon.svg',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'src/style.css', 'src/app.js', 'src/seed.js', 'config.js'
].map(path => new URL(path, BASE).href);
const FALLBACK = new URL('index.html', BASE).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('acc-bts-shell-') && key !== CACHE)
      .map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  event.respondWith(
    fetch(req).then(response => {
      if (response.ok && (req.mode === 'navigate' || SHELL.includes(req.url))) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(req);
      return cached || (req.mode === 'navigate' ? caches.match(FALLBACK) : Response.error());
    })
  );
});
