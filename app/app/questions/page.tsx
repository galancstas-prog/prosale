'use client'

import { useState, useEffect } from 'react'
import { useMembership } from '@/lib/auth/use-membership'
import { useTenantPlan } from '@/lib/hooks/use-tenant-plan'
import { getTodayDashboard, getTopNotFound } from '@/lib/actions/question-logs'
import { canRunMagicToday, runFaqMagicForToday, getTodayMagicSuggestions } from '@/lib/actions/faq-magic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader as Loader2, Sparkles } from 'lucide-react'
import { FaqMagicDrafts } from '@/components/faq-magic-drafts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type DashboardRow = {
  query: string
  total_count: number
  last_seen: string
  found_any: boolean
  sources_used: string[] | null
}

type NotFoundRow = {
  query: string
  total_count: number
  last_seen: string
}

interface MagicCluster {
  cluster_title: string
  reason: string
  items: {
    question: string
    answer_draft: string
    source_hint: string | null
    confidence: number
  }[]
}

interface MagicResult {
  clusters: MagicCluster[]
}

function QuestionsPageContent() {
  const { membership } = useMembership()
  const { plan } = useTenantPlan()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardRow[]>([])
  const [notFound, setNotFound] = useState<NotFoundRow[]>([])
  const [error, setError] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicAllowed, setMagicAllowed] = useState(true)
  const [magicNextAllowed, setMagicNextAllowed] = useState<string | null>(null)
  const [magicResult, setMagicResult] = useState<MagicResult | null>(null)

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'
  const hasManagerAccess = membership?.role === 'MANAGER' || isAdmin
  const hasAccess = plan === 'PRO' || plan === 'TEAM'

  console.log('[DEBUG QUESTIONS PAGE] membership:', membership?.role, 'hasManagerAccess:', hasManagerAccess, 'hasAccess:', hasAccess)

  useEffect(() => {
    if (!hasManagerAccess || !hasAccess) return

    async function loadData() {
      setLoading(true)
      setError('')

      const [dashboardResult, notFoundResult, magicCheck, suggestionsResult] = await Promise.all([
        getTodayDashboard({ limit: 50 }),
        getTopNotFound({ limit: 20 }),
        canRunMagicToday(),
        getTodayMagicSuggestions(),
      ])

      if (dashboardResult.success) {
        setDashboard((dashboardResult.data || []) as DashboardRow[])
      } else {
        setError(dashboardResult.error || 'Ошибка загрузки данных')
      }

      if (notFoundResult.success) {
        setNotFound((notFoundResult.data || []) as NotFoundRow[])
      }

      if (magicCheck.success) {
        setMagicAllowed(magicCheck.allowed)
        setMagicNextAllowed(magicCheck.next_allowed_at)
      }

      if (suggestionsResult.success && suggestionsResult.data) {
        setMagicResult(suggestionsResult.data)
      }

      setLoading(false)
    }

    loadData()
  }, [hasManagerAccess, hasAccess])

  const handleMagic = async () => {
    if (!isAdmin) return

    setMagicLoading(true)
    setError('')

    const result = await runFaqMagicForToday()

    setMagicLoading(false)

    if (result.success && result.data) {
      setMagicResult(result.data)
      setMagicAllowed(false)
    } else {
      setError(result.error || 'Ошибка генерации FAQ')
    }
  }

  if (!hasManagerAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertDescription>Доступ к этому разделу есть только у администраторов и менеджеров</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertDescription>Эта функция доступна на тарифах PRO и TEAM</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const canShowMagicButton = dashboard.length > 0 || notFound.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Что у вас спрашивали сегодня</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Анализ вопросов от клиентов и сотрудников
          </p>
        </div>

        {canShowMagicButton && isAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleMagic}
                    disabled={magicLoading || !magicAllowed}
                    className="gap-2"
                  >
                    {magicLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Генерация...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Магия
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!magicAllowed && (
                <TooltipContent>
                  <p>
                    {magicNextAllowed
                      ? `Уже запускали сегодня. Следующий запуск после ${new Date(
                          magicNextAllowed
                        ).toLocaleString('ru-RU')}`
                      : 'Магия уже использовалась сегодня'}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {magicResult && isAdmin && <FaqMagicDrafts clusters={magicResult.clusters} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Топ вопросов</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Сегодня вопросов не было</div>
          ) : (
            <div className="space-y-3">
              {dashboard.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                      {entry.query}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>Повторов: {entry.total_count}</span>
                      <span>•</span>
                      <span>
                        {new Date(entry.last_seen).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.found_any ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Найдено
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Не найдено
                      </Badge>
                    )}

                    <Badge variant="secondary" className="text-xs">
                      {entry.sources_used?.includes('ai_search') ? 'AI' : 'Ручной ввод'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {notFound.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span>ИИ не справился</span>
              <Badge variant="outline" className="ml-2">{notFound.length}</Badge>
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Эти вопросы — кандидаты в FAQ
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notFound.map((entry, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-950 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1">
                      {entry.query}
                    </p>
                    <Badge variant="secondary" className="ml-3 text-xs">
                      {entry.total_count}x
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.length > 0 && notFound.length === 0 && !magicResult && (
        <Alert>
          <AlertDescription>ИИ всё нашёл — отлично</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  return <QuestionsPageContent />
}