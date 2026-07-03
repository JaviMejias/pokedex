const CACHE_NAME = 'pokedex-pro-v2';
const API_CACHE_NAME = 'pokedex-api-v2';
const IMAGE_CACHE_NAME = 'pokedex-images-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const POKEAPI_ORIGIN = 'https://pokeapi.co';
const SPRITE_ORIGINS = [
  'https://raw.githubusercontent.com',
  'https://pokeapi.co',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME && name !== IMAGE_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (SPRITE_ORIGINS.some(o => url.origin === new URL(o).origin) && isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
    return;
  }

  if (url.origin === POKEAPI_ORIGIN) {
    event.respondWith(networkFirstWithCache(request, API_CACHE_NAME));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  event.respondWith(cacheFirst(request, CACHE_NAME));
});

function isImageRequest(request) {
  return request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(new URL(request.url).pathname);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && response.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso no disponible offline', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Sin conexión' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function navigationHandler(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match('/index.html');
    return cached || new Response('App no disponible offline', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CHECK_UPDATE') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_UPDATED' });
      });
    });
  }
});
