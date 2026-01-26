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
import { useTrainingCategoryMutation } from '@/lib/hooks/use-training-categories'

export function CreateTrainingCategoryDialog() {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const { createMutation } = useTrainingCategoryMutation()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    await createMutation.mutateAsync(formData)

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('training.newCategory')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('training.createCategory')}</DialogTitle>
          <DialogDescription>
            {t('training.createCategoryDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {createMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{createMutation.error.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t('training.categoryName')}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t('training.categoryNamePlaceholder')}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('training.categoryDesc')}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t('training.categoryDescPlaceholder')}
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
