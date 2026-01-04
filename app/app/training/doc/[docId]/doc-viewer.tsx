'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Check, Clock, Circle, Loader2, Save } from 'lucide-react'
import { markDocCompleted, markDocInProgress } from '@/lib/actions/training-progress'
import { updateTrainingDoc } from '@/lib/actions/training-docs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Doc {
  id: string
  title: string
  content_richtext: string | null
  category_id: string
}

interface Progress {
  id: string
  progress_percent: number
  completed_at: string | null
}

interface TrainingDocViewerProps {
  doc: Doc
  progress: Progress | null
  isAdmin: boolean
  searchQuery?: string
}

export function TrainingDocViewer({ doc, progress, isAdmin, searchQuery }: TrainingDocViewerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(doc.content_richtext || '<p>No content yet.</p>')
  const [shouldHighlight, setShouldHighlight] = useState(!!searchQuery)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!progress && !isAdmin) {
      markDocInProgress(doc.id)
    }
  }, [doc.id, progress, isAdmin])

  useEffect(() => {
    if (searchQuery && contentRef.current && !editing) {
      setTimeout(() => {
        const marks = contentRef.current?.querySelectorAll('mark')
        if (marks && marks.length > 0) {
          marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      setTimeout(() => {
        setShouldHighlight(false)
      }, 3000)
    }
  }, [searchQuery, editing])

  const getStatus = () => {
    if (!progress) return 'not_started'
    if (progress.completed_at && progress.progress_percent === 100) return 'completed'
    if (progress.progress_percent > 0) return 'in_progress'
    return 'not_started'
  }

  const status = getStatus()

  const handleMarkCompleted = async () => {
    setError('')
    setLoading(true)

    await markDocCompleted(doc.id)

    setLoading(false)
    router.refresh()
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)

    await updateTrainingDoc(doc.id, content)

    setEditing(false)
    setLoading(false)
    router.refresh()
  }

  const statusConfig = {
    not_started: {
      label: 'Not Started',
      icon: Circle,
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    in_progress: {
      label: 'In Progress',
      icon: Clock,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    completed: {
      label: 'Completed',
      icon: Check,
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
  }

  const StatusIcon = statusConfig[status].icon

  const highlightText = (text: string, query: string) => {
    if (!query || query.length < 2) return text

    const normalizedQuery = query.replace(/ё/gi, 'е').replace(/^"|"$/g, '')
    const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 0)

    let result = text
    words.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedWord})`, 'gi')
      result = result.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5">$1</mark>')
    })

    return result
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Progress</span>
              <Badge className={statusConfig[status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[status].label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status !== 'completed' && (
              <Button onClick={handleMarkCompleted} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            )}
            {status === 'completed' && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You completed this training document. Great job!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training Content</CardTitle>
            {isAdmin && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)}>
                    Edit Content
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <RichTextEditor
              content={content}
              onChange={setContent}
              editable={true}
            />
          ) : (
            <div ref={contentRef}>
              {shouldHighlight && searchQuery ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: highlightText(content, searchQuery) }}
                />
              ) : (
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  editable={false}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
