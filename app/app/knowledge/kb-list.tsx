'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { FileText, Trash2, Loader2, Eye } from 'lucide-react'
import { deleteKbPage } from '@/lib/actions/kb-pages'
import { useToast } from '@/hooks/use-toast'
import { EditKbDialog } from './edit-kb-dialog'

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
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return
    }

    setDeleting(pageId)
    await deleteKbPage(pageId)
    setDeleting(null)
    router.refresh()

    toast({
      title: 'Deleted',
      description: 'Knowledge base page has been removed',
    })
  }

  if (pages.length === 0) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={FileText}
          title="No pages yet"
          description={
            isAdmin
              ? "Create your first knowledge base page to share information with your team"
              : "No knowledge base pages available at this time"
          }
        />
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pages.map((page) => (
        <Card key={page.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-2">{page.title}</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
              {page.content_richtext.substring(0, 150)}...
            </p>

            <div className="text-xs text-slate-500">
              {new Date(page.created_at).toLocaleDateString()}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link href={`/app/knowledge/${page.id}`} className="flex-1">
                <Button size="sm" variant="default" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>

              {isAdmin && (
                <>
                  <EditKbDialog page={page} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(page.id)}
                    disabled={deleting === page.id}
                  >
                    {deleting === page.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-600" />
                    )}
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
