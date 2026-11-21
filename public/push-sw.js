/* LOCK IN — push handlers, imported into the generated service worker */
self.addEventListener('push', (event) => {
  let d = {}
  try {
    d = event.data ? event.data.json() : {}
  } catch {
    d = { body: event.data && event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(d.title || 'LOCK IN', {
      body: d.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: d.tag,
      data: { url: d.url || './' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          if ('navigate' in w) w.navigate(url).catch(() => {})
          return w.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
