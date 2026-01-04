'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { createEmbedding, createChatCompletion } from '@/lib/ai/openai'
import { chunkText } from '@/lib/ai/chunking'

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
    if (!query || query.length < 4) {
      return {
        answer: '',
        sources: [],
        error: 'Запрос слишком короткий. Минимум 4 символа.',
      }
    }

    const supabase = await getSupabaseServerClient()

    const queryEmbedding = await createEmbedding(query)

    const enabledModules = Object.entries(filters)
      .filter(([_, enabled]) => enabled)
      .map(([module]) => module)

    if (enabledModules.length === 0) {
      return {
        answer: 'Включите хотя бы один модуль для поиска.',
        sources: [],
      }
    }

    const { data: chunks, error: searchError } = await supabase.rpc('match_ai_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 20,
      filter_modules: enabledModules,
    })

    if (searchError) {
      throw new Error(`Search error: ${searchError.message}`)
    }

    if (!chunks || chunks.length === 0) {
      return {
        answer: 'К сожалению, я не нашёл информации по вашему запросу в базе знаний. Пожалуйста, уточните ваш вопрос или попробуйте другую формулировку.',
        sources: [],
      }
    }

    const context = chunks
      .map((c: any, i: number) => `[${i + 1}] ${c.chunk_text}`)
      .join('\n\n')

    const systemPrompt = `Ты — полезный ассистент для ProSale CRM. Отвечай кратко и по делу на русском языке, используя только информацию из предоставленного контекста. Твой ответ должен быть пригоден для отправки клиенту. Формат ответа:

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
      snippet: c.chunk_text.substring(0, 150) + '...',
      meta: c.metadata,
    }))

    return {
      answer,
      sources,
    }
  } catch (error: any) {
    console.error('AI Search error:', error)
    return {
      answer: '',
      sources: [],
      error: error.message || 'Произошла ошибка при выполнении AI-поиска',
    }
  }
}

export async function reindexAllContent() {
  try {
    const supabase = await getSupabaseServerClient()

    await supabase.from('ai_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { data: faqItems } = await supabase
      .from('faq_items')
      .select('id, question, answer')

    if (faqItems) {
      for (const item of faqItems) {
        const text = `${item.question}\n\n${item.answer}`
        const chunks = chunkText(text)

        for (const chunk of chunks) {
          const embedding = await createEmbedding(chunk)
          await supabase.from('ai_chunks').insert({
            module: 'faq',
            entity_id: item.id,
            title: item.question,
            url_path: `/app/faq?highlight=${item.id}`,
            chunk_text: chunk,
            embedding: JSON.stringify(embedding),
            metadata: { id: item.id },
          })
        }
      }
    }

    const { data: scriptTurns } = await supabase
      .from('script_turns')
      .select('id, message, thread_id, script_threads!inner(id, title, category_id)')

    if (scriptTurns) {
      for (const turn of scriptTurns) {
        const chunks = chunkText(turn.message)
        const thread = turn.script_threads as any

        for (const chunk of chunks) {
          const embedding = await createEmbedding(chunk)
          await supabase.from('ai_chunks').insert({
            module: 'scripts',
            entity_id: turn.id,
            title: thread.title,
            url_path: `/app/scripts/thread/${turn.thread_id}?turnId=${turn.id}`,
            chunk_text: chunk,
            embedding: JSON.stringify(embedding),
            metadata: { threadId: turn.thread_id, turnId: turn.id },
          })
        }
      }
    }

    const { data: trainingDocs } = await supabase
      .from('training_docs')
      .select('id, title, content_richtext, category_id')

    if (trainingDocs) {
      for (const doc of trainingDocs) {
        const text = doc.content_richtext || ''
        const chunks = chunkText(text)

        for (const chunk of chunks) {
          const embedding = await createEmbedding(chunk)
          await supabase.from('ai_chunks').insert({
            module: 'training',
            entity_id: doc.id,
            title: doc.title,
            url_path: `/app/training/doc/${doc.id}`,
            chunk_text: chunk,
            embedding: JSON.stringify(embedding),
            metadata: { docId: doc.id },
          })
        }
      }
    }

    const { data: kbPages } = await supabase
      .from('kb_pages')
      .select('id, title, content_richtext')

    if (kbPages) {
      for (const page of kbPages) {
        const text = page.content_richtext || ''
        const chunks = chunkText(text)

        for (const chunk of chunks) {
          const embedding = await createEmbedding(chunk)
          await supabase.from('ai_chunks').insert({
            module: 'kb',
            entity_id: page.id,
            title: page.title,
            url_path: `/app/knowledge/${page.id}`,
            chunk_text: chunk,
            embedding: JSON.stringify(embedding),
            metadata: { pageId: page.id },
          })
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Reindex error:', error)
    return { success: false, error: error.message }
  }
}
