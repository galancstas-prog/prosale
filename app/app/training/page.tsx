'use client'

import { useEffect, useState } from 'react'
import { getTrainingCategories } from '@/lib/actions/training-categories'
import { CreateTrainingCategoryDialog } from './create-category-dialog'
import { TrainingCategoryList } from './category-list'
import { useLocale } from '@/lib/i18n/use-locale'

export default function TrainingPage() {
  const { t } = useLocale()
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const categoriesResult = await getTrainingCategories()
      setCategories(categoriesResult.data || [])
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('training.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('training.subtitle')}
          </p>
        </div>
        <CreateTrainingCategoryDialog />
      </div>

      <TrainingCategoryList categories={categories} isAdmin={true} />
    </div>
  )
}
