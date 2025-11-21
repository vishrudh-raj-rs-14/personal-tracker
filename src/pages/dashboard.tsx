import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDailyLog, useUpdateDailyLog, useDailyLogs } from '@/hooks/use-daily-log'
import { useUser } from '@/hooks/use-user'
import { Save, Plus, Edit, Scale, Footprints, Droplet, Flame, Activity, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { FoodSearch } from '@/components/food-search'
import { format, subDays, isToday, parseISO } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const WORKOUT_TYPES = ['Push', 'Pull', 'Legs', 'Full Body', 'Swimming', 'Cardio', 'Rest']

export function DashboardPage() {
  const today = formatDate(new Date())
  const { data: log, isLoading } = useDailyLog(today)
  const { data: user } = useUser()
  const updateLog = useUpdateDailyLog()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  
  // Get last 30 days for charts and table
  const startDate = formatDate(subDays(new Date(), 30))
  const { data: recentLogs } = useDailyLogs(startDate, today)

  const [formData, setFormData] = useState({
    weight: null as number | null,
    steps: null as number | null,
    calories: null as number | null,
    workout_done: false,
    workout_type: '',
    wake_time: '',
    sleep_time: '',
    water_liters: 0,
    notes: '',
  })

  useEffect(() => {
    if (log) {
      setFormData({
        weight: log.weight ?? null,
        steps: log.steps ?? null,
        calories: log.calories ?? null,
        workout_done: log.workout_done ?? false,
        workout_type: log.workout_type ?? '',
        wake_time: log.wake_time ?? '',
        sleep_time: log.sleep_time ?? '',
        water_liters: log.water_liters ?? 0,
        notes: log.notes ?? '',
      })
      setIsEditing(false)
    } else {
      setFormData({
        weight: null,
        steps: null,
        calories: null,
        workout_done: false,
        workout_type: '',
        wake_time: '',
        sleep_time: '',
        water_liters: 0,
        notes: '',
      })
    }
  }, [log])

  const handleSave = async () => {
    try {
      const updates: any = {
        weight: formData.weight,
        steps: formData.steps,
        calories: formData.calories ? Math.round(formData.calories) : null, // Ensure integer
        workout_done: formData.workout_done,
        workout_type: formData.workout_done ? formData.workout_type : null,
        water_liters: formData.water_liters && formData.water_liters > 0 ? formData.water_liters : null,
        notes: formData.notes,
      }

      if (formData.wake_time && formData.wake_time.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
        updates.wake_time = formData.wake_time
      } else {
        updates.wake_time = null
      }

      if (formData.sleep_time && formData.sleep_time.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
        updates.sleep_time = formData.sleep_time
      } else {
        updates.sleep_time = null
      }

      await updateLog.mutateAsync({
        date: today,
        updates,
      })
      
      toast({
        title: 'Saved!',
        description: 'Your daily log has been saved.',
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: 'Error saving',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Prepare chart data
  const weightData = recentLogs
    ?.filter((l) => l.weight)
    .map((l) => ({
      date: format(parseISO(l.date), 'MMM dd'),
      weight: l.weight,
    })) || []

  const stepsData = recentLogs
    ?.filter((l) => l.steps)
    .map((l) => ({
      date: format(parseISO(l.date), 'MMM dd'),
      steps: l.steps,
    })) || []

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Enter Today's Data</h1>
          <div className="flex gap-2">
            {log && (
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={updateLog.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateLog.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weight (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={[formData.weight ?? 50]}
                  onValueChange={([value]) => updateField('weight', value)}
                  min={30}
                  max={200}
                  step={0.1}
                />
                <Input
                  type="number"
                  value={formData.weight ?? ''}
                  onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Enter weight"
                  step="0.1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Steps</CardTitle>
              {user?.steps_goal && (
                <p className="text-sm text-muted-foreground">
                  Goal: {user.steps_goal.toLocaleString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={formData.steps ?? ''}
                onChange={(e) => updateField('steps', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Enter steps"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calories Consumed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                value={formData.calories ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  updateField('calories', value ? Math.round(parseFloat(value)) : null)
                }}
                placeholder="Enter calories"
                step="1"
                min="0"
              />
              <FoodSearch
                onSelect={(calories) => {
                  const current = formData.calories ?? 0
                  updateField('calories', Math.round(current + calories))
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Water Intake (Liters)</CardTitle>
              {user?.water_goal_liters && (
                <p className="text-sm text-muted-foreground">
                  Goal: {user.water_goal_liters}L
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={[formData.water_liters ?? 0]}
                  onValueChange={([value]) => updateField('water_liters', value)}
                  min={0}
                  max={10}
                  step={0.1}
                />
                <Input
                  type="number"
                  value={formData.water_liters ?? ''}
                  onChange={(e) => updateField('water_liters', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="Enter water intake"
                  step="0.1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Workout Done</span>
                <Switch
                  checked={formData.workout_done}
                  onCheckedChange={(checked) => updateField('workout_done', checked)}
                />
              </div>
              {formData.workout_done && (
                <Select
                  value={formData.workout_type}
                  onValueChange={(value) => updateField('workout_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sleep</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Wake Time (optional)</label>
                <Input
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) => updateField('wake_time', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sleep Time (optional)</label>
                <Input
                  type="time"
                  value={formData.sleep_time}
                  onChange={(e) => updateField('sleep_time', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any additional notes..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main dashboard view
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {!log && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Today's Entry
          </Button>
        )}
      </div>

      {/* Charts Section - First */}
      {(weightData.length > 0 || stepsData.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {weightData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <CardTitle>Weight Over Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {stepsData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Footprints className="h-5 w-5 text-primary" />
                  <CardTitle>Steps Over Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stepsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="steps" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Today's Entry Section - Second */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Today's Entry</CardTitle>
            </div>
            {log ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {log ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {log.weight && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="text-2xl font-bold">{log.weight} kg</p>
                  </div>
                </div>
              )}

              {log.steps && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Footprints className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Steps</p>
                    <p className="text-2xl font-bold">{log.steps.toLocaleString()}</p>
                    {user?.steps_goal && (
                      <p className="text-xs text-muted-foreground">
                        Goal: {user.steps_goal.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {log.calories && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Calories</p>
                    <p className="text-2xl font-bold">{log.calories.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {log.water_liters != null && log.water_liters > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Droplet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Water</p>
                    <p className="text-2xl font-bold">{log.water_liters}L</p>
                    {user?.water_goal_liters && (
                      <p className="text-xs text-muted-foreground">
                        Goal: {user.water_goal_liters}L
                      </p>
                    )}
                  </div>
                </div>
              )}

              {log.workout_done && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Workout</p>
                    <p className="text-lg font-semibold">{log.workout_type || 'Completed'}</p>
                  </div>
                </div>
              )}

              {log.notes && (
                <div className="md:col-span-2 lg:col-span-4 p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">{log.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No entry for today yet</p>
              <Button onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Today's Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Days Table - Third */}
      {recentLogs && recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Date</th>
                    <th className="text-right p-3 text-sm font-semibold">Weight</th>
                    <th className="text-right p-3 text-sm font-semibold">Steps</th>
                    <th className="text-right p-3 text-sm font-semibold">Calories</th>
                    <th className="text-right p-3 text-sm font-semibold">Water</th>
                    <th className="text-center p-3 text-sm font-semibold">Workout</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.slice(0, 14).map((entry) => {
                    const entryDate = parseISO(entry.date)
                    const isTodayEntry = isToday(entryDate)
                    
                    return (
                      <tr 
                        key={entry.id} 
                        className={`border-b hover:bg-muted/50 ${
                          isTodayEntry ? 'bg-primary/5 font-medium' : ''
                        }`}
                      >
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            {isTodayEntry && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Today
                              </span>
                            )}
                            {format(entryDate, 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="text-right p-3 text-sm">
                          {entry.weight ? `${entry.weight} kg` : '-'}
                        </td>
                        <td className="text-right p-3 text-sm">
                          {entry.steps ? entry.steps.toLocaleString() : '-'}
                        </td>
                        <td className="text-right p-3 text-sm">
                          {entry.calories ? entry.calories.toLocaleString() : '-'}
                        </td>
                        <td className="text-right p-3 text-sm">
                          {entry.water_liters && entry.water_liters > 0 ? `${entry.water_liters}L` : '-'}
                        </td>
                        <td className="text-center p-3 text-sm">
                          {entry.workout_done ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Activity className="h-3 w-3" />
                              {entry.workout_type || 'Yes'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
