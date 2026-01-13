'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/i18n/use-locale'
import { MessageSquare, BookOpen, FileText, Database, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { createDemoContent } from '@/lib/actions/seed-demo'
import { reindexAllContent } from '@/lib/actions/ai-search'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { GlobalSearch } from './global-search'
import { QuestionCaptureBar } from '@/components/question-capture-bar'
import { WelcomePopup } from '@/components/welcome-popup'
import { useMembership } from '@/lib/auth/use-membership'

interface DashboardContentProps {
  isAdmin: boolean
}

export function DashboardContent({ isAdmin }: DashboardContentProps) {
  const { t } = useLocale()
  const router = useRouter()
  const { membership } = useMembership()

  const [firstName, setFirstName] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  const [aiStatus, setAiStatus] = useState<'ready' | 'indexing' | 'needs_reindex' | 'empty'>('empty')
  const [aiStatusLoading, setAiStatusLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [reindexLoading, setReindexLoading] = useState(false)
  const [reindexSuccess, setReindexSuccess] = useState(false)
  const [reindexError, setReindexError] = useState('')

  useEffect(() => {
    async function loadUserName() {
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user?.user_metadata?.first_name) {
        setFirstName(data.user.user_metadata.first_name)
      }
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    loadUserName()
  }, [])

  const loadAiStatus = async () => {
    if (!isAdmin) return
    setAiStatusLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('get_ai_status')
      if (!error && data) {
        setAiStatus((data.status as any) || 'empty')
      }
    } catch (e) {
      console.error('[AI STATUS ERROR]', e)
    } finally {
      setAiStatusLoading(false)
    }
  }

  useEffect(() => {
    loadAiStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const tiles = [
    { title: t('dashboard.scripts'), description: t('dashboard.scriptsDesc'), icon: MessageSquare, href: '/app/scripts', color: 'blue' },
    { title: t('dashboard.training'), description: t('dashboard.trainingDesc'), icon: BookOpen, href: '/app/training', color: 'green' },
    { title: t('dashboard.faq'), description: t('dashboard.faqDesc'), icon: FileText, href: '/app/faq', color: 'orange' },
    { title: t('dashboard.knowledge'), description: t('dashboard.knowledgeDesc'), icon: Database, href: '/app/knowledge', color: 'purple' },
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

    await createDemoContent()

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/app/scripts')
      router.refresh()
    }, 1500)
  }

  const handleReindex = async () => {
    setReindexError('')
    setReindexSuccess(false)
    setReindexLoading(true)

    const result = await reindexAllContent()

    if (result.success) {
      setReindexSuccess(true)
      setTimeout(() => setReindexSuccess(false), 5000)
      await loadAiStatus() // <<< важно: обновить статус после индексации
    } else {
      setReindexError(result.error || 'Ошибка переиндексации')
    }

    setReindexLoading(false)
  }

  const getAiStatusConfig = () => {
    switch (aiStatus) {
      case 'ready':
        return { color: 'bg-green-500', text: 'ИИ готов' }
      case 'indexing':
        return { color: 'bg-blue-500', text: 'Идёт индексация' }
      case 'needs_reindex':
        return { color: 'bg-yellow-500', text: 'Требуется переиндексация' }
      case 'empty':
      default:
        return { color: 'bg-gray-400', text: 'Нет данных для ИИ' }
    }
  }

  const hasQuestionCaptureAccess = membership?.role === 'ADMIN' || membership?.role === 'OWNER' || membership?.role === 'MANAGER'

  console.log('[DEBUG DASHBOARD] membership:', membership?.role, 'hasQuestionCaptureAccess:', hasQuestionCaptureAccess)

  return (
    <>
      {/* Попап показываем только когда точно есть userId */}
      {userId ? <WelcomePopup isAdmin={isAdmin} userId={userId} /> : null}

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 truncate">
              {firstName ? `С возвращением, ${firstName}!` : t('dashboard.welcome')}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={cn('w-2 h-2 rounded-full', getAiStatusConfig().color)} />
                <span className="text-muted-foreground whitespace-nowrap">
                  {aiStatusLoading ? 'Проверяю ИИ...' : getAiStatusConfig().text}
                </span>
              </div>

              <Button onClick={handleReindex} disabled={reindexLoading || reindexSuccess}>
                {reindexLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Обучить AI
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{t('dashboard.demoSuccess')}</AlertDescription>
          </Alert>
        )}

        {reindexError && (
          <Alert variant="destructive">
            <AlertDescription>{reindexError}</AlertDescription>
          </Alert>
        )}

        {reindexSuccess && (
          <Alert>
            <AlertDescription>AI индексация завершена успешно</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiles.map((tile) => {
            const Icon = tile.icon
            return (
              <Link key={tile.href} href={tile.href}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2">
                  <CardHeader>
                    <div
                      className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
                        colorClasses[tile.color as keyof typeof colorClasses]
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {tile.title}
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </CardTitle>
                    <CardDescription>{tile.description}</CardDescription>
                  </CardHeader>
                  <CardContent />
                </Card>
              </Link>
            )
          })}
        </div>

        <Card className="p-6">
          <div className="space-y-2 mb-4">
            <h2 className="text-xl font-semibold">Глобальный поиск</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Поиск по всем модулям
            </p>
          </div>
          <GlobalSearch />
        </Card>

        {hasQuestionCaptureAccess && (
          <Card className="p-6">
            <div className="space-y-2 mb-4">
              <h2 className="text-xl font-semibold">Не нашли ответ?</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Добавьте ненайденный вопрос для аналитики 
              </p>
            </div>

            <QuestionCaptureBar />
          </Card>
        )}
      </div>
    </>
  )
}