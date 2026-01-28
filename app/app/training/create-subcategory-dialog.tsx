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
import { useTrainingSubcategoryMutation } from '@/lib/hooks/use-training-subcategories'

interface CreateSubcategoryDialogProps {
  categoryId: string
}

export function CreateSubcategoryDialog({ categoryId }: CreateSubcategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const { createMutation } = useTrainingSubcategoryMutation(categoryId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      await createMutation.mutateAsync(formData)
      setOpen(false)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при создании подкатегории')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Подкатегория
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать подкатегорию</DialogTitle>
          <DialogDescription>
            Подкатегории помогают лучше организовать учебные материалы
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Название подкатегории</Label>
            <Input
              id="name"
              name="name"
              placeholder="Например: Базовые понятия"
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Опишите подкатегорию..."
              disabled={createMutation.isPending}
            />
          </div>
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
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
