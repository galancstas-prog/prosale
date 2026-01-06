'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getSupabaseClient } from '@/lib/supabase-client'

type Role = 'ADMIN' | 'MANAGER' | 'USER'

interface AppUser {
  id: string
  email: string | null
  role: Role
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    let unsubscribe: (() => void) | null = null

    const loadUser = async () => {
      setLoading(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) console.error('Error getting session:', sessionError)

      if (!session?.user) {
        setAuthUser(null)
        setAppUser(null)
        setLoading(false)
        router.push('/login')
        return
      }

      const user = session.user
      setAuthUser(user)

      // Determine role from tenant_members (profiles table is NOT used)
      const { data: memberships, error: memError } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (memError) console.error('Error loading tenant membership:', memError)

      const rawRole = memberships?.[0]?.role ? String(memberships[0].role).toUpperCase() : 'USER'
      const role: Role = rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'MANAGER' ? 'MANAGER' : 'USER'

      setAppUser({
        id: user.id,
        email: user.email ?? null,
        role,
      })

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    unsubscribe = () => subscription.unsubscribe()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  // If not logged in, we've already pushed to /login
  if (!authUser || !appUser) return null

  return <AppShell user={{ authUser, appUser }}>{children}</AppShell>
}
