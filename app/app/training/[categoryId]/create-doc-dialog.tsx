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
import { Plus, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RichTextEditor } from '@/components/rich-text-editor'
import { useLocale } from '@/lib/i18n/use-locale'
import { useTrainingDocMutation } from '@/lib/hooks/use-training-docs'

interface CreateTrainingDocDialogProps {
  categoryId: string
}

export function CreateTrainingDocDialog({ categoryId }: CreateTrainingDocDialogProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('<p>Enter your training content here...</p>')
  const { createMutation } = useTrainingDocMutation(categoryId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('content', content)

      await createMutation.mutateAsync(formData)
      
      // успех
      setOpen(false)
      setContent('<p>Enter your training content here...</p>')
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.toString?.() ||
        'Непредвиденная ошибка при создании документа'
      setError(msg)
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
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('training.content')}</Label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>
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
