'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTrainingSubcategories,
  createTrainingSubcategory,
  updateTrainingSubcategory,
  deleteTrainingSubcategory,
  type TrainingSubcategory,
} from '@/lib/actions/training-subcategories'

export function useTrainingSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: ['training-subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return []
      const result = await getTrainingSubcategories(categoryId)
      return result.data || []
    },
    enabled: !!categoryId,
  })
}

export function useTrainingSubcategoryMutation(categoryId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['training-subcategories', categoryId]

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createTrainingSubcategory(categoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey })
      const previousSubcategories = queryClient.getQueryData(queryKey)

      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const optimisticSubcategory: TrainingSubcategory = {
        id: `temp-${Date.now()}`,
        category_id: categoryId,
        name,
        description: description || null,
        order_index: 999,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData(queryKey, (old: TrainingSubcategory[] = []) => [
        ...old,
        optimisticSubcategory,
      ])
      return { previousSubcategories }
    },
    onError: (err, variables, context) => {
      if (context?.previousSubcategories) {
        queryClient.setQueryData(queryKey, context.previousSubcategories)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ subcategoryId, formData }: { subcategoryId: string; formData: FormData }) => {
      const result = await updateTrainingSubcategory(subcategoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (subcategoryId: string) => {
      const result = await deleteTrainingSubcategory(subcategoryId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onMutate: async (subcategoryId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousSubcategories = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: TrainingSubcategory[] = []) =>
        old.filter((s) => s.id !== subcategoryId)
      )
      return { previousSubcategories }
    },
    onError: (err, variables, context) => {
      if (context?.previousSubcategories) {
        queryClient.setQueryData(queryKey, context.previousSubcategories)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
