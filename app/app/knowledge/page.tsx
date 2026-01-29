'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, ChevronRight, FolderOpen, Loader2 } from 'lucide-react'
import { CreateKbDialog } from './create-kb-dialog'
import { CreateKbCategoryDialog } from './create-kb-category-dialog'
import { KbCategoryList } from './kb-category-list'
import { KbList } from './kb-list'
import { KbSearch } from './kb-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useKbPages } from '@/lib/hooks/use-kb-pages'
import { useKbCategories } from '@/lib/hooks/use-kb-categories'
import { ExportImportMenu } from '@/components/export-import-menu'
import { useCollapsiblePanel } from '@/lib/hooks/use-collapsible-panel'
import { reorderKbCategories, reorderKbPages } from '@/lib/actions/reorder'
import { exportKnowledge, importKnowledge } from '@/lib/actions/export-import'

export default function KnowledgePage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const { isCollapsed, toggleCollapsed, isLoaded } = useCollapsiblePanel('knowledge')
  
  const { data: allPages = [], isLoading: pagesLoading } = useKbPages()
  const { data: categories = [], isLoading: categoriesLoading } = useKbCategories()
  
  const [localCategories, setLocalCategories] = useState(categories)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

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

  const handleReorderCategories = async (orderedIds: string[]) => {
    await reorderKbCategories(orderedIds)
  }

  const handleReorderPages = async (orderedIds: string[]) => {
    if (!selectedCategoryId) return
    await reorderKbPages(selectedCategoryId, orderedIds)
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
          {isAdmin && (
            <ExportImportMenu
              onExport={async () => {
                const result = await exportKnowledge()
                if (result.error || !result.data) {
                  throw new Error(result.error || 'Export failed')
                }
                return result.data
              }}
              onImport={async (data) => {
                const result = await importKnowledge(data)
                if (result.error) {
                  throw new Error(result.error || 'Import failed')
                }
              }}
              moduleName="knowledge"
            />
          )}
          {isAdmin && <CreateKbCategoryDialog />}
          {isAdmin && <CreateKbDialog selectedCategoryId={selectedCategoryId} />}
        </div>
      </div>

      <KbSearch onResultClick={handleSearchResultClick} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={cn(
          "grid gap-6 min-h-[500px] transition-all duration-300",
          isCollapsed ? "grid-cols-1 lg:grid-cols-[48px_1fr]" : "grid-cols-1 lg:grid-cols-4"
        )}>
          {/* Левая панель - Категории */}
          <div className="lg:col-span-1">
            <Card className={cn(
              "p-4 h-full relative transition-all duration-300",
              isCollapsed && "overflow-hidden"
            )}>
              {/* Кнопка сворачивания */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                className="absolute top-2 right-2 z-10 h-7 w-7 p-0"
                title={isCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>

              {/* Контент панели */}
              <div className={cn(
                "transition-all duration-300",
                isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"
              )}>
                <h3 className="font-semibold mb-4 text-base pr-8">Категории</h3>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  <KbCategoryList 
                    categories={localCategories} 
                    isAdmin={isAdmin} 
                    onReorder={handleReorderCategories}
                    compact
                  />
                </ScrollArea>
              </div>

              {/* Вертикальный текст при свёрнутом состоянии */}
              {isCollapsed && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2">
                  <span
                    className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                    }}
                  >
                    Категории
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Правая панель - Страницы */}
          <div className={cn(
            "transition-all duration-300",
            isCollapsed ? "lg:col-span-1" : "lg:col-span-3"
          )}>
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {selectedCategoryId 
                  ? `Страницы: ${categories.find(c => c.id === selectedCategoryId)?.name || 'Категория'}`
                  : 'Все страницы'
                }
              </h2>
              <KbList 
                pages={filteredPages} 
                isAdmin={isAdmin} 
                onReorder={handleReorderPages}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
