'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRecentQuestions, getTopClusters, getDraftsForClusters, getAllDrafts, RecentQuestion, TopCluster, StandaloneDraft } from '@/lib/actions/analytics-questions'
import { publishFaqDraft, deleteFaqDraft } from '@/lib/actions/faq-magic'

export function useRecentQuestions() {
  return useQuery({
    queryKey: ['recent-questions'],
    queryFn: async () => {
      const result = await getRecentQuestions()
      return result.data || []
    },
  })
}

export function useTopClusters(filter: string = 'all') {
  return useQuery({
    queryKey: ['top-clusters', filter],
    queryFn: async () => {
      const result = await getTopClusters(filter as any)
      return result.data || []
    },
  })
}

export function useDraftsForClusters(clusterIds: string[]) {
  return useQuery({
    queryKey: ['drafts-for-clusters', clusterIds],
    queryFn: async () => {
      if (!clusterIds.length) return {}
      const result = await getDraftsForClusters(clusterIds)
      return result.data || {}
    },
  })
}

export function useAllDrafts() {
  return useQuery({
    queryKey: ['all-drafts'],
    queryFn: async () => {
      const result = await getAllDrafts()
      return result.data || []
    },
  })
}

export function useFaqDraftMutation() {
  const queryClient = useQueryClient()

  const publishMutation = useMutation({
    mutationFn: async ({
      draftId,
      question,
      answer,
    }: {
      draftId: string
      question: string
      answer: string
    }) => {
      const result = await publishFaqDraft({ draftId, question, answer })
      if (!result.success) throw new Error(result.error || 'Failed to publish draft')
      return result
    },
    onMutate: async ({ draftId, question }) => {
      await queryClient.cancelQueries({ queryKey: ['all-drafts'] })
      await queryClient.cancelQueries({ queryKey: ['drafts-for-clusters'] })

      const previousAllDrafts = queryClient.getQueryData(['all-drafts'])
      const previousClusters = queryClient.getQueryData(['drafts-for-clusters'])

      queryClient.setQueryData(['all-drafts'], (old: any[] = []) =>
        old.filter((d) => d.id !== draftId)
      )

      return { previousAllDrafts, previousClusters }
    },
    onError: (err, variables, context) => {
      if (context?.previousAllDrafts) {
        queryClient.setQueryData(['all-drafts'], context.previousAllDrafts)
      }
      if (context?.previousClusters) {
        queryClient.invalidateQueries({ queryKey: ['drafts-for-clusters'] })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['drafts-for-clusters'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const result = await deleteFaqDraft({ draftId })
      if (!result.success) throw new Error(result.error || 'Failed to delete draft')
      return result
    },
    onMutate: async (draftId) => {
      await queryClient.cancelQueries({ queryKey: ['all-drafts'] })
      await queryClient.cancelQueries({ queryKey: ['drafts-for-clusters'] })

      const previousAllDrafts = queryClient.getQueryData(['all-drafts'])
      const previousClusters = queryClient.getQueryData(['drafts-for-clusters'])

      queryClient.setQueryData(['all-drafts'], (old: any[] = []) =>
        old.filter((d) => d.id !== draftId)
      )

      return { previousAllDrafts, previousClusters }
    },
    onError: (err, variables, context) => {
      if (context?.previousAllDrafts) {
        queryClient.setQueryData(['all-drafts'], context.previousAllDrafts)
      }
      if (context?.previousClusters) {
        queryClient.invalidateQueries({ queryKey: ['drafts-for-clusters'] })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['drafts-for-clusters'] })
    },
  })

  return { publishMutation, deleteMutation }
}
