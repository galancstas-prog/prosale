'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getSupabaseClient } from '@/lib/Bolt Database-client'

interface AppUser {
  id: string
  email: string | null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        setUser(null)
        setLoading(false)
        router.replace('/login')
        return
      }

      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
      })
      setLoading(false)
    }

    loadUser()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      if (!u) {
        setUser(null)
        router.replace('/login')
        return
      }
      setUser({ id: u.id, email: u.email ?? null })
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  // ВАЖНО: НЕ return null. Показываем понятный экран, чтобы не было "черного экрана"
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Нет сессии. Перенаправляю на вход...</div>
      </div>
    )
  }

  return <AppShell user={user}>{children}</AppShell>
}