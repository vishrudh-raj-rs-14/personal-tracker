import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useDailyLogs } from '@/hooks/use-daily-log'
import { useUser } from '@/hooks/use-user'
import { formatDate, calculateStreak } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { Flame, Activity, Footprints, Droplet, Moon } from 'lucide-react'

type GoalType = 'workout' | 'steps' | 'water' | 'sleep'

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeGoal, setActiveGoal] = useState<GoalType>('workout')
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const startDate = formatDate(monthStart)
  const endDate = formatDate(monthEnd)
  const { data: logs } = useDailyLogs(startDate, endDate)
  const { data: user } = useUser()

  const checkGoalMet = (log: any, goalType: GoalType): boolean => {
    if (!log || !user) return false
    
    switch (goalType) {
      case 'workout':
        return log.workout_done === true
      
      case 'steps':
        return !user.steps_goal || (log.steps ?? 0) >= user.steps_goal
      
      case 'water':
        return !user.water_goal_liters || (log.water_liters ?? 0) >= user.water_goal_liters
      
      case 'sleep':
        if (!user.sleep_goal_hours || !log.wake_time || !log.sleep_time) return false
        const wake = new Date(`2000-01-01T${log.wake_time}`)
        const sleep = new Date(`2000-01-01T${log.sleep_time}`)
        let sleepHours = (wake.getTime() - sleep.getTime()) / (1000 * 60 * 60)
        if (sleepHours < 0) sleepHours += 24
        return sleepHours >= user.sleep_goal_hours
      
      default:
        return false
    }
  }


  const getLogForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return logs?.find((log) => {
      const logDate = log.date.split('T')[0]
      return logDate === dateStr
    })
  }

  const streak = calculateStreak(
    logs?.map((log) => ({
      date: log.date,
      goals_met: checkGoalMet(log, activeGoal),
    })) || []
  )

  const getDayStatus = (date: Date) => {
    const log = getLogForDate(date)
    if (!log) return 'empty'
    return checkGoalMet(log, activeGoal) ? 'met' : 'not-met'
  }

  const getGoalLabel = (goalType: GoalType): string => {
    switch (goalType) {
      case 'workout':
        return 'Workout'
      case 'steps':
        return 'Steps'
      case 'water':
        return 'Water'
      case 'sleep':
        return 'Sleep'
      default:
        return ''
    }
  }


  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2 text-xl sm:text-2xl">
          <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
          <span className="font-bold">{streak} day streak</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm rounded border hover:bg-accent"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm rounded border hover:bg-accent"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm rounded border hover:bg-accent"
              >
                Next
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeGoal} onValueChange={(value) => setActiveGoal(value as GoalType)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="workout" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Workout</span>
              </TabsTrigger>
              <TabsTrigger value="steps" className="flex items-center gap-2">
                <Footprints className="h-4 w-4" />
                <span className="hidden sm:inline">Steps</span>
              </TabsTrigger>
              <TabsTrigger value="water" className="flex items-center gap-2">
                <Droplet className="h-4 w-4" />
                <span className="hidden sm:inline">Water</span>
              </TabsTrigger>
              <TabsTrigger value="sleep" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span className="hidden sm:inline">Sleep</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeGoal} className="mt-0">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing: <span className="font-semibold">{getGoalLabel(activeGoal)}</span> goal achievement
                </p>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm p-2">
                    {day}
                  </div>
                ))}
                {days.map((day) => {
                  const status = getDayStatus(day)
                  const log = getLogForDate(day)
                  const isCurrentDay = isToday(day)
                  
                  let tooltipText = 'No data'
                  if (log) {
                    switch (activeGoal) {
                      case 'workout':
                        tooltipText = `Workout: ${log.workout_done ? (log.workout_type || 'Yes') : 'No'}`
                        break
                      case 'steps':
                        tooltipText = `Steps: ${log.steps ?? 0}${user?.steps_goal ? ` / ${user.steps_goal}` : ''}`
                        break
                      case 'water':
                        tooltipText = `Water: ${log.water_liters ?? 0}L${user?.water_goal_liters ? ` / ${user.water_goal_liters}L` : ''}`
                        break
                      case 'sleep':
                        if (log.wake_time && log.sleep_time) {
                          const wake = new Date(`2000-01-01T${log.wake_time}`)
                          const sleep = new Date(`2000-01-01T${log.sleep_time}`)
                          let sleepHours = (wake.getTime() - sleep.getTime()) / (1000 * 60 * 60)
                          if (sleepHours < 0) sleepHours += 24
                          tooltipText = `Sleep: ${Math.round(sleepHours * 10) / 10}h${user?.sleep_goal_hours ? ` / ${user.sleep_goal_hours}h` : ''}`
                        } else {
                          tooltipText = 'Sleep: No data'
                        }
                        break
                    }
                  }
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`aspect-square p-1 sm:p-2 rounded border flex flex-col items-center justify-center transition-colors text-xs sm:text-sm ${
                        isCurrentDay ? 'ring-2 ring-primary' : ''
                      } ${
                        status === 'met'
                          ? 'bg-green-500 dark:bg-green-600'
                          : status === 'not-met'
                          ? 'bg-red-500 dark:bg-red-600'
                          : 'bg-muted'
                      }`}
                      title={tooltipText}
                    >
                      <span className="text-sm font-medium">{format(day, 'd')}</span>
                      {status === 'met' && (
                        <span className="text-xs">✓</span>
                      )}
                      {status === 'not-met' && log && (
                        <span className="text-xs">✗</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Goal met</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span>Goal not met</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted"></div>
          <span>No data</span>
        </div>
      </div>
    </div>
  )
}
