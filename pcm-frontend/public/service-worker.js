/* Minimal service worker for CRA app
 * Caches app shell and serves cached assets offline.
 * Avoid caching API/POST requests to prevent auth or data loops.
 */
const CACHE_NAME = 'pcm-cache-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/site.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined))
      )
    )
  );
  self.clients.claim();
});

// Network-first for navigation; cache-first for same-origin static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Always pass through non-GET (e.g., POST/PUT) and any API calls
  const isApi = url.pathname.startsWith('/api/');
  const isNonGet = req.method !== 'GET';
  const isSocket = url.pathname.startsWith('/socket.io');

  if (isApi || isNonGet || isSocket) {
    return; // let the network handle it; no caching
  }

  // Network-first for navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
      )
    );
  }
});
