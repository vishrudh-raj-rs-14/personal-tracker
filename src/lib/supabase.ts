import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          name: string | null
          height_cm: number | null
          weight_goal: number | null
          steps_goal: number | null
          water_goal_liters: number | null
          workout_days_goal: number | null
          sleep_goal_hours: number | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          weight: number | null
          steps: number | null
          calories: number | null
          workout_done: boolean | null
          workout_type: string | null
          wake_time: string | null
          sleep_time: string | null
          water_liters: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>
      }
      weekly_photos: {
        Row: {
          id: string
          user_id: string
          week_start: string
          image_url: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weekly_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weekly_photos']['Insert']>
      }
      foods: {
        Row: {
          id: string
          name: string
          calories_per_unit: number
          unit: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['foods']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['foods']['Insert']>
      }
      reminders_log: {
        Row: {
          id: string
          user_id: string
          type: 'weekly' | 'monthly' | 'daily'
          sent_at: string
        }
        Insert: Omit<Database['public']['Tables']['reminders_log']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['reminders_log']['Insert']>
      }
    }
  }
}

