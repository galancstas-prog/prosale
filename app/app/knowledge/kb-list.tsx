'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { FileText, Trash2, Eye } from 'lucide-react'
import { useKbPageMutation } from '@/lib/hooks/use-kb-pages'
import { useToast } from '@/hooks/use-toast'
import { EditKbDialog } from './edit-kb-dialog'
import { getTextPreview } from '@/lib/text-utils'

interface KbPage {
  id: string
  title: string
  content_richtext: string
  created_at: string
}

interface KbListProps {
  pages: KbPage[]
  isAdmin: boolean
}

export function KbList({ pages, isAdmin }: KbListProps) {
  const { toast } = useToast()
  const { deleteMutation } = useKbPageMutation()

  const handleDelete = async (pageId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту страницу?')) {
      return
    }

    try {
      await deleteMutation.mutateAsync(pageId)
      toast({
        title: 'Удалено',
        description: 'Страница базы знаний была удалена',
      })
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Ошибка при удалении',
        variant: 'destructive',
      })
    }
  }

  if (pages.length === 0) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={FileText}
          title="Страниц пока нет"
          description={
            isAdmin
              ? 'Создайте первую страницу базы знаний, чтобы делиться информацией с командой'
              : 'В данный момент страницы базы знаний недоступны'
          }
        />
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pages.map((page) => (
        <Card key={page.id} className="p-6 hover:shadow-lg transition-shadow group">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-2 flex-1">{page.title}</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
              {getTextPreview(page.content_richtext)}
            </p>

            <div className="text-xs text-slate-500">
              {new Date(page.created_at).toLocaleDateString()}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link href={`/app/knowledge/${page.id}`} className="flex-1">
                <Button size="sm" variant="default" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть
                </Button>
              </Link>

              {isAdmin && (
                <>
                  <EditKbDialog page={page} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(page.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
