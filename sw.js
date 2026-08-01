const CACHE_NAME = 'halde-guide-v2';

// Alle Dateien die gecacht werden sollen
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
  // Falls du extra CSS/JS/Bild-Dateien hast, hier ergänzen:
  // '/style.css',
  // '/logo.png',
];

// Installation: alle Dateien in den Cache laden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivierung: alten Cache löschen wenn neue Version kommt
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: erst Cache, dann Netzwerk (Offline-first)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CMS-Inhalte immer zuerst aktuell vom Netz laden. Nur offline den Cache nutzen.
  if (url.pathname.startsWith('/content/') || url.pathname.startsWith('/admin/')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // aus Cache laden
      }
      return fetch(event.request).then((response) => {
        // neue Ressource auch in Cache speichern
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        // Wenn komplett offline: Fallback zur Hauptseite
        return caches.match('/index.html');
      });
    })
  );
});
