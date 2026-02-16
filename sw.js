const CACHE_NAME = 'fahrzeit-alarm-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/me.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.error('Cache failed:', error))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {

  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {

            // Only cache valid responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));

            return networkResponse;
          })
          .catch(() => {
            // Optional: fallback page
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
