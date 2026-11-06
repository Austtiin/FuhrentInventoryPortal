// Serve loaded blob images immediately while refreshing them in the background.
const CACHE_NAME = 'blob-image-cache-v3';
const MAX_IMAGES = 200;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await caches.delete('blob-image-cache-v2');
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isImage = req.destination === 'image';
  const isBlob = /blob\.core\.windows\.net/i.test(url.hostname);

  if (!isImage || !isBlob) {
    return; // don't intercept non-blob images
  }

  const response = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const update = async () => {
      const fresh = await fetch(req, { cache: 'no-cache' });
      if (fresh.ok || fresh.type === 'opaque') {
        await cache.put(req, fresh.clone());
        const keys = await cache.keys();
        for (const key of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) {
          await cache.delete(key);
        }
      }
      return fresh;
    };
    if (cached) {
      event.waitUntil(update().catch((error) => {
        console.warn('Background image refresh failed:', error);
      }));
      return cached;
    }
    return update();
  })();
  event.respondWith(response);
});

// Listen for messages to clear cache on demand (e.g., page refresh)
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'refresh-images') {
    event.waitUntil(
      (async () => {
        await caches.delete(CACHE_NAME);
      })()
    );
  }
});
