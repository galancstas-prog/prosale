'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTrainingDocsByCategory, createTrainingDoc, updateTrainingDoc, deleteTrainingDoc } from '@/lib/actions/training-docs'

type TrainingDoc = Awaited<ReturnType<typeof getTrainingDocsByCategory>>

export function useTrainingDocs(categoryId: string) {
  return useQuery({
    queryKey: ['training-docs', categoryId],
    queryFn: async () => {
      if (!categoryId) return []
      const result = await getTrainingDocsByCategory(categoryId)
      return result.data || []
    },
    enabled: !!categoryId,
  })
}

export function useTrainingDocMutation(categoryId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['training-docs', categoryId]

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createTrainingDoc(categoryId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey })
      const previousDocs = queryClient.getQueryData(queryKey)
      
      const title = formData.get('title') as string
      const optimisticDoc: any = {
        id: `temp-${Date.now()}`,
        title,
        content: '',
        content_richtext: '',
        category_id: categoryId,
        created_at: new Date().toISOString(),
        is_published: true,
      }
      queryClient.setQueryData(queryKey, (old: any[] = []) => [...old, optimisticDoc])
      return { previousDocs }
    },
    onError: (err, variables, context) => {
      if (context?.previousDocs) {
        queryClient.setQueryData(queryKey, context.previousDocs)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ docId, title, content }: { docId: string; title?: string; content?: string }) => {
      const updateData: { title?: string; content_richtext?: string } = {}
      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content_richtext = content
      
      const result = await updateTrainingDoc(docId, updateData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const result = await deleteTrainingDoc(docId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onMutate: async (docId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousDocs = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.filter((d) => d.id !== docId)
      )
      return { previousDocs }
    },
    onError: (err, variables, context) => {
      if (context?.previousDocs) {
        queryClient.setQueryData(queryKey, context.previousDocs)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
