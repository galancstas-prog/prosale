'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface GlobalSearchResult {
  module: 'scripts' | 'training' | 'faq' | 'kb'
  id: string
  title: string
  breadcrumb: string
  snippet: string
  meta: any
}

export async function globalSearch(query: string) {
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

  const results: GlobalSearchResult[] = []

  const { data: faqData } = await supabase
    .from('faq_items')
    .select('id, question, answer')
    .or(`question.ilike.${searchPattern},answer.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (faqData) {
    faqData.forEach((item) => {
      const normalizedQuestion = item.question.toLowerCase().replace(/ё/gi, 'е')
      const normalizedAnswer = item.answer.toLowerCase().replace(/ё/gi, 'е')
      const searchTerms = normalizedQuery.toLowerCase()

      const questionMatch = normalizedQuestion.includes(searchTerms)
      const answerMatch = normalizedAnswer.includes(searchTerms)

      let snippet = ''
      if (questionMatch) {
        const matchIndex = normalizedQuestion.indexOf(searchTerms)
        const start = Math.max(0, matchIndex - 30)
        const end = Math.min(item.question.length, matchIndex + searchTerms.length + 30)
        snippet = (start > 0 ? '...' : '') + item.question.substring(start, end) + (end < item.question.length ? '...' : '')
      } else if (answerMatch) {
        const matchIndex = normalizedAnswer.indexOf(searchTerms)
        const start = Math.max(0, matchIndex - 30)
        const end = Math.min(item.answer.length, matchIndex + searchTerms.length + 30)
        snippet = (start > 0 ? '...' : '') + item.answer.substring(start, end) + (end < item.answer.length ? '...' : '')
      }

      results.push({
        module: 'faq',
        id: item.id,
        title: item.question,
        breadcrumb: 'FAQ',
        snippet,
        meta: { id: item.id },
      })
    })
  }

  const { data: scriptTurns } = await supabase
    .from('script_turns')
    .select('id, message, thread_id, script_threads!inner(id, title, category_id, categories!inner(id, name))')
    .ilike('message', searchPattern)
    .order('created_at', { ascending: false })
    .limit(50)

  if (scriptTurns) {
    scriptTurns.forEach((turn) => {
      const normalizedMessage = turn.message.toLowerCase().replace(/ё/gi, 'е')
      const searchTerms = normalizedQuery.toLowerCase()
      const matchIndex = normalizedMessage.indexOf(searchTerms)
      const start = Math.max(0, matchIndex - 30)
      const end = Math.min(turn.message.length, matchIndex + searchTerms.length + 30)
      const snippet = (start > 0 ? '...' : '') + turn.message.substring(start, end) + (end < turn.message.length ? '...' : '')

      const thread = turn.script_threads as any
      const category = thread?.categories as any

      // Skip if thread or category is missing (e.g., due to deletion)
      if (!thread || !category) return

      results.push({
        module: 'scripts',
        id: turn.id,
        title: thread.title,
        breadcrumb: `Скрипты / ${category.name} / ${thread.title}`,
        snippet,
        meta: {
          threadId: turn.thread_id,
          turnId: turn.id,
          categoryName: category.name,
        },
      })
    })
  }

  const { data: trainingDocs } = await supabase
  .from('training_docs')
  .select('id, title, content_richtext')
  .or(
    `title.ilike.${searchPattern},content_richtext.ilike.${searchPattern}`
  )
  .order('created_at', { ascending: false })
  .limit(50)

if (trainingDocs) {
  trainingDocs.forEach((doc) => {
    const content = doc.content_richtext || ''
    const normalizedContent = content.toLowerCase().replace(/ё/gi, 'е')
    const searchTerms = normalizedQuery.toLowerCase()

    const sourceText = content || doc.title
    const normalizedSource = sourceText.toLowerCase().replace(/ё/gi, 'е')

    const matchIndex = normalizedSource.indexOf(searchTerms)
    const start = Math.max(0, matchIndex - 30)
    const end = Math.min(sourceText.length, matchIndex + searchTerms.length + 30)

    const snippet =
      matchIndex >= 0
        ? (start > 0 ? '...' : '') +
          sourceText.substring(start, end) +
          (end < sourceText.length ? '...' : '')
        : ''

    results.push({
      module: 'training',
      id: doc.id,
      title: doc.title,
      breadcrumb: `Обучение / ${doc.title}`,
      snippet,
      meta: {
        docId: doc.id,
      },
    })
  })
}

  const { data: kbPages } = await supabase
  .from('kb_pages')
  .select('id, title, content_richtext')
  .or(`title.ilike.${searchPattern},content_richtext.ilike.${searchPattern}`)
  .order('created_at', { ascending: false })
  .limit(50)

  if (kbPages) {
    kbPages.forEach((page) => {
      const content = page.content_richtext || ''
      const normalizedContent = content.toLowerCase().replace(/ё/gi, 'е')
      const searchTerms = normalizedQuery.toLowerCase()
      const matchIndex = normalizedContent.indexOf(searchTerms)
      const start = Math.max(0, matchIndex - 30)
      const end = Math.min(content.length, matchIndex + searchTerms.length + 30)
      const snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '')

      results.push({
        module: 'kb',
        id: page.id,
        title: page.title,
        breadcrumb: `База знаний / ${page.title}`,
        snippet,
        meta: {
          pageId: page.id,
        },
      })
    })
  }

  return { data: results, error: null }
}
