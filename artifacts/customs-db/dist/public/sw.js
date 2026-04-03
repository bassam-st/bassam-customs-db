/**
 * Service Worker - PWA Support
 * مخزن البنود الجمركية
 */
const CACHE_NAME = "customs-db-v2";
const BASE_PATH = "/bassam-customs-db/";
const SHELL_ASSETS = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json"
];

// تثبيت: حفظ الأصول الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// تنشيط: حذف الكاشات القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// طلبات الشبكة
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الطلبات الخارجية
  if (url.origin !== self.location.origin) return;

  // تجاهل أي طلب غير GET
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.headers.get("accept")?.includes("text/html")) {
            return (
              caches.match(BASE_PATH + "index.html") ||
              new Response("Offline", { status: 503 })
            );
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});
