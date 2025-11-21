import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export interface DailyLog {
  id: string
  user_id: string
  date: string
  weight: number | null
  steps: number | null
  calories: number | null
  protein: number | null
  carbs: number | null
  workout_done: boolean | null
  workout_type: string | null
  wake_time: string | null
  sleep_time: string | null
  water_liters: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function useDailyLog(date: Date | string = new Date()) {
  const dateStr = formatDate(date)
  
  return useQuery({
    queryKey: ['daily-log', dateStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as DailyLog | null
    },
  })
}

export function useUpdateDailyLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ date, updates }: { date: string; updates: Partial<DailyLog> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Clean up updates - ensure time fields are either valid or null
      const cleanUpdates: any = { ...updates }
      
      // Validate and clean time fields
      if (cleanUpdates.wake_time !== undefined) {
        if (!cleanUpdates.wake_time || cleanUpdates.wake_time === '') {
          cleanUpdates.wake_time = null
        }
      }
      if (cleanUpdates.sleep_time !== undefined) {
        if (!cleanUpdates.sleep_time || cleanUpdates.sleep_time === '') {
          cleanUpdates.sleep_time = null
        }
      }

      // Try to update first
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('daily_logs')
          .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date,
            ...cleanUpdates,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log', variables.date] })
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useDailyLogs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['daily-logs', startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error
      return data as DailyLog[]
    },
  })
}

