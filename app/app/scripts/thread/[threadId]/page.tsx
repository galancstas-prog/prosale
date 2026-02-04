'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getThreadById } from '@/lib/actions/script-threads'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ConversationView } from './conversation-view'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'

function ThreadPageContent({ params }: { params: { threadId: string } }) {
  const { t } = useLocale()
  const { membership } = useMembership()
  const searchParams = useSearchParams()
  const highlightTurnId = searchParams.get('turnId') || ''
  const searchQuery = searchParams.get('q') || ''
  const [thread, setThread] = useState<any>(null)

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  useEffect(() => {
    async function loadData() {
      const threadResult = await getThreadById(params.threadId)

      if (threadResult.data) {
        setThread(threadResult.data)
      }
    }
    loadData()
  }, [params.threadId])

  if (!thread) {
    return <div>Чат не найден</div>
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
            <p className="text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
              {thread.description}
            </p>
          )}
        </div>
      </div>

      <ConversationView
        threadId={params.threadId}
        isAdmin={isAdmin}
        highlightTurnId={highlightTurnId}
        searchQuery={searchQuery}
      />
    </div>
  )
}

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-muted-foreground">Загрузка...</div></div>}>
      <ThreadPageContent params={params} />
    </Suspense>
  )
}
