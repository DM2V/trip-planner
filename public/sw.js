// Bumping the name makes the activate step below discard older caches, including v1, which also
// kept every map tile and the Supabase/API responses it ever saw.
const CACHE_NAME = "trip-planner-v2";
// Pages, RSC payloads and each deploy's build assets pile up; keep only the most recent.
const MAX_ENTRIES = 150;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function remember(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  // Keys come back oldest first, and put() moves a re-fetched URL to the end.
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((key) => cache.delete(key)));
}

// Network-first, falling back to cache — keeps trip data fresh while online, but still
// returns the last-seen page/assets if connectivity drops mid-trip (e.g. in the subway).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Only this app's own pages and assets. Map tiles and Supabase live on other origins (tiles
  // alone would grow the cache without limit), and API and auth responses are answers to one
  // request, not pages worth showing offline. Also skips browser-extension URLs, which the
  // Cache API rejects.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) event.waitUntil(remember(request, response.clone()).catch(() => {}));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
