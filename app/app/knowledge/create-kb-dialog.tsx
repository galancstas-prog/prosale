'use client'

import { useState, useRef } from 'react'
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
import { RichTextEditor } from '@/components/rich-text-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from '@/lib/i18n/use-locale'
import { useKbPageMutation } from '@/lib/hooks/use-kb-pages'
import { useKbCategories } from '@/lib/hooks/use-kb-categories'

interface CreateKbDialogProps {
  selectedCategoryId?: string | null
}

export function CreateKbDialog({ selectedCategoryId }: CreateKbDialogProps) {
  const { t } = useLocale()
  const { toast } = useToast()
  const { createMutation } = useKbPageMutation()
  const { data: categories = [] } = useKbCategories()
  const formRef = useRef<HTMLFormElement | null>(null)

  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<string | undefined>(selectedCategoryId || undefined)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData(e.currentTarget)
      
      // Добавить category_id в formData
      if (categoryId) {
        formData.set('category_id', categoryId)
      }
      
      formData.set('content', content)
      
      await createMutation.mutateAsync(formData)

      setOpen(false)
      setContent('')
      formRef.current?.reset()
      setCategoryId(selectedCategoryId || undefined)

      toast({
        title: 'Готово',
        description: 'Страница базы знаний создана',
      })
    } catch (err: any) {
      const msg = err?.message || 'Неожиданная ошибка при создании страницы'
      toast({
        title: 'Ошибка',
        description: msg,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        setCategoryId(selectedCategoryId || undefined)
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('kb.newPage')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('kb.createPage')}</DialogTitle>
          <DialogDescription>
            {t('kb.createPageDesc')}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {createMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{createMutation.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={createMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t('kb.pageTitle')}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t('kb.pageTitlePlaceholder')}
              required
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('kb.pageContent')}</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={t('kb.pageContentPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('common.cancel')}
            </Button>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
