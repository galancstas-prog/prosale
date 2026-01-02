'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

// Создание диалога (thread) внутри категории
export async function createThread(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = String(formData.get('title') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!categoryId) return { error: 'Missing categoryId' }
  if (!title) return { error: 'Thread title is required' }

  const { data, error } = await supabase
    .from('script_threads')
    .insert({
      category_id: categoryId,
      title,
      description,
      is_published: true,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/scripts')
  revalidatePath(`/app/scripts/${categoryId}`)
  return { data }
}

// Список диалогов по категории
export async function getThreadsByCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) return { data: [] as any[], error: error.message }
  return { data: data || [], error: null }
}

// ✅ ВАЖНО: это имя ожидает UI (по логу). Добавляем обратно.
export async function getThreadById(threadId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('id', threadId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Обновление диалога
export async function updateThread(threadId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = String(formData.get('title') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!threadId) return { error: 'Missing threadId' }
  if (!title) return { error: 'Thread title is required' }

  const { data, error } = await supabase
    .from('script_threads')
    .update({ title, description })
    .eq('id', threadId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/scripts')
  return { data }
}

// Удаление диалога
export async function deleteThread(threadId: string) {
  const supabase = await getSupabaseServerClient()
  if (!threadId) return { error: 'Missing threadId' }

  const { error } = await supabase.from('script_threads').delete().eq('id', threadId)
  if (error) return { error: error.message }

  revalidatePath('/app/scripts')
  return { success: true }
}