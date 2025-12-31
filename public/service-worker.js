// Enhanced Service Worker for Always-Online Music Player
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `music-player-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `music-player-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `music-player-images-${CACHE_VERSION}`;
const API_CACHE = `music-player-api-${CACHE_VERSION}`;

// Critical assets to cache immediately for offline use
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg'
];

// Maximum cache sizes
const MAX_IMAGE_CACHE_SIZE = 100;
const MAX_API_CACHE_SIZE = 50;
const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event - pre-cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old cache versions
            return name.startsWith('music-player-') && !name.endsWith(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// Helper: Check if cache is expired
function isCacheExpired(cachedResponse) {
  const cachedDate = new Date(cachedResponse.headers.get('date'));
  const now = new Date();
  return (now - cachedDate) > CACHE_EXPIRY_TIME;
}

// Strategy: Cache First (for static assets)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse && !isCacheExpired(cachedResponse)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Strategy: Network First with fallback (for API calls)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_API_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Strategy: Stale While Revalidate (for images)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // YouTube API calls - Network First
  if (url.hostname.includes('youtube.com') || url.hostname.includes('googleapis.com')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // YouTube thumbnails - Stale While Revalidate
  if (url.hostname.includes('ytimg.com') || url.hostname.includes('ggpht.com')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Images - Stale While Revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // API requests - Network First
  if (url.pathname.includes('/api/') || request.mode === 'cors') {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Navigation requests - Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/') || new Response('Offline', { status: 503 }))
    );
    return;
  }

  // CSS, JS, fonts - Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default - Network First
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-playback') {
    event.waitUntil(syncPlaybackData());
  }
});

async function syncPlaybackData() {
  // Sync any pending playback data when back online
  console.log('[Service Worker] Syncing playback data...');
}

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCacheInBackground());
  }
});

async function updateCacheInBackground() {
  console.log('[Service Worker] Updating cache in background...');
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(PRECACHE_ASSETS);
}

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});

// Keep service worker alive
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
});

// Monitor online/offline status
self.addEventListener('online', () => {
  console.log('[Service Worker] Back online');
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'ONLINE' });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('[Service Worker] Gone offline');
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'OFFLINE' });
    });
  });
});

console.log('[Service Worker] Loaded and ready');
