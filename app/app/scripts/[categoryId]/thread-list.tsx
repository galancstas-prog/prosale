'use client'

import { ContentTile } from '@/components/content-tile'
import { EmptyState } from '@/components/empty-state'
import { MessageSquare } from 'lucide-react'

interface Thread {
  id: string
  title: string
  description: string | null
}

interface ThreadListProps {
  threads: Thread[]
  isAdmin: boolean
}

export function ThreadList({ threads, isAdmin }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No script threads yet"
        description={
          isAdmin
            ? "Create your first script thread to start building conversations"
            : "No script threads available yet"
        }
      />
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {threads.map((thread) => (
        <ContentTile
          key={thread.id}
          title={thread.title}
          description={thread.description || undefined}
          href={`/app/scripts/thread/${thread.id}`}
          icon={MessageSquare}
          iconColor="bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
        />
      ))}
    </div>
  )
}
