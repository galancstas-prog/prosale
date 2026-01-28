'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/rich-text-editor'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useScriptTurns, useScriptTurnMutation } from '@/lib/hooks/use-script-turns'

interface Turn {
  id: string
  speaker: 'agent' | 'client'
  message: string
  order_index: number
}

interface ConversationViewProps {
  threadId: string
  isAdmin: boolean
  highlightTurnId?: string
  searchQuery?: string
}

export function ConversationView({ threadId, isAdmin, highlightTurnId, searchQuery }: ConversationViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null)
  
  const [error, setError] = useState('')
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [shouldHighlight, setShouldHighlight] = useState(!!highlightTurnId)
  const { data: turns = [], isLoading } = useScriptTurns(threadId)
  const { createMutation, updateMutation, deleteMutation, reorderMutation } = useScriptTurnMutation(threadId)

  useEffect(() => {
    if (highlightTurnId && !isLoading) {
      setTimeout(() => {
        const element = document.getElementById(`turn-${highlightTurnId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      setTimeout(() => {
        setShouldHighlight(false)
      }, 3000)
    }
  }, [highlightTurnId, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка сообщений...</div>
      </div>
    )
  }

  const handleAddTurn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('message', newMessage)
      await createMutation.mutateAsync(formData)
      formRef.current?.reset()
      setNewMessage('')
    } catch (err: any) {
      setError(err?.message || 'Ошибка при создании')
    }
  }

  const handleEdit = (turn: Turn) => {
    setEditingTurnId(turn.id)
    setEditContent(turn.message)
  }

  const handleSaveEdit = async (turnId: string) => {
    try {
      await updateMutation.mutateAsync({ turnId, message: editContent })
      setEditingTurnId(null)
      setEditContent('')
    } catch (err: any) {
      setError(err?.message || 'Ошибка при сохранении')
    }
  }

  const handleDelete = async (turnId: string) => {
    if (!confirm('Are you sure you want to delete this turn?')) return

    try {
      await deleteMutation.mutateAsync(turnId)
    } catch (err: any) {
      setError(err?.message || 'Ошибка при удалении')
    }
  }

  const handleReorder = async (turnId: string, direction: 'up' | 'down') => {
    try {
      await reorderMutation.mutateAsync({ turnId, direction })
    } catch (err: any) {
      setError(err?.message || 'Ошибка при переупорядочивании')
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query || query.length < 2) return text

    const normalizedQuery = query.replace(/ё/gi, 'е').replace(/^"|"$/g, '')
    const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 0)

    let result = text
    words.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedWord})`, 'gi')
      result = result.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5">$1</mark>')
    })

    return result
  }

  return (
    <div className={isAdmin ? 'grid lg:grid-cols-3 gap-6' : 'max-w-4xl mx-auto'}>
      <div className={isAdmin ? 'lg:col-span-2' : ''}>
        <Card>
          <CardHeader>
            <CardTitle>Скрипт</CardTitle>
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
                title="Нет новых сообщений"
                description={
                  isAdmin
                    ? 'Добавьте новое сообщение для начала диалога'
                    : 'В этой переписке пока нет сообщений'
                }
              />
            ) : (
              <div className="space-y-2">
                {turns.map((turn, index) => (
                  <div
                    key={turn.id}
                    id={`turn-${turn.id}`}
                    className={`relative group ${shouldHighlight && turn.id === highlightTurnId ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
                  >
                    {editingTurnId === turn.id ? (
                      <div className="border rounded-lg p-4 space-y-2">
                        <RichTextEditor
                          content={editContent}
                          onChange={setEditContent}
                          placeholder="Редактировать сообщение..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(turn.id)}
                            disabled={updateMutation.isPending}
                          >
                            Сохранить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTurnId(null)
                              setEditContent('')
                            }}
                            disabled={updateMutation.isPending}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {shouldHighlight && turn.id === highlightTurnId && searchQuery ? (
                          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className={`text-sm font-medium mb-2 ${turn.speaker === 'agent' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                              {turn.speaker === 'agent' ? 'Менеджер' : 'Клиент'}
                            </div>
                            <div
                              className="text-sm rich-content"
                              dangerouslySetInnerHTML={{ __html: highlightText(turn.message, searchQuery) }}
                            />
                          </div>
                        ) : (
                          <ChatBubble
                            speaker={turn.speaker}
                            content={turn.message}
                            showCopyButton={true}
                          />
                        )}
                        {isAdmin && (
                          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 rounded-lg shadow-md p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReorder(turn.id, 'up')}
                              disabled={reorderMutation.isPending || index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReorder(turn.id, 'down')}
                              disabled={reorderMutation.isPending || index === turns.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(turn)}
                              disabled={updateMutation.isPending}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(turn.id)}
                              disabled={deleteMutation.isPending}
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
              <CardTitle>Добавить сообщение</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                ref={formRef}
                onSubmit={handleAddTurn}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Роль</Label>
                  <Select name="speaker" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Менеджер</SelectItem>
                      <SelectItem value="client">Клиент</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Сообщение</Label>
                  <RichTextEditor
                    content={newMessage}
                    onChange={setNewMessage}
                    placeholder="Напишите сообщение..."
                    editable={!createMutation.isPending}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Добавить сообщение
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
