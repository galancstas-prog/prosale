'use client'

import { useState, useEffect } from 'react'
import { useMembership } from '@/lib/auth/use-membership'
import { useTenantPlan } from '@/lib/hooks/use-tenant-plan'
import { getRecentQuestions, getTopClusters, getDraftsForClusters, RecentQuestion, TopCluster } from '@/lib/actions/analytics-questions'
import { publishFaqDraft, deleteFaqDraft } from '@/lib/actions/faq-magic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, Clock, Sparkles, X, Check } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type MatchTypeFilter = 'all' | 'missing' | 'partial' | 'covered'

interface DraftItem {
  question: string
  answer_draft: string
  source_hint: string | null
  confidence: number
}

function QuestionsPageContent() {
  const { membership } = useMembership()
  const { plan } = useTenantPlan()
  const [loading, setLoading] = useState(true)
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([])
  const [topClusters, setTopClusters] = useState<TopCluster[]>([])
  const [draftsMap, setDraftsMap] = useState<Record<string, DraftItem[]>>({})
  const [filter, setFilter] = useState<MatchTypeFilter>('all')
  const [error, setError] = useState('')
  const [editingDrafts, setEditingDrafts] = useState<Record<string, string>>({})
  const [publishingDrafts, setPublishingDrafts] = useState<Set<string>>(new Set())

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'
  const hasManagerAccess = membership?.role === 'MANAGER' || isAdmin
  const hasAccess = plan === 'PRO' || plan === 'TEAM'

  useEffect(() => {
    if (!hasManagerAccess || !hasAccess) return
    loadData()
  }, [hasManagerAccess, hasAccess, filter])

  async function loadData() {
    setLoading(true)
    setError('')

    const [recentResult, clustersResult, draftsResult] = await Promise.all([
      getRecentQuestions(20),
      getTopClusters(filter, 50),
      getDraftsForClusters([]),
    ])

    if (recentResult.success) {
      setRecentQuestions(recentResult.data)
    } else {
      setError(recentResult.error || 'Ошибка загрузки данных')
    }

    if (clustersResult.success) {
      setTopClusters(clustersResult.data)
    }

    if (draftsResult.success) {
      setDraftsMap(draftsResult.data)
    }

    setLoading(false)
  }

  const handlePublishDraft = async (question: string, answer: string) => {
    setPublishingDrafts(prev => new Set(prev).add(question))

    const result = await publishFaqDraft({ question, answer })

    setPublishingDrafts(prev => {
      const next = new Set(prev)
      next.delete(question)
      return next
    })

    if (result.success) {
      toast.success('Черновик опубликован в FAQ')

      setDraftsMap(prev => {
  const next = { ...prev }
  // удалить draft внутри всех ключей (без угадываний)
  for (const k of Object.keys(next)) {
    next[k] = (next[k] || []).filter(d => d.question !== question)
    if (next[k].length === 0) delete next[k]
  }
  return next
})

      setEditingDrafts(prev => {
        const next = { ...prev }
        delete next[question]
        return next
      })
    } else {
      toast.error(result.error || 'Не удалось опубликовать')
    }
  }

  const handleDeleteDraft = async (question: string) => {
    const result = await deleteFaqDraft({ question })

    if (result.success) {
      toast.success('Черновик удалён')

      setDraftsMap(prev => {
  const next = { ...prev }
  // удалить draft внутри всех ключей (без угадываний)
  for (const k of Object.keys(next)) {
    next[k] = (next[k] || []).filter(d => d.question !== question)
    if (next[k].length === 0) delete next[k]
  }
  return next
})

      setEditingDrafts(prev => {
        const next = { ...prev }
        delete next[question]
        return next
      })
    } else {
      toast.error(result.error || 'Не удалось удалить')
    }
  }

  const handlePublishAll = async () => {
    const allDrafts = Object.entries(draftsMap)
      .filter(([key]) => {
        const cluster = topClusters.find(c => c.question.toLowerCase().trim() === key)
        return cluster && (cluster.match_type === 'missing' || cluster.match_type === 'partial')
      })

    for (const [key, drafts] of allDrafts) {
      if (drafts.length > 0) {
        const draft = drafts[0]
        const answer = editingDrafts[draft.question] || draft.answer_draft
        await handlePublishDraft(draft.question, answer)
      }
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

  const filteredClusters = topClusters

  const hasDrafts = Object.keys(draftsMap).length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Вопросы клиентов</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Аналитика и управление вопросами
          </p>
        </div>

        {hasDrafts && isAdmin && (
          <Button onClick={handlePublishAll} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Опубликовать все черновики
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Последние вопросы</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Хронология событий
              </p>
            </CardHeader>
            <CardContent>
              {recentQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Нет вопросов
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {q.found ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium flex-1">{q.query}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 ml-6">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(q.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs h-5">
                          {q.source === 'ai_search' ? 'AI' : 'Ручной'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Топ вопросов</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Аналитика по кластерам
                  </p>
                </div>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as MatchTypeFilter)}>
                  <TabsList>
                    <TabsTrigger value="all">Все</TabsTrigger>
                    <TabsTrigger value="missing">Missing</TabsTrigger>
                    <TabsTrigger value="partial">Partial</TabsTrigger>
                    <TabsTrigger value="covered">Covered</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {filteredClusters.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Нет данных для выбранного фильтра
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClusters.map((cluster) => {
                    const drafts = draftsMap[cluster.question.toLowerCase().trim()] || []
                    const showDrafts = isAdmin && drafts.length > 0 && (cluster.match_type === 'missing' || cluster.match_type === 'partial')
                    const isCovered = cluster.match_type === 'covered'

                    return (
                      <div
                        key={cluster.id}
                        className={`p-4 border rounded-lg ${
                          isCovered
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                            : 'bg-white dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                              {cluster.question}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Score: {cluster.score}</span>
                              <span>•</span>
                              <span>Повторов: {cluster.total_asks}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {cluster.match_type === 'covered' && (
                              <Badge className="bg-green-600 text-white">Covered</Badge>
                            )}
                            {cluster.match_type === 'partial' && (
                              <Badge className="bg-amber-600 text-white">Partial</Badge>
                            )}
                            {cluster.match_type === 'missing' && (
                              <Badge className="bg-red-600 text-white">Missing</Badge>
                            )}
                          </div>
                        </div>

                        {showDrafts && drafts.map((draft) => {
                          const isEditing = draft.question in editingDrafts
                          const isPublishing = publishingDrafts.has(draft.question)
                          const currentAnswer = isEditing ? editingDrafts[draft.question] : draft.answer_draft

                          return (
                            <div
                              key={draft.question}
                              className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-900"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    Черновик FAQ
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">
                                    Уверенность: {Math.round(draft.confidence * 100)}%
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                    Вопрос
                                  </label>
                                  <p className="text-sm font-medium">{draft.question}</p>
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                    Ответ
                                  </label>
                                  <Textarea
                                    value={currentAnswer}
                                    onChange={(e) => {
                                      setEditingDrafts(prev => ({
                                        ...prev,
                                        [draft.question]: e.target.value
                                      }))
                                    }}
                                    className="min-h-[100px] text-sm"
                                    disabled={isPublishing}
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handlePublishDraft(draft.question, currentAnswer)}
                                    disabled={isPublishing}
                                    className="gap-2"
                                  >
                                    {isPublishing ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Публикация...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3" />
                                        Опубликовать
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDraft(draft.question)}
                                    disabled={isPublishing}
                                    className="gap-2"
                                  >
                                    <X className="h-3 w-3" />
                                    Удалить
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function QuestionsPage() {
  return <QuestionsPageContent />
}
