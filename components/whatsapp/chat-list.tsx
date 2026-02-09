'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { MessageCircle, Check, CheckCheck, Clock } from 'lucide-react'
import type { WhatsAppChat, WhatsAppChatPriority } from '@/lib/whatsapp/types'

interface ChatListItemProps {
  chat: WhatsAppChat
  isActive?: boolean
  onClick?: () => void
}

export function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  const initials = useMemo(() => {
    if (chat.contact_name) {
      return chat.contact_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    }
    return chat.contact_phone.slice(-2)
  }, [chat.contact_name, chat.contact_phone])

  const timeAgo = useMemo(() => {
    if (!chat.last_message_at) return null
    return formatDistanceToNow(new Date(chat.last_message_at), {
      addSuffix: false,
      locale: ru,
    })
  }, [chat.last_message_at])

  const priorityClasses: Record<WhatsAppChatPriority, string> = {
    low: 'wa-priority-low',
    normal: 'wa-priority-normal',
    high: 'wa-priority-high',
    urgent: 'wa-priority-urgent',
  }

  return (
    <div
      className={cn(
        'wa-chat-item wa-animate-fade-in',
        isActive && 'active',
        chat.unread_count > 0 && 'unread'
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          {chat.contact_avatar_url ? (
            <img
              src={chat.contact_avatar_url}
              alt={chat.contact_name || 'Avatar'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {initials}
            </span>
          )}
        </div>
        {chat.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">
              {chat.unread_count > 9 ? '9+' : chat.unread_count}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className={cn(
            'font-medium truncate',
            chat.unread_count > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
          )}>
            {chat.contact_name || chat.contact_phone}
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          {chat.last_message_direction === 'out' && (
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          )}
          <p className={cn(
            'text-sm truncate',
            chat.unread_count > 0 
              ? 'text-slate-700 dark:text-slate-200 font-medium' 
              : 'text-slate-500 dark:text-slate-400'
          )}>
            {chat.last_message_text || 'Нет сообщений'}
          </p>
        </div>

        {/* Tags & Priority */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {chat.priority !== 'normal' && (
            <span className={cn('wa-priority', priorityClasses[chat.priority])}>
              {chat.priority === 'urgent' && '🔴'}
              {chat.priority === 'high' && '🟡'}
              {chat.priority === 'low' && '⚪'}
              {' '}
              {chat.priority === 'urgent' ? 'Срочно' : 
               chat.priority === 'high' ? 'Важно' : 'Низкий'}
            </span>
          )}
          {chat.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="wa-tag">
              {tag}
            </span>
          ))}
          {chat.tags.length > 2 && (
            <span className="text-xs text-slate-400">+{chat.tags.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChatListProps {
  chats: WhatsAppChat[]
  activeChatId?: string
  onChatSelect?: (chat: WhatsAppChat) => void
  emptyMessage?: string
}

export function ChatList({ chats, activeChatId, onChatSelect, emptyMessage }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {emptyMessage || 'Нет чатов'}
        </p>
      </div>
    )
  }

  return (
    <div className="wa-chat-list wa-scrollbar overflow-y-auto">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onClick={() => onChatSelect?.(chat)}
        />
      ))}
    </div>
  )
}
