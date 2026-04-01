/**
 * Service Worker - PWA Support
 * مخزن البنود الجمركية
 */
const CACHE_NAME = 'customs-db-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
];

// تثبيت: حفظ الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// تنشيط: حذف الكاشات القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// طلبات الشبكة: Cache-first للأصول، Network-first للـ API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات Firebase وخارجية
  if (url.origin !== self.location.origin) return;

  // تجاهل طلبات API
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // كاش الاستجابات الناجحة فقط
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // عند انقطاع الشبكة، إرجاع الصفحة الرئيسية للـ SPA
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html') ?? new Response('Offline', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
