'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/empty-state'
import { FolderOpen, ArrowRight, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useKbCategoryMutation } from '@/lib/hooks/use-kb-categories'
import { SortableList, DragHandle } from '@/components/sortable-list'

interface Category {
  id: string
  name: string
  description: string | null
}

interface KbCategoryListProps {
  categories: Category[]
  isAdmin: boolean
  onReorder?: (orderedIds: string[]) => Promise<void>
  compact?: boolean
}

export function KbCategoryList({ categories, isAdmin, onReorder, compact = false }: KbCategoryListProps) {
  const searchParams = useSearchParams()
  const selectedCategoryId = searchParams.get('category')
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [error, setError] = useState('')
  const { updateMutation, deleteMutation } = useKbCategoryMutation()
  const [localCategories, setLocalCategories] = useState(categories)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const handleReorder = async (reordered: Category[]) => {
    setLocalCategories(reordered)
    if (onReorder) {
      await onReorder(reordered.map(c => c.id))
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCategory) return

    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      await updateMutation.mutateAsync({ categoryId: editingCategory.id, formData })
      setEditingCategory(null)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при обновлении')
    }
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить категорию «${categoryName}»?`
      )
    )
      return

    try {
      await deleteMutation.mutateAsync(categoryId)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при удалении')
    }
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Категорий пока нет"
        description={
          isAdmin
            ? "Создайте первую категорию, чтобы начать структурировать базу знаний"
            : "Категории базы знаний пока недоступны"
        }
      />
    )
  }

  // Compact mode - для боковой панели
  if (compact) {
    return (
      <>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-1">
          <SortableList
            items={localCategories}
            onReorder={handleReorder}
            disabled={!isAdmin || !onReorder}
            renderItem={(category, dragHandleProps) => {
              const isSelected = selectedCategoryId === category.id
              
              return (
                <Link
                  href={`/app/knowledge?category=${category.id}`}
                  className={cn(
                    'group flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-sm',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {isAdmin && onReorder && (
                    <DragHandle {...dragHandleProps} className="shrink-0 opacity-0 group-hover:opacity-100" />
                  )}
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 font-medium truncate">{category.name}</span>
                  {isAdmin && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.preventDefault()
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
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(category.id, category.name)
                        }}
                        disabled={updateMutation.isPending || deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  )}
                </Link>
              )
            }}
          />
        </div>

        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать категорию</DialogTitle>
              <DialogDescription>Обновить сведения о категории</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Название категории</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
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

  // Grid mode - оригинальный вид
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <SortableList
        items={localCategories}
        onReorder={handleReorder}
        disabled={!isAdmin || !onReorder}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        renderItem={(category, dragHandleProps) => {
          const isSelected = selectedCategoryId === category.id
          
          return (
            <Card 
              className={cn(
                "h-full hover:shadow-lg transition-all border-2 relative group",
                isSelected && 'border-primary ring-2 ring-primary/20'
              )}
            >
              {isAdmin && onReorder && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DragHandle {...dragHandleProps} />
                </div>
              )}
              <Link href={`/app/knowledge?category=${category.id}`}>
                <CardHeader className="cursor-pointer">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {category.name}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </CardTitle>
                  {category.description && <CardDescription>{category.description}</CardDescription>}
                </CardHeader>
              </Link>
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault()
                      setEditingCategory(category)
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(category.id, category.name)
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </Card>
          )
        }}
      />

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
            <DialogDescription>Обновить сведения о категории</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Название категории</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingCategory?.name}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
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
