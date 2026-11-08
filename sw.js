const CACHE = 'acc-bts-shell-v3';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/src/style.css', '/src/app.js', '/src/seed.js', '/config.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(resp => {
    if (resp.ok && (req.mode === 'navigate' || SHELL.includes(new URL(req.url).pathname))) {
      const copy = resp.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
    }
    return resp;
  }).catch(() => caches.match(req).then(cached => cached || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error()))));
});
