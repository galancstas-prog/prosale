'use client'

import { useState, useEffect } from 'react'
import { useMembership } from '@/lib/auth/use-membership'
import { useTenantPlan } from '@/lib/hooks/use-tenant-plan'
import { getTodayDashboard, getTopNotFound } from '@/lib/actions/question-logs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface QuestionEntry {
  query: string
  count: number
  last_asked: string
  found: boolean
  source: string
}

function QuestionsPageContent() {
  const { membership } = useMembership()
  const { plan } = useTenantPlan()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<QuestionEntry[]>([])
  const [notFound, setNotFound] = useState<QuestionEntry[]>([])
  const [error, setError] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)

  const isAdmin = membership?.role === 'ADMIN'
  const hasAccess = plan === 'PRO' || plan === 'TEAM'

  useEffect(() => {
    if (!isAdmin || !hasAccess) return

    async function loadData() {
      setLoading(true)
      setError('')

      const [dashboardResult, notFoundResult] = await Promise.all([
        getTodayDashboard({ limit: 50 }),
        getTopNotFound({ limit: 20 })
      ])

      if (dashboardResult.success) {
        setDashboard(dashboardResult.data || [])
      } else {
        setError(dashboardResult.error || 'Ошибка загрузки данных')
      }

      if (notFoundResult.success) {
        setNotFound(notFoundResult.data || [])
      }

      setLoading(false)
    }

    loadData()
  }, [isAdmin, hasAccess])

  const handleMagic = () => {
    setMagicLoading(true)
    setTimeout(() => {
      setMagicLoading(false)
      alert('Генерация FAQ скоро')
    }, 1500)
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertDescription>
            Доступ к этому разделу есть только у администраторов
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertDescription>
            Эта функция доступна на тарифах PRO и TEAM
          </AlertDescription>
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Что у вас спрашивали сегодня</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Анализ вопросов от клиентов и сотрудников
          </p>
        </div>

        {notFound.length > 0 && (
          <Button onClick={handleMagic} disabled={magicLoading}>
            {magicLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Генерация...
              </>
            ) : (
              'Магия'
            )}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Топ вопросов</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Сегодня вопросов не было
            </div>
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
                      <span>Повторов: {entry.count}</span>
                      <span>•</span>
                      <span>{new Date(entry.last_asked).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.found ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Найдено
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Не найдено
                      </Badge>
                    )}

                    <Badge variant="secondary" className="text-xs">
                      {entry.source === 'ai_search' ? 'AI' : 'Ручной ввод'}
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
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-slate-950 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1">
                      {entry.query}
                    </p>
                    <Badge variant="secondary" className="ml-3 text-xs">
                      {entry.count}x
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.length > 0 && notFound.length === 0 && (
        <Alert>
          <AlertDescription>
            ИИ всё нашёл — отлично
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  return <QuestionsPageContent />
}
