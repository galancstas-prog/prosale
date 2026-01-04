'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories } from '@/lib/actions/categories'
import { CreateCategoryDialog } from './create-category-dialog'
import { CategoryList } from './category-list'
import { ScriptsSearch } from './scripts-search'
import { useLocale } from '@/lib/i18n/use-locale'

export default function ScriptsPage() {
  const { t } = useLocale()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const categoriesResult = await getCategories()
      setCategories(categoriesResult.data || [])
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
        <CreateCategoryDialog />
      </div>

      <ScriptsSearch onResultClick={handleSearchResultClick} />

      <CategoryList categories={categories} isAdmin={true} />
    </div>
  )
}
