import { getThreadById } from '@/lib/actions/script-threads'
import { getTurnsByThread } from '@/lib/actions/script-turns'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ConversationView } from './conversation-view'

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const threadResult = await getThreadById(params.threadId)
  const turnsResult = await getTurnsByThread(params.threadId)

  if (threadResult.error || !threadResult.data) {
    return <div>Thread not found</div>
  }

  const thread = threadResult.data
  const turns = turnsResult.data || []

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/scripts/${thread.category_id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scripts
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

      <ConversationView threadId={params.threadId} turns={turns} isAdmin={true} />
    </div>
  )
}
