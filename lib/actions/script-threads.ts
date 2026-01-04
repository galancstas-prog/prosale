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

  if (!title) return { error: 'Title is required' }

  const { data, error } = await supabase
    .from('script_threads')
    .update({ title, description })
    .eq('id', threadId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  safeRevalidatePath('/app/scripts')
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

  const { data: thread } = await supabase
    .from('script_threads')
    .select('category_id')
    .eq('id', threadId)
    .single()

  const { error } = await supabase.from('script_threads').delete().eq('id', threadId)
  if (error) return { error: error.message }

  safeRevalidatePath('/app/scripts')
  if (thread?.category_id) safeRevalidatePath(`/app/scripts/${thread.category_id}`)
  return { success: true }
}
