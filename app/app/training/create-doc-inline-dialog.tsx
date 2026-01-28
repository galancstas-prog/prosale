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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RichTextEditor } from '@/components/rich-text-editor'
import { useLocale } from '@/lib/i18n/use-locale'
import { createTrainingDoc } from '@/lib/actions/training-docs'
import { useQueryClient } from '@tanstack/react-query'

interface Subcategory {
  id: string
  name: string
}

interface CreateDocInlineDialogProps {
  categoryId: string
  subcategories: Subcategory[]
  selectedSubcategoryId?: string | null
  onSuccess?: () => void
}

export function CreateDocInlineDialog({ 
  categoryId, 
  subcategories,
  selectedSubcategoryId,
  onSuccess 
}: CreateDocInlineDialogProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [subcategoryId, setSubcategoryId] = useState<string>(selectedSubcategoryId || '')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsPending(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('content', content)
      if (subcategoryId && subcategoryId !== 'none') {
        formData.set('subcategory_id', subcategoryId)
      }

      const result = await createTrainingDoc(categoryId, formData, subcategoryId === 'none' ? undefined : subcategoryId)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Инвалидируем кеш
      queryClient.invalidateQueries({ queryKey: ['training-docs', categoryId] })
      
      // Успех
      setOpen(false)
      setContent('')
      setSubcategoryId(selectedSubcategoryId || '')
      onSuccess?.()
    } catch (err: any) {
      const msg = err?.message || err?.toString?.() || 'Непредвиденная ошибка при создании документа'
      setError(msg)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('training.newDoc')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('training.createDoc')}</DialogTitle>
          <DialogDescription>
            {t('training.createDocDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">{t('training.docTitle')}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t('training.docTitlePlaceholder')}
              required
              disabled={isPending}
            />
          </div>

          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Подкатегория (опционально)</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подкатегорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без подкатегории</SelectItem>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('training.content')}</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Напишите содержимое документа..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
