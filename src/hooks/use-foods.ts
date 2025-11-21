import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Food {
  id: string
  name: string
  calories_per_unit: number
  protein_per_unit: number
  carbs_per_unit: number
  unit: string
  created_at: string
}

export function useFoods(searchTerm?: string) {
  return useQuery({
    queryKey: ['foods', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true })
        .limit(50)

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Food[]
    },
  })
}

export function useAddFood() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (food: { 
      name: string
      calories_per_unit: number
      protein_per_unit?: number
      carbs_per_unit?: number
      unit: string 
    }) => {
      const { data, error } = await supabase
        .from('foods')
        .insert({
          ...food,
          protein_per_unit: food.protein_per_unit || 0,
          carbs_per_unit: food.carbs_per_unit || 0,
        })
        .select()
        .single()

      if (error) throw error
      return data as Food
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
    },
  })
}

