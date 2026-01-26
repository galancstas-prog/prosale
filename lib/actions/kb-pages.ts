'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getKbPages() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('kb_pages')
    .select('id,title,content_richtext,created_at,category_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getKbPages] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function createKbPage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = String(formData.get('title') ?? '').trim()
  const content = String(
    formData.get('content_richtext') ??
      formData.get('content') ?? // fallback на старое имя
      ''
  ).trim()
  const categoryIdRaw = formData.get('category_id')
  let categoryId = categoryIdRaw ? String(categoryIdRaw) : null

  // временная отладка (если надо) — потом убери
  // console.log('[createKbPage] keys:', Array.from(formData.keys()))

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  // Если category_id не указан, найти категорию "Общая" для KB
  if (!categoryId) {
    const { data: defaultCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('type', 'kb')
      .eq('name', 'Общая')
      .single()

    if (defaultCategory) {
      categoryId = defaultCategory.id
    }
  }

  const { data, error } = await supabase
    .from('kb_pages')
    .insert({
      title,
      content_richtext: content,
      category_id: categoryId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createKbPage] Database error:', error)
    return { error: error.message }
  }

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
      console.error('[createKbPage] AI status update error:', statusError)
    }
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

  const title = String(formData.get('title') ?? '').trim()
  const content = String(
    formData.get('content_richtext') ??
      formData.get('content') ?? // fallback
      ''
  ).trim()
  const categoryIdRaw = formData.get('category_id')
  const categoryId = categoryIdRaw ? String(categoryIdRaw) : null

  if (!title || !content) return { error: 'Title and content are required' }

  const updateData: any = {
    title,
    content_richtext: content,
  }

  if (categoryId !== null) {
    updateData.category_id = categoryId
  }

  const { data, error } = await supabase
    .from('kb_pages')
    .update(updateData)
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

  // FIX #1: Delete related ai_chunks
  const { error: chunksError } = await supabase
    .from('ai_chunks')
    .delete()
    .eq('module', 'kb')
    .eq('entity_id', id)

  if (chunksError) {
    console.error('[deleteKbPage] AI chunks delete error:', chunksError)
  }

  // FIX #1: Update tenants ai_status to needs_reindex
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
      console.error('[deleteKbPage] AI status update error:', statusError)
    }
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
    searchPattern = words.map((w) => `%${w}%`).join('')
  }

  const { data, error } = await supabase
    .from('kb_pages')
    .select('id, title, content_richtext')
    .ilike('content_richtext', searchPattern)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }

  const results = (data || []).map((page) => {
    const contentText = page.content_richtext ?? ''
    const normalizedContent = contentText.toLowerCase().replace(/ё/gi, 'е')
    const searchTerms = normalizedQuery.toLowerCase()

    const matchIndex = normalizedContent.indexOf(searchTerms)

    if (matchIndex === -1) {
      return {
        id: page.id,
        title: page.title,
        content: contentText,
        snippet: contentText.slice(0, 120) + (contentText.length > 120 ? '...' : ''),
      }
    }

    const start = Math.max(0, matchIndex - 30)
    const end = Math.min(contentText.length, matchIndex + searchTerms.length + 30)
    const snippet =
      (start > 0 ? '...' : '') +
      contentText.substring(start, end) +
      (end < contentText.length ? '...' : '')

    return {
      id: page.id,
      title: page.title,
      content: contentText,
      snippet,
    }
  })

  return { data: results, error: null }
}
