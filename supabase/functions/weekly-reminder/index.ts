import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Dynamic import of web-push - will be loaded when needed
async function getWebPush() {
  try {
    // Try npm: specifier first (better Deno compatibility)
    const module = await import('npm:web-push@3.6.6')
    return module.default || module
  } catch (e) {
    console.warn('web-push not available:', e.message)
    return null
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')

    if (usersError) throw usersError

    const today = new Date()
    // Get Monday of current week (week starts on Monday)
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)

    // Get logs from last week
    const weekStart = new Date(monday)
    weekStart.setDate(weekStart.getDate() - 7)
    const weekEnd = new Date(monday)
    weekEnd.setDate(weekEnd.getDate() - 1) // Sunday of last week

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    
    // Current week start (Monday of this week)
    const currentWeekStart = monday.toISOString().split('T')[0]

    for (const user of users || []) {
      // Check if reminder already sent this week
      const { data: existing } = await supabaseAdmin
        .from('reminders_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'weekly')
        .gte('sent_at', weekStartStr)
        .single()

      if (existing) continue

      // Get last week's logs
      const { data: logs } = await supabaseAdmin
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

      const workoutCount = logs?.filter((log) => log.workout_done).length || 0
      const avgSteps = logs?.reduce((sum, log) => sum + (log.steps || 0), 0) / (logs?.length || 1) || 0

      // Check if user has uploaded photos for this week
      const { data: currentWeekPhotos } = await supabaseAdmin
        .from('weekly_photos')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart)

      const hasPhotosThisWeek = currentWeekPhotos && currentWeekPhotos.length > 0

      // Prepare reminder message
      const reminderMessage = hasPhotosThisWeek
        ? `Great job! You've uploaded ${currentWeekPhotos.length} photo(s) this week. Keep tracking your progress! 📸`
        : `📸 Weekly Photo Reminder: Don't forget to upload your progress photo this week! Track your transformation over time.`

      // Get user's push subscriptions
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)

      // Send push notifications
      if (subscriptions && subscriptions.length > 0) {
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || ''
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''
        
        if (vapidPublicKey && vapidPrivateKey) {
          const webPush = await getWebPush()
          if (webPush) {
            try {
              webPush.setVapidDetails(
                'mailto:vishrudh.shrinivas@gmail.com', // Update with your email
                vapidPublicKey,
                vapidPrivateKey
              )

              for (const sub of subscriptions) {
                try {
                  await webPush.sendNotification(
                    {
                      endpoint: sub.endpoint,
                      keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                      },
                    },
                    JSON.stringify({
                      title: hasPhotosThisWeek ? 'Weekly Check-in ✅' : 'Weekly Photo Reminder 📸',
                      body: reminderMessage,
                      icon: '/pwa-192x192.png',
                      badge: '/pwa-192x192.png',
                      url: '/photos',
                    })
                  )
                } catch (error) {
                  // If subscription is invalid, remove it
                  if (error.statusCode === 410 || error.statusCode === 404) {
                    await supabaseAdmin
                      .from('push_subscriptions')
                      .delete()
                      .eq('id', sub.id)
                  }
                  console.error(`Failed to send push to ${user.email}:`, error)
                }
              }
            } catch (error) {
              console.error('Error setting up web-push:', error)
            }
          } else {
            console.warn('web-push library not available, skipping push notifications')
          }
        }
      }

      // Log the reminder
      await supabaseAdmin
        .from('reminders_log')
        .insert({
          user_id: user.id,
          type: 'weekly',
        })

      console.log(`Weekly reminder for ${user.email}:`, reminderMessage)
    }

    return new Response(
      JSON.stringify({ message: 'Weekly reminders processed', count: users?.length || 0 }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

