'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getThreadById } from '@/lib/actions/script-threads'
import { getTurnsByThread } from '@/lib/actions/script-turns'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ConversationView } from './conversation-view'
import { useLocale } from '@/lib/i18n/use-locale'

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  const { t } = useLocale()
  const searchParams = useSearchParams()
  const highlightTurnId = searchParams.get('turnId') || ''
  const searchQuery = searchParams.get('q') || ''
  const [thread, setThread] = useState<any>(null)
  const [turns, setTurns] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const threadResult = await getThreadById(params.threadId)
      const turnsResult = await getTurnsByThread(params.threadId)

      if (threadResult.data) {
        setThread(threadResult.data)
      }
      setTurns(turnsResult.data || [])
    }
    loadData()
  }, [params.threadId])

  if (!thread) {
    return <div>Thread not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/scripts/${thread.category_id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('scripts.backToCategory')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{thread.title}</h1>
          {thread.description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {thread.description}
            </p>
          )}
        </div>
      </div>

      <ConversationView
        threadId={params.threadId}
        turns={turns}
        isAdmin={true}
        highlightTurnId={highlightTurnId}
        searchQuery={searchQuery}
      />
    </div>
  )
}
