'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function getKbPages() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('id,title,content_richtext,created_at,updated_at')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function getKbPageById(pageId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('*')
    .eq('id', pageId)
    .single()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createKbPage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()

  if (!title || !content) return { error: 'Title and content are required' }

  const { data, error } = await supabase
    .from('kb_pages')
    .insert({
      title,
      content_richtext: content, // NOT NULL в твоём SQL
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/knowledge')
  return { data }
}

export async function updateKbPage(pageId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content_richtext') as string)?.trim()

  if (!title || !content) return { error: 'Title and content are required' }

  const { data, error } = await supabase
    .from('kb_pages')
    .update({
      title,
      content_richtext: content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/knowledge')
  revalidatePath(`/app/knowledge/${pageId}`)
  return { data }
}

export async function deleteKbPage(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from('kb_pages').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/app/knowledge')
  return { success: true }
}