'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocaleProvider, useLocale } from '@/lib/i18n/use-locale'
import { LocaleSwitcher } from '@/components/locale-switcher'

function RegisterPageContent() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          router.push('/app')
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to initialize Supabase client')
      }
    }

    checkUser()
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()

      const signUpData: {
        email: string
        password: string
        options?: {
          data?: {
            invite_code?: string
            first_name?: string
            last_name?: string
          }
        }
      } = {
        email,
        password,
      }

      const metadata: any = {}
      if (inviteCode.trim()) {
        metadata.invite_code = inviteCode.trim()
      }
      if (firstName.trim()) {
        metadata.first_name = firstName.trim()
      }
      if (lastName.trim()) {
        metadata.last_name = lastName.trim()
      }

      if (Object.keys(metadata).length > 0) {
        signUpData.options = { data: metadata }
      }

      console.log('[REGISTER]', { email, inviteCode: inviteCode.trim() || 'none' })

      const { data, error } = await supabase.auth.signUp(signUpData)

      console.log('[REGISTER RESULT]', { data, error })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        router.replace('/app')
      } else {
        setMessage('Account created! Redirecting to login...')
        setTimeout(() => router.replace('/login'), 2000)
      }
    } catch (e: any) {
      console.error('[REGISTER ERROR]', e)
      setError(e?.message ?? 'Registration failed')
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
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.register.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.register.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.register.password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode">Код приглашения (optional)</Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Введите код приглашения, если он у вас есть"
              />
              <p className="text-xs text-muted-foreground">
                Оставьте поле пустым, чтобы создать новое рабочее пространство в качестве администратора.
              </p>
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}
            {message && <div className="text-sm text-green-600">{message}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? `${t('common.loading')}` : t('auth.register.submit')}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              {t('auth.register.hasAccount')}{' '}
              <Link href="/login" className="underline">
                {t('auth.register.signIn')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <LocaleProvider>
      <RegisterPageContent />
    </LocaleProvider>
  )
}
