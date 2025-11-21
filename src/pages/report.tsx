import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDailyLogs } from '@/hooks/use-daily-log'
import { formatDate } from '@/lib/utils'
import { format, subDays, subMonths } from 'date-fns'
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
import { Calendar, Filter, Download } from 'lucide-react'

export function ReportPage() {
  const today = new Date()
  const defaultStartDate = formatDate(subMonths(today, 1))
  const defaultEndDate = formatDate(today)

  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)

  const { data: logs, isLoading } = useDailyLogs(startDate, endDate)

  // Prepare chart data
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

  const workoutData = logs
    ?.map((log) => ({
      date: format(new Date(log.date), 'MMM dd'),
      workout: log.workout_done ? 1 : 0,
      type: log.workout_type || 'None',
    })) || []

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

  const handleQuickFilter = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)
    setStartDate(formatDate(start))
    setEndDate(formatDate(end))
  }

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return

    const headers = ['Date', 'Weight (kg)', 'Steps', 'Calories', 'Water (L)', 'Workout', 'Workout Type', 'Wake Time', 'Sleep Time', 'Notes']
    const rows = logs.map((log) => [
      log.date,
      log.weight ?? '',
      log.steps ?? '',
      log.calories ?? '',
      log.water_liters ?? '',
      log.workout_done ? 'Yes' : 'No',
      log.workout_type ?? '',
      log.wake_time ?? '',
      log.sleep_time ?? '',
      log.notes ?? '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-report-${startDate}-to-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
          Fitness Report
        </h1>
        {logs && logs.length > 0 && (
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={formatDate(today)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleQuickFilter(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickFilter(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickFilter(90)}>
                Last 90 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : !logs || logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No data found for the selected date range.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-muted-foreground">Days Recorded</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {logs.filter((l) => l.weight).length}
                </div>
                <p className="text-xs text-muted-foreground">Weight Entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {logs.filter((l) => l.workout_done).length}
                </div>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {Math.round(
                    (logs.reduce((sum, l) => sum + (l.steps || 0), 0) / logs.length) || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Avg Steps/Day</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4">
            {weightData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Weight Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
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
                  <ResponsiveContainer width="100%" height={250}>
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
                  <ResponsiveContainer width="100%" height={250}>
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
                <CardTitle>Water Intake</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
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

            {workoutData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Workout Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={workoutData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="workout" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {sleepData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sleep Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
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
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">All Recorded Data ({logs.length} entries)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile: Card view, Desktop: Table view */}
              <div className="block md:hidden space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border bg-card space-y-2">
                    <div className="font-semibold text-sm">{format(new Date(log.date), 'MMM dd, yyyy')}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {log.weight && (
                        <div>
                          <span className="text-muted-foreground">Weight: </span>
                          <span className="font-medium">{log.weight} kg</span>
                        </div>
                      )}
                      {log.steps && (
                        <div>
                          <span className="text-muted-foreground">Steps: </span>
                          <span className="font-medium">{log.steps.toLocaleString()}</span>
                        </div>
                      )}
                      {log.calories && (
                        <div>
                          <span className="text-muted-foreground">Calories: </span>
                          <span className="font-medium">{log.calories.toLocaleString()}</span>
                        </div>
                      )}
                      {log.water_liters && log.water_liters > 0 && (
                        <div>
                          <span className="text-muted-foreground">Water: </span>
                          <span className="font-medium">{log.water_liters}L</span>
                        </div>
                      )}
                      {log.workout_done && (
                        <div>
                          <span className="text-muted-foreground">Workout: </span>
                          <span className="font-medium">{log.workout_type || 'Yes'}</span>
                        </div>
                      )}
                      {log.wake_time && (
                        <div>
                          <span className="text-muted-foreground">Wake: </span>
                          <span className="font-medium">{log.wake_time}</span>
                        </div>
                      )}
                      {log.sleep_time && (
                        <div>
                          <span className="text-muted-foreground">Sleep: </span>
                          <span className="font-medium">{log.sleep_time}</span>
                        </div>
                      )}
                    </div>
                    {log.notes && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <span className="font-medium">Notes: </span>
                        {log.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Weight</th>
                      <th className="text-left p-2 font-medium">Steps</th>
                      <th className="text-left p-2 font-medium">Calories</th>
                      <th className="text-left p-2 font-medium">Water</th>
                      <th className="text-left p-2 font-medium">Workout</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Wake</th>
                      <th className="text-left p-2 font-medium">Sleep</th>
                      <th className="text-left p-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                        <td className="p-2">{log.weight ? `${log.weight} kg` : '-'}</td>
                        <td className="p-2">{log.steps?.toLocaleString() || '-'}</td>
                        <td className="p-2">{log.calories?.toLocaleString() || '-'}</td>
                        <td className="p-2">
                          {log.water_liters && log.water_liters > 0 ? `${log.water_liters}L` : '-'}
                        </td>
                        <td className="p-2">{log.workout_done ? '✓' : '-'}</td>
                        <td className="p-2">{log.workout_type || '-'}</td>
                        <td className="p-2">{log.wake_time || '-'}</td>
                        <td className="p-2">{log.sleep_time || '-'}</td>
                        <td className="p-2 max-w-xs truncate" title={log.notes || ''}>
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

