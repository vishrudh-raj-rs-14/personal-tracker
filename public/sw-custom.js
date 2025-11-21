// Custom service worker code that will be injected into VitePWA's service worker
// This file contains push notification handlers

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
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

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data || '/dashboard')
  )
})

