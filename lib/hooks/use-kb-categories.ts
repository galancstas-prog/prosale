'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getKbCategories, createKbCategory, updateKbCategory, deleteKbCategory } from '@/lib/actions/kb-categories'

export function useKbCategories() {
  return useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const result = await getKbCategories()
      return result.data || []
    },
  })
}

export function useKbCategoryMutation() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createKbCategory(formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ categoryId, formData }: { categoryId: string; formData: FormData }) => {
      const result = await updateKbCategory(categoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const result = await deleteKbCategory(categoryId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
