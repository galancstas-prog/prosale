'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

// UI ожидает это имя
export async function getTurnsByThread(threadId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_turns')
    .select('*')
    .eq('thread_id', threadId)
    .order('order_index', { ascending: true })

  if (error) return { data: [] as any[], error: error.message }
  return { data: data || [], error: null }
}

export async function createTurn(threadId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const speaker = String(formData.get('speaker') || '').trim()
  const message = String(formData.get('message') || '').trim()

  if (!threadId) return { error: 'Missing threadId' }
  if (!message) return { error: 'Message is required' }

  if (speaker !== 'agent' && speaker !== 'client') {
    return { error: 'Invalid speaker (must be agent or client)' }
  }

  const { data: lastTurn, error: lastErr } = await supabase
    .from('script_turns')
    .select('order_index')
    .eq('thread_id', threadId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastErr) return { error: lastErr.message }

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

  if (error) return { error: error.message }

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

  if (error) return { error: error.message }

  if (data?.thread_id) revalidatePath(`/app/scripts/thread/${data.thread_id}`)
  return { success: true }
}

// UI вызывает deleteTurn(turnId, threadId)
export async function deleteTurn(turnId: string, threadId?: string) {
  const supabase = await getSupabaseServerClient()
  if (!turnId) return { error: 'Missing turnId' }

  const { error } = await supabase.from('script_turns').delete().eq('id', turnId)
  if (error) return { error: error.message }

  if (threadId) revalidatePath(`/app/scripts/thread/${threadId}`)
  return { success: true }
}

/**
 * ✅ ВАЖНО: UI вызывает reorderTurn(turnId, threadId, direction)
 * Поэтому принимаем 3 аргумента (threadId используем для revalidatePath),
 * но реальные данные всё равно берём из БД по turnId (надёжнее).
 */
export async function reorderTurn(
  turnId: string,
  threadId: string,
  direction: 'up' | 'down'
) {
  const supabase = await getSupabaseServerClient()
  if (!turnId) return { error: 'Missing turnId' }

  const { data: current, error: currErr } = await supabase
    .from('script_turns')
    .select('*')
    .eq('id', turnId)
    .single()

  if (currErr) return { error: currErr.message }

  const realThreadId = current.thread_id || threadId
  const currentIndex = current.order_index

  const operator = direction === 'up' ? 'lt' : 'gt'
  const orderAsc = direction === 'up' ? false : true

  const { data: neighbor, error: nErr } = await supabase
    .from('script_turns')
    .select('*')
    // @ts-ignore
    .filter('order_index', operator, currentIndex)
    .eq('thread_id', realThreadId)
    .order('order_index', { ascending: orderAsc })
    .limit(1)
    .maybeSingle()

  if (nErr) return { error: nErr.message }
  if (!neighbor) {
    revalidatePath(`/app/scripts/thread/${realThreadId}`)
    return { success: true }
  }

  const { error: u1 } = await supabase
    .from('script_turns')
    .update({ order_index: neighbor.order_index })
    .eq('id', current.id)

  const { error: u2 } = await supabase
    .from('script_turns')
    .update({ order_index: current.order_index })
    .eq('id', neighbor.id)

  if (u1 || u2) return { error: (u1 || u2)?.message || 'Failed to reorder' }

  revalidatePath(`/app/scripts/thread/${realThreadId}`)
  return { success: true }
}