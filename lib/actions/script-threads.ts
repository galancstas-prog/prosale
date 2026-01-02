'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

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

  if (error) {
    console.error('[createThread]', error)
    return { error: error.message || 'Failed to create thread' }
  }

  revalidatePath('/app/scripts')
  revalidatePath(`/app/scripts/${categoryId}`)
  return { data }
}

export async function getThreadsByCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getThreadsByCategory]', error)
    return { data: [] as any[] }
  }

  return { data: data || [] }
}

export async function deleteThread(threadId: string) {
  const supabase = await getSupabaseServerClient()

  if (!threadId) return { error: 'Missing threadId' }

  const { error } = await supabase.from('script_threads').delete().eq('id', threadId)

  if (error) {
    console.error('[deleteThread]', error)
    return { error: error.message || 'Failed to delete thread' }
  }

  revalidatePath('/app/scripts')
  return { success: true }
}