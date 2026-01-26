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
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ['kb-pages'] })
      const previousPages = queryClient.getQueryData(['kb-pages'])
      
      const title = formData.get('title') as string
      const optimisticPage: any = {
        id: `temp-${Date.now()}`,
        title,
        content_richtext: '',
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData(['kb-pages'], (old: any[] = []) => [...old, optimisticPage])
      return { previousPages }
    },
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(['kb-pages'], context.previousPages)
      }
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['kb-pages'] })
      const previousPages = queryClient.getQueryData(['kb-pages'])
      queryClient.setQueryData(['kb-pages'], (old: any[] = []) =>
        old.filter((p) => p.id !== id)
      )
      return { previousPages }
    },
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(['kb-pages'], context.previousPages)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-pages'] })
    },
  })

  return { createMutation, deleteMutation }
}
