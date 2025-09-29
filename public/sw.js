const CACHE_VERSION = 'v3';
const STATIC_CACHE = `buscaaquibdc-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `buscaaquibdc-dynamic-${CACHE_VERSION}`;

// Environment detection
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Cache Strategy: Cache First for static assets, Network First for dynamic content
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

const API_ENDPOINTS = [
  '/api/dashboard/stats',
  '/api/ads',
  '/api/profile/complete',
  '/api/anuncios'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('buscaaquibdc-') && 
              ![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension URLs and external APIs
  if (shouldSkipRequest(url)) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, '/offline'));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache strategies
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // In development, be less aggressive with caching
    if (isDevelopment) {
      const response = await fetch(request);
      // Only cache if response is OK and not from dev server hot reloading
      if (response.ok && !request.url.includes('_next/webpack-hmr')) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone()).catch(() => {
          // Silently handle cache errors in development
          console.debug('Cache put failed for:', request.url);
        });
      }
      return response;
    } else {
      // Production: cache aggressively
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    }
  } catch (error) {
    console.warn('Cache first failed for:', request.url, error);
    // Try to return cached version if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return a fallback response
    return new Response('Resource not available offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

async function networkFirst(request, fallbackUrl = null) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (fallbackUrl) {
      return caches.match(fallbackUrl);
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Skip caching for unsupported schemes
  const url = new URL(request.url);
  if (shouldSkipCaching(url)) {
    try {
      return await fetch(request);
    } catch (error) {
      return cachedResponse || new Response('Service Unavailable', { status: 503 });
    }
  }
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok && !shouldSkipCaching(url)) {
      cache.put(request, response.clone()).catch(() => {
        // Silently handle cache errors for unsupported schemes
      });
    }
    return response;
  }).catch(() => {
    // Return cached response on network error
    return cachedResponse || new Response('Service Unavailable', { status: 503 });
  });

  return cachedResponse || fetchPromise;
}

// Helper functions
function shouldSkipRequest(url) {
  // Skip chrome-extension URLs
  if (url.protocol === 'chrome-extension:') {
    return true;
  }
  
  // Skip external APIs that don't support CORS
  if (url.hostname === 'www.asaas.com' && url.pathname.startsWith('/api/')) {
    return true;
  }
  
  // Skip other browser extension schemes
  if (['moz-extension:', 'safari-extension:', 'edge-extension:'].includes(url.protocol)) {
    return true;
  }

  // Skip Next.js development resources that commonly fail
  if (isDevelopment) {
    const problematicPaths = [
      '/_next/webpack-hmr',
      '/_next/static/webpack/',
      '/_next/static/chunks/',
      '/webpack.js',
      '/main-app.js',
      '/app-pages-internals.js',
      '/layout.css',
      '/layout.js',
      '/page.js'
    ];

    if (problematicPaths.some(path => url.pathname.includes(path))) {
      return true;
    }
  }

  // Skip any Next.js chunks and dynamic imports
  if (url.pathname.includes('/_next/static/chunks/') ||
      url.pathname.includes('/_next/static/css/') ||
      url.pathname.endsWith('.hot-update.js') ||
      url.pathname.endsWith('.hot-update.json')) {
    return true;
  }
  
  return false;
}

function shouldSkipCaching(url) {
  // Don't cache chrome-extension URLs or external APIs
  return shouldSkipRequest(url);
}

function isStaticAsset(url) {
  return url.pathname.includes('/images/') || 
         url.pathname.includes('/icons/') || 
         url.pathname.includes('/_next/static/');
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') && url.hostname === self.location.hostname;
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when back online
  try {
    const offlineActions = await getOfflineActions();
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
    await clearOfflineActions();
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: data.url || '/'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/icons/check.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BuscaAquiBdC', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Utility functions for offline storage
async function getOfflineActions() {
  // Implementation for retrieving offline actions from IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // Implementation for processing offline actions
  console.log('Processing offline action:', action);
}

async function clearOfflineActions() {
  // Implementation for clearing processed offline actions
  console.log('Clearing offline actions');
} 