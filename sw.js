const CACHE_NAME = 'suptemiz-v1';
const urlsToCache = [
  '/suptemiz/',
  '/suptemiz/index.html',
  '/suptemiz/manifest.json',
  '/suptemiz/icons/icon-72.png',
  '/suptemiz/icons/icon-96.png',
  '/suptemiz/icons/icon-128.png',
  '/suptemiz/icons/icon-144.png',
  '/suptemiz/icons/icon-152.png',
  '/suptemiz/icons/icon-192.png',
  '/suptemiz/icons/icon-384.png',
  '/suptemiz/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});
