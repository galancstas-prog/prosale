'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { createChatCompletion } from '@/lib/ai/openai'
import { revalidatePath } from 'next/cache'

interface QuestionEntry {
  query: string
  count: number
  last_asked: string
  found: boolean
  source: string
}

interface MagicItem {
  canonical_question: string
  merged_questions: string[]
  source_question_ids: string[]
  decision: 'create_draft' | 'skip_as_duplicate' | 'skip_as_already_answered'
  answer_draft?: string
  source_hint?: string | null
  reason: string
  confidence: number
}

interface MagicCluster {
  cluster_title: string
  reason: string
  items: MagicItem[]
}

interface MagicResult {
  clusters: MagicCluster[]
}

export async function canRunMagicToday() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase.rpc('can_run_magic_today')

    if (error) {
      console.error('[CAN RUN MAGIC ERROR]', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      allowed: data?.allowed || false,
      next_allowed_at: data?.next_allowed_at || null,
    }
  } catch (e) {
    console.error('[CAN RUN MAGIC EXCEPTION]', e)
    return { success: false, error: 'Failed to check magic availability' }
  }
}

export async function runFaqMagicForToday() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'OpenAI API key not configured' }
    }

    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: tm, error: tmErr } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle()

    if (tmErr || !tm?.tenant_id) {
      console.error('[TENANT RESOLVE ERROR]', tmErr)
      return { success: false, error: 'Tenant not resolved' }
    }

    const tenantId = tm.tenant_id as string
    const userId = userData.user.id

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 1) Создать run_id через INSERT в ai_magic_runs (проверка unique constraint tenant+day)
    const { data: runData, error: runError } = await supabase
      .from('ai_magic_runs')
      .insert({
        tenant_id: tenantId,
        run_date: startOfDay.toISOString().split('T')[0],
        created_by: userId,
        status: 'started',
        period_from: startOfDay.toISOString(),
        period_to: now.toISOString(),
      })
      .select('id')
      .maybeSingle()

    if (runError) {
      if (runError.message?.includes('duplicate') || runError.code === '23505') {
        return {
          success: false,
          error: 'Магия уже использовалась сегодня. Попробуйте завтра.',
        }
      }
      console.error('[CREATE RUN ERROR]', runError)
      return { success: false, error: 'Failed to start magic run' }
    }

    const runId = runData?.id as string

    // 2) Получить вопросы с id из ai_search_logs (не processed)
    const { data: questionsData, error: questionsError } = await supabase
      .from('ai_search_logs')
      .select('id, query, found, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', now.toISOString())
      .is('processed_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    if (questionsError) {
      console.error('[QUESTIONS ERROR]', questionsError)
      return { success: false, error: 'Failed to fetch questions' }
    }

    if (!questionsData || questionsData.length === 0) {
      return { success: false, error: 'Нет новых вопросов за период для анализа' }
    }

    // Подсчет повторов вопросов
    const countMap: Record<string, { ids: string[]; found: boolean }> = {}
    for (const q of questionsData) {
      const key = q.query.toLowerCase().trim()
      if (!countMap[key]) countMap[key] = { ids: [], found: q.found }
      countMap[key].ids.push(q.id)
    }

    const questions = Object.entries(countMap).map(([query, data]) => ({
      id: data.ids[0],
      query,
      found: data.found,
      count: data.ids.length,
      all_ids: data.ids,
    }))

    // Приоритизация
    const prioritized = [
      ...questions.filter(q => !q.found).slice(0, 100),
      ...questions.filter(q => q.found && q.count > 1).slice(0, 50),
      ...questions.filter(q => q.found && q.count === 1).slice(0, 50),
    ].slice(0, 200)

    // 3) Получить контекст знаний из faq_items (топ 40)
    const { data: faqItems, error: faqError } = await supabase
      .from('faq_items')
      .select('question, answer')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(40)

    if (faqError) console.error('[FAQ CONTEXT ERROR]', faqError)

    let knowledgeContext = ''
    if (faqItems && faqItems.length > 0) {
      const faqText = faqItems
        .map((f, i) => {
          const truncAnswer = (f.answer || '').slice(0, 400)
          return `${i + 1}. Q: "${f.question}"\n   A: ${truncAnswer}${f.answer.length > 400 ? '...' : ''}`
        })
        .join('\n\n')
      knowledgeContext = `\n\nKNOWLEDGE CONTEXT (existing FAQ):\n${faqText}`
    }

    // 4) Формируем JSON для OpenAI
    const questionsJson = JSON.stringify(
      prioritized.map(q => ({
        id: q.id,
        query: q.query,
        found: q.found,
        count: q.count,
      })),
      null,
      2
    )

    const systemPrompt = `Ты — эксперт по созданию FAQ для SalesPilot, CRM-платформы для отделов продаж.

ЗАДАЧА:
Проанализируй реальные вопросы клиентов и создай структурированные FAQ-черновики с объединением дублей.

ПРАВИЛА:
1. Объединяй похожие вопросы по смыслу (если требуют одинаковый ответ) в один canonical_question
2. Нормализуй формулировку в корпоративный стиль (например: "сколько стоит?" → "Какова стоимость продукта?")
3. Группируй в кластеры (max 10 кластеров, max 8 items в кластере)
4. Для каждого элемента определи decision:
   - "create_draft" — создать новый FAQ-черновик
   - "skip_as_duplicate" — пропустить как дубль
   - "skip_as_already_answered" — пропустить, уже покрыто базой знаний
5. Для create_draft создай answer_draft:
   - Тон: дружелюбный, уверенный менеджер
   - Стиль: кратко, по делу, без воды
   - Если нет точных данных — используй placeholder X для цифр/дат/сумм
   - Пример: "Срок обработки — X рабочих дней" или "Стоимость от X ₸"
6. НЕ придумывай конкретные цифры, цены, даты
7. Ответ СТРОГО в JSON формате

JSON SCHEMA:
{
  "clusters": [
    {
      "cluster_title": "Краткое название темы",
      "reason": "Почему эти вопросы сгруппированы",
      "items": [
        {
          "canonical_question": "Нормализованный вопрос в корпоративном стиле",
          "merged_questions": ["исходная формулировка 1", "исходная формулировка 2"],
          "source_question_ids": ["uuid1", "uuid2"],
          "decision": "create_draft" | "skip_as_duplicate" | "skip_as_already_answered",
          "answer_draft": "Черновой ответ (только для create_draft)",
          "source_hint": "FAQ|KB|Training|Scripts или null",
          "reason": "Почему принято это решение",
          "confidence": 0.0-1.0
        }
      ]
    }
  ]
}

ВАЖНО:
- merged_questions: список исходных формулировок, которые объединены
- source_question_ids: список uuid из входных вопросов
- answer_draft обязателен ТОЛЬКО для decision = create_draft
- Используй Knowledge Context чтобы понять что уже покрыто`

    const userPrompt = `Questions (with IDs):
${questionsJson}${knowledgeContext}

Верни ТОЛЬКО JSON по указанной схеме, без дополнительного текста.`

    console.log('[FAQ MAGIC] Calling OpenAI with', prioritized.length, 'questions')

    const openaiResponse = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { max_tokens: 3000, temperature: 0.2 }
    )

    let magicResult: MagicResult
    try {
      const cleaned = openaiResponse
        .trim()
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')

      magicResult = JSON.parse(cleaned)

      if (!magicResult.clusters || !Array.isArray(magicResult.clusters)) {
        throw new Error('Invalid response structure')
      }
    } catch (parseError) {
      console.error('[OPENAI PARSE ERROR]', parseError, openaiResponse?.slice(0, 500))
      return { success: false, error: 'Не удалось обработать ответ OpenAI' }
    }

    // 5) Сохранить ai_faq_suggestions
    const { error: insertError } = await supabase.from('ai_faq_suggestions').insert({
      tenant_id: tenantId,
      period_from: startOfDay.toISOString(),
      period_to: now.toISOString(),
      title: `FAQ Magic (${now.toLocaleDateString('ru-RU')})`,
      payload: magicResult,
    })

    if (insertError) {
      console.error('[INSERT SUGGESTIONS ERROR]', insertError)
      return { success: false, error: 'Failed to save magic results' }
    }

    // 6) Синк в faq_drafts (ТОЛЬКО decision = create_draft, БЕЗ cluster_id)
    const draftsToInsert: any[] = []
    for (const cluster of magicResult.clusters || []) {
      for (const item of cluster.items || []) {
        if (item.decision === 'create_draft' && item.canonical_question && item.answer_draft) {
          draftsToInsert.push({
            tenant_id: tenantId,
            cluster_id: null,
            status: 'draft',
            question: item.canonical_question.trim(),
            answer: item.answer_draft.trim(),
            confidence: Math.max(0, Math.min(100, Math.round(item.confidence * 100))),
          })
        }
      }
    }

    if (draftsToInsert.length > 0) {
      const { error: draftsErr } = await supabase.from('faq_drafts').insert(draftsToInsert)

      if (draftsErr) {
        console.error('[FAQ_DRAFTS INSERT ERROR]', draftsErr)
      }
    }

    // 7) Пометить processed (ТОЛЬКО found=false за период)
    const { error: processedError } = await supabase
      .from('ai_search_logs')
      .update({
        processed_at: now.toISOString(),
        processed_run_id: runId,
      })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', now.toISOString())
      .eq('found', false)
      .is('processed_at', null)

    if (processedError) {
      console.error('[MARK PROCESSED ERROR]', processedError)
    }

    revalidatePath('/app/questions')

    const drafts_created = draftsToInsert.length

    return { success: true, data: magicResult, drafts_created }
  } catch (e: any) {
    console.error('[RUN FAQ MAGIC EXCEPTION]', e)
    return { success: false, error: e.message || 'Failed to run FAQ magic' }
  }
}

