'use client'

import { Card } from '@/components/ui/card'
import { EditKbDialog } from '../edit-kb-dialog'

interface KbPageViewerProps {
  page: {
    id: string
    title: string
    content_richtext: string
    created_at: string
  }
  isAdmin: boolean
}

export function KbPageViewer({ page, isAdmin }: KbPageViewerProps) {
  return (
    <Card className="p-8">
      <div className="space-y-6">
        {isAdmin && (
          <div className="flex justify-end">
            <EditKbDialog page={page} />
          </div>
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
            {page.content_richtext}
          </div>
        </div>
      </div>
    </Card>
  )
}
