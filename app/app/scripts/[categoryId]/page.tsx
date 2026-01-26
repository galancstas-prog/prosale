'use client'

import { useEffect, useState } from 'react'
import { getCategories } from '@/lib/actions/categories'
import { CreateThreadDialog } from './create-thread-dialog'
import { ThreadList } from './thread-list'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useScriptThreads } from '@/lib/hooks/use-script-threads'

export default function CategoryPage({ params }: { params: { categoryId: string } }) {
  const { t } = useLocale()
  const { membership } = useMembership()
  const [category, setCategory] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const { data: threads = [], isLoading } = useScriptThreads(params.categoryId)

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'


  useEffect(() => {
    async function loadData() {
      const categoriesResult = await getCategories()

      const categories = categoriesResult.data || []
      const foundCategory = categories.find(c => c.id === params.categoryId)

      if (!foundCategory) {
        setNotFound(true)
      } else {
        setCategory(foundCategory)
      }
    }
    loadData()
  }, [params.categoryId])

  if (isLoading || !category) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (notFound) {
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
            <h1 className="text-3xl font-bold tracking-tight">{category?.name || 'Loading...'}</h1>
            {category?.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {category.description}
              </p>
            )}
          </div>
          {isAdmin && <CreateThreadDialog categoryId={params.categoryId} />}
        </div>
      </div>

      <ThreadList threads={threads} categoryId={params.categoryId} isAdmin={isAdmin} />
    </div>
  )
}
