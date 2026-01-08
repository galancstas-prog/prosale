'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories } from '@/lib/actions/categories'
import { CreateCategoryDialog } from './create-category-dialog'
import { CategoryList } from './category-list'
import { ScriptsSearch } from './scripts-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'

export default function ScriptsPage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = membership?.role === 'ADMIN'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const categoriesResult = await getCategories()
      setCategories(categoriesResult.data || [])
      setLoading(false)
    }
    loadData()
  }, [])

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
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <CategoryList categories={categories} isAdmin={isAdmin} />
      )}
    </div>
  )
}