export async function getTodayMagicSuggestions() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const { data, error } = await supabase
      .from('ai_faq_suggestions')
      .select('*')
      .gte('period_from', startOfDay.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[GET SUGGESTIONS ERROR]', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: (data?.payload as MagicResult | null) ?? null }
  } catch (e) {
    console.error('[GET SUGGESTIONS EXCEPTION]', e)
    return { success: false, error: 'Failed to get suggestions' }
  }
}

export async function publishFaqDraft({
  draftId,
  question,
  answer,
}: {
  draftId: string
  question: string
  answer: string
}) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { success: false, error: 'Not authenticated' }

    const q = question.trim()
    const a = answer.trim()

    // 1) upsert в faq_items
    const { data: existing, error: existErr } = await supabase
      .from('faq_items')
      .select('id')
      .eq('question', q)
      .maybeSingle()

    if (existErr) {
      console.error('[FAQ EXIST ERROR]', existErr)
      return { success: false, error: existErr.message }
    }

    if (existing?.id) {
      const { error } = await supabase
        .from('faq_items')
        .update({ answer: a, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) {
        console.error('[FAQ UPDATE ERROR]', error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await supabase.from('faq_items').insert({ question: q, answer: a })

      if (error) {
        console.error('[FAQ INSERT ERROR]', error)
        return { success: false, error: error.message }
      }
    }

    // 2) удалить черновик из faq_drafts
    const { error: delErr } = await supabase.from('faq_drafts').delete().eq('id', draftId)

    if (delErr) {
      console.error('[DRAFT DELETE ERROR]', delErr)
      // не фейлим publish — FAQ уже создан
    }

    // 3) флажок на реиндекс
    const { error: reindexError } = await supabase.rpc('mark_tenant_ai_needs_reindex')
    if (reindexError) console.error('[MARK REINDEX ERROR]', reindexError)

    revalidatePath('/app/faq')
    revalidatePath('/app/questions')

    return { success: true }
  } catch (e: any) {
    console.error('[PUBLISH FAQ EXCEPTION]', e)
    return { success: false, error: e.message || 'Failed to publish FAQ' }
  }
}

export async function deleteFaqDraft({ draftId }: { draftId: string }) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { success: false, error: 'Not authenticated' }
    
    const { error } = await supabase.from('faq_drafts').delete().eq('id', draftId)

    if (error) {
      console.error('[DELETE DRAFT ERROR]', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/app/questions')
    return { success: true }
  } catch (e: any) {
    console.error('[DELETE FAQ DRAFT EXCEPTION]', e)
    return { success: false, error: e.message || 'Failed to delete draft' }
  }
}