'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getKbPages } from '@/lib/actions/kb-pages'
import { CreateKbDialog } from './create-kb-dialog'
import { KbList } from './kb-list'
import { KbSearch } from './kb-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'

export default function KnowledgePage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = membership?.role === 'ADMIN'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const result = await getKbPages()
      setPages(result.data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSearchResultClick = (id: string, query: string) => {
    router.push(`/app/knowledge/${id}?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('kb.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('kb.subtitle')}
          </p>
        </div>
        {isAdmin && <CreateKbDialog />}
      </div>

      <KbSearch onResultClick={handleSearchResultClick} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <KbList pages={pages} isAdmin={isAdmin} />
      )}
    </div>
  )
}
