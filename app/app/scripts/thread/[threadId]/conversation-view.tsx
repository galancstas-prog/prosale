'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChatBubble } from '@/components/chat-bubble'
import { EmptyState } from '@/components/empty-state'
import {
  MessageSquare,
  Loader2,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  createTurn,
  updateTurn,
  deleteTurn,
  reorderTurn,
} from '@/lib/actions/script-turns'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Turn {
  id: string
  speaker: 'agent' | 'client'
  message: string
  order_index: number
}

interface ConversationViewProps {
  threadId: string
  turns: Turn[]
  isAdmin: boolean
}

export function ConversationView({ threadId, turns, isAdmin }: ConversationViewProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleAddTurn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    await createTurn(threadId, formData)

    formRef.current?.reset()
    setLoading(false)
    router.refresh()
  }

  const handleEdit = (turn: Turn) => {
    setEditingTurnId(turn.id)
    setEditContent(turn.message)
  }

  const handleSaveEdit = async (turnId: string) => {
    setLoading(true)
    await updateTurn(turnId, editContent)

    setEditingTurnId(null)
    setEditContent('')
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async (turnId: string) => {
    if (!confirm('Are you sure you want to delete this turn?')) return

    setLoading(true)
    await deleteTurn(turnId, threadId)
    setLoading(false)
    router.refresh()
  }

  const handleReorder = async (turnId: string, direction: 'up' | 'down') => {
    setLoading(true)
    await reorderTurn(turnId, threadId, direction)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {turns.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description={
                  isAdmin
                    ? 'Add the first message to start the conversation'
                    : 'No messages in this conversation yet'
                }
              />
            ) : (
              <div className="space-y-2">
                {turns.map((turn, index) => (
                  <div key={turn.id} className="relative group">
                    {editingTurnId === turn.id ? (
                      <div className="border rounded-lg p-4 space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(turn.id)}
                            disabled={loading}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTurnId(null)
                              setEditContent('')
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ChatBubble
                          speaker={turn.speaker}
                          content={turn.message}
                          showCopyButton={turn.speaker === 'agent'}
                        />
                        {isAdmin && (
                          <div className="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReorder(turn.id, 'up')}
                              disabled={loading || index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReorder(turn.id, 'down')}
                              disabled={loading || index === turns.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(turn)}
                              disabled={loading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(turn.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                ref={formRef}
                onSubmit={handleAddTurn}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Speaker</Label>
                  <Select name="speaker" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Manager</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    name="message"
                    placeholder="Enter the message..."
                    required
                    disabled={loading}
                    className="min-h-[150px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Add Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}