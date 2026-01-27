'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import { MembershipProvider, useMembership } from '@/lib/auth/use-membership'
import { AppShell } from '@/components/app-shell'

interface User {
  id: string
  email: string | null
}

function AppLayoutContent({ user, children }: { user: User; children: React.ReactNode }) {
  const { membership, loading: membershipLoading } = useMembership()

  // 🔴 LOADING GATE: Wait for membership before rendering content
  if (membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!membership) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Ошибка доступа</div>
      </div>
    )
  }

  // ✅ Membership готов -렌더 AppShell и children с известной ролью
  return <AppShell user={user}>{children}</AppShell>
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // ✅ Храним текущий userId чтобы не обновлять состояние при возврате на вкладку
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getUser().then(({ data, error }) => {
      console.log('[APP LAYOUT]', { user: data.user, error })

      if (!data.user || error) {
        router.replace('/login')
      } else {
        currentUserIdRef.current = data.user.id
        setUser({
          id: data.user.id,
          email: data.user.email ?? null,
        })
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH STATE CHANGE]', event, session?.user?.id)

      // ✅ Игнорируем события, которые не меняют пользователя:
      // - TOKEN_REFRESHED, INITIAL_SESSION - технические события
      // - SIGNED_IN с тем же userId - просто возврат на вкладку
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('[AUTH STATE CHANGE] Ignoring technical event:', event)
        return
      }

      // ✅ Если пользователь тот же - не обновляем состояние (предотвращает перерендер при возврате на вкладку)
      if (session?.user && session.user.id === currentUserIdRef.current) {
        console.log('[AUTH STATE CHANGE] Same user, skipping update:', event)
        return
      }

      if (!session?.user) {
        currentUserIdRef.current = null
        router.replace('/login')
        setUser(null)
      } else {
        currentUserIdRef.current = session.user.id
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <MembershipProvider>
      <AppLayoutContent user={user}>{children}</AppLayoutContent>
    </MembershipProvider>
  )
}