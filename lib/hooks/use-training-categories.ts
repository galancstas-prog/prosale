'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTrainingCategories,
  createTrainingCategory,
  updateTrainingCategory,
  deleteTrainingCategory,
} from '@/lib/actions/training-categories'

export function useTrainingCategories() {
  return useQuery({
    queryKey: ['training-categories'],
    queryFn: async () => {
      const result = await getTrainingCategories()
      return result.data || []
    },
  })
}

export function useTrainingCategoryMutation() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createTrainingCategory(formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ categoryId, formData }: { categoryId: string; formData: FormData }) => {
      const result = await updateTrainingCategory(categoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const result = await deleteTrainingCategory(categoryId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-categories'] })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
