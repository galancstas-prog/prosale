// WhatsApp AI Helper
// Генерация подсказок на основе базы знаний ProSale
'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { createEmbedding, createChatCompletion } from '@/lib/ai/openai'
import type { AISuggestionSource } from './types'

interface AIChunk {
  id: string
  module: 'scripts' | 'training' | 'faq' | 'kb'
  source_id: string
  title: string
  content: string
  similarity: number
}

/**
 * Генерирует AI подсказку для входящего сообщения
 * на основе базы знаний компании
 */
export async function generateAISuggestion(
  messageText: string,
  chatContext?: string[] // последние сообщения для контекста
): Promise<{ suggestion: string; sources: AISuggestionSource[]; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { 
        suggestion: '', 
        sources: [], 
        error: 'OpenAI API key not configured' 
      }
    }

    const supabase = await getSupabaseServerClient()

    // 1. Создаём embedding для сообщения клиента
    const queryEmbedding = await createEmbedding(messageText)

    // 2. Ищем похожие чанки в базе знаний
    const { data: chunks, error: searchError } = await supabase.rpc('match_ai_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
    })

    if (searchError) {
      console.error('[WA AI] Search error:', searchError)
      return { suggestion: '', sources: [], error: searchError.message }
    }

    if (!chunks || chunks.length === 0) {
      return { 
        suggestion: 'В базе знаний не найдено релевантной информации для ответа на этот вопрос.',
        sources: [] 
      }
    }

    // 3. Формируем контекст из найденных чанков
    const contextParts = chunks.map((chunk: AIChunk, idx: number) => {
      const moduleNames: Record<string, string> = {
        scripts: 'Скрипт продаж',
        training: 'Обучение',
        faq: 'FAQ',
        kb: 'База знаний',
      }
      return `[${idx + 1}. ${moduleNames[chunk.module] || chunk.module}: ${chunk.title}]\n${chunk.content}`
    })

    const context = contextParts.join('\n\n---\n\n')

    // 4. Формируем историю чата если есть
    let chatHistoryText = ''
    if (chatContext && chatContext.length > 0) {
      chatHistoryText = '\n\nПоследние сообщения в диалоге:\n' + chatContext.slice(-5).join('\n')
    }

    // 5. Генерируем подсказку
    const systemPrompt = `Ты — AI-помощник менеджера по продажам.
Твоя задача — предложить ГОТОВЫЙ ответ клиенту на основе базы знаний компании.

ВАЖНО:
- Отвечай ТОЛЬКО на основе предоставленного контекста
- Не придумывай информацию
- Тон: дружелюбный, профессиональный, как от менеджера
- Ответ должен быть готов к отправке клиенту
- Если информации недостаточно — предложи уточняющий вопрос

Контекст из базы знаний:
${context}
${chatHistoryText}`

    const userPrompt = `Клиент написал: "${messageText}"

Предложи готовый ответ для отправки клиенту:`

    const suggestion = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, max_tokens: 500 }
    )

    // 6. Формируем источники
    const sources: AISuggestionSource[] = chunks.slice(0, 3).map((chunk: AIChunk) => ({
      module: chunk.module,
      id: chunk.source_id,
      title: chunk.title,
      snippet: chunk.content.substring(0, 150) + '...',
      similarity: chunk.similarity,
    }))

    return { suggestion, sources }
  } catch (error: any) {
    console.error('[WA AI] Error:', error)
    return { 
      suggestion: '', 
      sources: [], 
      error: error.message || 'Failed to generate suggestion' 
    }
  }
}

/**
 * Анализирует сообщение и определяет intent
 */
export async function analyzeMessageIntent(
  messageText: string
): Promise<{ 
  intent: 'question' | 'complaint' | 'order' | 'greeting' | 'thanks' | 'other'
  confidence: number
  suggestedPriority: 'low' | 'normal' | 'high' | 'urgent'
  suggestedTags: string[]
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        intent: 'other',
        confidence: 0,
        suggestedPriority: 'normal',
        suggestedTags: [],
      }
    }

    const systemPrompt = `Ты анализируешь сообщения клиентов и определяешь их намерение.
Верни JSON с полями:
- intent: "question" | "complaint" | "order" | "greeting" | "thanks" | "other"
- confidence: число от 0 до 1
- suggestedPriority: "low" | "normal" | "high" | "urgent"
- suggestedTags: массив тегов из ["Новый клиент", "VIP", "Возврат", "Вопрос", "Заказ", "Рекламация"]

Правила приоритета:
- urgent: жалобы на срочные проблемы, угрозы уйти
- high: жалобы, возвраты, недовольство
- normal: вопросы, заказы
- low: благодарности, приветствия

Отвечай ТОЛЬКО валидным JSON без markdown.`

    const response = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText },
      ],
      { temperature: 0.1, max_tokens: 200 }
    )

    const parsed = JSON.parse(response)
    return {
      intent: parsed.intent || 'other',
      confidence: parsed.confidence || 0,
      suggestedPriority: parsed.suggestedPriority || 'normal',
      suggestedTags: parsed.suggestedTags || [],
    }
  } catch (error: any) {
    console.error('[WA AI] Intent analysis error:', error)
    return {
      intent: 'other',
      confidence: 0,
      suggestedPriority: 'normal',
      suggestedTags: [],
    }
  }
}

/**
 * Суммаризация диалога для быстрого просмотра РОПом
 */
export async function summarizeChat(
  messages: Array<{ direction: 'in' | 'out'; content: string }>
): Promise<{ summary: string; keyPoints: string[]; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { summary: '', keyPoints: [], error: 'OpenAI API key not configured' }
    }

    const chatText = messages
      .map((m) => `${m.direction === 'in' ? 'Клиент' : 'Менеджер'}: ${m.content}`)
      .join('\n')

    const systemPrompt = `Ты суммаризируешь диалоги с клиентами.
Верни JSON с полями:
- summary: краткое описание диалога (1-2 предложения)
- keyPoints: массив ключевых моментов (до 3 пунктов)

Отвечай ТОЛЬКО валидным JSON без markdown.`

    const response = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: chatText },
      ],
      { temperature: 0.2, max_tokens: 300 }
    )

    const parsed = JSON.parse(response)
    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
    }
  } catch (error: any) {
    console.error('[WA AI] Summarization error:', error)
    return { summary: '', keyPoints: [], error: error.message }
  }
}

/**
 * Поиск быстрого ответа по шорткату
 */
export async function findQuickReplyByShortcut(
  shortcut: string
): Promise<{ content: string | null; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('whatsapp_quick_replies')
      .select('id, content')
      .eq('shortcut', shortcut)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { content: null }
      }
      return { content: null, error: error.message }
    }

    // Increment usage count
    await supabase.rpc('increment_quick_reply_usage', { reply_id: data.id })

    return { content: data.content }
  } catch (error: any) {
    return { content: null, error: error.message }
  }
}

/**
 * Автоматическое определение языка сообщения
 */
export async function detectLanguage(text: string): Promise<'ru' | 'kk' | 'en'> {
  const t = (text || '').toLowerCase()

  // Kazakh specific letters
  if (/[әғқңөұүһі]/i.test(t)) return 'kk'

  const latin = (t.match(/[a-z]/g) || []).length
  const cyr = (t.match(/[а-яё]/g) || []).length

  if (latin > cyr) return 'en'
  return 'ru'
}
