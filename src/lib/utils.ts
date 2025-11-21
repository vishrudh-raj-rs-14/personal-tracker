import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  // Use local timezone to avoid date shifting
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekStart(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  const monday = new Date(d.setDate(diff))
  return formatDate(monday)
}

export function calculateStreak(logs: Array<{ date: string; goals_met: boolean }>): number {
  let streak = 0
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  for (const log of sorted) {
    if (log.goals_met) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export function calculateConsistencyScore(logs: Array<{ goals_met: boolean }>): number {
  if (logs.length === 0) return 0
  const met = logs.filter(l => l.goals_met).length
  return Math.round((met / logs.length) * 100)
}

