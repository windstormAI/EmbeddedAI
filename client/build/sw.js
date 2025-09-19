/**
 * Service Worker for Embedded Platform PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'embedded-platform-v1.0.0';
const STATIC_CACHE = 'embedded-platform-static-v1.0.0';
const DYNAMIC_CACHE = 'embedded-platform-dynamic-v1.0.0';
const API_CACHE = 'embedded-platform-api-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/components',
  '/api/users'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE &&
                !cacheName.startsWith('embedded-platform-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(request.url)) {
      // Cache-first strategy for static assets
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isApiRequest(request.url)) {
      // Network-first strategy for API requests
      event.respondWith(networkFirst(request, API_CACHE));
    } else if (isImageRequest(request.url)) {
      // Cache-first with fallback for images
      event.respondWith(cacheFirstWithFallback(request, DYNAMIC_CACHE));
    } else {
      // Network-first with offline fallback for pages
      event.respondWith(networkFirstWithOffline(request, DYNAMIC_CACHE));
    }
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync-projects') {
    event.waitUntil(syncProjects());
  } else if (event.tag === 'background-sync-circuits') {
    event.waitUntil(syncCircuits());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Embedded Platform', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Helper functions

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('.js') ||
         url.includes('.css') ||
         url.includes('.woff') ||
         url.includes('.woff2');
}

function isApiRequest(url) {
  return url.includes('/api/') &&
         !url.includes('/api/auth/') &&
         !url.includes('/api/stripe/');
}

function isImageRequest(url) {
  return url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.jpeg') ||
         url.includes('.gif') ||
         url.includes('.svg') ||
         url.includes('.webp');
}

// Cache strategies

async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirstWithFallback(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first with fallback failed:', error);
    // Return a placeholder image or offline indicator
    return new Response('', { status: 503 });
  }
}

async function networkFirstWithOffline(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving offline page:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Background sync functions

async function syncProjects() {
  try {
    console.log('[SW] Syncing projects...');
    const cache = await caches.open('sync-projects');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.log('[SW] Failed to sync project:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Project sync failed:', error);
  }
}

async function syncCircuits() {
  try {
    console.log('[SW] Syncing circuits...');
    const cache = await caches.open('sync-circuits');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.log('[SW] Failed to sync circuit:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Circuit sync failed:', error);
  }
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-sync') {
      event.waitUntil(syncContent());
    }
  });
}

async function syncContent() {
  try {
    console.log('[SW] Periodic content sync...');
    // Sync any pending content updates
    const cache = await caches.open('content-sync');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.log('[SW] Failed to sync content:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Content sync failed:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});