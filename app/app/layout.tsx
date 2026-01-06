'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import { AppShell } from '@/components/app-shell'

interface User {
  id: string
  email: string | null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getUser().then(({ data, error }) => {
      console.log('[APP LAYOUT]', { user: data.user, error })

      if (!data.user || error) {
        router.replace('/login')
      } else {
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
      console.log('[AUTH STATE CHANGE]', event, session?.user)

      if (!session?.user) {
        router.replace('/login')
        setUser(null)
      } else {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground">Redirecting to login…</div>
    </div>
  )
}

  return <AppShell user={user}>{children}</AppShell>
}