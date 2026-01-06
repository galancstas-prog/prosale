'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getKbPageById } from '@/lib/actions/kb-pages'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { KbPageViewer } from './page-viewer'
import { EditKbDialog } from '../edit-kb-dialog'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'

export default function KnowledgePageView({ params }: { params: { pageId: string } }) {
  const { t } = useLocale()
  const { membership } = useMembership()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const [page, setPage] = useState<any>(null)
  const [error, setError] = useState(false)

  const isAdmin = membership?.role === 'ADMIN'

  useEffect(() => {
    async function loadData() {
      const result = await getKbPageById(params.pageId)
      if (result.error || !result.data) {
        setError(true)
      } else {
        setPage(result.data)
      }
    }
    loadData()
  }, [params.pageId])

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/app/knowledge">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('kb.backToKb')}
          </Button>
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Page not found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            The page you are looking for does not exist.
          </p>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/app/knowledge">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('kb.backToKb')}
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
            <p className="text-sm text-slate-500 mt-2">
              Created {new Date(page.created_at).toLocaleDateString()}
            </p>
          </div>
          {isAdmin && (
            <div>
              <EditKbDialog page={page} />
            </div>
          )}
        </div>
      </div>

      <KbPageViewer page={page} isAdmin={false} searchQuery={searchQuery} />
    </div>
  )
}
