// Service Worker — Cache busting + offline support
const CACHE_VERSION = 'v2026-03-22f';
const CACHE_NAME = `vikuplan-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/charts.js',
  './js/views/daily.js',
  './js/views/inbox.js',
  './js/views/checkin.js',
  './js/views/timeline.js',
  './js/views/history.js',
  './js/views/reflection.js',
  './js/views/yfirlit.js',
  './js/views/vd.js',
  './js/views/personal.js',
  './manifest.json'
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('vikuplan-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
  // Notify all clients that a new version is active
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
  });
});

// Fetch: network-first for data, stale-while-revalidate for app shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Data files: always go to network first (they have ?t= cache bust already)
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const fetched = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetched;
      })
    )
  );
});
