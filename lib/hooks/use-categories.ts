'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategories()
      return result.data || []
    },
  })
}

export function useCategoryMutation() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createCategory(formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ categoryId, formData }: { categoryId: string; formData: FormData }) => {
      const result = await updateCategory(categoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const result = await deleteCategory(categoryId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
