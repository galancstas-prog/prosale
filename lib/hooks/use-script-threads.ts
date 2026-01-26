'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createThread, getThreadsByCategory, updateThread, updateThreadTitle, deleteThread } from '@/lib/actions/script-threads'

export function useScriptThreads(categoryId: string) {
  return useQuery({
    queryKey: ['script-threads', categoryId],
    queryFn: async () => {
      const result = await getThreadsByCategory(categoryId)
      return result.data || []
    },
  })
}

export function useScriptThreadMutation(categoryId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createThread(categoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ['script-threads', categoryId] })
      const previousThreads = queryClient.getQueryData(['script-threads', categoryId])
      
      const title = formData.get('title') as string
      const optimisticThread: any = {
        id: `temp-${Date.now()}`,
        title,
        description: (formData.get('description') as string) || null,
      }
      queryClient.setQueryData(['script-threads', categoryId], (old: any[] = []) => [...old, optimisticThread])
      return { previousThreads }
    },
    onError: (err, variables, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(['script-threads', categoryId], context.previousThreads)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-threads', categoryId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ threadId, formData }: { threadId: string; formData: FormData }) => {
      const result = await updateThread(threadId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-threads', categoryId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const result = await deleteThread(threadId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: ['script-threads', categoryId] })
      const previousThreads = queryClient.getQueryData(['script-threads', categoryId])
      queryClient.setQueryData(['script-threads', categoryId], (old: any[] = []) =>
        old.filter((t) => t.id !== threadId)
      )
      return { previousThreads }
    },
    onError: (err, variables, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(['script-threads', categoryId], context.previousThreads)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-threads', categoryId] })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
