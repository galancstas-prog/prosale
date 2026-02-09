'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { 
  User, 
  Tag, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  FileText,
  Bookmark,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { 
  WhatsAppChat, 
  WhatsAppTag, 
  WhatsAppChatNote,
  WhatsAppChatPriority,
  WhatsAppChatStatus,
  TeamMemberForAssignment 
} from '@/lib/whatsapp/types'

interface ChatSidebarProps {
  chat: WhatsAppChat
  notes?: WhatsAppChatNote[]
  availableTags?: WhatsAppTag[]
  teamMembers?: TeamMemberForAssignment[]
  chatSummary?: { summary: string; keyPoints: string[] } | null
  onClose?: () => void
  onUpdateStatus?: (status: WhatsAppChatStatus) => void
  onUpdatePriority?: (priority: WhatsAppChatPriority) => void
  onUpdateTags?: (tags: string[]) => void
  onAssign?: (userId: string | null) => void
  onAddNote?: (content: string) => void
}

export function ChatSidebar({
  chat,
  notes = [],
  availableTags = [],
  teamMembers = [],
  chatSummary,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateTags,
  onAssign,
  onAddNote,
}: ChatSidebarProps) {
  const createdDate = useMemo(() => {
    return format(new Date(chat.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })
  }, [chat.created_at])

  const assignedMember = useMemo(() => {
    return teamMembers.find((m) => m.id === chat.assigned_to)
  }, [teamMembers, chat.assigned_to])

  const statusOptions = [
    { value: 'open', label: 'Открыт', color: 'text-green-600' },
    { value: 'pending', label: 'Ожидание', color: 'text-yellow-600' },
    { value: 'resolved', label: 'Решён', color: 'text-blue-600' },
    { value: 'archived', label: 'В архиве', color: 'text-slate-400' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Низкий', emoji: '⚪' },
    { value: 'normal', label: 'Обычный', emoji: '🔵' },
    { value: 'high', label: 'Высокий', emoji: '🟡' },
    { value: 'urgent', label: 'Срочный', emoji: '🔴' },
  ]

  const handleTagToggle = (tagName: string) => {
    const newTags = chat.tags.includes(tagName)
      ? chat.tags.filter((t) => t !== tagName)
      : [...chat.tags, tagName]
    onUpdateTags?.(newTags)
  }

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Детали чата
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto wa-scrollbar p-4 space-y-6">
        {/* Contact info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
              {chat.contact_avatar_url ? (
                <img
                  src={chat.contact_avatar_url}
                  alt={chat.contact_name || 'Avatar'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                {chat.contact_name || 'Без имени'}
              </h4>
              <p className="text-sm text-slate-500">{chat.contact_phone}</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Создан: {createdDate}
          </div>
        </div>

        {/* AI Summary */}
        {chatSummary && (
          <div className="wa-ai-panel">
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">AI Сводка</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
              {chatSummary.summary}
            </p>
            {chatSummary.keyPoints.length > 0 && (
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {chatSummary.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Статус
          </label>
          <Select
            value={chat.status}
            onValueChange={(value) => onUpdateStatus?.(value as WhatsAppChatStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Приоритет
          </label>
          <Select
            value={chat.priority}
            onValueChange={(value) => onUpdatePriority?.(value as WhatsAppChatPriority)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Назначен
          </label>
          <Select
            value={chat.assigned_to || 'unassigned'}
            onValueChange={(value) => onAssign?.(value === 'unassigned' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Не назначен" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <span className="text-slate-500">Не назначен</span>
              </SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <span>
                      {member.first_name || member.email.split('@')[0]}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {member.active_chats_count} чатов
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Теги
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = chat.tags.includes(tag.name)
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.name)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    isSelected
                      ? 'ring-2 ring-offset-1'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor: isSelected ? tag.color + '20' : 'transparent',
                    color: tag.color,
                    borderColor: tag.color,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    ...(isSelected && { ringColor: tag.color }),
                  }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Заметки ({notes.length})
          </label>
          
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {note.content}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(note.created_at), 'd MMM, HH:mm', { locale: ru })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Нет заметок</p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              const content = prompt('Введите заметку:')
              if (content?.trim()) {
                onAddNote?.(content.trim())
              }
            }}
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
            Добавить заметку
          </Button>
        </div>
      </div>
    </div>
  )
}
