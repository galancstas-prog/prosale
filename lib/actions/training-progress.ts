'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getMyProgress(docId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('doc_id', docId)
    .maybeSingle()

  if (error) {
    console.error('[getMyProgress]', error)
    return { data: null as any }
  }

  return { data }
}

export async function markDocInProgress(docId: string) {
  const supabase = await getSupabaseServerClient()

  const { data: existing } = await supabase
    .from('training_progress')
    .select('*')
    .eq('doc_id', docId)
    .maybeSingle()

  if (existing) return { data: existing }

  const { data, error } = await supabase
    .from('training_progress')
    .insert({ doc_id: docId, completed: false })
    .select('*')
    .single()

  if (error) {
    console.error('[markDocInProgress]', error)
    return { error: error.message || 'Не удалось обновить прогресс' }
  }

  safeRevalidatePath(`/app/training/doc/${docId}`)
  return { data }
}

export async function markDocCompleted(docId: string) {
  const supabase = await getSupabaseServerClient()

  const { data: existing } = await supabase
    .from('training_progress')
    .select('*')
    .eq('doc_id', docId)
    .maybeSingle()

  const patch = {
    completed: true,
    completed_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase.from('training_progress').update(patch).eq('id', existing.id)
    if (error) {
      console.error('[markDocCompleted:update]', error)
      return { error: error.message || 'Не удалось обновить прогресс' }
    }
  } else {
    const { error } = await supabase.from('training_progress').insert({ doc_id: docId, ...patch })
    if (error) {
      console.error('[markDocCompleted:insert]', error)
      return { error: error.message || 'Не удалось обновить прогресс' }
    }
  }

  safeRevalidatePath(`/app/training/doc/${docId}`)
  safeRevalidatePath('/app/admin/progress')
  return { success: true }
}

export async function getAllProgress() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_progress')
    .select('*, training_docs(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getAllProgress]', error)
    return { data: [] as any[] }
  }

  return { data: data || [] }
}