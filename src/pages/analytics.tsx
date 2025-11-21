import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDailyLogs } from '@/hooks/use-daily-log'
import { formatDate, calculateConsistencyScore } from '@/lib/utils'
import { subWeeks, subMonths, format } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function AnalyticsPage() {
  const [view, setView] = useState<'week' | 'month'>('month')
  const now = new Date()
  const startDate = view === 'week' 
    ? formatDate(subWeeks(now, 1))
    : formatDate(subMonths(now, 1))
  const endDate = formatDate(now)
  
  const { data: logs } = useDailyLogs(startDate, endDate)

  const weightData = logs
    ?.filter((log) => log.weight)
    .map((log) => ({
      date: format(new Date(log.date), 'MMM dd'),
      weight: log.weight,
    })) || []

  const stepsData = logs
    ?.map((log) => ({
      date: format(new Date(log.date), 'MMM dd'),
      steps: log.steps ?? 0,
    })) || []

  const caloriesData = logs
    ?.filter((log) => log.calories)
    .map((log) => ({
      date: format(new Date(log.date), 'MMM dd'),
      calories: log.calories,
    })) || []

  const waterData = logs
    ?.map((log) => ({
      date: format(new Date(log.date), 'MMM dd'),
      water: log.water_liters ?? 0,
    })) || []

  const workoutData = logs?.reduce((acc, log) => {
    const week = format(new Date(log.date), 'MMM dd')
    if (!acc[week]) {
      acc[week] = { week, count: 0 }
    }
    if (log.workout_done) {
      acc[week].count++
    }
    return acc
  }, {} as Record<string, { week: string; count: number }>) || {}

  const workoutChartData = Object.values(workoutData)

  const sleepData = logs
    ?.filter((log) => log.wake_time && log.sleep_time)
    .map((log) => {
      const wake = new Date(`2000-01-01T${log.wake_time}`)
      const sleep = new Date(`2000-01-01T${log.sleep_time}`)
      let hours = (wake.getTime() - sleep.getTime()) / (1000 * 60 * 60)
      if (hours < 0) hours += 24
      return {
        date: format(new Date(log.date), 'MMM dd'),
        hours: Math.round(hours * 10) / 10,
      }
    }) || []

  const consistencyData = logs?.map((log) => {
    // Simple consistency score based on filled fields
    let score = 0
    if (log.steps) score += 25
    if (log.water_liters) score += 25
    if (log.workout_done !== null) score += 25
    if (log.wake_time && log.sleep_time) score += 25
    return {
      date: format(new Date(log.date), 'MMM dd'),
      score,
    }
  }) || []

  const overallConsistency = calculateConsistencyScore(
    logs?.map((log) => ({
      goals_met: (log.steps ?? 0) > 0 && (log.water_liters ?? 0) > 0,
    })) || []
  )

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded ${view === 'week' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded ${view === 'month' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Consistency Score: {overallConsistency}%</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consistencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {weightData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weight Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Steps Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stepsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {caloriesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Calories Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={caloriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Water Intake Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="water" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {sleepData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sleep Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Workout Count per Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workoutChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

