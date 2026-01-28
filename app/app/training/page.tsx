'use client'

import { useRouter } from 'next/navigation'
import { CreateTrainingCategoryDialog } from './create-category-dialog'
import { TrainingSearch } from './training-search'
import { TrainingContentPanel } from './training-content-panel'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useTrainingCategories } from '@/lib/hooks/use-training-categories'
import { deleteTrainingDoc } from '@/lib/actions/training-docs'
import { useQueryClient } from '@tanstack/react-query'

export default function TrainingPage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: categories = [], isLoading: loading } = useTrainingCategories()

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  const handleSearchResultClick = (id: string, query: string) => {
    router.push(`/app/training/doc/${id}?q=${encodeURIComponent(query)}`)
  }

  const handleDeleteDoc = async (docId: string) => {
    const result = await deleteTrainingDoc(docId)
    if (result.error) throw new Error(result.error)
    // Инвалидируем все кеши документов
    queryClient.invalidateQueries({ queryKey: ['training-docs'] })
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
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <TrainingContentPanel 
          categories={categories} 
          isAdmin={isAdmin} 
          onDeleteDoc={handleDeleteDoc}
        />
      )}
    </div>
  )
}
