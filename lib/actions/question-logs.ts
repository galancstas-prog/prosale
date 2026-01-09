'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

interface LogQuestionParams {
  query: string
  source: 'ai_search' | 'manual'
  found?: boolean
  sources?: Array<{
    module: string
    entity_id: string
    title: string
    similarity?: number
  }>
  meta?: any
}

export async function logQuestion({
  query,
  source,
  found = false,
  sources = [],
  meta = {}
}: LogQuestionParams) {
  try {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 3) {
      return { success: false, error: 'Query too short' }
    }

    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('ai_search_logs')
      .insert({
        query: trimmedQuery,
        source,
        found,
        sources: sources.length > 0 ? sources : null,
        meta: Object.keys(meta).length > 0 ? meta : null
      })

    if (error) {
      console.error('[LOG QUESTION ERROR]', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    console.error('[LOG QUESTION EXCEPTION]', e)
    return { success: false, error: 'Failed to log question' }
  }
}

interface GetDashboardParams {
  sourceFilter?: 'all' | 'ai_search' | 'manual'
  onlyNotFound?: boolean
  limit?: number
}

export async function getTodayDashboard({
  sourceFilter = 'all',
  onlyNotFound = false,
  limit = 50
}: GetDashboardParams = {}) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const { data, error } = await supabase.rpc('get_questions_dashboard', {
      from_ts: startOfDay.toISOString(),
      to_ts: now.toISOString(),
      source_filter: sourceFilter,
      only_not_found: onlyNotFound,
      limit_count: limit
    })

    if (error) {
      console.error('[GET DASHBOARD ERROR]', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (e) {
    console.error('[GET DASHBOARD EXCEPTION]', e)
    return { success: false, error: 'Failed to get dashboard data' }
  }
}

export async function getTopNotFound({ limit = 20 }: { limit?: number } = {}) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const { data, error } = await supabase.rpc('get_top_not_found_questions', {
      from_ts: startOfDay.toISOString(),
      to_ts: now.toISOString(),
      limit_count: limit
    })

    if (error) {
      console.error('[GET TOP NOT FOUND ERROR]', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (e) {
    console.error('[GET TOP NOT FOUND EXCEPTION]', e)
    return { success: false, error: 'Failed to get top not found' }
  }
}
