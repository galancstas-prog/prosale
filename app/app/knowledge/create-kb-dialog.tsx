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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from '@/lib/i18n/use-locale'
import { useKbPageMutation } from '@/lib/hooks/use-kb-pages'

export function CreateKbDialog() {
  const { t } = useLocale()
  const { toast } = useToast()
  const { createMutation } = useKbPageMutation()
  const formRef = useRef<HTMLFormElement | null>(null)

  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData(e.currentTarget)
      await createMutation.mutateAsync(formData)

      setOpen(false)
      formRef.current?.reset()

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
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Label htmlFor="content">{t('kb.pageContent')}</Label>
            <Textarea
              id="content"
              name="content"
              placeholder={t('kb.pageContentPlaceholder')}
              required
              disabled={createMutation.isPending}
              className="min-h-[300px] font-mono text-sm"
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
