// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'Fitness Tracker Reminder'
  const options = {
    body: data.body || 'You have a new reminder',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'fitness-reminder',
    requireInteraction: false,
    data: data.url || '/dashboard',
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data || '/dashboard')
  )
})

