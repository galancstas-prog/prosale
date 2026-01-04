'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getFaqItems() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createFaqItem(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const question = (formData.get('question') as string)?.trim()
  const answer = (formData.get('answer') as string)?.trim()

  if (!question || !answer) return { error: 'Question and answer are required' }

  const { data, error } = await supabase
    .from('faq_items')
    .insert({ question, answer })
    .select('*')
    .single()

  if (error) return { error: error.message }

  safeRevalidatePath('/app/faq')
  return { data }
}

export async function deleteFaqItem(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from('faq_items').delete().eq('id', id)
  if (error) return { error: error.message }

  safeRevalidatePath('/app/faq')
  return { success: true }
}

export async function searchFaqItems(query: string) {
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
    .from('faq_items')
    .select('id, question, answer')
    .or(`question.ilike.${searchPattern},answer.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }

  const results = (data || []).map((item) => {
    const normalizedQuestion = item.question.toLowerCase().replace(/ё/gi, 'е')
    const normalizedAnswer = item.answer.toLowerCase().replace(/ё/gi, 'е')
    const searchTerms = normalizedQuery.toLowerCase()

    const questionMatch = normalizedQuestion.includes(searchTerms)
    const answerMatch = normalizedAnswer.includes(searchTerms)

    let snippet = ''
    let matchField: 'question' | 'answer' = 'question'

    if (questionMatch) {
      snippet = item.question.substring(0, 100)
      matchField = 'question'
    } else if (answerMatch) {
      const matchIndex = normalizedAnswer.indexOf(searchTerms)
      const start = Math.max(0, matchIndex - 30)
      const end = Math.min(item.answer.length, matchIndex + searchTerms.length + 30)
      snippet = (start > 0 ? '...' : '') + item.answer.substring(start, end) + (end < item.answer.length ? '...' : '')
      matchField = 'answer'
    }

    return {
      id: item.id,
      question: item.question,
      answer: item.answer,
      snippet,
      matchField,
    }
  })

  return { data: results, error: null }
}
