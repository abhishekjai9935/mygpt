// MyGPT service worker: caches the app shell so the interface can reload
// while offline once it has been visited online at least once. It never
// touches the local AI model itself — Chrome manages that separately.
const CACHE_NAME = "mygpt-shell-v1";
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/how-it-works",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return (await caches.match("/offline")) ?? Response.error();
          }
          return Response.error();
        });

      return cached || networkFetch;
    })
  );
});
