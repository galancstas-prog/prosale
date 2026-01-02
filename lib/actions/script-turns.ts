'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function createTurn(threadId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const speaker = String(formData.get('speaker') || '').trim()
  const message = String(formData.get('message') || '').trim()

  if (!threadId) return { error: 'Missing threadId' }
  if (!message) return { error: 'Message is required' }
  if (speaker !== 'agent' && speaker !== 'client') {
    return { error: 'Invalid speaker (must be agent or client)' }
  }

  // Determine next order_index
  const { data: lastTurn, error: lastErr } = await supabase
    .from('script_turns')
    .select('order_index')
    .eq('thread_id', threadId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastErr) {
    console.error('[createTurn:lastTurn]', lastErr)
    return { error: lastErr.message || 'Failed to read turns' }
  }

  const nextIndex = (lastTurn?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('script_turns')
    .insert({
      thread_id: threadId,
      speaker,
      message,
      order_index: nextIndex,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createTurn]', error)
    return { error: error.message || 'Failed to create turn' }
  }

  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { data }
}

export async function updateTurn(turnId: string, message: string) {
  const supabase = await getSupabaseServerClient()

  const text = String(message || '').trim()
  if (!turnId) return { error: 'Missing turnId' }
  if (!text) return { error: 'Message is required' }

  const { data, error } = await supabase
    .from('script_turns')
    .update({ message: text })
    .eq('id', turnId)
    .select('thread_id')
    .single()

  if (error) {
    console.error('[updateTurn]', error)
    return { error: error.message || 'Failed to update turn' }
  }

  if (data?.thread_id) revalidatePath(`/app/scripts/thread/${data.thread_id}`)
  return { success: true }
}

export async function deleteTurn(turnId: string) {
  const supabase = await getSupabaseServerClient()
  if (!turnId) return { error: 'Missing turnId' }

  // Get thread_id for revalidate
  const { data: row } = await supabase
    .from('script_turns')
    .select('thread_id')
    .eq('id', turnId)
    .maybeSingle()

  const { error } = await supabase.from('script_turns').delete().eq('id', turnId)

  if (error) {
    console.error('[deleteTurn]', error)
    return { error: error.message || 'Failed to delete turn' }
  }

  if (row?.thread_id) revalidatePath(`/app/scripts/thread/${row.thread_id}`)
  return { success: true }
}

export async function reorderTurn(turnId: string, direction: 'up' | 'down') {
  const supabase = await getSupabaseServerClient()
  if (!turnId) return { error: 'Missing turnId' }

  const { data: current, error: currErr } = await supabase
    .from('script_turns')
    .select('*')
    .eq('id', turnId)
    .single()

  if (currErr) {
    console.error('[reorderTurn:current]', currErr)
    return { error: currErr.message || 'Failed to read turn' }
  }

  const threadId = current.thread_id
  const currentIndex = current.order_index

  const operator = direction === 'up' ? 'lt' : 'gt'
  const orderAsc = direction === 'up' ? false : true

  const { data: neighbor, error: nErr } = await supabase
    .from('script_turns')
    .select('*')
    // @ts-ignore supabase filter op
    .filter('order_index', operator, currentIndex)
    .eq('thread_id', threadId)
    .order('order_index', { ascending: orderAsc })
    .limit(1)
    .maybeSingle()

  if (nErr) {
    console.error('[reorderTurn:neighbor]', nErr)
    return { error: nErr.message || 'Failed to read neighbor' }
  }

  if (!neighbor) return { success: true } // already at edge

  // swap order_index
  const { error: u1 } = await supabase
    .from('script_turns')
    .update({ order_index: neighbor.order_index })
    .eq('id', current.id)

  const { error: u2 } = await supabase
    .from('script_turns')
    .update({ order_index: current.order_index })
    .eq('id', neighbor.id)

  if (u1 || u2) {
    console.error('[reorderTurn:swap]', u1 || u2)
    return { error: (u1 || u2)?.message || 'Failed to reorder' }
  }

  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { success: true }
}