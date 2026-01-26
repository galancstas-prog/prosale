'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreateKbDialog } from './create-kb-dialog'
import { CreateKbCategoryDialog } from './create-kb-category-dialog'
import { KbCategoryList } from './kb-category-list'
import { KbList } from './kb-list'
import { KbSearch } from './kb-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useKbPages } from '@/lib/hooks/use-kb-pages'
import { useKbCategories } from '@/lib/hooks/use-kb-categories'

export default function KnowledgePage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  
  const { data: allPages = [], isLoading: pagesLoading } = useKbPages()
  const { data: categories = [], isLoading: categoriesLoading } = useKbCategories()

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  // Выбрать категорию по умолчанию
  const selectedCategoryId = useMemo(() => {
    if (categoryId) return categoryId
    
    // Найти категорию "Общая"
    const defaultCategory = categories.find((c) => c.name === 'Общая')
    if (defaultCategory) return defaultCategory.id
    
    // Fallback на первую категорию
    return categories[0]?.id || null
  }, [categoryId, categories])

  // Фильтровать страницы по категории
  const filteredPages = useMemo(() => {
    if (!selectedCategoryId) return allPages
    return allPages.filter((page: any) => page.category_id === selectedCategoryId)
  }, [allPages, selectedCategoryId])

  const handleSearchResultClick = (id: string, query: string) => {
    router.push(`/app/knowledge/${id}?q=${encodeURIComponent(query)}`)
  }

  const loading = pagesLoading || categoriesLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('kb.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('kb.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <CreateKbCategoryDialog />}
          {isAdmin && <CreateKbDialog selectedCategoryId={selectedCategoryId} />}
        </div>
      </div>

      <KbSearch onResultClick={handleSearchResultClick} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Категории</h2>
            <KbCategoryList categories={categories} isAdmin={isAdmin} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedCategoryId 
                ? `Страницы: ${categories.find(c => c.id === selectedCategoryId)?.name || 'Категория'}`
                : 'Все страницы'
              }
            </h2>
            <KbList pages={filteredPages} isAdmin={isAdmin} />
          </div>
        </>
      )}
    </div>
  )
}
