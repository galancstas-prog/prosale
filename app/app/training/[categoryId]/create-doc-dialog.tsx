'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Loader2 } from 'lucide-react'
import { createTrainingDoc } from '@/lib/actions/training-docs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RichTextEditor } from '@/components/rich-text-editor'
import { useLocale } from '@/lib/i18n/use-locale'

interface CreateTrainingDocDialogProps {
  categoryId: string
}

export function CreateTrainingDocDialog({ categoryId }: CreateTrainingDocDialogProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('<p>Enter your training content here...</p>')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('content', content)

      // ВАЖНО: типизируем как any, чтобы TS не сходил с ума и не давал "never"
      const result: any = await createTrainingDoc(categoryId, formData)

      if (result?.error) {
        const msg =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Не удалось создать документ'
        setError(msg)
        return
      }

      // успех
      setOpen(false)
      setContent('<p>Enter your training content here...</p>')
      router.refresh()
    } catch (err: any) {
      // ЛОВИМ РЕАЛЬНУЮ ОШИБКУ, КОТОРУЮ РАНЬШЕ ТЫ НЕ ВИДЕЛ
      const msg =
        err?.message ||
        err?.toString?.() ||
        'Непредвиденная ошибка при создании документа'
      setError(msg)
    } finally {
      setLoading(false)
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
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('training.content')}</Label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
