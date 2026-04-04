self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('cc-v1').then((cache) =>
      cache.addAll(['/', '/offline.html'])
    )
  )
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
