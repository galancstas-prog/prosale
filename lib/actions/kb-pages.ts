'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getKbPages() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('id,title,content_richtext,created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getKbPages] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function createKbPage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content_richtext') as string)?.trim()

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

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
    return { error: error.message }
  }

  safeRevalidatePath('/app/knowledge')
  return { data }
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

export async function searchKbPages(query: string) {
  if (!query || query.length < 2) {
    return { data: [], error: null }
  }

  const supabase = await getSupabaseServerClient()

  const normalizedQuery = query.replace(/ё/gi, 'е')

  const isExactPhrase = /^".*"$/.test(query)
  let searchPattern: string

  if (isExactPhrase) {
    const phrase = query.slice(1, -1).replace(/ё/gi, 'е')
    searchPattern = `%${phrase}%`
  } else {
    const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 0)
    searchPattern = words.map(w => `%${w}%`).join('')
  }

  const { data, error } = await supabase
    .from('kb_pages')
    .select('id, title, content_richtext')
    .ilike('content_richtext', searchPattern)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }

  const results = (data || []).map((page) => {
    const normalizedContent = page.content_richtext.toLowerCase().replace(/ё/gi, 'е')
    const searchTerms = normalizedQuery.toLowerCase()

    const matchIndex = normalizedContent.indexOf(searchTerms)
    const start = Math.max(0, matchIndex - 30)
    const end = Math.min(page.content_richtext.length, matchIndex + searchTerms.length + 30)
    const snippet = (start > 0 ? '...' : '') + page.content_richtext.substring(start, end) + (end < page.content_richtext.length ? '...' : '')

    return {
      id: page.id,
      title: page.title,
      content: page.content_richtext,
      snippet,
    }
  })

  return { data: results, error: null }
}

