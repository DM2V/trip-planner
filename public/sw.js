const CACHE_NAME = "trip-planner-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first, falling back to cache — keeps trip data fresh while online, but still
// returns the last-seen page/assets if connectivity drops mid-trip (e.g. in the subway).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Browser extensions (ad blockers, password managers, ...) can route their own requests
  // through this page's service worker. The Cache API only accepts http(s) requests — trying
  // to cache a chrome-extension:// (or similar) one throws, so skip anything that isn't ours.
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
