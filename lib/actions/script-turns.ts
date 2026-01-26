'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

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

  // FIX #3: Update ai_status after creating new content
  const { data: tenantRow, error: tenantErr } = await supabase
    .from('tenants')
    .select('id')
    .single()

  if (!tenantErr && tenantRow?.id) {
    const { error: statusError } = await supabase
      .from('tenants')
      .update({ ai_status: 'needs_reindex' })
      .eq('id', tenantRow.id)

    if (statusError) {
      console.error('[createTurn] AI status update error:', statusError)
    }
  }

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

  // FIX #3: Update ai_status after content update
  const { data: tenantRow, error: tenantErr } = await supabase
    .from('tenants')
    .select('id')
    .single()

  if (!tenantErr && tenantRow?.id) {
    const { error: statusError } = await supabase
      .from('tenants')
      .update({ ai_status: 'needs_reindex' })
      .eq('id', tenantRow.id)

    if (statusError) {
      console.error('[updateTurn] AI status update error:', statusError)
    }
  }

  return { success: true }
}

// UI вызывает deleteTurn(turnId, threadId)
export async function deleteTurn(turnId: string, threadId?: string) {
  const supabase = await getSupabaseServerClient()
  if (!turnId) return { error: 'Missing turnId' }

  const { error } = await supabase.from('script_turns').delete().eq('id', turnId)
  if (error) return { error: error.message }

  // FIX #1: Delete related ai_chunks
  const { error: chunksError } = await supabase
    .from('ai_chunks')
    .delete()
    .eq('module', 'scripts')
    .eq('entity_id', turnId)

  if (chunksError) {
    console.error('[deleteTurn] AI chunks delete error:', chunksError)
  }

  // FIX #1: Update tenants ai_status to needs_reindex
  const { data: tenantRow, error: tenantErr } = await supabase
    .from('tenants')
    .select('id')
    .single()

  if (!tenantErr && tenantRow?.id) {
    const { error: statusError } = await supabase
      .from('tenants')
      .update({ ai_status: 'needs_reindex' })
      .eq('id', tenantRow.id)

    if (statusError) {
      console.error('[deleteTurn] AI status update error:', statusError)
    }
  }

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

  return { success: true }
}

export async function searchScriptTurns(query: string) {
  if (!query || query.length < 2) {
    return { data: [], error: null }
  }

  const supabase = await getSupabaseServerClient()

  const normalizedQuery = query.replace(/ё/gi, 'е')

  const isExactPhrase = /^".*"$/.test(query)
  let searchPattern: string

  if (isExactPhrase) {
    const phrase = query.slice(1, -1).replace(/ё/gi, 'е')
    searchPattern = `%${phrase}%`
  } else {
    const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 0)
    searchPattern = words.map(w => `%${w}%`).join('')
  }

  const { data, error } = await supabase
    .from('script_turns')
    .select('id, message, thread_id, script_threads!inner(id, title, category_id, categories!inner(id, name))')
    .ilike('message', searchPattern)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }

  const results = (data || []).map((turn) => {
    const normalizedMessage = turn.message.toLowerCase().replace(/ё/gi, 'е')
    const searchTerms = normalizedQuery.toLowerCase()

    const matchIndex = normalizedMessage.indexOf(searchTerms)
    const start = Math.max(0, matchIndex - 30)
    const end = Math.min(turn.message.length, matchIndex + searchTerms.length + 30)
    const snippet = (start > 0 ? '...' : '') + turn.message.substring(start, end) + (end < turn.message.length ? '...' : '')

    const thread = turn.script_threads as any
    const category = thread?.categories as any

    // Skip if thread or category is missing
    if (!thread || !category) return null

    return {
      id: turn.id,
      threadId: turn.thread_id,
      threadTitle: thread.title,
      categoryName: category.name,
      message: turn.message,
      snippet,
    }
  }).filter((result): result is NonNullable<typeof result> => result !== null)

  return { data: results, error: null }
}