/* Service worker de Dix Doigts : garde l'application disponible hors ligne. */
const VERSION = 'dix-doigts-e5bf858a3bc3';
const FILES = ["./index.html","./manifest.webmanifest","./fonts/bricolage-grotesque-600-latin-ext.woff2","./fonts/bricolage-grotesque-600-latin.woff2","./fonts/fonts.css","./fonts/ibm-plex-mono-400-latin-ext.woff2","./fonts/ibm-plex-mono-400-latin.woff2","./fonts/ibm-plex-mono-500-latin-ext.woff2","./fonts/ibm-plex-mono-500-latin.woff2","./fonts/ibm-plex-mono-600-latin-ext.woff2","./fonts/ibm-plex-mono-600-latin.woff2","./fonts/ibm-plex-sans-400-latin-ext.woff2","./fonts/ibm-plex-sans-400-latin.woff2","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('dix-doigts-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // la page : d'abord le réseau, pour avoir la dernière version ; sinon la copie gardée
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 4000);
        const res = await fetch(req.url, { signal: ctl.signal, cache: 'no-cache' });
        clearTimeout(timer);
        if (res.ok) { cache.put('./index.html', res.clone()); return res; }
      } catch (err) { /* hors ligne ou trop lent */ }
      return (await cache.match('./index.html')) || Response.error();
    })());
    return;
  }
  // polices, icônes, manifeste : la copie gardée d'abord
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
