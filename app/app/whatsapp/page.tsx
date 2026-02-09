'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMembership } from '@/lib/auth/use-membership'
import { useTenantPlan } from '@/lib/hooks/use-tenant-plan'
import {
  Search,
  Filter,
  Settings,
  MessageCircle,
  Phone,
  Loader2,
  AlertCircle,
  PanelRightOpen,
  PanelRightClose,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChatList,
  MessageList,
  MessageInput,
  ChatSidebar,
  StatsCards,
  MiniStats,
  ConnectionStatus,
} from '@/components/whatsapp'
import {
  getChats,
  getMessages,
  getSessions,
  getWhatsAppStats,
  getTeamMembersForAssignment,
  getTags,
  getQuickReplies,
  getChatNotes,
  updateChat,
  assignChat,
  createChatNote,
  markChatAsRead,
} from '@/lib/whatsapp/actions'
import { generateAISuggestion, summarizeChat } from '@/lib/whatsapp/ai-helper'
import type {
  WhatsAppChat,
  WhatsAppMessage,
  WhatsAppSession,
  WhatsAppStats,
  WhatsAppTag,
  WhatsAppQuickReply,
  WhatsAppChatNote,
  TeamMemberForAssignment,
  ChatFilters,
} from '@/lib/whatsapp/types'

