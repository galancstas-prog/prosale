'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

type Role = 'ADMIN' | 'OWNER' | 'MANAGER'

interface Membership {
  user: User
  tenantId: string
  role: Role
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

  // prevent duplicate parallel fetches (auth события могут стрелять пачкой)
  const inFlightRef = useRef<Promise<void> | null>(null)
  
  // ✅ Храним текущий userId чтобы не перезагружать при возврате на вкладку
  const currentUserIdRef = useRef<string | null>(null)
  // ✅ Флаг первой загрузки
  const initialLoadDoneRef = useRef(false)

  const fetchMembership = async (forceRefresh = false) => {
    if (inFlightRef.current) return inFlightRef.current

    const run = (async () => {
      try {
        const supabase = getSupabaseClient()

        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          // не считаем это фатальной ошибкой
          currentUserIdRef.current = null
          setMembership(null)
          return
        }
        
        // ✅ Если пользователь тот же и уже загружен - не обновляем (предотвращает мигание)
        if (!forceRefresh && initialLoadDoneRef.current && userData.user.id === currentUserIdRef.current && membership) {
          console.log('[MEMBERSHIP] Same user already loaded, skipping refetch')
          return
        }
        
        // Показываем loading только при первой загрузке или смене пользователя
        if (!initialLoadDoneRef.current || userData.user.id !== currentUserIdRef.current) {
          setLoading(true)
        }
        setError(null)

        // ✅ ВАЖНО: НЕ limit(1). Берём все членства и выбираем приоритетно ADMIN.
        const { data: members, error: memberError } = await supabase
          .from('tenant_members')
          .select('tenant_id, role')
          .eq('user_id', userData.user.id)

        if (memberError) {
          throw new Error(memberError.message)
        }

        if (!members || members.length === 0) {
          throw new Error('User is not a member of any tenant')
        }

        // ✅ если есть ADMIN — берём его, иначе первую запись
        const preferred =
          members.find((m) => m.role === 'ADMIN') ?? members[0]

        console.log('[DEBUG MEMBERSHIP] user:', userData.user.id, 'tenantId:', preferred.tenant_id, 'role:', preferred.role, 'all members:', members)

        currentUserIdRef.current = userData.user.id
        initialLoadDoneRef.current = true
        setMembership({
          user: userData.user,
          tenantId: preferred.tenant_id,
          role: preferred.role as Role,
        })
      } catch (e: any) {
        console.error('[MEMBERSHIP ERROR]', e)
        setError(e?.message ?? 'Failed to fetch membership')
        setMembership(null)
      } finally {
        setLoading(false)
        inFlightRef.current = null
      }
    })()

    inFlightRef.current = run
    return run
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    // 1) первый запрос
    fetchMembership()

    // 2) подписка на изменения auth
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // ✅ Игнорируем технические события
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('[MEMBERSHIP] Ignoring technical event:', event)
        return
      }
      
      // ✅ Если пользователь тот же и уже загружен - не перезагружаем
      if (session?.user && session.user.id === currentUserIdRef.current && initialLoadDoneRef.current) {
        console.log('[MEMBERSHIP] Same user, skipping refetch for event:', event)
        return
      }
      
      console.log('[MEMBERSHIP] Processing auth event:', event)
      fetchMembership()
    })

    return () => {
      sub?.subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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