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

interface MagicCluster {
  cluster_title: string
  reason: string
  items: {
    question: string
    answer_draft: string
    source_hint: string | null
    confidence: number
  }[]
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
    console.log('[FAQ MAGIC] ============ SERVER ACTION INVOKED ============')

    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'OpenAI API key not configured' }
    }

    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    await supabase.from('ai_faq_suggestions').insert({
      title: '🔥 DIAGNOSTIC PING - MAGIC INVOKED',
      period_from: new Date().toISOString(),
      period_to: new Date().toISOString(),
      payload: { diagnostic: true, timestamp: Date.now() }
    })

    console.log('[FAQ MAGIC] Diagnostic ping inserted into DB')

    const { error: lockError } = await supabase.rpc('lock_magic_today')

    if (lockError) {
      if (lockError.message?.includes('MAGIC_ALREADY_USED_TODAY')) {
        return {
          success: false,
          error: 'Магия уже использовалась сегодня. Попробуйте завтра.',
        }
      }
      console.error('[LOCK MAGIC ERROR]', lockError)
      return { success: false, error: lockError.message }
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const { data: dashboardData, error: dashboardError } = await supabase.rpc(
      'get_questions_dashboard',
      {
        from_ts: startOfDay.toISOString(),
        to_ts: now.toISOString(),
        source_filter: 'all',
        only_not_found: false,
        limit_count: 200,
      }
    )

    if (dashboardError) {
      console.error('[DASHBOARD ERROR]', dashboardError)
      return { success: false, error: 'Failed to fetch questions' }
    }

    const questions = (dashboardData || []) as QuestionEntry[]

    if (questions.length === 0) {
      return { success: false, error: 'Нет вопросов за сегодня для анализа' }
    }

    const prioritized = [
      ...questions.filter(q => !q.found).slice(0, 100),
      ...questions.filter(q => q.found && q.count > 1).slice(0, 50),
      ...questions.filter(q => q.found && q.count === 1).slice(0, 50),
    ].slice(0, 200)

    const questionsText = prioritized
      .map(
        (q, i) =>
          `${i + 1}. "${q.query}" (повторов: ${q.count}, найдено: ${
            q.found ? 'да' : 'нет'
          })`
      )
      .join('\n')

    const systemPrompt = `Ты — эксперт по созданию FAQ для SalesPilot, CRM-платформы для отделов продаж.

ЗАДАЧА:
Проанализируй реальные вопросы клиентов и менеджеров и создай структурированные FAQ-черновики.

ПРАВИЛА:
1. Группируй похожие вопросы в кластеры (max 10 кластеров)
2. В каждом кластере max 8 вопросов
3. Для каждого вопроса создай черновой ответ:
   - Тон: дружелюбный, уверенный менеджер
   - Стиль: кратко, по делу, без воды
   - Если нет точных данных — используй placeholder X для цифр/дат/сумм
   - Пример: "Срок обработки — X рабочих дней" или "Стоимость от X ₸"
4. НЕ придумывай конкретные цифры, цены, даты
5. Ответ СТРОГО в JSON формате

JSON SCHEMA:
{
  "clusters": [
    {
      "cluster_title": "Краткое название темы",
      "reason": "Почему эти вопросы сгруппированы",
      "items": [
        {
          "question": "Вопрос клиента",
          "answer_draft": "Черновой ответ менеджера",
          "source_hint": "FAQ/KB/Training/Scripts или null",
          "confidence": 0.0-1.0
        }
      ]
    }
  ]
}`

    const userPrompt = `Вопросы клиентов за сегодня:\n\n${questionsText}\n\nВерни ТОЛЬКО JSON по указанной схеме, без дополнительного текста.`

    const openaiResponse = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { max_tokens: 1200, temperature: 0.2 }
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
      console.error('[OPENAI PARSE ERROR]', parseError, openaiResponse)
      return { success: false, error: 'Не удалось обработать ответ OpenAI' }
    }

    // 1) сохраняем историю магии
    const { error: insertError } = await supabase.from('ai_faq_suggestions').insert({
      period_from: startOfDay.toISOString(),
      period_to: now.toISOString(),
      title: `FAQ Magic (${now.toLocaleDateString('ru-RU')})`,
      payload: magicResult,
    })

    if (insertError) {
      console.error('[INSERT SUGGESTIONS ERROR]', insertError)
      return { success: false, error: 'Failed to save magic results' }
    }

    // 2) SYNC MAGIC RESULT -> faq_drafts (UI + publish/delete живут тут)
    const flatDrafts = (magicResult?.clusters || [])
      .flatMap(c =>
        (c.items || []).map(it => ({
          question: (it.question || '').trim(),
          answer_draft: (it.answer_draft || '').trim(),
          source_hint: it.source_hint ?? null,
          confidence: typeof it.confidence === 'number' ? it.confidence : 0,
        }))
      )
      .filter(d => d.question.length > 0)

    if (flatDrafts.length > 0) {
      const { error: upsertErr } = await supabase
        .from('faq_drafts')
        .upsert(flatDrafts, { onConflict: 'question' })

      if (upsertErr) {
        console.error('[FAQ_DRAFTS UPSERT ERROR]', upsertErr)

        const questionsToReplace = flatDrafts.map(d => d.question)

        const { error: delErr } = await supabase
          .from('faq_drafts')
          .delete()
          .in('question', questionsToReplace)

        if (delErr) console.error('[FAQ_DRAFTS DELETE FALLBACK ERROR]', delErr)

        const { error: insErr } = await supabase.from('faq_drafts').insert(flatDrafts)

        if (insErr) {
          console.error('[FAQ_DRAFTS INSERT FALLBACK ERROR]', insErr)
          return { success: false, error: 'Failed to sync drafts for UI' }
        }
      }
    }

    revalidatePath('/app/questions')

    const drafts_created =
      magicResult?.clusters?.reduce((sum, c) => sum + (c.items?.length || 0), 0) || 0

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