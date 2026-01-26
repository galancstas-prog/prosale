'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTurnsByThread, createTurn, updateTurn, deleteTurn, reorderTurn } from '@/lib/actions/script-turns'

export function useScriptTurns(threadId: string) {
  return useQuery({
    queryKey: ['script-turns', threadId],
    queryFn: async () => {
      const result = await getTurnsByThread(threadId)
      return result.data || []
    },
  })
}

export function useScriptTurnMutation(threadId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createTurn(threadId, formData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ['script-turns', threadId] })
      const previousTurns = queryClient.getQueryData(['script-turns', threadId])
      
      const speaker = (formData.get('speaker') as 'agent' | 'client') || 'agent'
      const message = formData.get('message') as string
      const turns = (previousTurns as any[]) || []
      const optimisticTurn: any = {
        id: `temp-${Date.now()}`,
        speaker,
        message,
        order_index: turns.length,
      }
      queryClient.setQueryData(['script-turns', threadId], [...turns, optimisticTurn])
      return { previousTurns }
    },
    onError: (err, variables, context) => {
      if (context?.previousTurns) {
        queryClient.setQueryData(['script-turns', threadId], context.previousTurns)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-turns', threadId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ turnId, message }: { turnId: string; message: string }) => {
      const result = await updateTurn(turnId, message)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-turns', threadId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (turnId: string) => {
      const result = await deleteTurn(turnId, threadId)
      if (result.error) throw new Error(result.error)
      return result
    },
    onMutate: async (turnId) => {
      await queryClient.cancelQueries({ queryKey: ['script-turns', threadId] })
      const previousTurns = queryClient.getQueryData(['script-turns', threadId])
      queryClient.setQueryData(['script-turns', threadId], (old: any[] = []) =>
        old.filter((t) => t.id !== turnId)
      )
      return { previousTurns }
    },
    onError: (err, variables, context) => {
      if (context?.previousTurns) {
        queryClient.setQueryData(['script-turns', threadId], context.previousTurns)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-turns', threadId] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ turnId, direction }: { turnId: string; direction: 'up' | 'down' }) => {
      const result = await reorderTurn(turnId, threadId, direction)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-turns', threadId] })
    },
  })

  return { createMutation, updateMutation, deleteMutation, reorderMutation }
}
