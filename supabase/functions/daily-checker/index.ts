import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'https://esm.sh/web-push@3.6.6'

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
      .select('id, email, name, steps_goal, water_goal_liters')

    if (usersError) throw usersError

    for (const user of users || []) {
      // Get today's log
      const { data: log } = await supabaseAdmin
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      const reminders: string[] = []

      if (!log || !log.steps || log.steps === 0) {
        reminders.push('No steps logged today')
      }

      if (!log || !log.workout_done) {
        reminders.push('No workout logged today')
      }

      if (!log || (log.water_liters || 0) < (user.water_goal_liters || 0)) {
        reminders.push(`Water intake below goal (${log?.water_liters || 0}L / ${user.water_goal_liters || 0}L)`)
      }

      if (reminders.length > 0) {
        // Evening reminder (9 PM): Check if goals are met and remind to log data
        const message = `Evening reminder for ${user.name || 'there'}: ${reminders.join(', ')}. Don't forget to log your data before the day ends!`
        
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
            webPush.setVapidDetails(
              'mailto:your-email@example.com', // Contact email
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
                    title: 'Evening Reminder 🌙',
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
          }
        }

        // Log the reminder
        await supabaseAdmin
          .from('reminders_log')
          .insert({
            user_id: user.id,
            type: 'daily',
          })

        console.log(`Evening reminder (9 PM) for ${user.email}:`, message)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Daily checks processed', count: users?.length || 0 }),
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

