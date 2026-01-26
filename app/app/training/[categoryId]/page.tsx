'use client'

import { useEffect, useState } from 'react'
import { getTrainingDocsByCategory } from '@/lib/actions/training-docs'
import { getTrainingCategories } from '@/lib/actions/training-categories'
import { CreateTrainingDocDialog } from './create-doc-dialog'
import { TrainingDocList } from './doc-list'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'

export default function TrainingCategoryPage({ params }: { params: { categoryId: string } }) {
  const { t } = useLocale()
  const { membership } = useMembership()
  const [category, setCategory] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  useEffect(() => {
    async function loadData() {
      const docsResult = await getTrainingDocsByCategory(params.categoryId)
      const categoriesResult = await getTrainingCategories()

      const categories = categoriesResult.data || []
      const foundCategory = categories.find(c => c.id === params.categoryId)

      setCategory(foundCategory)
      setDocs(docsResult.data || [])
    }
    loadData()
  }, [params.categoryId])

  if (!category) {
    return <div>Category not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/training">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('training.backToTraining')}
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {category.description}
              </p>
            )}
          </div>
          {isAdmin && <CreateTrainingDocDialog categoryId={params.categoryId} />}
        </div>
      </div>

      <TrainingDocList docs={docs} isAdmin={isAdmin} categoryId={params.categoryId} />
    </div>
  )
}
