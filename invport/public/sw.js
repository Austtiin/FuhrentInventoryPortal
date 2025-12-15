// Simple service worker to cache blob images. No auto-refresh.
const CACHE_NAME = 'blob-image-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isImage = req.destination === 'image';
  const isBlob = /blob\.core\.windows\.net/i.test(url.hostname);

  if (!isImage || !isBlob) {
    return; // don't intercept non-blob images
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) {
      // Serve cached without background refresh
      return cached;
    }

    // Not cached yet: fetch and store
    try {
      const resp = await fetch(req);
      if (resp && resp.ok) {
        const cloned = resp.clone();
        await cache.put(req, cloned);
        return resp;
      }
    } catch (e) {
      // network error: fall back to network default behavior
    }
    return fetch(req);
  })());
});

// Listen for messages to clear cache on demand (e.g., page refresh)
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'refresh-images') {
    event.waitUntil(
      (async () => {
        try {
          await caches.delete(CACHE_NAME);
        } catch {}
      })()
    );
  }
});
