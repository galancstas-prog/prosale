'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTrainingCategories } from '@/lib/actions/training-categories'
import { CreateTrainingCategoryDialog } from './create-category-dialog'
import { TrainingCategoryList } from './category-list'
import { TrainingSearch } from './training-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'

export default function TrainingPage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const categoriesResult = await getTrainingCategories()
      setCategories(categoriesResult.data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSearchResultClick = (id: string, query: string) => {
    router.push(`/app/training/doc/${id}?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('training.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('training.subtitle')}
          </p>
        </div>
        {isAdmin && <CreateTrainingCategoryDialog />}
      </div>

      <TrainingSearch onResultClick={handleSearchResultClick} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <TrainingCategoryList categories={categories} isAdmin={isAdmin} />
      )}
    </div>
  )
}
