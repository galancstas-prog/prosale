'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/i18n/use-locale'
import { MessageSquare, BookOpen, FileText, Database, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { createDemoContent } from '@/lib/actions/seed-demo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface DashboardContentProps {
  isAdmin: boolean
}

export function DashboardContent({ isAdmin }: DashboardContentProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const tiles = [
    {
      title: t('dashboard.scripts'),
      description: 'Manage conversation scripts and templates',
      icon: MessageSquare,
      href: '/app/scripts',
      color: 'blue',
    },
    {
      title: t('dashboard.training'),
      description: 'Access training materials and track your progress',
      icon: BookOpen,
      href: '/app/training',
      color: 'green',
    },
    {
      title: t('dashboard.faq'),
      description: 'Find quick answers to common questions',
      icon: FileText,
      href: '/app/faq',
      color: 'orange',
    },
    {
      title: t('dashboard.knowledge'),
      description: 'Browse our comprehensive knowledge base',
      icon: Database,
      href: '/app/knowledge',
      color: 'purple',
    },
  ]

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  }

  const handleCreateDemo = async () => {
    setError('')
    setSuccess(false)
    setLoading(true)

    const result = await createDemoContent()

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/app/scripts')
      router.refresh()
    }, 1500)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('dashboard.welcome')}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateDemo} disabled={loading || success}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Create Demo Content
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Demo content created successfully! Redirecting to Scripts...</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Link key={tile.href} href={tile.href}>
              <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2">
                <CardHeader>
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-3', colorClasses[tile.color as keyof typeof colorClasses])}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {tile.title}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </CardTitle>
                  <CardDescription>{tile.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get started with your platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Explore Scripts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Browse conversation scripts to help guide your interactions
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Complete Training</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Review training materials and track your learning progress
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Check FAQ</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Find answers to frequently asked questions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
