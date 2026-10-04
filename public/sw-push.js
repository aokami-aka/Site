// Service Worker Web Push & Notification Click Handler for AnimeGuides

// 1. Background Web Push Event Listener (Receives notifications when app is closed!)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {
        title: 'AnimeGuides',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'AnimeGuides • Novo Episódio!';
  const options = {
    body: data.body || 'Confira os novos lançamentos de animes de hoje!',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || `animeguides-${Date.now()}`,
    renotify: true,
    vibrate: [140, 70, 160],
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Periodic Background Sync (Optional browser wake-up mechanism)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-anime-airing') {
    event.waitUntil(
      fetch('/api/push/sync-subscriptions')
        .then((res) => res.json())
        .catch(() => {})
    );
  }
});

// 3. Notification Click Handler: Opens/focuses the app and navigates to the anime
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const animeId = data.animeId;
  const year = data.year;
  const season = data.season;

  let targetPath = '/';
  if (data.url) {
    targetPath = data.url;
  } else if (animeId) {
    const params = new URLSearchParams();
    params.set('view', 'season');
    if (year) params.set('year', String(year));
    if (season) params.set('season', String(season));
    params.set('animeId', String(animeId));
    targetPath = `/?${params.toString()}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if (client.navigate) {
            return client.navigate(targetPath);
          } else {
            client.postMessage({
              type: 'OPEN_ANIME_DETAILS',
              animeId,
              year,
              season,
              url: targetPath,
            });
            return;
          }
        }
      }

      // If no window is currently open, open a new window to the target path
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});
