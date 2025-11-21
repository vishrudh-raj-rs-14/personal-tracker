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

    const today = new Date().toISOString().split('T')[0]

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')

    if (usersError) throw usersError

    for (const user of users || []) {
      // Check if user has logged data today
      const { data: log } = await supabaseAdmin
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      // Morning reminder: encourage logging data for the day
      if (!log) {
        const message = `Good morning ${user.name || 'there'}! 🌅 Don't forget to log your fitness data today. Track your weight, steps, and workouts to stay on track!`
        
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
                  'mailto:vishrudh.shrinivas@gmail.com', // Contact email
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
                        title: 'Morning Reminder 🌅',
                        body: message,
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png',
                        url: '/dashboard',
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
            type: 'daily',
          })

        console.log(`Morning reminder for ${user.email}:`, message)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Morning reminders processed', count: users?.length || 0 }),
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

