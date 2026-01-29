'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { FileText, Trash2, Loader2, Eye, GripVertical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getTextPreview } from '@/lib/text-utils'
import { SortableList, DragHandle } from '@/components/sortable-list'

interface Doc {
  id: string
  title: string
  content_richtext: string
  created_at: string
  subcategory_id: string | null
}

interface TrainingDocGridProps {
  docs: Doc[]
  isAdmin: boolean
  onViewDoc: (docId: string) => void
  onDeleteDoc?: (docId: string) => Promise<void>
  isDeleting?: boolean
  onReorder?: (orderedIds: string[]) => Promise<void>
}

export function TrainingDocGrid({ docs, isAdmin, onViewDoc, onDeleteDoc, isDeleting, onReorder }: TrainingDocGridProps) {
  const { toast } = useToast()
  const [localDocs, setLocalDocs] = useState(docs)

  useEffect(() => {
    setLocalDocs(docs)
  }, [docs])

  const handleReorder = async (reordered: Doc[]) => {
    setLocalDocs(reordered)
    if (onReorder) {
      await onReorder(reordered.map(d => d.id))
    }
  }

  const handleDelete = async (docId: string, title: string) => {
    if (!onDeleteDoc) return
    if (!confirm(`Вы уверены, что хотите удалить «${title}»?`)) return

    try {
      await onDeleteDoc(docId)
      toast({
        title: 'Удалено',
        description: 'Документ был удален',
      })
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Ошибка при удалении',
        variant: 'destructive',
      })
    }
  }

  if (docs.length === 0) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={FileText}
          title="Документов пока нет"
          description={
            isAdmin
              ? 'Создайте первый учебный документ'
              : 'Учебные документы пока недоступны'
          }
        />
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SortableList
        items={localDocs}
        onReorder={handleReorder}
        disabled={!isAdmin || !onReorder}
        renderItem={(doc, dragHandleProps) => (
          <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                {isAdmin && onReorder && (
                  <DragHandle {...dragHandleProps} className="shrink-0 opacity-0 group-hover:opacity-100 mt-1" />
                )}
                <h3 className="font-semibold text-lg line-clamp-2 flex-1">{doc.title}</h3>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                {getTextPreview(doc.content_richtext)}
              </p>

              <div className="text-xs text-slate-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-1"
                  onClick={() => onViewDoc(doc.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть
                </Button>

                {isAdmin && onDeleteDoc && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(doc.id, doc.title)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-600" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  )
}
