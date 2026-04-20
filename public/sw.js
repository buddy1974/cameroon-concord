self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('cc-v1').then((cache) =>
      cache.addAll(['/', '/offline.html'])
    )
  )
})

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Cameroon Concord'
  const options = {
    body:  data.body || '',
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data:  { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone()
        caches.open('cc-v1').then((cache) => cache.put(e.request, clone))
        return res
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached || caches.match('/offline.html'))
      )
  )
})
