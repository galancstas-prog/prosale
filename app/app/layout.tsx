'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getSupabaseClient } from '@/lib/supabase-client'

type AppUser = {
  id: string
  email: string | null
  role: string
  [key: string]: any
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ authUser: any; appUser: AppUser } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseClient()
    let unsubscribe: (() => void) | null = null

    const loadUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) console.error('getSession error:', error)

        if (!session) {
          setUser(null)
          setLoading(false)
          router.push('/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError) console.error('profile fetch error:', profileError)

        const appUser: AppUser = {
          ...(profile ?? {}),
          id: session.user.id,
          email: session.user.email,
          role: (profile as any)?.role ?? 'USER',
        }

        setUser({ authUser: session.user, appUser })
        setLoading(false)
      } catch (e: any) {
        console.error('Auth bootstrap failed:', e)
        setUser(null)
        setLoading(false)
        router.push('/login')
      }
    }

    loadUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        router.push('/login')
      }
    })

    unsubscribe = () => data.subscription.unsubscribe()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return <AppShell user={user}>{children}</AppShell>
}