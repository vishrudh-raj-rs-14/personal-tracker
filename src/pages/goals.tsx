import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUser, useUpdateUser } from '@/hooks/use-user'
import { useToast } from '@/components/ui/use-toast'
import { Save } from 'lucide-react'

export function GoalsPage() {
  const { data: user, isLoading } = useUser()
  const updateUser = useUpdateUser()
  const { toast } = useToast()
  const [goals, setGoals] = useState({
    steps_goal: 10000,
    water_goal_liters: 2.5,
    workout_days_goal: 4,
    sleep_goal_hours: 8,
    weight_goal: null as number | null,
  })

  useEffect(() => {
    if (user) {
      setGoals({
        steps_goal: user.steps_goal ?? 10000,
        water_goal_liters: user.water_goal_liters ?? 2.5,
        workout_days_goal: user.workout_days_goal ?? 4,
        sleep_goal_hours: user.sleep_goal_hours ?? 8,
        weight_goal: user.weight_goal ?? null,
      })
    }
  }, [user])

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync(goals)
      toast({
        title: 'Goals saved!',
        description: 'Your goals have been updated.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goals</h1>
        <Button onClick={handleSave} disabled={updateUser.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Goals
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Steps Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={goals.steps_goal}
              onChange={(e) => setGoals({ ...goals, steps_goal: parseInt(e.target.value) || 0 })}
              placeholder="10000"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Aim to walk at least {goals.steps_goal.toLocaleString()} steps per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Water Intake Goal (Liters)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              step="0.1"
              value={goals.water_goal_liters}
              onChange={(e) => setGoals({ ...goals, water_goal_liters: parseFloat(e.target.value) || 0 })}
              placeholder="2.5"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Aim to drink at least {goals.water_goal_liters}L of water per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Workout Days Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="0"
              max="7"
              value={goals.workout_days_goal}
              onChange={(e) => setGoals({ ...goals, workout_days_goal: parseInt(e.target.value) || 0 })}
              placeholder="4"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Aim to work out at least {goals.workout_days_goal} days per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Sleep Goal (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={goals.sleep_goal_hours}
              onChange={(e) => setGoals({ ...goals, sleep_goal_hours: parseFloat(e.target.value) || 0 })}
              placeholder="8"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Aim to sleep at least {goals.sleep_goal_hours} hours per night
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weight Goal (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              step="0.1"
              value={goals.weight_goal ?? ''}
              onChange={(e) => setGoals({ ...goals, weight_goal: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="Optional"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {goals.weight_goal ? `Target weight: ${goals.weight_goal}kg` : 'Set a target weight (optional)'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

