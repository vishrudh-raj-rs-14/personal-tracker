import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useUser, useUpdateUser } from '@/hooks/use-user'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Save, Bell, BellOff } from 'lucide-react'
import { 
  requestPushPermission, 
  unsubscribeFromPush, 
  isSubscribedToPush,
  hasPushPermission 
} from '@/lib/push-notifications'

export function SettingsPage() {
  const { data: user, isLoading } = useUser()
  const updateUser = useUpdateUser()
  const { signOut } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState({
    name: '',
    height_cm: null as number | null,
  })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [checkingPush, setCheckingPush] = useState(true)

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? '',
        height_cm: user.height_cm ?? null,
      })
    }
  }, [user])

  useEffect(() => {
    // Run comprehensive diagnostics when Settings page loads
    runPushNotificationDiagnostics()
    checkPushStatus()
  }, [])

  const runPushNotificationDiagnostics = async () => {
    console.log('🔍 ===== PUSH NOTIFICATION DIAGNOSTICS =====')
    console.log('📱 Device & Browser Info:')
    console.log('  User Agent:', navigator.userAgent)
    console.log('  Platform:', navigator.platform)
    console.log('  Language:', navigator.language)
    console.log('  Cookie Enabled:', navigator.cookieEnabled)
    console.log('  OnLine:', navigator.onLine)
    
    // Check protocol
    console.log('\n🔒 Security:')
    console.log('  Protocol:', window.location.protocol)
    console.log('  Is HTTPS:', window.location.protocol === 'https:')
    console.log('  Host:', window.location.host)
    
    // Check API support
    console.log('\n✅ API Support:')
    console.log('  Service Worker:', 'serviceWorker' in navigator)
    console.log('  PushManager:', 'PushManager' in window)
    console.log('  Notification API:', 'Notification' in window)
    
    // Check Notification permission
    if ('Notification' in window) {
      console.log('  Notification Permission:', Notification.permission)
      // Note: maxActions is experimental and may not be available
      try {
        const maxActions = (Notification as any).maxActions
        if (maxActions !== undefined) {
          console.log('  Notification.maxActions:', maxActions)
        }
      } catch (e) {
        // Ignore if not available
      }
    }
    
    // Check Service Worker
    if ('serviceWorker' in navigator) {
      console.log('\n⚙️ Service Worker Status:')
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          console.log('  ✅ Service Worker Registered')
          console.log('  Scope:', registration.scope)
          console.log('  Active:', registration.active?.scriptURL)
          console.log('  Waiting:', registration.waiting?.scriptURL)
          console.log('  Installing:', registration.installing?.scriptURL)
          
          // Check if service worker is ready
          try {
            const ready = await navigator.serviceWorker.ready
            console.log('  ✅ Service Worker Ready')
            console.log('  Ready Scope:', ready.scope)
          } catch (error) {
            console.log('  ❌ Service Worker Not Ready:', error)
          }
        } else {
          console.log('  ❌ No Service Worker Registration Found')
        }
        
        // Check controller
        if (navigator.serviceWorker.controller) {
          console.log('  ✅ Service Worker Controlling Page')
          console.log('  Controller Script:', navigator.serviceWorker.controller.scriptURL)
        } else {
          console.log('  ⚠️ No Service Worker Controller')
        }
      } catch (error) {
        console.log('  ❌ Error checking service worker:', error)
      }
    }
    
    // Check PushManager
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('\n📲 Push Manager Status:')
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          console.log('  ✅ Already Subscribed')
          console.log('  Endpoint:', subscription.endpoint.substring(0, 50) + '...')
          const keys = subscription.getKey('p256dh')
          const auth = subscription.getKey('auth')
          console.log('  Has p256dh key:', !!keys)
          console.log('  Has auth key:', !!auth)
        } else {
          console.log('  ⚠️ Not Subscribed')
        }
        
        // Check supported content encodings (experimental API)
        try {
          const pushManager = registration.pushManager as any
          const supportedEncodings = pushManager.supportedContentEncodings || []
          if (supportedEncodings.length > 0) {
            console.log('  Supported Encodings:', supportedEncodings)
          }
        } catch (e) {
          // Ignore if not available
        }
      } catch (error) {
        console.log('  ❌ Error checking push manager:', error)
      }
    }
    
    // Check VAPID key
    console.log('\n🔑 VAPID Key:')
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    console.log('  Key exists:', !!vapidKey)
    console.log('  Key length:', vapidKey?.length || 0)
    if (vapidKey) {
      console.log('  Key preview:', vapidKey.substring(0, 30) + '...')
      console.log('  Key format valid:', /^[A-Za-z0-9_-]+$/.test(vapidKey))
    } else {
      console.log('  ❌ VAPID key not configured!')
    }
    
    // Browser detection
    console.log('\n🌐 Browser Detection:')
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isAndroid = /Android/.test(ua)
    const isChrome = /Chrome/.test(ua) && !/Edge|OPR|Edg/.test(ua)
    const isFirefox = /Firefox/.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    const isEdge = /Edg/.test(ua)
    
    console.log('  iOS:', isIOS)
    console.log('  Android:', isAndroid)
    console.log('  Chrome:', isChrome)
    console.log('  Firefox:', isFirefox)
    console.log('  Safari:', isSafari)
    console.log('  Edge:', isEdge)
    
    // iOS version check (rough)
    if (isIOS) {
      const iosVersion = ua.match(/OS (\d+)_(\d+)/)
      if (iosVersion) {
        const major = parseInt(iosVersion[1])
        const minor = parseInt(iosVersion[2])
        console.log('  iOS Version:', `${major}.${minor}`)
        console.log('  Push Support (iOS 16.4+):', major > 16 || (major === 16 && minor >= 4))
      }
    }
    
    // Final summary
    console.log('\n📊 Summary:')
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasPushManager = 'PushManager' in window
    const hasNotification = 'Notification' in window
    const isHTTPS = window.location.protocol === 'https:'
    const hasVAPID = !!vapidKey
    
    console.log('  Service Worker Support:', hasServiceWorker ? '✅' : '❌')
    console.log('  PushManager Support:', hasPushManager ? '✅' : '❌')
    console.log('  Notification API:', hasNotification ? '✅' : '❌')
    console.log('  HTTPS:', isHTTPS ? '✅' : '❌')
    console.log('  VAPID Key:', hasVAPID ? '✅' : '❌')
    
    const allSupported = hasServiceWorker && hasPushManager && hasNotification && isHTTPS && hasVAPID
    console.log('  Overall Support:', allSupported ? '✅ READY' : '❌ NOT READY')
    
    if (!allSupported) {
      console.log('\n⚠️ Issues Found:')
      if (!hasServiceWorker) console.log('  - Service Workers not supported')
      if (!hasPushManager) console.log('  - PushManager not supported (browser too old or unsupported)')
      if (!hasNotification) console.log('  - Notification API not supported')
      if (!isHTTPS) console.log('  - Not using HTTPS (required for push notifications)')
      if (!hasVAPID) console.log('  - VAPID key not configured')
    }
    
    console.log('🔍 ===== END DIAGNOSTICS =====\n')
  }

  const checkPushStatus = async () => {
    setCheckingPush(true)
    const hasPermission = await hasPushPermission()
    const isSubscribed = await isSubscribedToPush()
    setPushEnabled(hasPermission && isSubscribed)
    setCheckingPush(false)
  }

  const handlePushToggle = async (enabled: boolean) => {
    console.log('🔄 Push Toggle:', enabled ? 'ENABLING' : 'DISABLING')
    try {
      if (enabled) {
        console.log('📲 Attempting to enable push notifications...')
        const result = await requestPushPermission()
        console.log('📲 Request result:', result)
        
        if (result.subscription) {
          console.log('✅ Push notification subscription successful!')
          setPushEnabled(true)
          toast({
            title: 'Push notifications enabled!',
            description: 'You will now receive reminders at 8 AM and 9 PM.',
          })
        } else {
          // Show specific error message
          const errorMsg = result.error || 'Failed to enable push notifications. Please try again.'
          console.error('❌ Push notification error:', result.error)
          console.error('❌ Full error details:', result)
          
          // Run diagnostics again to see current state
          console.log('🔍 Re-running diagnostics after error...')
          await runPushNotificationDiagnostics()
          
          toast({
            title: 'Failed to enable notifications',
            description: errorMsg,
            variant: 'destructive',
          })
        }
      } else {
        console.log('🔕 Disabling push notifications...')
        await unsubscribeFromPush()
        setPushEnabled(false)
        console.log('✅ Push notifications disabled')
        toast({
          title: 'Push notifications disabled',
          description: 'You will no longer receive push notifications.',
        })
      }
    } catch (error: any) {
      console.error('❌ Exception during push toggle:', error)
      console.error('❌ Error stack:', error.stack)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update push notification settings.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync(profile)
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been saved.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input value={user?.email ?? ''} disabled />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Height (cm)</label>
            <Input
              type="number"
              value={profile.height_cm ?? ''}
              onChange={(e) => setProfile({ ...profile, height_cm: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="170"
            />
          </div>
          <Button onClick={handleSave} disabled={updateUser.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {pushEnabled ? (
                  <Bell className="h-5 w-5 text-green-500" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders at 8 AM and 9 PM
                  </p>
                </div>
              </div>
            </div>
            {checkingPush ? (
              <div className="text-sm text-muted-foreground">Checking...</div>
            ) : (
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={checkingPush}
              />
            )}
          </div>
          {!pushEnabled && !checkingPush && (
            <p className="text-xs text-muted-foreground">
              Enable push notifications to get daily reminders about logging your fitness data.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

