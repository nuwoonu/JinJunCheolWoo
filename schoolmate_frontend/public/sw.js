const CACHE_NAME = 'schoolmate-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
<<<<<<< HEAD
  if (event.request.url.includes('/api/')) return;
  // GET 요청만 처리 (POST 등은 서비스 워커가 간섭하지 않음)
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached ?? fetch('/index.html'))
=======
  const url = new URL(event.request.url);
  // API 요청 및 Vite 개발 서버 경로는 서비스 워커 개입 없이 통과
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(
        (cached) => cached || new Response('Service Unavailable', { status: 503 })
      )
>>>>>>> developMerge
    )
  );
});

// ── 푸쉬 알림 수신 ──
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'SchoolMate 알림', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'SchoolMate 알림';
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/pwa-icon-512.svg',
    badge: '/images/pwa-icon-512.svg',
    data: { actionUrl: (data.data && data.data.actionUrl) ? data.data.actionUrl : '/hub' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── 알림 클릭 시 해당 페이지로 이동 ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = (event.notification.data && event.notification.data.actionUrl)
    ? event.notification.data.actionUrl
    : '/hub';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(actionUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
