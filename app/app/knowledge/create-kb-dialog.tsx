'use client'

import { useState, useRef } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createKbPage } from '@/lib/actions/kb-pages'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from '@/lib/i18n/use-locale'

export function CreateKbDialog() {
  const { t } = useLocale()
  const router = useRouter()
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement | null>(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result: any = await createKbPage(formData)

      if (result?.error) {
        const msg =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Не удалось создать страницу базы знаний'
        setError(msg)
        setLoading(false)
        return
      }

      setOpen(false)
      formRef.current?.reset()
      setLoading(false)
      router.refresh()

      toast({
        title: 'Готово',
        description: 'Неожиданная ошибка при создании страницы базы знаний',
      })
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.toString?.() ||
        'Неожиданная ошибка при создании страницы базы знаний'
      setError(msg)
      setLoading(false)
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
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t('kb.pageTitle')}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t('kb.pageTitlePlaceholder')}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('kb.pageContent')}</Label>
            <Textarea
              id="content"
              name="content"
              placeholder={t('kb.pageContentPlaceholder')}
              required
              disabled={loading}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
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
