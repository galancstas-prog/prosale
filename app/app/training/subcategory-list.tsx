'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/empty-state'
import { FolderOpen, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTrainingSubcategoryMutation } from '@/lib/hooks/use-training-subcategories'
import { SortableList, DragHandle } from '@/components/sortable-list'

interface Subcategory {
  id: string
  name: string
  description: string | null
}

interface SubcategoryListProps {
  subcategories: Subcategory[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  isAdmin: boolean
  categoryId: string
  onReorder?: (orderedIds: string[]) => void
}

export function TrainingSubcategoryList({ 
  subcategories, 
  selectedId, 
  onSelect, 
  isAdmin,
  categoryId,
  onReorder
}: SubcategoryListProps) {
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [error, setError] = useState('')
  const { updateMutation, deleteMutation } = useTrainingSubcategoryMutation(categoryId)
  const [localSubcategories, setLocalSubcategories] = useState(subcategories)

  useEffect(() => {
    setLocalSubcategories(subcategories)
  }, [subcategories])

  const handleReorder = (reordered: Subcategory[]) => {
    setLocalSubcategories(reordered)
    if (onReorder) {
      onReorder(reordered.map(s => s.id))
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingSubcategory) return

    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      await updateMutation.mutateAsync({ subcategoryId: editingSubcategory.id, formData })
      setEditingSubcategory(null)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при обновлении')
    }
  }

  const handleDelete = async (subcategoryId: string, subcategoryName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить «${subcategoryName}»? Все документы в ней будут откреплены.`)) return

    try {
      await deleteMutation.mutateAsync(subcategoryId)
      if (selectedId === subcategoryId) {
        onSelect(null)
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка при удалении')
    }
  }

  if (subcategories.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
        Подкатегорий пока нет
      </div>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-1">
        {/* Пункт "Все документы" */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-sm',
            selectedId === null
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">Все документы</span>
        </button>

        <SortableList
          items={localSubcategories}
          onReorder={handleReorder}
          disabled={!isAdmin || !onReorder}
          renderItem={(subcategory, dragHandleProps) => {
            const isSelected = selectedId === subcategory.id

            return (
              <div
                key={subcategory.id}
                className={cn(
                  'group relative flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer text-sm',
                  isSelected
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                onClick={() => onSelect(subcategory.id)}
              >
                {isAdmin && onReorder && (
                  <DragHandle {...dragHandleProps} className="shrink-0 opacity-0 group-hover:opacity-100" />
                )}
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm leading-tight break-words block" title={subcategory.name}>{subcategory.name}</span>
                  {subcategory.description && (
                    <span className="text-xs text-slate-500 leading-tight break-words block">{subcategory.description}</span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingSubcategory(subcategory)
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
                        handleDelete(subcategory.id, subcategory.name)
                      }}
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

      <Dialog open={!!editingSubcategory} onOpenChange={(open) => !open && setEditingSubcategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать подкатегорию</DialogTitle>
            <DialogDescription>Обновить сведения о подкатегории</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Название подкатегории</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingSubcategory?.name}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingSubcategory?.description || ''}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSubcategory(null)}
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
