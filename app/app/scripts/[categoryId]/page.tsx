'use client'

import { useEffect, useState } from 'react'
import { getThreadsByCategory } from '@/lib/actions/script-threads'
import { getCategories } from '@/lib/actions/categories'
import { CreateThreadDialog } from './create-thread-dialog'
import { ThreadList } from './thread-list'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/use-locale'

export default function CategoryPage({ params }: { params: { categoryId: string } }) {
  const { t } = useLocale()
  const [category, setCategory] = useState<any>(null)
  const [threads, setThreads] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const threadsResult = await getThreadsByCategory(params.categoryId)
      const categoriesResult = await getCategories()

      const categories = categoriesResult.data || []
      const foundCategory = categories.find(c => c.id === params.categoryId)

      setCategory(foundCategory)
      setThreads(threadsResult.data || [])
    }
    loadData()
  }, [params.categoryId])

  if (!category) {
    return <div>Category not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/scripts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('scripts.backToScripts')}
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
          <CreateThreadDialog categoryId={params.categoryId} />
        </div>
      </div>

      <ThreadList threads={threads} isAdmin={true} />
    </div>
  )
}
