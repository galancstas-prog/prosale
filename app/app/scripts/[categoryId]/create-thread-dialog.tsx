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
import { useLocale } from '@/lib/i18n/use-locale'
import { useScriptThreadMutation } from '@/lib/hooks/use-script-threads'

interface CreateThreadDialogProps {
  categoryId: string
}

export function CreateThreadDialog({ categoryId }: CreateThreadDialogProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const { createMutation } = useScriptThreadMutation(categoryId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      await createMutation.mutateAsync(formData)
      setOpen(false)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при создании')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('scripts.newThread')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('scripts.createThread')}</DialogTitle>
          <DialogDescription>
            {t('scripts.createThreadDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">{t('scripts.threadTitle')}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t('scripts.threadTitlePlaceholder')}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description"
              disabled={createMutation.isPending}
            />
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
