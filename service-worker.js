
const CACHE_NAME = 'kalimat-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/ibtikar.GIF',
  '/malem.jpeg',
  "/ramadan.jpeg",
  "/sabar.jpeg",
  "/kadr.jpg",
  "/fonoun.jpg"

];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        // Optionally cache new requests
        return res;
      }).catch(() => cached);
    })
  );
});
