'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getKbPages() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('kb_pages')
    // updated_at в таблице НЕТ — поэтому НЕ выбираем его
    .select('id,title,content_richtext,created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getKbPages] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getKbPageById(pageId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('*')
    .eq('id', pageId)
    .single()

  if (error) {
    console.error('[getKbPageById] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function createKbPage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()

  if (!title) return { error: 'Title is required' }
  if (!content) return { error: 'Content is required' }

  const { data, error } = await supabase
    .from('kb_pages')
    .insert({
      title,
      content_richtext: content,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createKbPage] Database error:', error)
    return { error: `Database error: ${error.message}` }
  }

  safeRevalidatePath('/app/knowledge')
  return { data }
}

export async function updateKbPage(pageId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content_richtext') as string)?.trim()

  if (!title || !content) return { error: 'Title and content are required' }

  // updated_at в таблице НЕТ — поэтому НЕ обновляем его
  const { data, error } = await supabase
    .from('kb_pages')
    .update({
      title,
      content_richtext: content,
    })
    .eq('id', pageId)
    .select('*')
    .single()

  if (error) {
    console.error('[updateKbPage] Database error:', error)
    return { error: error.message }
  }

  safeRevalidatePath('/app/knowledge')
  safeRevalidatePath(`/app/knowledge/${pageId}`)
  return { data }
}

export async function deleteKbPage(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from('kb_pages').delete().eq('id', id)

  if (error) {
    console.error('[deleteKbPage] Database error:', error)
    return { error: error.message }
  }

  safeRevalidatePath('/app/knowledge')
  return { success: true }
}