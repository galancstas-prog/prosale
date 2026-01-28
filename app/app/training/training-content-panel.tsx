'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen } from 'lucide-react'
import { useTrainingCategories } from '@/lib/hooks/use-training-categories'
import { useTrainingSubcategories } from '@/lib/hooks/use-training-subcategories'
import { useTrainingDocs } from '@/lib/hooks/use-training-docs'
import { TrainingSubcategoryList } from './subcategory-list'
import { TrainingDocGrid } from './doc-grid'
import { TrainingDocInlinePanel } from './doc-inline-panel'
import { CreateSubcategoryDialog } from './create-subcategory-dialog'
import { CreateDocInlineDialog } from './create-doc-inline-dialog'
import { EmptyState } from '@/components/empty-state'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
}

interface TrainingContentPanelProps {
  categories: Category[]
  isAdmin: boolean
  onDeleteDoc?: (docId: string) => Promise<void>
}

export function TrainingContentPanel({ categories, isAdmin, onDeleteDoc }: TrainingContentPanelProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id || null
  )
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [viewingDocId, setViewingDocId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  )

  // Получаем подкатегории для выбранной категории
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useTrainingSubcategories(selectedCategoryId)

  // Получаем все документы для выбранной категории
  const { data: allDocs = [], isLoading: docsLoading } = useTrainingDocs(selectedCategoryId || '')

  // Фильтруем документы по подкатегории
  const filteredDocs = useMemo(() => {
    if (!selectedSubcategoryId) {
      // Показываем все документы категории
      return allDocs
    }
    return allDocs.filter((doc: any) => doc.subcategory_id === selectedSubcategoryId)
  }, [allDocs, selectedSubcategoryId])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedSubcategoryId(null)
    setViewingDocId(null)
    if (!expandedCategories.has(categoryId)) {
      toggleCategory(categoryId)
    }
  }

  const handleSubcategorySelect = (subcategoryId: string | null) => {
    setSelectedSubcategoryId(subcategoryId)
    setViewingDocId(null)
  }

  const handleViewDoc = (docId: string) => {
    setViewingDocId(docId)
  }

  const handleBackToList = () => {
    setViewingDocId(null)
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  if (categories.length === 0) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={BookOpen}
          title="Категории обучения пока отсутствуют"
          description={
            isAdmin
              ? "Создайте свою первую категорию, чтобы начать организовывать учебные материалы"
              : "Категории обучения пока недоступны"
          }
        />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
      {/* Левая панель - Категории и подкатегории */}
      <div className="lg:col-span-1">
        <Card className="p-4 h-full">
          <h3 className="font-semibold mb-4 text-lg">Разделы</h3>
          <ScrollArea className="h-[calc(100%-3rem)]">
            <div className="space-y-2 pr-3">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id)
                const isSelected = selectedCategoryId === category.id

                return (
                  <div key={category.id} className="space-y-1">
                    {/* Категория */}
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all font-medium',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCategory(category.id)
                        }}
                        className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1">{category.name}</span>
                    </button>

                    {/* Подкатегории (раскрываются при выборе категории) */}
                    {isExpanded && isSelected && (
                      <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                        {subcategoriesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <TrainingSubcategoryList
                            subcategories={subcategories}
                            selectedId={selectedSubcategoryId}
                            onSelect={handleSubcategorySelect}
                            isAdmin={isAdmin}
                            categoryId={category.id}
                          />
                        )}
                        {isAdmin && (
                          <div className="mt-3">
                            <CreateSubcategoryDialog categoryId={category.id} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Правая панель - Контент */}
      <div className="lg:col-span-3">
        {viewingDocId ? (
          <TrainingDocInlinePanel
            docId={viewingDocId}
            isAdmin={isAdmin}
            onBack={handleBackToList}
          />
        ) : (
          <div className="space-y-4">
            {/* Заголовок раздела */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedCategory?.name || 'Выберите категорию'}
                </h2>
                {selectedSubcategoryId && (
                  <p className="text-sm text-muted-foreground">
                    {subcategories.find(s => s.id === selectedSubcategoryId)?.name}
                  </p>
                )}
              </div>
              {isAdmin && selectedCategoryId && (
                <CreateDocInlineDialog
                  categoryId={selectedCategoryId}
                  subcategories={subcategories}
                  selectedSubcategoryId={selectedSubcategoryId}
                />
              )}
            </div>

            {/* Список документов */}
            {docsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TrainingDocGrid
                docs={filteredDocs}
                isAdmin={isAdmin}
                onViewDoc={handleViewDoc}
                onDeleteDoc={onDeleteDoc}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
