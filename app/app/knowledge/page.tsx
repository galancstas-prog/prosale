'use client'

import { useRouter } from 'next/navigation'
import { CreateKbDialog } from './create-kb-dialog'
import { KbList } from './kb-list'
import { KbSearch } from './kb-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useKbPages } from '@/lib/hooks/use-kb-pages'

export default function KnowledgePage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const { data: pages = [], isLoading: loading } = useKbPages()

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

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
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <KbList pages={pages} isAdmin={isAdmin} />
      )}
    </div>
  )
}
