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
    checkPushStatus()
  }, [])

  const checkPushStatus = async () => {
    setCheckingPush(true)
    const hasPermission = await hasPushPermission()
    const isSubscribed = await isSubscribedToPush()
    setPushEnabled(hasPermission && isSubscribed)
    setCheckingPush(false)
  }

  const handlePushToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const result = await requestPushPermission()
        if (result.subscription) {
          setPushEnabled(true)
          toast({
            title: 'Push notifications enabled!',
            description: 'You will now receive reminders at 8 AM and 9 PM.',
          })
        } else {
          // Show specific error message
          const errorMsg = result.error || 'Failed to enable push notifications. Please try again.'
          toast({
            title: 'Failed to enable notifications',
            description: errorMsg,
            variant: 'destructive',
          })
          console.error('Push notification error:', result.error)
        }
      } else {
        await unsubscribeFromPush()
        setPushEnabled(false)
        toast({
          title: 'Push notifications disabled',
          description: 'You will no longer receive push notifications.',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update push notification settings.',
        variant: 'destructive',
      })
      console.error('Push toggle error:', error)
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
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">Settings</h1>

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

