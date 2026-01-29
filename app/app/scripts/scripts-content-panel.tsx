'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, ChevronDown, ChevronRight, FolderOpen, Pencil, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { useCategories, useCategoryMutation } from '@/lib/hooks/use-categories'
import { useScriptThreads, useScriptThreadMutation } from '@/lib/hooks/use-script-threads'
import { ScriptThreadGrid } from './thread-grid'
import { ScriptThreadInlinePanel } from './thread-inline-panel'
import { CreateThreadDialog } from './create-thread-dialog'
import { EmptyState } from '@/components/empty-state'
import { useQueryClient } from '@tanstack/react-query'

interface Category {
  id: string
  name: string
  description: string | null
}

interface ScriptsContentPanelProps {
  categories: Category[]
  isAdmin: boolean
}

export function ScriptsContentPanel({ categories, isAdmin }: ScriptsContentPanelProps) {
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id || null
  )
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  )
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editError, setEditError] = useState('')
  
  const { updateMutation, deleteMutation } = useCategoryMutation()

  // Получаем threads для выбранной категории
  const { data: threads = [], isLoading: threadsLoading } = useScriptThreads(selectedCategoryId || '')

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
    setViewingThreadId(null)
    if (!expandedCategories.has(categoryId)) {
      toggleCategory(categoryId)
    }
  }

  const handleViewThread = (threadId: string) => {
    setViewingThreadId(threadId)
  }

  const handleBackToList = () => {
    setViewingThreadId(null)
  }

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCategory) return

    setEditError('')

    try {
      const formData = new FormData(e.currentTarget)
      await updateMutation.mutateAsync({ categoryId: editingCategory.id, formData })
      setEditingCategory(null)
    } catch (err: any) {
      setEditError(err?.message || 'Ошибка при обновлении')
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить «${categoryName}»? Все скрипты будут удалены.`)) return

    try {
      await deleteMutation.mutateAsync(categoryId)
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(categories.find(c => c.id !== categoryId)?.id || null)
      }
    } catch (err: any) {
      setEditError(err?.message || 'Ошибка при удалении')
    }
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  if (categories.length === 0) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={FolderOpen}
          title="Категории скриптов пока отсутствуют"
          description={
            isAdmin
              ? "Создайте свою первую категорию, чтобы начать организовывать скрипты"
              : "Категории скриптов пока недоступны"
          }
        />
      </Card>
    )
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
      {/* Левая панель - Категории и threads */}
      <div className="lg:col-span-1">
        <Card className="p-4 h-full">
          <h3 className="font-semibold mb-4 text-base">Разделы</h3>
          <ScrollArea className="h-[calc(100%-3rem)]">
            <div className="space-y-2 pr-3">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id)
                const isSelected = selectedCategoryId === category.id

                return (
                  <div key={category.id} className="space-y-1">
                    {/* Категория */}
                    <div
                      className={cn(
                        'group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all text-sm',
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
                        className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <button 
                        onClick={() => handleCategorySelect(category.id)}
                        className="flex-1 min-w-0 text-left font-medium"
                        title={category.name}
                      >
                        <span className="block text-sm leading-tight break-words">{category.name}</span>
                      </button>
                      {isAdmin && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingCategory(category)
                            }}
                            disabled={updateMutation.isPending || deleteMutation.isPending}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCategory(category.id, category.name)
                            }}
                            disabled={updateMutation.isPending || deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Threads внутри категории (раскрываются при выборе категории) */}
                    {isExpanded && isSelected && (
                      <div className="ml-4 pl-3 mt-3 pt-1 border-l border-slate-200 dark:border-slate-700">
                        <ThreadListInNav
                          threads={threads}
                          isLoading={threadsLoading}
                          selectedThreadId={viewingThreadId}
                          onSelectThread={handleViewThread}
                          isAdmin={isAdmin}
                          categoryId={category.id}
                        />
                        {isAdmin && (
                          <div className="mt-3">
                            <CreateThreadDialog categoryId={category.id} compact />
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
        {viewingThreadId ? (
          <ScriptThreadInlinePanel
            threadId={viewingThreadId}
            isAdmin={isAdmin}
            onBack={handleBackToList}
            categories={categories}
            onThreadMoved={() => {
              queryClient.invalidateQueries({ queryKey: ['script-threads'] })
              setViewingThreadId(null)
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Заголовок раздела */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedCategory?.name || 'Выберите категорию'}
                </h2>
                {selectedCategory?.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
              {isAdmin && selectedCategoryId && (
                <CreateThreadDialog categoryId={selectedCategoryId} />
              )}
            </div>

            {/* Список threads */}
            {threadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScriptThreadGrid
                threads={threads}
                isAdmin={isAdmin}
                onViewThread={handleViewThread}
              />
            )}
          </div>
        )}
      </div>
    </div>

    {/* Диалог редактирования категории */}
    <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать категорию</DialogTitle>
          <DialogDescription>Обновите сведения о категории</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          {editError && (
            <Alert variant="destructive">
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-cat-name">Название категории</Label>
            <Input
              id="edit-cat-name"
              name="name"
              defaultValue={editingCategory?.name}
              required
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cat-description">Описание</Label>
            <Textarea
              id="edit-cat-description"
              name="description"
              defaultValue={editingCategory?.description || ''}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCategory(null)}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}

// Компонент списка threads внутри навигации
interface ThreadListInNavProps {
  threads: any[]
  isLoading: boolean
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
  isAdmin: boolean
  categoryId: string
}

function ThreadListInNav({ threads, isLoading, selectedThreadId, onSelectThread, isAdmin, categoryId }: ThreadListInNavProps) {
  const { deleteMutation } = useScriptThreadMutation(categoryId)
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Скриптов пока нет
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {threads.map((thread) => {
        const isSelected = selectedThreadId === thread.id
        return (
          <div
            key={thread.id}
            className={cn(
              'group flex items-center gap-1.5 px-2 py-1 rounded-md text-sm cursor-pointer transition-all',
              isSelected
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <button
              onClick={() => onSelectThread(thread.id)}
              className="flex-1 min-w-0 text-left"
              title={thread.title}
            >
              <span className="block text-sm leading-tight break-words">{thread.title}</span>
            </button>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Удалить "${thread.title}"?`)) {
                    deleteMutation.mutate(thread.id)
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