export default function WhatsAppPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { membership, loading: membershipLoading } = useMembership()
  const { plan } = useTenantPlan()

  // State
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [chats, setChats] = useState<WhatsAppChat[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [stats, setStats] = useState<WhatsAppStats | null>(null)
  const [tags, setTags] = useState<WhatsAppTag[]>([])
  const [quickReplies, setQuickReplies] = useState<WhatsAppQuickReply[]>([])
  const [chatNotes, setChatNotes] = useState<WhatsAppChatNote[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMemberForAssignment[]>([])

  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assignedFilter, setAssignedFilter] = useState<string>('all')
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [chatSummary, setChatSummary] = useState<{ summary: string; keyPoints: string[] } | null>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null)

  // Permissions
  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'
  const isManager = membership?.role === 'MANAGER'
  const hasAccess = plan === 'PRO' || plan === 'TEAM'

  // Selected chat
  const selectedChat = useMemo(() => {
    return chats.find((c) => c.id === selectedChatId) || null
  }, [chats, selectedChatId])

  // Active session
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.status === 'connected')
  }, [sessions])

  // Filtered chats
  const filteredChats = useMemo(() => {
    let filtered = [...chats]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.contact_name?.toLowerCase().includes(query) ||
          c.contact_phone.includes(query) ||
          c.last_message_text?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    if (assignedFilter === 'unassigned') {
      filtered = filtered.filter((c) => !c.assigned_to)
    } else if (assignedFilter === 'mine') {
      filtered = filtered.filter((c) => c.assigned_to === membership?.user.id)
    } else if (assignedFilter !== 'all') {
      filtered = filtered.filter((c) => c.assigned_to === assignedFilter)
    }

    return filtered
  }, [chats, searchQuery, statusFilter, assignedFilter, membership])

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [sessionsRes, chatsRes, statsRes, tagsRes, repliesRes, teamRes] = await Promise.all([
        getSessions(),
        getChats(),
        getWhatsAppStats(),
        getTags(),
        getQuickReplies(),
        isAdmin ? getTeamMembersForAssignment() : Promise.resolve({ data: [] }),
      ])

      if (sessionsRes.error) throw new Error(sessionsRes.error)
      if (chatsRes.error) throw new Error(chatsRes.error)

      setSessions(sessionsRes.data || [])
      setChats(chatsRes.data || [])
      setStats(statsRes.data)
      setTags(tagsRes.data || [])
      setQuickReplies(repliesRes.data || [])
      setTeamMembers(teamRes.data || [])
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!membershipLoading && membership) {
      loadData()
    }
  }, [membershipLoading, membership, loadData])

  // Auto-refresh chats every 5 seconds (polling for new messages)
  useEffect(() => {
    if (!membership || membershipLoading) return

    const refreshChats = async () => {
      try {
        const [chatsRes, statsRes] = await Promise.all([
          getChats(),
          getWhatsAppStats(),
        ])
        if (!chatsRes.error && chatsRes.data) {
          setChats(chatsRes.data)
        }
        if (statsRes.data) {
          setStats(statsRes.data)
        }
      } catch {
        // silent refresh failure
      }
    }

    const interval = setInterval(refreshChats, 5000)
    return () => clearInterval(interval)
  }, [membership, membershipLoading])

  // Auto-refresh messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return

    const refreshMessages = async () => {
      try {
        const { data } = await getMessages(selectedChatId)
        if (data) {
          setMessages(data)
        }
      } catch {
        // silent
      }
    }

    const interval = setInterval(refreshMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedChatId])

  // Load messages when chat selected
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      setMessagesLoading(true)
      const { data, error } = await getMessages(chatId)
      if (error) throw new Error(error)
      setMessages(data || [])

      // Mark as read
      await markChatAsRead(chatId)

      // Load chat notes
      const notesRes = await getChatNotes(chatId)
      setChatNotes(notesRes.data || [])

      // Generate AI suggestion for last incoming message
      const lastIncoming = data?.filter((m) => m.direction === 'in').pop()
      if (lastIncoming && !lastIncoming.ai_suggestion) {
        const contextMessages = data?.slice(-5).map((m) => 
          `${m.direction === 'in' ? 'Клиент' : 'Менеджер'}: ${m.content_text}`
        )
        const suggestionRes = await generateAISuggestion(
          lastIncoming.content_text || '',
          contextMessages
        )
        if (suggestionRes.suggestion) {
          setAiSuggestion(suggestionRes.suggestion)
        }
      }

      // Generate chat summary for sidebar
      if (data && data.length > 3) {
        const summaryRes = await summarizeChat(
          data.slice(-10).map((m) => ({
            direction: m.direction,
            content: m.content_text || '',
          }))
        )
        if (summaryRes.summary) {
          setChatSummary(summaryRes)
        }
      }
    } catch (e: any) {
      console.error('Load messages error:', e)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // Handle chat selection
  const handleChatSelect = useCallback((chat: WhatsAppChat) => {
    setSelectedChatId(chat.id)
    setAiSuggestion(null)
    setChatSummary(null)
    loadMessages(chat.id)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set('chat', chat.id)
    router.push(`/app/whatsapp?${params.toString()}`, { scroll: false })
  }, [loadMessages, router, searchParams])

  // Handle send message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!selectedChatId || !selectedChat || !activeSession) return

    try {
      // Send via API route (proxy to Bridge)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          sessionId: activeSession.id,
          chatId: selectedChatId,
          phone: selectedChat.contact_phone,
          message: text,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Не удалось отправить сообщение')
      }

      // Reload messages to show sent message
      await loadMessages(selectedChatId)
      setAiSuggestion(null)
    } catch (e: any) {
      setError(`Ошибка отправки: ${e.message}`)
    }
  }, [selectedChatId, selectedChat, activeSession, loadMessages])

  // Handle chat updates
  const handleUpdateChat = useCallback(async (updates: Partial<WhatsAppChat>) => {
    if (!selectedChatId) return

    if (updates.status) {
      await updateChat(selectedChatId, { status: updates.status })
    }
    if (updates.priority) {
      await updateChat(selectedChatId, { priority: updates.priority })
    }
    if (updates.tags) {
      await updateChat(selectedChatId, { tags: updates.tags })
    }

    // Reload chats
    const { data } = await getChats()
    setChats(data || [])
  }, [selectedChatId])

  // Handle assignment
  const handleAssign = useCallback(async (userId: string | null) => {
    if (!selectedChatId) return
    await assignChat(selectedChatId, userId)
    const { data } = await getChats()
    setChats(data || [])
  }, [selectedChatId])

  // Handle add note
  const handleAddNote = useCallback(async (content: string) => {
    if (!selectedChatId) return
    await createChatNote(selectedChatId, content)
    const { data } = await getChatNotes(selectedChatId)
    setChatNotes(data || [])
  }, [selectedChatId])

  // Loading state
  if (membershipLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-500">Загрузка WhatsApp...</p>
        </div>
      </div>
    )
  }

  // Access check
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp интеграция доступна на тарифах PRO и TEAM.
            <Button
              variant="link"
              className="p-0 h-auto ml-1"
              onClick={() => router.push('/app/billing')}
            >
              Перейти к тарифам
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No sessions
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
          <Phone className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          WhatsApp не подключён
        </h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Для начала работы администратору необходимо подключить WhatsApp в настройках.
        </p>
        {isAdmin && (
          <Button
            className="quick-action-btn primary"
            onClick={() => router.push('/app/admin/whatsapp')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Перейти к настройкам
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="dashboard-module-icon whatsapp w-10 h-10">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  WhatsApp
                </h1>
                {activeSession && (
                  <ConnectionStatus
                    status={activeSession.status}
                    phoneNumber={activeSession.phone_number}
                    compact
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats && <MiniStats openChats={stats.open_chats} unreadCount={0} />}
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/app/admin/whatsapp')}
              >
                <Settings className="w-4 h-4 mr-1" />
                Настройки
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && isAdmin && (
          <StatsCards stats={stats} className="mb-4" />
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 wa-input"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="open">Открытые</SelectItem>
              <SelectItem value="pending">Ожидание</SelectItem>
              <SelectItem value="resolved">Решённые</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Назначение" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="mine">Мои чаты</SelectItem>
              <SelectItem value="unassigned">Без менеджера</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat list */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <ChatList
            chats={filteredChats}
            activeChatId={selectedChatId || undefined}
            onChatSelect={handleChatSelect}
            emptyMessage={searchQuery ? 'Чаты не найдены' : 'Нет чатов'}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    {selectedChat.contact_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {selectedChat.contact_name || selectedChat.contact_phone}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedChat.contact_phone}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? (
                    <PanelRightClose className="w-5 h-5" />
                  ) : (
                    <PanelRightOpen className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <MessageList
                    messages={messages}
                    showAISuggestions
                    onReply={(msg) => setReplyTo({ id: msg.id, text: msg.content_text || '' })}
                    onCopy={(msg) => navigator.clipboard.writeText(msg.content_text || '')}
                    onUseSuggestion={(suggestion) => setAiSuggestion(suggestion)}
                  />
                )}
              </div>

              {/* Input */}
              <MessageInput
                onSend={handleSendMessage}
                quickReplies={quickReplies}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                aiSuggestion={aiSuggestion}
                onUseSuggestion={() => setAiSuggestion(null)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Выберите чат
                </h3>
                <p className="text-sm text-slate-500">
                  Выберите чат слева для просмотра сообщений
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && selectedChat && (
          <ChatSidebar
            chat={selectedChat}
            notes={chatNotes}
            availableTags={tags}
            teamMembers={teamMembers}
            chatSummary={chatSummary}
            onClose={() => setShowSidebar(false)}
            onUpdateStatus={(status) => handleUpdateChat({ status })}
            onUpdatePriority={(priority) => handleUpdateChat({ priority })}
            onUpdateTags={(tags) => handleUpdateChat({ tags })}
            onAssign={handleAssign}
            onAddNote={handleAddNote}
          />
        )}
      </div>

      {/* Error toast */}
      {error && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
