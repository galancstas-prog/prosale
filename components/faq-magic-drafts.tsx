'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { publishFaqDraft } from '@/lib/actions/faq-magic'
import { Check, Loader2 } from 'lucide-react'

interface DraftItem {
  question: string
  answer_draft: string
  source_hint: string | null
  confidence: number
}

interface Cluster {
  cluster_title: string
  reason: string
  items: DraftItem[]
}

interface FaqMagicDraftsProps {
  clusters: Cluster[]
}

export function FaqMagicDrafts({ clusters }: FaqMagicDraftsProps) {
  const [editedItems, setEditedItems] = useState<Record<string, { question: string; answer: string }>>({})
  const [publishedItems, setPublishedItems] = useState<Set<string>>(new Set())
  const [publishingItems, setPublishingItems] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const getItemKey = (clusterIdx: number, itemIdx: number) => `${clusterIdx}-${itemIdx}`

  const handleEdit = (key: string, field: 'question' | 'answer', value: string) => {
    setEditedItems(prev => ({
      ...prev,
      [key]: {
        question: field === 'question' ? value : (prev[key]?.question || ''),
        answer: field === 'answer' ? value : (prev[key]?.answer || '')
      }
    }))
  }

  const handlePublish = async (clusterIdx: number, itemIdx: number, originalItem: DraftItem) => {
    const key = getItemKey(clusterIdx, itemIdx)
    const edited = editedItems[key]

    const question = edited?.question || originalItem.question
    const answer = edited?.answer || originalItem.answer_draft

    if (!question.trim() || !answer.trim()) {
      setError('Вопрос и ответ не могут быть пустыми')
      setTimeout(() => setError(''), 3000)
      return
    }

    setPublishingItems(prev => new Set(prev).add(key))
    setError('')

    const result = await publishFaqDraft({ question, answer })

    setPublishingItems(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

    if (result.success) {
      setPublishedItems(prev => new Set(prev).add(key))
    } else {
      setError(result.error || 'Ошибка публикации')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handlePublishAll = async () => {
    const allItems: Array<{ clusterIdx: number; itemIdx: number; item: DraftItem }> = []

    clusters.forEach((cluster, clusterIdx) => {
      cluster.items.forEach((item, itemIdx) => {
        const key = getItemKey(clusterIdx, itemIdx)
        if (!publishedItems.has(key)) {
          allItems.push({ clusterIdx, itemIdx, item })
        }
      })
    })

    for (const { clusterIdx, itemIdx, item } of allItems) {
      await handlePublish(clusterIdx, itemIdx, item)
    }
  }

  const totalItems = clusters.reduce((sum, c) => sum + c.items.length, 0)
  const publishedCount = publishedItems.size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Черновики FAQ</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Опубликовано: {publishedCount} из {totalItems}
          </p>
        </div>

        {publishedCount < totalItems && (
          <Button onClick={handlePublishAll} variant="outline">
            Опубликовать все
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {clusters.map((cluster, clusterIdx) => (
        <Card key={clusterIdx}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              <span>{cluster.cluster_title}</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {cluster.items.length} {cluster.items.length === 1 ? 'вопрос' : 'вопросов'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {cluster.reason}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {cluster.items.map((item, itemIdx) => {
              const key = getItemKey(clusterIdx, itemIdx)
              const edited = editedItems[key]
              const isPublished = publishedItems.has(key)
              const isPublishing = publishingItems.has(key)

              const currentQuestion = edited?.question ?? item.question
              const currentAnswer = edited?.answer ?? item.answer_draft

              return (
                <div
                  key={itemIdx}
                  className={`p-4 border rounded-lg space-y-3 ${isPublished ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-slate-50 dark:bg-slate-900'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                          Вопрос
                        </label>
                        <Textarea
                          value={currentQuestion}
                          onChange={(e) => handleEdit(key, 'question', e.target.value)}
                          disabled={isPublished}
                          className="min-h-[60px] text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                          Ответ
                        </label>
                        <Textarea
                          value={currentAnswer}
                          onChange={(e) => handleEdit(key, 'answer', e.target.value)}
                          disabled={isPublished}
                          className="min-h-[100px] text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {item.source_hint && (
                          <Badge variant="outline" className="text-xs">
                            {item.source_hint}
                          </Badge>
                        )}
                        <span>Уверенность: {Math.round(item.confidence * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isPublished ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Опубликовано</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handlePublish(clusterIdx, itemIdx, item)}
                          disabled={isPublishing}
                          size="sm"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Публикация...
                            </>
                          ) : (
                            'Опубликовать'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
