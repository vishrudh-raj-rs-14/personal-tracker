import { useState } from 'react'
import { useFoods, useAddFood } from '@/hooks/use-foods'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface FoodSearchProps {
  onSelect: (calories: number) => void
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFood, setNewFood] = useState({ name: '', calories_per_unit: 0, unit: 'serving' })
  const { data: foods } = useFoods(searchTerm)
  const addFood = useAddFood()
  const { toast } = useToast()

  const handleAddFood = async () => {
    if (!newFood.name || newFood.calories_per_unit <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a food name and calories',
        variant: 'destructive',
      })
      return
    }

    try {
      await addFood.mutateAsync(newFood)
      toast({
        title: 'Food added!',
        description: `${newFood.name} has been added to the database.`,
      })
      setNewFood({ name: '', calories_per_unit: 0, unit: 'serving' })
      setShowAddForm(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Input
              placeholder="Food name"
              value={newFood.name}
              onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Calories"
                value={newFood.calories_per_unit || ''}
                onChange={(e) => setNewFood({ ...newFood, calories_per_unit: parseFloat(e.target.value) || 0 })}
              />
              <Input
                placeholder="Unit (e.g., serving, 100g)"
                value={newFood.unit}
                onChange={(e) => setNewFood({ ...newFood, unit: e.target.value })}
              />
            </div>
            <Button onClick={handleAddFood} size="sm" className="w-full">
              Add Food
            </Button>
          </CardContent>
        </Card>
      )}

      {searchTerm && foods && foods.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {foods.map((food) => (
                <button
                  key={food.id}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                  onClick={() => onSelect(Math.round(food.calories_per_unit))}
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(food.calories_per_unit)} cal per {food.unit}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

