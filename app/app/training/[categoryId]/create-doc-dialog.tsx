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

interface CreateTrainingDocDialogProps {
  categoryId: string
}

export function CreateTrainingDocDialog({ categoryId }: CreateTrainingDocDialogProps) {
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

      // ВАЖНО: server action типизируется криво в client компонентах → каст в any
      const result = (await createTrainingDoc(categoryId, formData)) as any

      if (result?.error) {
        setError(
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Failed to create training document'
        )
        setLoading(false)
        return
      }

      setOpen(false)
      setContent('<p>Enter your training content here...</p>')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to create training document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Training Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Training Document</DialogTitle>
          <DialogDescription>Create a new training document with rich content</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Product Overview"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor content={content} onChange={setContent} />
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
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
