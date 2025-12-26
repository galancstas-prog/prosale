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

export function CreateKbDialog() {
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
    const result = await createKbPage(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    formRef.current?.reset()
    setLoading(false)
    router.refresh()

    toast({
      title: 'Success',
      description: 'Knowledge base page created successfully',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Knowledge Base Page</DialogTitle>
          <DialogDescription>
            Add a new page to the knowledge base
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Getting Started Guide"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your content here..."
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
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Page
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
