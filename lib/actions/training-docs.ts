'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'
import { randomUUID } from 'crypto'

const TRAINING_BUCKET = 'training-images'

export async function getTrainingDocsByCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('id,title,content_richtext,category_id,created_at,is_published')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getTrainingDocsByCategory] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getTrainingDocById(docId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*')
    .eq('id', docId)
    .single()

  if (error) {
    console.error('[getTrainingDocById] Database error:', error)
    return { error: error.message, data: null }
  }

  // ✅ Авто-обновление протухших signed-url в HTML
  // (работает только если ты ДОБАВИШЬ helper refreshTrainingSignedUrls в этом файле)
  try {
    if (data?.content_richtext) {
      data.content_richtext = await refreshTrainingSignedUrls(supabase, data.content_richtext)
    }
    if (data?.content) {
      data.content = await refreshTrainingSignedUrls(supabase, data.content)
    }
  } catch (e) {
    console.warn('[getTrainingDocById] Signed URL refresh failed:', e)
    // не валим страницу — просто вернем как есть
  }

  return { data, error: null }
}

export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim() || ''

  if (!title) return { error: 'Заголовок обязателен' }
  if (!categoryId) return { error: 'Category is required' }
  if (!content) return { error: 'Content is required' }

  const { data, error } = await supabase
    .from('training_docs')
    .insert({
      category_id: categoryId,
      title,
      content,
      content_richtext: content,
      is_published: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createTrainingDoc] Database error:', error)
    return { error: `Ошибка базы данных: ${error.message}` }
  }

  safeRevalidatePath(`/app/training/${categoryId}`)
  safeRevalidatePath('/app/training')
  return { data }
}

export async function updateTrainingDoc(docId: string, content_richtext: string) {
  const supabase = await getSupabaseServerClient()

  const content = (content_richtext || '').trim()
  if (!content) return { error: 'Содержание не может быть пустым' }

  const { data, error } = await supabase
    .from('training_docs')
    .update({
      content,
      content_richtext: content,
    })
    .eq('id', docId)
    .select('*')
    .single()

  if (error) {
    console.error('[updateTrainingDoc] Database error:', error)
    return { error: error.message }
  }

  safeRevalidatePath(`/app/training/doc/${docId}`)
  return { data }
}

export async function deleteTrainingDoc(id: string) {
  const supabase = await getSupabaseServerClient()

  const { data: doc, error: fetchError } = await supabase
    .from('training_docs')
    .select('category_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('[deleteTrainingDoc] Fetch doc error:', fetchError)
  }

  const { error } = await supabase.from('training_docs').delete().eq('id', id)
  if (error) {
    console.error('[deleteTrainingDoc] Delete error:', error)
    return { error: error.message }
  }

  if (doc?.category_id) safeRevalidatePath(`/app/training/${doc.category_id}`)
  safeRevalidatePath('/app/training')
  return { success: true }
}

export async function uploadTrainingImage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Файл не предоставлен' }

  if (!file.type.startsWith('image/')) return { error: 'Допускаются только изображения' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Максимальный размер файла 5МБ' }

  // 1) достаем текущего юзера
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) return { error: 'Не аутентифицирован' }

  // 2) достаем tenant_id (вариант: из tenant_members)
  const { data: tm, error: tmErr } = await supabase
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (tmErr || !tm?.tenant_id) {
    return { error: 'Тенант не найден для пользователя' }
  }

  // (опционально) жестко ограничим upload только админам на уровне кода
  // даже если UI скрыт — это лишняя страховка
  const role = String(tm.role || '').toUpperCase()
