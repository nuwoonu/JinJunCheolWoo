const CACHE_NAME = 'schoolmate-v1';

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
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
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
