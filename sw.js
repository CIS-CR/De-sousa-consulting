const STATIC_CACHE = "desousa-static-v2";
const RUNTIME_CACHE = "desousa-runtime-v2";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/en.html",
  "/pt-br.html",
  "/about/index.html",
  "/styles.css",
  "/app.js",
  "/config.js",
  "/manifest.webmanifest",
  "/assets/favicon-desousa.png",
  "/assets/apple-touch-icon.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable-512.png",
  "/assets/logo-desousa.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !keep.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isHtmlNavigation =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match("/") || caches.match("/index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(async (cached) => {
      if (cached) return cached;

      const res = await fetch(req).catch(() => null);
      if (!res || res.status !== 200) {
        return res || (await caches.match("/")) || (await caches.match("/index.html"));
      }

      const copy = res.clone();
      caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      return res;
    })
  );
});
