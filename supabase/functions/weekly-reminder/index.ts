import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)) // Get Monday of current week

    // Get logs from last week
    const weekStart = new Date(monday)
    weekStart.setDate(weekStart.getDate() - 7)
    const weekEnd = new Date(monday)

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

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

      // Send email reminder (using Supabase's built-in email)
      // Note: You'll need to configure email in Supabase dashboard
      const emailBody = `
        Hi ${user.name || 'there'},

        It's time for your weekly check-in!

        Last week's summary:
        - Workouts: ${workoutCount} days
        - Average steps: ${Math.round(avgSteps)}

        Don't forget to:
        1. Upload your weekly progress photo
        2. Enter this week's weight measurement
        3. Review your calories trend

        Keep up the great work!
      `

      // Log the reminder
      await supabaseAdmin
        .from('reminders_log')
        .insert({
          user_id: user.id,
          type: 'weekly',
        })

      // In production, you would send actual email/push notifications here
      console.log(`Weekly reminder for ${user.email}:`, emailBody)
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

