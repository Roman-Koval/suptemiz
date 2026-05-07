const CACHE_NAME = 'suptemiz-v2.1';
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// Install — кэшируем основные файлы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SupTemiz: Кэширование ресурсов...');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate — очистка старых кэшей
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch — стратегия Cache First + Network fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кэша если есть
                if (response) {
                    return response;
                }

                // Если нет — идём в сеть
                return fetch(event.request).then(
                    networkResponse => {
                        // Не кэшируем запросы к Firebase
                        if (!event.request.url.includes('firebase')) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    }
                );
            }).catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('index.html');
                }
            })
    );
});

// Push notifications (готовность)
self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body || 'Новое уведомление от SupTemiz',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SupTemiz', options)
    );
});
