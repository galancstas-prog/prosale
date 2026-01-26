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
import { useFaqItemMutation } from '@/lib/hooks/use-faq-items'

export function CreateFaqDialog() {
  const { t } = useLocale()
  const { toast } = useToast()
  const { createMutation } = useFaqItemMutation()

  const formRef = useRef<HTMLFormElement | null>(null)

  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    await createMutation.mutateAsync(formData)

    // закрываем диалог
    setOpen(false)

    // безопасно очищаем форму
    formRef.current?.reset()

    toast({
      title: 'Успешно',
      description: 'Пункт FAQ создан',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('faq.newItem')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('faq.createItem')}</DialogTitle>
          <DialogDescription>
            {t('faq.createItemDesc')}
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {createMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{createMutation.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">{t('faq.question')}</Label>
            <Input
              id="question"
              name="question"
              placeholder={t('faq.questionPlaceholder')}
              required
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">{t('faq.answer')}</Label>
            <Textarea
              id="answer"
              name="answer"
              placeholder={t('faq.answerPlaceholder')}
              required
              disabled={createMutation.isPending}
              className="min-h-[150px]"
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
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}