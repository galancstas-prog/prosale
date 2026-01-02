'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function createKbPage(formData: FormData) {
  const supabase = getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()

  if (!title || !content) return { error: 'Title and content are required' }

  // В SQL: content_richtext NOT NULL → кладём туда текст
  const { data, error } = await supabase
    .from('kb_pages')
    .insert({ title, content_richtext: content })
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/knowledge')
  return { data }
}

export async function deleteKbPage(id: string) {
  const supabase = getSupabaseServerClient()

  const { error } = await supabase.from('kb_pages').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/app/knowledge')
  return { success: true }
}