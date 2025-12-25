'use client'

import { ContentTile } from '@/components/content-tile'
import { EmptyState } from '@/components/empty-state'
import { FileText } from 'lucide-react'

interface Doc {
  id: string
  title: string
}

interface DocListProps {
  docs: Doc[]
  isAdmin: boolean
}

export function TrainingDocList({ docs, isAdmin }: DocListProps) {
  if (docs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No training documents yet"
        description={
          isAdmin
            ? "Create your first training document to get started"
            : "No training documents available yet"
        }
      />
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {docs.map((doc) => (
        <ContentTile
          key={doc.id}
          title={doc.title}
          href={`/app/training/doc/${doc.id}`}
          icon={FileText}
          iconColor="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
        />
      ))}
    </div>
  )
}
