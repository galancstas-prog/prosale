'use client'

import { useRouter } from 'next/navigation'
import { CreateCategoryDialog } from './create-category-dialog'
import { CategoryList } from './category-list'
import { ScriptsSearch } from './scripts-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useCategories } from '@/lib/hooks/use-categories'

export default function ScriptsPage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const { data: categories = [], isLoading: loading } = useCategories()

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  const handleSearchResultClick = (threadId: string, turnId: string, query: string) => {
    router.push(`/app/scripts/thread/${threadId}?turnId=${turnId}&q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('scripts.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('scripts.subtitle')}
          </p>
        </div>
        {isAdmin && <CreateCategoryDialog />}
      </div>

      <ScriptsSearch onResultClick={handleSearchResultClick} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <CategoryList categories={categories} isAdmin={isAdmin} />
      )}
    </div>
  )
}
