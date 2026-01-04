'use client'

import { useEffect, useState } from 'react'
import { getCategories } from '@/lib/actions/categories'
import { CreateCategoryDialog } from './create-category-dialog'
import { CategoryList } from './category-list'
import { useLocale } from '@/lib/i18n/use-locale'

export default function ScriptsPage() {
  const { t } = useLocale()
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const categoriesResult = await getCategories()
      setCategories(categoriesResult.data || [])
    }
    loadData()
  }, [])

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

      <CategoryList categories={categories} isAdmin={true} />
    </div>
  )
}