if (!['ADMIN', 'OWNER'].includes(role)) {
  return { error: 'Только ADMIN может загружать изображения' }
}

  const tenantId = tm.tenant_id as string

  // 3) грузим в PRIVATE bucket по пути tenantId/uuid.ext
  const ext = file.name.split('.').pop() || 'png'
  const path = `${tenantId}/${randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(TRAINING_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('[uploadTrainingImage] Upload error:', uploadError)
    return { error: uploadError.message }
  }

  // 4) PRIVATE bucket => publicUrl НЕ работает
  // возвращаем signedUrl, чтобы картинка сразу отображалась
  const { data: signed, error: signErr } = await supabase.storage
    .from(TRAINING_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 30) // 30 дней

  if (signErr || !signed?.signedUrl) {
    console.error('[uploadTrainingImage] Signed URL error:', signErr)
    return { error: signErr?.message ?? 'Не удалось создать подписанный URL' }
  }

  // Можно вернуть и path на будущее (чтобы позже уметь обновлять url)
  return { url: signed.signedUrl, path }
}

export async function searchTrainingDocs(query: string) {
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
    .from('training_docs')
    .select('id, title, content_richtext, category_id, categories!inner(id, name)')
    .ilike('content_richtext', searchPattern)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }

  const results = (data || []).map((doc) => {
    const normalizedContent = doc.content_richtext.toLowerCase().replace(/ё/gi, 'е')
    const searchTerms = normalizedQuery.toLowerCase()

    const matchIndex = normalizedContent.indexOf(searchTerms)
    const start = Math.max(0, matchIndex - 30)
    const end = Math.min(doc.content_richtext.length, matchIndex + searchTerms.length + 30)
    const snippet = (start > 0 ? '...' : '') + doc.content_richtext.substring(start, end) + (end < doc.content_richtext.length ? '...' : '')

    return {
      id: doc.id,
      title: doc.title,
      content: doc.content_richtext,
      categoryName: (doc.categories as any).name,
      snippet,
    }
  })

  return { data: results, error: null }
}

async function refreshTrainingSignedUrls(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  html: string
): Promise<string> {
  if (!html) return html

  // Ищем все <img ... src="..."> / src='...'
  const imgSrcRegex = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi

  // Соберём уникальные src
  const srcSet = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = imgSrcRegex.exec(html)) !== null) {
    const src = match[2]?.trim()
    if (src) srcSet.add(src)
  }
  if (srcSet.size === 0) return html

  // Пытаемся вытащить path из supabase storage URL.
  // Поддерживаем форматы:
  // 1) .../storage/v1/object/sign/training-images/<path>?token=...
  // 2) .../storage/v1/object/public/training-images/<path>  (на всякий случай)
  // 3) .../storage/v1/object/training-images/<path> (редко, но бывает)
  const extractPath = (src: string): string | null => {
    try {
      const url = new URL(src)

      // quick reject
      if (!url.pathname.includes(`/storage/v1/object/`)) return null
      if (!url.pathname.includes(`/${TRAINING_BUCKET}/`)) return null

      // pathname example:
      // /storage/v1/object/sign/training-images/tenantId/uuid.png
      // /storage/v1/object/public/training-images/tenantId/uuid.png
      const parts = url.pathname.split(`/${TRAINING_BUCKET}/`)
      if (parts.length < 2) return null

      const rawPath = parts[1] // "tenantId/uuid.png"
      const path = decodeURIComponent(rawPath).replace(/^\/+/, '')
      if (!path) return null
      return path
    } catch {
      return null
    }
  }

  const srcList = Array.from(srcSet)

  // Составляем мапу src -> newSignedUrl
  const replacements = new Map<string, string>()

  for (const src of srcList) {
    const path = extractPath(src)
    if (!path) continue

    // Перевыпускаем signed url на 30 дней
    const { data: signed, error: signErr } = await supabase.storage
      .from(TRAINING_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 30)

    if (signErr || !signed?.signedUrl) {
      // Не ломаем страницу — оставляем старый src
      console.warn('[refreshTrainingSignedUrls] Failed for path:', path, signErr?.message)
      continue
    }

    replacements.set(src, signed.signedUrl)
  }

  if (replacements.size === 0) return html

  // Аккуратно заменяем только точные совпадения src
  let updated = html
  Array.from(replacements.entries()).forEach(([oldSrc, newSrc]) => {
    // заменяем и "src="old"" и "src='old'"
    updated = updated
      .replaceAll(`src="${oldSrc}"`, `src="${newSrc}"`)
      .replaceAll(`src='${oldSrc}'`, `src='${newSrc}'`)
  })

  return updated
}