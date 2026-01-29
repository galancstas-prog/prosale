'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function createThread(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!title) return { error: 'Title is required' }

  const { data, error } = await supabase
    .from('script_threads')
    .insert({ category_id: categoryId, title, description })
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
      console.error('[createThread] AI status update error:', statusError)
    }
  }

  safeRevalidatePath('/app/scripts')
  safeRevalidatePath(`/app/scripts/${categoryId}`)
  return { data }
}

export async function getThreadsByCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('category_id', categoryId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] as any[] }

  return { data: data || [] }
}

export async function getThreadById(threadId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('id', threadId)
    .single()

  if (error) return { error: error.message, data: null }

  return { data }
}

export async function updateThread(threadId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const categoryId = (formData.get('category_id') as string)?.trim() || null

  if (!title) return { error: 'Title is required' }

  // Получаем старый category_id для revalidate
  const { data: oldThread } = await supabase
    .from('script_threads')
    .select('category_id')
    .eq('id', threadId)
    .single()

  const updateData: any = { title, description }
  if (categoryId) {
    updateData.category_id = categoryId
  }

  const { data, error } = await supabase
    .from('script_threads')
    .update(updateData)
    .eq('id', threadId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  // Revalidate обе категории при перемещении
  safeRevalidatePath('/app/scripts')
  if (oldThread?.category_id && oldThread.category_id !== categoryId) {
    safeRevalidatePath(`/app/scripts/${oldThread.category_id}`)
  }
  if (categoryId) {
    safeRevalidatePath(`/app/scripts/${categoryId}`)
  }

  return { data }
}

export async function updateThreadTitle(threadId: string, title: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_threads')
    .update({ title })
    .eq('id', threadId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  safeRevalidatePath('/app/scripts')
  return { data }
}

export async function deleteThread(threadId: string) {
  const supabase = await getSupabaseServerClient()

  // 1. узнаём category_id (для revalidate)
  const { data: thread } = await supabase
    .from('script_threads')
    .select('category_id')
    .eq('id', threadId)
    .single()

  // 2. получаем turn-ы ДО удаления thread (иначе CASCADE сотрёт их)
  const { data: turns } = await supabase
    .from('script_turns')
    .select('id')
    .eq('thread_id', threadId)

  // 3. чистим ai_chunks для turn-ов
  if (turns?.length) {
    const turnIds = turns.map((t) => t.id)

    const { error: chunksError } = await supabase
      .from('ai_chunks')
      .delete()
      .eq('module', 'scripts')
      .in('entity_id', turnIds)

    if (chunksError) {
      console.error('[deleteThread] AI chunks delete error:', chunksError)
    }
  }

  // 4. удаляем сам thread
  const { error } = await supabase
    .from('script_threads')
    .delete()
    .eq('id', threadId)

  if (error) return { error: error.message }

  // 5. помечаем ИИ как требующий переиндексации
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
      console.error('[deleteThread] AI status update error:', statusError)
    }
  }

  // 6. revalidate
  safeRevalidatePath('/app/scripts')
  if (thread?.category_id) {
    safeRevalidatePath(`/app/scripts/${thread.category_id}`)
  }

  return { success: true }
}