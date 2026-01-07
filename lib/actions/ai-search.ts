'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { createEmbedding, createChatCompletion } from '@/lib/ai/openai'
import { chunkText } from '@/lib/ai/chunking'
import { createEmbeddingsBatch } from '@/lib/ai/openai'

export interface AISource {
  module: 'scripts' | 'training' | 'faq' | 'kb'
  id: string
  title: string
  snippet: string
  meta: any
}

export interface AISearchResult {
  answer: string
  sources: AISource[]
  error?: string
}

export async function aiSearch(
  query: string,
  filters: { scripts: boolean; training: boolean; faq: boolean; kb: boolean }
): Promise<AISearchResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { answer: '', sources: [], error: 'OPENAI_API_KEY is missing' }
    }

    if (!query || query.length < 4) {
      return { answer: '', sources: [], error: 'Запрос слишком короткий. Минимум 4 символа.' }
    }

    const supabase = await getSupabaseServerClient()

    const queryEmbedding = await createEmbedding(query)

    // важно: в pgvector vector(1536) должен прийти массив чисел
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
      throw new Error('Invalid embedding format: must be array of 1536 numbers')
    }
    if (!queryEmbedding.every((v) => typeof v === 'number' && Number.isFinite(v))) {
      throw new Error('Invalid embedding format: all values must be finite numbers')
    }

    const enabledModules = Object.entries(filters)
      .filter(([_, enabled]) => enabled)
      .map(([module]) => module)

    if (enabledModules.length === 0) {
      return { answer: 'Включите хотя бы один модуль для поиска.', sources: [] }
    }

    const { data: chunks, error: searchError } = await supabase.rpc('match_ai_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 20,
      filter_modules: enabledModules,
    })

    if (searchError) throw new Error(`Search error: ${searchError.message}`)

    if (!chunks || chunks.length === 0) {
      return {
        answer:
          'К сожалению, я не нашёл информации по вашему запросу в базе знаний. Пожалуйста, уточните ваш вопрос или попробуйте другую формулировку.',
        sources: [],
      }
    }

    const context = chunks.map((c: any, i: number) => `[${i + 1}] ${c.chunk_text}`).join('\n\n')

function detectLang(text: string): 'kk' | 'ru' | 'en' {
  const t = (text || '').toLowerCase()

  // Kazakh Cyrillic specific letters
  if (/[әғқңөұүһі]/i.test(t)) return 'kk'

  // crude latin check
  const latin = (t.match(/[a-z]/g) || []).length
  const cyr = (t.match(/[а-яё]/g) || []).length
  if (latin > cyr) return 'en'

  return 'ru'
}

const lang = detectLang(query)
const answerLangInstruction =
  lang === 'kk'
    ? 'Отвечай на казахском языке.'
    : lang === 'en'
      ? 'Answer in English.'
      : 'Отвечай на русском языке.'

const systemPrompt = `Ты — полезный ассистент для ProSale CRM.
${answerLangInstruction}
Отвечай кратко и по делу, используя только информацию из предоставленного контекста. Твой ответ должен быть пригоден для отправки клиенту. Формат ответа:

Вопрос: [перефразируй вопрос пользователя]
Ответ: [краткий ответ на основе контекста]

Если в контексте нет информации для ответа, скажи: "К сожалению, в базе знаний нет информации по этому вопросу. Пожалуйста, уточните ваш запрос."`

    const userPrompt = `Контекст из базы знаний:\n\n${context}\n\nВопрос пользователя: ${query}`

    const answer = await createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const sources: AISource[] = chunks.slice(0, 10).map((c: any) => ({
      module: c.module,
      id: c.entity_id,
      title: c.title,
      snippet: String(c.chunk_text).substring(0, 150) + '...',
      meta: c.metadata,
    }))

    return { answer, sources }
  } catch (error: any) {
    console.error('AI Search error:', error)
    return { answer: '', sources: [], error: error.message || 'Произошла ошибка при выполнении AI-поиска' }
  }
}

