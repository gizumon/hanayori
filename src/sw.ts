/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { APP_VERSION } from './sw-version';

declare const self: ServiceWorkerGlobalScope;

const CACHE_PREFIX = 'hanayori';

function getMajorMinor(version: string): string {
  const [major = '0', minor = '1'] = version.split('.');
  return `${major}.${minor}`;
}

const VERSION_KEY = getMajorMinor(APP_VERSION);
const versionedName = (suffix: string) => `${CACHE_PREFIX}-v${VERSION_KEY}-${suffix}`;

self.skipWaiting();
clientsClaim();

// Inject Next.js build manifest (populated by @ducanh2912/next-pwa)
precacheAndRoute(self.__WB_MANIFEST ?? []);
cleanupOutdatedCaches();

// Delete caches whose major.minor differs from the current version
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      const stale = names.filter((name) => {
        if (!name.startsWith(CACHE_PREFIX)) return false;
        const m = name.match(/^hanayori-v(\d+\.\d+)/);
        return m ? m[1] !== VERSION_KEY : true;
      });
      await Promise.all(stale.map((n) => caches.delete(n)));
    })
  );
});

// Navigation: NetworkFirst — serve the cached page offline if the network fails
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: versionedName('pages'),
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 86_400 })],
  })
);

// API routes: NetworkFirst — always attempt fresh, fall back to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: versionedName('api'),
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 3_600 })],
  })
);

// Fonts & images: CacheFirst — long-lived, safe to serve stale
registerRoute(
  ({ request }) => request.destination === 'font' || request.destination === 'image',
  new CacheFirst({
    cacheName: versionedName('static'),
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2_592_000 })],
  })
);
