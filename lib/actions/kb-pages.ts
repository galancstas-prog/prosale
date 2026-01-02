import { getSupabaseClient } from '@/lib/supabase-client'
export async function createKbPage(formData: FormData) {
  const supabase = getSupabaseClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const { data, error } = await supabase
    .from('kb_pages')
    .insert({
      title,
      content_richtext: content,
    })
    .select()
    .single()

  if (error) {
    console.error('[KB create]', error)
    return { error: error?.message ?? JSON.stringify(error) }
  }

  return { data }
}

export async function getKbPages() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching KB pages:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function getKbPageById(pageId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('*')
    .eq('id', pageId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching KB page:', error)
    return { error: 'Page not found' }
  }

  if (!data) {
    return { error: 'Page not found' }
  }

  return { data }
}

export async function updateKbPage(pageId: string, formData: FormData) {
  const supabase = getSupabaseClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const { data, error } = await supabase
    .from('kb_pages')
    .update({
      title,
      content_richtext: content,
    })
    .eq('id', pageId)
    .select()
    .single()

  if (error) {
    console.error('[KB update]', error)
    return { error: error?.message ?? JSON.stringify(error) }
  }

  return { data }
}

export async function deleteKbPage(pageId: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('kb_pages')
    .delete()
    .eq('id', pageId)

  if (error) {
    console.error('[KB delete]', error)
    return { error: error?.message ?? JSON.stringify(error) }
  }

  return { success: true }
}