'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  ArrowLeft,
  Save,
  X,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useScriptTurns, useScriptTurnMutation } from '@/lib/hooks/use-script-turns'
import { useScriptThreadMutation } from '@/lib/hooks/use-script-threads'
import { getThreadById, updateThread } from '@/lib/actions/script-threads'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface Turn {
  id: string
  speaker: 'agent' | 'client'
  message: string
  order_index: number
}

interface Category {
  id: string
  name: string
}

interface ScriptThreadInlinePanelProps {
  threadId: string
  isAdmin: boolean
  onBack: () => void
  categories?: Category[]
  onThreadMoved?: () => void
}

export function ScriptThreadInlinePanel({ threadId, isAdmin, onBack, categories = [], onThreadMoved }: ScriptThreadInlinePanelProps) {
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement | null>(null)
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<string>('')
  const [error, setError] = useState('')
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  // Получаем данные thread
  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ['script-thread', threadId],
    queryFn: async () => {
      const result = await getThreadById(threadId)
      return result.data
    },
  })

  const { data: turns = [], isLoading: turnsLoading } = useScriptTurns(threadId)
  const { createMutation, updateMutation, deleteMutation, reorderMutation } = useScriptTurnMutation(threadId)

  const isLoading = threadLoading || turnsLoading

  const handleStartEditTitle = () => {
    if (thread) {
      setEditTitle(thread.title || '')
      setEditDescription(thread.description || '')
      setEditCategoryId(thread.category_id || '')
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) {
      setError('Название обязательно')
      return
    }

    setIsSavingTitle(true)
    setError('')

    const categoryChanged = editCategoryId && editCategoryId !== thread?.category_id

    try {
      const formData = new FormData()
      formData.set('title', editTitle.trim())
      formData.set('description', editDescription.trim())
      if (editCategoryId) {
        formData.set('category_id', editCategoryId)
      }
      
      const result = await updateThread(threadId, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }

      queryClient.invalidateQueries({ queryKey: ['script-thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['script-threads'] })
      setIsEditingTitle(false)

      // Если категория изменилась, уведомляем родителя
      if (categoryChanged && onThreadMoved) {
        onThreadMoved()
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка при сохранении')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false)
    setEditTitle('')
    setEditDescription('')
    setEditCategoryId('')
    setError('')
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (!thread) {
    return (
      <Card className="h-full p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <p className="text-muted-foreground">Скрипт не найден</p>
      </Card>
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
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
            
            {isEditingTitle ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Название скрипта"
                    disabled={isSavingTitle}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Описание скрипта"
                    disabled={isSavingTitle}
                    rows={2}
                  />
                </div>
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select
                      value={editCategoryId}
                      onValueChange={setEditCategoryId}
                      disabled={isSavingTitle}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveTitle} disabled={isSavingTitle}>
                    {isSavingTitle && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEditTitle} disabled={isSavingTitle}>
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <CardTitle className="text-xl break-words">{thread.title}</CardTitle>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartEditTitle}
                      className="shrink-0"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                  )}
                </div>
                {thread.description && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{thread.description}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className={isAdmin ? 'grid lg:grid-cols-3 gap-6' : ''}>
          {/* Скрипт - диалог */}
          <div className={isAdmin ? 'lg:col-span-2' : ''}>
            {turns.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Диалог пуст"
                description={
                  isAdmin
                    ? 'Добавьте первое сообщение, чтобы начать скрипт'
                    : 'В этом скрипте пока нет сообщений'
                }
              />
            ) : (
              <div className="space-y-2">
                {turns.map((turn: Turn, index: number) => (
                  <div
                    key={turn.id}
                    id={`turn-${turn.id}`}
                    className="relative group"
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
                        <ChatBubble
                          speaker={turn.speaker}
                          content={turn.message}
                          showCopyButton={true}
                        />
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
          </div>

          {/* Форма добавления сообщения */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Добавить сообщение</CardTitle>
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
      </CardContent>
    </Card>
  )
}
