import { supabase } from './supabase'

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Request push notification permission and subscribe user
 */
export async function requestPushPermission(): Promise<{ subscription: PushSubscription | null; error?: string }> {
  if (!('serviceWorker' in navigator)) {
    return { subscription: null, error: 'Service workers are not supported in this browser' }
  }

  // For iOS Safari, PushManager might not be on window, but available through service worker
  // So we check by trying to access it through the service worker registration
  let hasPushSupport = false
  let isIOS = false
  try {
    const registration = await navigator.serviceWorker.ready
    // Try to access pushManager - if it exists, push is supported
    hasPushSupport = 'pushManager' in registration
    // Check if iOS
    isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  } catch (error) {
    // If we can't get service worker, check window as fallback
    hasPushSupport = 'PushManager' in window
    isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  }

  if (!hasPushSupport) {
    // Check if it's iOS Safari - give more helpful message
    if (isIOS) {
      // Check if running as PWA (standalone mode)
      const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
      if (!isStandalone) {
        return { 
          subscription: null, 
          error: 'Push notifications on iOS require the app to be installed as a PWA. Please tap the Share button → "Add to Home Screen", then open the app from your home screen.' 
        }
      }
      return { 
        subscription: null, 
        error: 'Push notifications are not available. Make sure you\'re using iOS 16.4+ and have the app installed from the home screen.' 
      }
    }
    return { subscription: null, error: 'Push notifications are not supported in this browser' }
  }

  // Check Notification API
  if (!('Notification' in window)) {
    // On iOS, Notification might not be on window but still available
    // We'll try to use it anyway and catch the error
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (!isIOS) {
      return { subscription: null, error: 'Notification API is not available' }
    }
  }

  try {
    // Wait for service worker to be ready
    let registration: ServiceWorkerRegistration
    try {
      registration = await navigator.serviceWorker.ready
    } catch (error) {
      return { 
        subscription: null, 
        error: 'Service worker not registered. Please refresh the page and try again.' 
      }
    }

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    
    if (existingSubscription) {
      // Already subscribed, save to database
      try {
        await saveSubscriptionToDatabase(existingSubscription)
        return { subscription: existingSubscription }
      } catch (error: any) {
        return { subscription: null, error: `Failed to save subscription: ${error.message}` }
      }
    }

    // Request permission
    // On iOS Safari, Notification API might not be on window but still work
    let permission: NotificationPermission = 'default'
    try {
      if ('Notification' in window && typeof Notification.requestPermission === 'function') {
        permission = await Notification.requestPermission()
      } else {
        // For iOS Safari in PWA mode, Notification might work even if not on window
        // Try to proceed with subscription - if it fails, we'll catch it
        // iOS Safari might allow push without explicit Notification.requestPermission
        permission = 'default' // We'll try to subscribe anyway
      }
    } catch (error: any) {
      // If Notification API is truly not available, we can't proceed
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        return { 
          subscription: null, 
          error: 'Notification API is not available. Make sure the app is installed as a PWA (Add to Home Screen) and you\'re using iOS 16.4+.' 
        }
      }
      return { 
        subscription: null, 
        error: `Failed to request notification permission: ${error.message || 'Unknown error'}` 
      }
    }
    
    if (permission !== 'granted') {
      if (permission === 'denied') {
        return { 
          subscription: null, 
          error: 'Notifications are blocked. Please enable them in your browser/device settings and try again.' 
        }
      }
      return { 
        subscription: null, 
        error: 'Notification permission was not granted. Please allow notifications when prompted.' 
      }
    }

    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    
    if (!vapidPublicKey) {
      return { 
        subscription: null, 
        error: 'VAPID public key not configured. Please contact support.' 
      }
    }

    // Convert VAPID key to Uint8Array
    let applicationServerKey: Uint8Array
    try {
      applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
    } catch (error) {
      return { 
        subscription: null, 
        error: 'Invalid VAPID key format. Please contact support.' 
      }
    }

    // Subscribe to push notifications
    let subscription: PushSubscription
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      })
    } catch (error: any) {
      console.error('Subscription error:', error)
      if (error.name === 'NotAllowedError') {
        return { 
          subscription: null, 
          error: 'Subscription not allowed. Please check your browser settings.' 
        }
      }
      return { 
        subscription: null, 
        error: `Failed to subscribe: ${error.message || 'Unknown error'}` 
      }
    }

    // Save subscription to database
    try {
      await saveSubscriptionToDatabase(subscription)
      return { subscription }
    } catch (error: any) {
      // Subscription created but failed to save - unsubscribe to clean up
      try {
        await subscription.unsubscribe()
      } catch {}
      return { 
        subscription: null, 
        error: `Failed to save subscription: ${error.message}` 
      }
    }
  } catch (error: any) {
    console.error('Error requesting push permission:', error)
    return { 
      subscription: null, 
      error: `Unexpected error: ${error.message || 'Unknown error'}` 
    }
  }
}

/**
 * Save push subscription to database
 */
async function saveSubscriptionToDatabase(subscription: PushSubscription): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const subscriptionData: PushSubscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!),
    },
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscriptionData.endpoint,
      p256dh: subscriptionData.keys.p256dh,
      auth: subscriptionData.keys.auth,
    }, {
      onConflict: 'user_id,endpoint',
    })

  if (error) {
    console.error('Error saving push subscription:', error)
    throw error
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      
      // Remove from database
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
      }
    }
  } catch (error) {
    console.error('Error unsubscribing from push:', error)
  }
}

/**
 * Check if user has push notification permission
 */
export async function hasPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }
  return Notification.permission === 'granted'
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    // Check if pushManager is available (might not be on window for iOS)
    if (!('pushManager' in registration)) {
      return false
    }
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch (error) {
    return false
  }
}

/**
 * Convert VAPID key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