export async function reindexAllContent() {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing')

    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // чистим текущие чанки (RLS сам ограничит тенантом)
    await supabase.from('ai_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000')

   // ---- helpers: embeddings with retry + small concurrency, and bulk insert ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function createEmbeddingWithRetry(text: string, attempts = 6): Promise<number[]> {
  let lastErr: any = null

  for (let i = 0; i < attempts; i++) {
    try {
      const emb = await createEmbedding(text)

      if (!Array.isArray(emb) || emb.length !== 1536) {
        throw new Error('Invalid embedding format: must be array of 1536 numbers')
      }
      if (!emb.every((v) => typeof v === 'number' && Number.isFinite(v))) {
        throw new Error('Invalid embedding format: all values must be finite numbers')
      }

      return emb
    } catch (e: any) {
      lastErr = e
      const msg = String(e?.message || e)

      // мягкий retry для лимитов/временных ошибок
      const isRate =
        msg.includes('Too Many Requests') ||
        msg.includes('429') ||
        msg.toLowerCase().includes('rate')

      const isTemp =
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('tempor') ||
        msg.toLowerCase().includes('fetch failed')

      if (i === attempts - 1 || (!isRate && !isTemp)) {
        throw e
      }

      // exponential backoff + jitter
      const backoff = Math.min(8000, 600 * Math.pow(2, i)) + Math.floor(Math.random() * 250)
      await sleep(backoff)
    }
  }

  throw lastErr || new Error('Embedding failed')
}

// небольшая конкуррентность, чтобы не убивать OpenAI
async function createEmbeddingsBatch(texts: string[], concurrency = 3): Promise<number[][]> {
  const out: number[][] = new Array(texts.length)
  let idx = 0

  async function worker() {
    while (true) {
      const cur = idx++
      if (cur >= texts.length) return
      out[cur] = await createEmbeddingWithRetry(texts[cur])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, texts.length) }, () => worker())
  await Promise.all(workers)
  return out
}

async function insertAiChunksBulk(rows: any[], batchSize = 100) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('ai_chunks').insert(batch)
    if (error) throw new Error(`ai_chunks bulk insert failed: ${error.message}`)
  }
}

// ------------------------- FAQ -------------------------
const { data: faqItems } = await supabase.from('faq_items').select('id, question, answer')

if (faqItems && faqItems.length) {
  for (const item of faqItems) {
    const text = `${item.question}\n\n${item.answer}`
    const chunks = chunkText(text)
    if (!chunks.length) continue

    const embeddings = await createEmbeddingsBatch(chunks, 3)

    const rows = chunks.map((chunk, i) => ({
      module: 'faq',
      entity_id: item.id,
      title: item.question,
      url_path: `/app/faq?highlight=${item.id}`,
      chunk_text: chunk,
      embedding: embeddings[i],
      metadata: { id: item.id },
    }))

    await insertAiChunksBulk(rows)
  }
}

// ------------------------- SCRIPTS (script_turns) -------------------------
const { data: scriptTurns } = await supabase
  .from('script_turns')
  .select('id, message, thread_id, script_threads!inner(id, title, category_id)')

if (scriptTurns && scriptTurns.length) {
  for (const turn of scriptTurns as any[]) {
    const chunks = chunkText(turn.message || '')
    if (!chunks.length) continue

    const thread = turn.script_threads
    const embeddings = await createEmbeddingsBatch(chunks, 3)

    const rows = chunks.map((chunk, i) => ({
      module: 'scripts',
      entity_id: turn.id,
      title: thread?.title || 'Script',
      url_path: `/app/scripts/thread/${turn.thread_id}?turnId=${turn.id}`,
      chunk_text: chunk,
      embedding: embeddings[i],
      metadata: { threadId: turn.thread_id, turnId: turn.id },
    }))

    await insertAiChunksBulk(rows)
  }
}

// ------------------------- TRAINING -------------------------
const { data: trainingDocs } = await supabase
  .from('training_docs')
  .select('id, title, content_richtext, category_id')

if (trainingDocs && trainingDocs.length) {
  for (const doc of trainingDocs as any[]) {
    const text = doc.content_richtext || ''
    const chunks = chunkText(text)
    if (!chunks.length) continue

    const embeddings = await createEmbeddingsBatch(chunks, 3)

    const rows = chunks.map((chunk, i) => ({
      module: 'training',
      entity_id: doc.id,
      title: doc.title,
      url_path: `/app/training/doc/${doc.id}`,
      chunk_text: chunk,
      embedding: embeddings[i],
      metadata: { docId: doc.id },
    }))

    await insertAiChunksBulk(rows)
  }
}

// ------------------------- KB -------------------------
const { data: kbPages } = await supabase.from('kb_pages').select('id, title, content_richtext')

if (kbPages && kbPages.length) {
  for (const page of kbPages as any[]) {
    const text = page.content_richtext || ''
    const chunks = chunkText(text)
    if (!chunks.length) continue

    const embeddings = await createEmbeddingsBatch(chunks, 3)

    const rows = chunks.map((chunk, i) => ({
      module: 'kb',
      entity_id: page.id,
      title: page.title,
      url_path: `/app/knowledge/${page.id}`,
      chunk_text: chunk,
      embedding: embeddings[i],
      metadata: { pageId: page.id },
    }))

    await insertAiChunksBulk(rows)
  }
}

return { success: true }