'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/empty-state'
import { MessageSquare, ArrowRight, Pencil, Trash2, Loader2 } from 'lucide-react'
import { updateThread, deleteThread } from '@/lib/actions/script-threads'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Thread {
  id: string
  title: string
  description: string | null
}

interface ThreadListProps {
  threads: Thread[]
  isAdmin: boolean
}

export function ThreadList({ threads, isAdmin }: ThreadListProps) {
  const router = useRouter()
  const [editingThread, setEditingThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingThread) return

    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateThread(editingThread.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setEditingThread(null)
      setLoading(false)
      router.refresh()
    }
  }

  const handleDelete = async (threadId: string, threadTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${threadTitle}"? All messages will be deleted.`)) return

    setLoading(true)
    await deleteThread(threadId)
    setLoading(false)
    router.refresh()
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No script threads yet"
        description={
          isAdmin
            ? "Create your first script thread to start building conversations"
            : "No script threads available yet"
        }
      />
    )
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {threads.map((thread) => (
          <Card key={thread.id} className="h-full hover:shadow-lg transition-all border-2 relative group">
            <Link href={`/app/scripts/thread/${thread.id}`}>
              <CardHeader className="cursor-pointer">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {thread.title}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </CardTitle>
                {thread.description && <CardDescription>{thread.description}</CardDescription>}
              </CardHeader>
            </Link>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault()
                    setEditingThread(thread)
                  }}
                  disabled={loading}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(thread.id, thread.title)
                  }}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!editingThread} onOpenChange={(open) => !open && setEditingThread(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Script Thread</DialogTitle>
            <DialogDescription>Update the thread details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Thread Title</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={editingThread?.title}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingThread?.description || ''}
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingThread(null)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
