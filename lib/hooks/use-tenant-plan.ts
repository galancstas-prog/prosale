'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useMembership } from '@/lib/auth/use-membership'

export type Plan = 'MINI' | 'PRO' | 'TEAM'

interface TenantPlan {
  plan: Plan
  access_expires_at: string | null
  max_users: number
}

interface UseTenantPlanReturn {
  plan: Plan | null
  access_expires_at: string | null
  max_users: number | null
  isExpired: boolean
  daysLeft: number | null
  loading: boolean
  error: string | null
}

export function useTenantPlan(): UseTenantPlanReturn {
  const { membership } = useMembership()
  const [data, setData] = useState<TenantPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!membership?.tenantId) {
      setLoading(false)
      return
    }

    const fetchTenantPlan = async () => {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()

        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('plan, access_expires_at, max_users')
          .eq('id', membership.tenantId)
          .maybeSingle()

        if (tenantError) {
          throw new Error(tenantError.message)
        }

        if (!tenantData) {
          throw new Error('Tenant not found')
        }

        setData({
          plan: tenantData.plan as Plan,
          access_expires_at: tenantData.access_expires_at,
          max_users: tenantData.max_users,
        })
        setError(null)
      } catch (e: any) {
        console.error('[TENANT PLAN ERROR]', e)
        setError(e?.message ?? 'Failed to fetch tenant plan')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTenantPlan()
  }, [membership?.tenantId])

  const isExpired = data?.access_expires_at
    ? new Date(data.access_expires_at) <= new Date()
    : false

  const daysLeft = data?.access_expires_at
    ? Math.ceil(
        (new Date(data.access_expires_at).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  return {
    plan: data?.plan ?? null,
    access_expires_at: data?.access_expires_at ?? null,
    max_users: data?.max_users ?? null,
    isExpired,
    daysLeft,
    loading,
    error,
  }
}
