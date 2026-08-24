const CACHE_NAME = "rar-rc28-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./hero-rc21.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);

  // HTML / navigation: network first so a newly deployed RC is visible immediately.
  if (request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Static assets: cache first.
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
    )
  );
});
