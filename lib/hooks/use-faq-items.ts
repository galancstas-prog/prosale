'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getFaqItems, createFaqItem, updateFaqItem, deleteFaqItem, searchFaqItems } from '@/lib/actions/faq-items'

export function useFaqItems() {
  return useQuery({
    queryKey: ['faq-items'],
    queryFn: async () => {
      const result = await getFaqItems()
      return result.data || []
    },
  })
}

export function useFaqItemMutation() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createFaqItem(formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateFaqItem(id, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFaqItem(id)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}

export function useFaqSearch(query: string) {
  return useQuery({
    queryKey: ['faq-search', query],
    queryFn: async () => {
      const result = await searchFaqItems(query)
      return result.data || []
    },
    enabled: query.length > 0,
  })
}
