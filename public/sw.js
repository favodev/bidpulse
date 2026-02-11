const CACHE_VERSION = 3;
const CACHE_NAME = `bidpulse-v${CACHE_VERSION}`;
const STATIC_ASSETS = ["/manifest.json", "/assets/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API routes or auth-related requests
  if (url.pathname.startsWith("/api/")) return;

  // Never cache Next.js build bundles (they have hashed filenames and should be fetched fresh)
  if (url.pathname.startsWith("/_next/")) return;

  // Static assets: cache-first
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // All other requests: network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (request.mode === "navigate") {
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BidPulse - Offline</title><style>body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}h1{font-size:1.5rem}p{color:#94a3b8;margin-top:0.5rem}button{margin-top:1rem;padding:0.5rem 1rem;border:1px solid #334155;background:#1e293b;color:#fff;border-radius:0.5rem;cursor:pointer}</style></head><body><div><h1>Sin conexión</h1><p>Revisa tu conexión a internet e intenta de nuevo.</p><button onclick="location.reload()">Reintentar</button></div></body></html>',
              { headers: { "Content-Type": "text/html" } }
            );
          }
          return new Response("Offline", { status: 503 });
        })
      )
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "BidPulse", body: "Tienes una nueva notificación" };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback to defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "BidPulse", {
      body: data.body || data.message || "",
      icon: "/assets/logo.png",
      badge: "/assets/logo.png",
      data: data.data || {},
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
