'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useScriptThreadMutation } from '@/lib/hooks/use-script-threads'

interface CreateThreadDialogProps {
  categoryId: string
  compact?: boolean
}

export function CreateThreadDialog({ categoryId, compact = false }: CreateThreadDialogProps) {
  const [open, setOpen] = useState(false)
  const { createMutation } = useScriptThreadMutation(categoryId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData(e.currentTarget)
      await createMutation.mutateAsync(formData)
      setOpen(false)
    } catch (err) {
      // Ошибка обрабатывается в мутации
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button size="sm" variant="outline" className="w-full text-xs h-7">
            <Plus className="h-3 w-3 mr-1" />
            Добавить скрипт
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новый скрипт
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать скрипт</DialogTitle>
          <DialogDescription>
            Добавьте название и описание нового скрипта
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {createMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{createMutation.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="thread-title">Название</Label>
            <Input
              id="thread-title"
              name="title"
              placeholder="Например: Первый звонок клиенту"
              required
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thread-description">Описание</Label>
            <Textarea
              id="thread-description"
              name="description"
              placeholder="Коротко: для чего этот скрипт"
              disabled={createMutation.isPending}
            />
          </div>

          <input type="hidden" name="category_id" value={categoryId} />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
