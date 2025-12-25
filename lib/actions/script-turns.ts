'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { revalidatePath } from 'next/cache'

export async function createTurn(threadId: string, formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const speaker = formData.get('speaker') as string
  const content = formData.get('content') as string

  if (!speaker || !content) {
    return { error: 'Speaker and content are required' }
  }

  if (speaker !== 'agent' && speaker !== 'client') {
    return { error: 'Invalid speaker type' }
  }

  const supabase = await createClient()

  const { data: maxOrder } = await supabase
    .from('script_turns')
    .select('turn_order')
    .eq('thread_id', threadId)
    .order('turn_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const turnOrder = maxOrder ? maxOrder.turn_order + 1 : 1

  const { data, error } = await supabase
    .from('script_turns')
    .insert({
      tenant_id: user.appUser.tenant_id,
      thread_id: threadId,
      turn_order: turnOrder,
      speaker,
      content,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { data }
}

export async function getTurnsByThread(threadId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('script_turns')
    .select('*')
    .eq('thread_id', threadId)
    .order('turn_order', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function updateTurn(turnId: string, content: string) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { data: turn } = await supabase
    .from('script_turns')
    .select('thread_id')
    .eq('id', turnId)
    .single()

  const { error } = await supabase
    .from('script_turns')
    .update({ content })
    .eq('id', turnId)
    .eq('tenant_id', user.appUser.tenant_id)

  if (error) {
    return { error: error.message }
  }

  if (turn?.thread_id) {
    revalidatePath(`/app/scripts/thread/${turn.thread_id}`)
  }
  return { success: true }
}

export async function deleteTurn(turnId: string, threadId: string) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('script_turns')
    .delete()
    .eq('id', turnId)
    .eq('tenant_id', user.appUser.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { success: true }
}

export async function reorderTurn(turnId: string, threadId: string, direction: 'up' | 'down') {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { data: currentTurn } = await supabase
    .from('script_turns')
    .select('turn_order')
    .eq('id', turnId)
    .single()

  if (!currentTurn) {
    return { error: 'Turn not found' }
  }

  const newOrder = direction === 'up' ? currentTurn.turn_order - 1 : currentTurn.turn_order + 1

  const { data: swapTurn } = await supabase
    .from('script_turns')
    .select('id')
    .eq('thread_id', threadId)
    .eq('turn_order', newOrder)
    .maybeSingle()

  if (!swapTurn) {
    return { error: 'Cannot move in that direction' }
  }

  await supabase
    .from('script_turns')
    .update({ turn_order: newOrder })
    .eq('id', turnId)

  await supabase
    .from('script_turns')
    .update({ turn_order: currentTurn.turn_order })
    .eq('id', swapTurn.id)

  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { success: true }
}
