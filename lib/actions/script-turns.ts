'use server'

import { getSupabaseClient } from '@/lib/supabase-client'
const supabase = getSupabaseClient()

export async function createTurn(threadId: string, formData: FormData) {
  const speaker = formData.get('speaker') as string
  const content = formData.get('content') as string

  if (!speaker || !content) {
    return { error: 'Speaker and content are required' }
  }

  if (speaker !== 'agent' && speaker !== 'client') {
    return { error: 'Invalid speaker type' }
  }

  const { count } = await supabase
    .from('script_turns')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId)

  const { data, error } = await supabase
    .from('script_turns')
    .insert({
      thread_id: threadId,
      speaker,
      message: content,
      order_index: (count || 0) + 1,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating turn:', error)
    return { error: 'Failed to create turn' }
  }

  return { data }
}

export async function getTurnsByThread(threadId: string) {
  const { data, error } = await supabase
    .from('script_turns')
    .select('*')
    .eq('thread_id', threadId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching turns:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function updateTurn(turnId: string, content: string) {
  const { error } = await supabase
    .from('script_turns')
    .update({ message: content })
    .eq('id', turnId)

  if (error) {
    console.error('Error updating turn:', error)
    return { error: 'Failed to update turn' }
  }

  return { success: true }
}

export async function deleteTurn(turnId: string, threadId: string) {
  const { error } = await supabase
    .from('script_turns')
    .delete()
    .eq('id', turnId)

  if (error) {
    console.error('Error deleting turn:', error)
    return { error: 'Failed to delete turn' }
  }

  return { success: true }
}

export async function reorderTurn(turnId: string, threadId: string, direction: 'up' | 'down') {
  const { data: turn, error: turnError } = await supabase
    .from('script_turns')
    .select('*')
    .eq('id', turnId)
    .maybeSingle()

  if (turnError || !turn) {
    return { error: 'Turn not found' }
  }

  const newOrder = direction === 'up' ? turn.order_index - 1 : turn.order_index + 1

  const { data: swapTurn, error: swapError } = await supabase
    .from('script_turns')
    .select('*')
    .eq('thread_id', threadId)
    .eq('order_index', newOrder)
    .maybeSingle()

  if (swapError || !swapTurn) {
    return { error: 'Cannot move in that direction' }
  }

  await supabase
    .from('script_turns')
    .update({ order_index: newOrder })
    .eq('id', turnId)

  await supabase
    .from('script_turns')
    .update({ order_index: turn.order_index })
    .eq('id', swapTurn.id)

  return { success: true }
}
