'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocaleProvider, useLocale } from '@/lib/i18n/use-locale'
import { LocaleSwitcher } from '@/components/locale-switcher'

function LoginPageContent() {
  const { t } = useLocale()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      console.log('[LOGIN CLICK]', { email, passwordLen: password.length })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[LOGIN RESULT]', { data, error })

      // Extra verification: do we have a session right after login?
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('[SESSION AFTER LOGIN]', { session: sessionData.session, sessionError })

      if (error) {
        setErrorMsg(error.message || 'Login failed')
        setLoading(false)
        return
      }

      // If signIn succeeded but session is still missing, that means cookies/session persistence is broken in this runtime.
      if (!sessionData.session) {
        setErrorMsg('Login succeeded, but session is missing. (Cookies/session persistence problem in this environment.)')
        setLoading(false)
        return
      }

      // Success
      setLoading(false)
      router.replace('/app')
      return
    } catch (e: any) {
      console.error('[LOGIN ERROR]', e)
      setErrorMsg(e?.message ?? 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          </div>
          <CardTitle>{t('auth.login.title')}</CardTitle>
          <CardDescription>{t('auth.login.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {errorMsg && <div className="text-sm text-red-500">{errorMsg}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? `${t('common.loading')}` : t('auth.login.submit')}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              {t('auth.login.noAccount')}{' '}
              <Link href="/register" className="underline">
                {t('auth.login.signUp')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <LocaleProvider>
      <LoginPageContent />
    </LocaleProvider>
  )
}