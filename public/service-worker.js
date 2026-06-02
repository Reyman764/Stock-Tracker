/* Stock Tracker — Service Worker (offline + online support)
   Strategy: Network-first with cache fallback.
   - Online : fetches from network, updates cache silently.
   - Offline: serves from cache if available.
*/

const CACHE_NAME = "stock-tracker-cache-v1";

// On install — pre-cache the app shell (just the root; assets are cached on first visit)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(["/"]))
  );
  self.skipWaiting();
});

// On activate — purge old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// On fetch — network first, fall back to cache
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin resources
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      fetch(event.request)
        .then((networkResponse) => {
          // Cache a clone of every successful response
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() =>
          // Network failed — try cache
          cache.match(event.request).then(
            (cached) =>
              cached ||
              new Response("Offline – page not cached yet.", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              })
          )
        )
    )
  );
});
