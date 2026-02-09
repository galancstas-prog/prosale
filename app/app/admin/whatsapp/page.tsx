'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMembership } from '@/lib/auth/use-membership'
import {
  Settings,
  Phone,
  Plus,
  Trash2,
  Edit,
  Tag,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QRCodeDisplay, ConnectionStatus, StatsCards } from '@/components/whatsapp'
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getQuickReplies,
  createQuickReply,
  getWhatsAppStats,
  initDefaultTags,
} from '@/lib/whatsapp/actions'
import type { WhatsAppSession, WhatsAppTag, WhatsAppQuickReply, WhatsAppStats } from '@/lib/whatsapp/types'

export default function WhatsAppAdminPage() {
  const router = useRouter()
  const { membership, loading: membershipLoading } = useMembership()

  // State
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [tags, setTags] = useState<WhatsAppTag[]>([])
  const [quickReplies, setQuickReplies] = useState<WhatsAppQuickReply[]>([])
  const [stats, setStats] = useState<WhatsAppStats | null>(null)

  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('sessions')

  // Dialogs
  const [showNewSession, setShowNewSession] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)
  const [showNewReply, setShowNewReply] = useState(false)

  // Form state
  const [newSessionName, setNewSessionName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')
  const [newReplyTitle, setNewReplyTitle] = useState('')
  const [newReplyContent, setNewReplyContent] = useState('')
  const [newReplyShortcut, setNewReplyShortcut] = useState('')

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [sessionsRes, tagsRes, repliesRes, statsRes] = await Promise.all([
        getSessions(),
        getTags(),
        getQuickReplies(),
        getWhatsAppStats(),
      ])

      if (sessionsRes.error) throw new Error(sessionsRes.error)

      setSessions(sessionsRes.data || [])
      setTags(tagsRes.data || [])
      setQuickReplies(repliesRes.data || [])
      setStats(statsRes.data)
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!membershipLoading && isAdmin) {
      loadData()
    }
  }, [membershipLoading, isAdmin, loadData])

  // Handle create session
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return

    try {
      const { error } = await createSession(newSessionName.trim())
      if (error) throw new Error(error)

      setNewSessionName('')
      setShowNewSession(false)
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Handle update session settings
  const handleUpdateSessionSettings = async (
    sessionId: string,
    updates: Partial<WhatsAppSession>
  ) => {
    try {
      await updateSession(sessionId, updates)
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Handle connect session - calls /api/whatsapp proxy (server-to-server to Bridge)
  const handleConnectSession = async (sessionId: string) => {
    try {
      setError(null)
      
      // Call через серверный прокси (обходит mixed-content блокировку браузера)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reconnect',
          sessionId
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось подключиться к WhatsApp Bridge')
      }
      
      // QR приходит асинхронно от Baileys — poll Bridge каждые 2 сек
      let attempts = 0
      const pollQR = async () => {
        attempts++
        if (attempts > 30) return // макс 60 сек
        
        try {
          const qrResponse = await fetch(`/api/whatsapp?action=qr&sessionId=${sessionId}`)
          const qrData = await qrResponse.json()
          
          if (qrData.status === 'qr_pending' && qrData.qr) {
            // QR получен — обновляем данные
            await loadData()
            return
          }
          
          if (qrData.status === 'connected') {
            await loadData()
            return
          }
          
          // Ещё нет QR — ждём и пробуем снова
          setTimeout(pollQR, 2000)
        } catch {
          setTimeout(pollQR, 2000)
        }
      }
      
      // Начинаем polling через 1 сек (дадим время Baileys подключиться)
      setTimeout(pollQR, 1000)
      
    } catch (e: any) {
      console.error('Connect error:', e)
      setError(`Ошибка подключения: ${e.message}. Убедитесь что WhatsApp Bridge запущен на сервере.`)
    }
  }

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Удалить эту сессию WhatsApp? Все чаты будут потеряны.')) return

    try {
      const { error } = await deleteSession(sessionId)
      if (error) throw new Error(error)
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Handle create tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const { error } = await createTag(newTagName.trim(), newTagColor)
      if (error) throw new Error(error)

      setNewTagName('')
      setNewTagColor('#6366f1')
      setShowNewTag(false)
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Handle delete tag
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Удалить этот тег?')) return

    try {
      const { error } = await deleteTag(tagId)
      if (error) throw new Error(error)
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Handle create quick reply
  const handleCreateQuickReply = async () => {
    if (!newReplyTitle.trim() || !newReplyContent.trim()) return

    try {
      const { error } = await createQuickReply(
        newReplyTitle.trim(),
        newReplyContent.trim(),
        newReplyShortcut.trim() || undefined
      )
      if (error) throw new Error(error)

      setNewReplyTitle('')
      setNewReplyContent('')
      setNewReplyShortcut('')
      setShowNewReply(false)
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Handle init default tags
  const handleInitDefaultTags = async () => {
    try {
      await initDefaultTags()
      loadData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Loading state
  if (membershipLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-500">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  // Access check
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Доступ к настройкам WhatsApp есть только у администраторов.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Настройки WhatsApp
          </h1>
          <p className="text-slate-500 mt-1">
            Управление подключениями, тегами и быстрыми ответами
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/app/whatsapp')}>
          <MessageSquare className="w-4 h-4 mr-2" />
          К чатам
        </Button>
      </div>

      {/* Stats */}
      {stats && <StatsCards stats={stats} />}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Подключения
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Теги
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Быстрые ответы
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Подключённые аккаунты WhatsApp для вашей команды
            </p>
            <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
              <DialogTrigger asChild>
                <Button className="quick-action-btn primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить WhatsApp
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новое подключение WhatsApp</DialogTitle>
                  <DialogDescription>
                    Добавьте название для нового подключения. После создания вы сможете отсканировать QR-код.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input
                      placeholder="Например: Отдел продаж"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewSession(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateSession}>Создать</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {sessions.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Нет подключений</h3>
                <p className="text-slate-500 mb-4">
                  Добавьте первое подключение WhatsApp для начала работы
                </p>
                <Button onClick={() => setShowNewSession(true)} className="quick-action-btn primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить WhatsApp
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="premium-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.session_name}</CardTitle>
                      <ConnectionStatus status={session.status} compact />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* QR Code or Status */}
                    <QRCodeDisplay
                      session={session}
                      onRefresh={() => handleConnectSession(session.id)}
                    />

                    {/* Settings */}
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Автораспределение</Label>
                          <p className="text-xs text-slate-500">
                            Новые чаты распределяются между менеджерами
                          </p>
                        </div>
                        <Switch
                          checked={session.auto_assign}
                          onCheckedChange={(checked) =>
                            handleUpdateSessionSettings(session.id, { auto_assign: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">AI подсказки</Label>
                          <p className="text-xs text-slate-500">
                            Генерировать подсказки на основе базы знаний
                          </p>
                        </div>
                        <Switch
                          checked={session.ai_suggestions_enabled}
                          onCheckedChange={(checked) =>
                            handleUpdateSessionSettings(session.id, { ai_suggestions_enabled: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Теги для категоризации чатов
            </p>
            <div className="flex gap-2">
              {tags.length === 0 && (
                <Button variant="outline" onClick={handleInitDefaultTags}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Создать базовые теги
                </Button>
              )}
              <Dialog open={showNewTag} onOpenChange={setShowNewTag}>
                <DialogTrigger asChild>
                  <Button className="quick-action-btn primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить тег
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый тег</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input
                        placeholder="Например: VIP клиент"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Цвет</Label>
                      <div className="flex gap-2">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                          <button
                            key={color}
                            className={cn(
                              'w-8 h-8 rounded-full transition-all',
                              newTagColor === color && 'ring-2 ring-offset-2 ring-slate-900'
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewTagColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTag(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleCreateTag}>Создать</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ borderColor: tag.color + '50', backgroundColor: tag.color + '10' }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span style={{ color: tag.color }} className="font-medium">
                  {tag.name}
                </span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Quick Replies Tab */}
        <TabsContent value="replies" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Шаблоны ответов для быстрой работы
            </p>
            <Dialog open={showNewReply} onOpenChange={setShowNewReply}>
              <DialogTrigger asChild>
                <Button className="quick-action-btn primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить шаблон
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новый быстрый ответ</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input
                      placeholder="Например: Приветствие"
                      value={newReplyTitle}
                      onChange={(e) => setNewReplyTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Текст ответа</Label>
                    <Textarea
                      placeholder="Добрый день! Чем могу помочь?"
                      value={newReplyContent}
                      onChange={(e) => setNewReplyContent(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Шорткат (опционально)</Label>
                    <Input
                      placeholder="/hello"
                      value={newReplyShortcut}
                      onChange={(e) => setNewReplyShortcut(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Введите в чате для быстрой вставки
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewReply(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateQuickReply}>Создать</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {quickReplies.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="py-8 text-center">
                <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Нет быстрых ответов</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {quickReplies.map((reply) => (
                <Card key={reply.id} className="premium-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{reply.title}</CardTitle>
                      {reply.shortcut && (
                        <code className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {reply.shortcut}
                        </code>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {reply.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Использовано: {reply.usage_count} раз
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
