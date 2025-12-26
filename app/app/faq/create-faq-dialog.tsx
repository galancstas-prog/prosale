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
import { createFaqItem } from '@/lib/actions/faq-items'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export function CreateFaqDialog() {
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

    const formData = new FormData(e.currentTarget)
    const result = await createFaqItem(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // закрываем диалог
    setOpen(false)

    // безопасно очищаем форму
    formRef.current?.reset()

    setLoading(false)
    router.refresh()

    toast({
      title: 'Success',
      description: 'FAQ item created successfully',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New FAQ Item
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create FAQ Item</DialogTitle>
          <DialogDescription>
            Add a new frequently asked question and answer
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              name="question"
              placeholder="e.g., How do I reset my password?"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              name="answer"
              placeholder="Provide a clear and helpful answer..."
              required
              disabled={loading}
              className="min-h-[150px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create FAQ Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}