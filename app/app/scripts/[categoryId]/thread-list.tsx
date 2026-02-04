'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/empty-state'
import { MessageSquare, ArrowRight, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useScriptThreads, useScriptThreadMutation } from '@/lib/hooks/use-script-threads'
import { getTextPreview } from '@/lib/text-utils'

interface Thread {
  id: string
  title: string
  description: string | null
}

interface ThreadListProps {
  categoryId: string
  isAdmin: boolean
}

export function ThreadList({ categoryId, isAdmin }: ThreadListProps) {
  const [editingThread, setEditingThread] = useState<Thread | null>(null)
  const [error, setError] = useState('')
  const { data: threads = [], isLoading } = useScriptThreads(categoryId)
  const { updateMutation, deleteMutation } = useScriptThreadMutation(categoryId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка тем...</div>
      </div>
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

  const handleDelete = async (threadId: string, threadTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить "${threadTitle}"? Все сообщения будут удалены.`)) return

    try {
      await deleteMutation.mutateAsync(threadId)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при удалении')
    }
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No script threads yet"
        description={
          isAdmin
            ? "Create your first script thread to start building conversations"
            : "No script threads available yet"
        }
      />
    )
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {threads.map((thread) => (
          <Card key={thread.id} className="h-full hover:shadow-lg transition-all border-2 relative group">
            <Link href={`/app/scripts/thread/${thread.id}`}>
              <CardHeader className="cursor-pointer">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {thread.title}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </CardTitle>
                {thread.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {getTextPreview(thread.description, 100)}
                  </CardDescription>
                )}
              </CardHeader>
            </Link>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault()
                    setEditingThread(thread)
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
                    handleDelete(thread.id, thread.title)
                  }}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!editingThread} onOpenChange={(open) => !open && setEditingThread(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать чат скрипта</DialogTitle>
            <DialogDescription>Обновить чат скрипта</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Название чата</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={editingThread?.title}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingThread?.description || ''}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingThread(null)} disabled={updateMutation.isPending}>
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
