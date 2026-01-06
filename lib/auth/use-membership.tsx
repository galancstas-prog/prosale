'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

interface Membership {
  user: User
  tenantId: string
  role: 'ADMIN' | 'MANAGER'
}

interface MembershipContextValue {
  membership: Membership | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const MembershipContext = createContext<MembershipContextValue | undefined>(undefined)

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembership = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error(userError?.message ?? 'No user found')
      }

      console.log('[MEMBERSHIP] Fetching for user:', userData.user.id)

      const { data: memberData, error: memberError } = await supabase
        .from('tenant_members')
        .select('tenant_id, role')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      console.log('[MEMBERSHIP] Result:', { memberData, memberError })

      if (memberError) {
        throw new Error(memberError.message)
      }

      if (!memberData) {
        throw new Error('User is not a member of any tenant')
      }

      setMembership({
        user: userData.user,
        tenantId: memberData.tenant_id,
        role: memberData.role as 'ADMIN' | 'MANAGER',
      })
    } catch (e: any) {
      console.error('[MEMBERSHIP ERROR]', e)
      setError(e?.message ?? 'Failed to fetch membership')
      setMembership(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembership()
  }, [])

  return (
    <MembershipContext.Provider
      value={{
        membership,
        loading,
        error,
        refetch: fetchMembership,
      }}
    >
      {children}
    </MembershipContext.Provider>
  )
}

export function useMembership() {
  const context = useContext(MembershipContext)
  if (context === undefined) {
    throw new Error('useMembership must be used within MembershipProvider')
  }
  return context
}
