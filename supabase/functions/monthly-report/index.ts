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

    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const monthStart = firstDay.toISOString().split('T')[0]
    const monthEnd = lastDay.toISOString().split('T')[0]

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')

    if (usersError) throw usersError

    for (const user of users || []) {
      // Check if reminder already sent this month
      const { data: existing } = await supabaseAdmin
        .from('reminders_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'monthly')
        .gte('sent_at', monthStart)
        .single()

      if (existing) continue

      // Get month's logs
      const { data: logs } = await supabaseAdmin
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)

      const workoutCount = logs?.filter((log) => log.workout_done).length || 0
      const totalSteps = logs?.reduce((sum, log) => sum + (log.steps || 0), 0) || 0
      const avgSteps = logs?.length ? totalSteps / logs.length : 0
      const totalCalories = logs?.reduce((sum, log) => sum + (log.calories || 0), 0) || 0
      const avgCalories = logs?.length ? totalCalories / logs.length : 0

      // Calculate consistency streak
      let streak = 0
      const sortedLogs = [...(logs || [])].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      for (const log of sortedLogs) {
        if (log.steps && log.water_liters && log.workout_done) {
          streak++
        } else {
          break
        }
      }

      const emailBody = `
        Hi ${user.name || 'there'},

        Your monthly fitness report for ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}:

        📊 Summary:
        - Workouts completed: ${workoutCount} days
        - Average daily steps: ${Math.round(avgSteps)}
        - Average daily calories: ${Math.round(avgCalories)}
        - Current streak: ${streak} days

        📈 Trends:
        - Total steps: ${totalSteps.toLocaleString()}
        - Total calories logged: ${totalCalories.toLocaleString()}

        Keep up the amazing work! Your consistency is building strong habits.
      `

      // Log the reminder
      await supabaseAdmin
        .from('reminders_log')
        .insert({
          user_id: user.id,
          type: 'monthly',
        })

      // In production, send actual email with charts
      console.log(`Monthly report for ${user.email}:`, emailBody)
    }

    return new Response(
      JSON.stringify({ message: 'Monthly reports processed', count: users?.length || 0 }),
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

