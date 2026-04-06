// GritCore Service Worker — cache-first offline strategy
// Bump CACHE version after any code change to force clients to update.
const CACHE = 'gc-sw-v1';

const ASSETS = [
  './',
  './gritcore.css',
  './gritcore.js',
  './config.js',
  './paywall.js',
  './marble-interpolator.js',
  './notifications.js',
  './img/marble.jpg',
  './img/icon-192.png',
  './img/icon-512.png',
  './fonts/fonts.css',
  './fonts/cormorant-garamond-v21-latin-600.woff2',
  './fonts/cormorant-garamond-v21-latin-600italic.woff2',
  './fonts/cormorant-garamond-v21-latin-700.woff2',
  './fonts/cormorant-garamond-v21-latin-italic.woff2',
  './fonts/cormorant-garamond-v21-latin-regular.woff2',
  './fonts/josefin-sans-v34-latin-300.woff2',
  './fonts/josefin-sans-v34-latin-600.woff2',
  './fonts/josefin-sans-v34-latin-regular.woff2',
];

// Install: pre-cache all assets, activate immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches, take control of open tabs
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first; on miss fetch + cache; on network failure serve shell
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./'));
    })
  );
});
