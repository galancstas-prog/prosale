'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/empty-state'
import { MessageSquare, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useScriptThreadMutation } from '@/lib/hooks/use-script-threads'
import { getTextPreview } from '@/lib/text-utils'

interface Thread {
  id: string
  title: string
  description: string | null
  category_id: string
}

interface ScriptThreadGridProps {
  threads: Thread[]
  isAdmin: boolean
  onViewThread: (threadId: string) => void
}

export function ScriptThreadGrid({ threads, isAdmin, onViewThread }: ScriptThreadGridProps) {
  const [editingThread, setEditingThread] = useState<Thread | null>(null)
  const [error, setError] = useState('')
  
  // Берём category_id от первого thread, если он есть
  const categoryId = threads[0]?.category_id || ''
  const { updateMutation, deleteMutation } = useScriptThreadMutation(categoryId)

  if (threads.length === 0) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={MessageSquare}
          title="Скриптов пока нет"
          description={
            isAdmin
              ? 'Создайте первый скрипт в этой категории'
              : 'Скрипты для этой категории пока не добавлены'
          }
        />
      </Card>
    )
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingThread) return

    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      await updateMutation.mutateAsync({ threadId: editingThread.id, formData })
      setEditingThread(null)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при обновлении')
    }
  }

  const handleDelete = async (e: React.MouseEvent, thread: Thread) => {
    e.stopPropagation()
    if (!confirm(`Вы уверены, что хотите удалить "${thread.title}"? Все сообщения будут удалены.`)) return

    try {
      await deleteMutation.mutateAsync(thread.id)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при удалении')
    }
  }

  return (
    <>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {threads.map((thread) => (
          <Card
            key={thread.id}
            className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all relative group"
            onClick={() => onViewThread(thread.id)}
          >
            <CardHeader>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <CardTitle className="text-base leading-snug">{thread.title}</CardTitle>
              {thread.description && (
                <CardDescription className="text-sm line-clamp-2">
                  {getTextPreview(thread.description, 100)}
                </CardDescription>
              )}
            </CardHeader>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingThread(thread)
                  }}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleDelete(e, thread)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Диалог редактирования */}
      <Dialog open={!!editingThread} onOpenChange={(open) => !open && setEditingThread(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать скрипт</DialogTitle>
            <DialogDescription>Обновите название и описание скрипта</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-thread-title">Название</Label>
              <Input
                id="edit-thread-title"
                name="title"
                defaultValue={editingThread?.title}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-thread-description">Описание</Label>
              <Textarea
                id="edit-thread-description"
                name="description"
                defaultValue={editingThread?.description || ''}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingThread(null)}
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
