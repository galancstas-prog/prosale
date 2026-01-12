'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface RecentQuestion {
  id: string
  query: string
  source: 'ai_search' | 'manual'
  found: boolean
  created_at: string
}

export interface TopCluster {
  id: string
  question: string
  score: number
  total_asks: number
  match_type: 'covered' | 'partial' | 'missing' | null
  created_at: string
}

export async function getRecentQuestions(limit: number = 20) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    const { data, error } = await supabase
      .from('ai_search_logs')
      .select('id, query, source, found, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[GET RECENT QUESTIONS ERROR]', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as RecentQuestion[] }
  } catch (e: any) {
    console.error('[GET RECENT QUESTIONS EXCEPTION]', e)
    return { success: false, error: 'Failed to get recent questions', data: [] }
  }
}

export async function getTopClusters(
  matchTypeFilter?: 'all' | 'missing' | 'partial' | 'covered',
  limit: number = 50
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    let query = supabase
      .from('faq_clusters')
      .select(`
        id,
        centroid,
        title,
        score,
        total_asks,
        created_at,
        faq_matches (
          match_type
        )
      `)
      .order('score', { ascending: false })

    if (matchTypeFilter && matchTypeFilter !== 'all') {
      query = query.eq('faq_matches.match_type', matchTypeFilter)
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      console.error('[GET TOP CLUSTERS ERROR]', error)
      return { success: false, error: error.message, data: [] }
    }

    const clusters: TopCluster[] = (data || []).map((cluster: any) => ({
      id: cluster.id,
      // ВАЖНО: в БД нет question, берем centroid (или title как запасной)
      question: cluster.centroid || cluster.title || '',
      score: cluster.score,
      total_asks: cluster.total_asks,
      match_type: cluster.faq_matches?.[0]?.match_type || null,
      created_at: cluster.created_at
    }))

    return { success: true, data: clusters }
  } catch (e: any) {
    console.error('[GET TOP CLUSTERS EXCEPTION]', e)
    return { success: false, error: 'Failed to get top clusters', data: [] }
  }
}

export async function getDraftsForClusters(clusters: { id: string }[]) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated', data: {} as Record<string, any[]> }
    }

    const clusterIds = (clusters || []).map(c => c.id).filter(Boolean)
    if (clusterIds.length === 0) {
      return { success: true, data: {} as Record<string, any[]> }
    }

    const { data, error } = await supabase
      .from('faq_drafts')
      .select('cluster_id, question, answer, source_hint, confidence, status')
      .in('cluster_id', clusterIds)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET DRAFTS ERROR]', error)
      return { success: false, error: error.message, data: {} as Record<string, any[]> }
    }

    const draftsMap: Record<string, any[]> = {}
    for (const row of data || []) {
      const key = row.cluster_id as string
      if (!draftsMap[key]) draftsMap[key] = []
      draftsMap[key].push({
        question: row.question,
        answer_draft: row.answer, // алиас для UI
        source_hint: row.source_hint ?? null,
        confidence: row.confidence, // int 0..100
      })
    }

    return { success: true, data: draftsMap }
  } catch (e: any) {
    console.error('[GET DRAFTS EXCEPTION]', e)
    return { success: false, error: 'Failed to get drafts', data: {} as Record<string, any[]> }
  }
}