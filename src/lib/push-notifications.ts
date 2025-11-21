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
export async function requestPushPermission(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser')
    return null
  }

  try {
    // Check if already subscribed
    const registration = await navigator.serviceWorker.ready
    const existingSubscription = await registration.pushManager.getSubscription()
    
    if (existingSubscription) {
      // Already subscribed, save to database
      await saveSubscriptionToDatabase(existingSubscription)
      return existingSubscription
    }

    // Request permission
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Push notification permission denied')
      return null
    }

    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    
    if (!vapidPublicKey) {
      console.warn('VAPID public key not configured')
      return null
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    })

    // Save subscription to database
    await saveSubscriptionToDatabase(subscription)

    return subscription
  } catch (error) {
    console.error('Error requesting push permission:', error)
    return null
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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
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

