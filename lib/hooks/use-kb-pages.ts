'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getKbPages, createKbPage, deleteKbPage } from '@/lib/actions/kb-pages'

export function useKbPages() {
  return useQuery({
    queryKey: ['kb-pages'],
    queryFn: async () => {
      const result = await getKbPages()
      return result.data || []
    },
  })
}

export function useKbPageMutation() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createKbPage(formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-pages'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteKbPage(id)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-pages'] })
    },
  })

  return { createMutation, deleteMutation }
}
