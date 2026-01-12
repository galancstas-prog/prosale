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

    // 1) Берём кластеры (ВАЖНО: centroid вместо question)
    const { data: clustersData, error: clustersError } = await supabase
      .from('faq_clusters')
      .select('id, centroid, score, total_asks, created_at')
      .order('score', { ascending: false })
      .limit(limit)

    if (clustersError) {
      console.error('[GET TOP CLUSTERS ERROR]', clustersError)
      return { success: false, error: clustersError.message, data: [] }
    }

    const clusterIds = (clustersData || []).map((c: any) => c.id)

    // 2) Берём match_type отдельно (без period_from/period_to — их в matches нет)
    let matchesMap: Record<string, string> = {}
    if (clusterIds.length > 0) {
      const { data: matchesData, error: matchesError } = await supabase
        .from('faq_matches')
        .select('cluster_id, match_type')
        .in('cluster_id', clusterIds)

      if (matchesError) {
        console.error('[GET MATCHES ERROR]', matchesError)
      } else {
        // если вдруг несколько строк на cluster_id — берём первую попавшуюся
        for (const m of (matchesData || []) as any[]) {
          if (!matchesMap[m.cluster_id]) matchesMap[m.cluster_id] = m.match_type
        }
      }
    }

    // 3) Маппим в формат UI + фильтр
    let clusters: TopCluster[] = (clustersData || []).map((c: any) => ({
      id: c.id,
      question: c.centroid, // <-- вот тут UI продолжает ждать "question"
      score: c.score,
      total_asks: c.total_asks,
      match_type: (matchesMap[c.id] as any) || null,
      created_at: c.created_at
    }))

    if (matchTypeFilter && matchTypeFilter !== 'all') {
      clusters = clusters.filter(c => c.match_type === matchTypeFilter)
    }

    return { success: true, data: clusters }
  } catch (e: any) {
    console.error('[GET TOP CLUSTERS EXCEPTION]', e)
    return { success: false, error: 'Failed to get top clusters', data: [] }
  }
}

export async function getDraftsForClusters(clusterIds: string[]) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated', data: {} }
    }

    if (!clusterIds || clusterIds.length === 0) {
      return { success: true, data: {} }
    }

    // Берём черновики ТОЛЬКО из faq_drafts (через view, если она есть)
    const { data, error } = await supabase
      .from('v_faq_drafts_ui') // <-- важно: view из твоей схемы
      .select('id, cluster_id, question, answer_draft, source_hint, confidence')
      .in('cluster_id', clusterIds)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET DRAFTS ERROR]', error)
      return { success: false, error: error.message, data: {} }
    }

    // Ключуем по cluster_id, чтобы в UI было draftsMap[cluster.id]
    const draftsMap: Record<string, any[]> = {}
    for (const row of data || []) {
      const k = row.cluster_id
      if (!draftsMap[k]) draftsMap[k] = []
      draftsMap[k].push(row)
    }

    return { success: true, data: draftsMap }
  } catch (e: any) {
    console.error('[GET DRAFTS EXCEPTION]', e)
    return { success: false, error: 'Failed to get drafts', data: {} }
  }
}