'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Check, CheckCheck, Clock, AlertCircle, Reply, Copy, Sparkles } from 'lucide-react'
import type { WhatsAppMessage, WhatsAppMessageStatus } from '@/lib/whatsapp/types'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MessageBubbleProps {
  message: WhatsAppMessage
  onReply?: () => void
  onCopy?: () => void
  showAISuggestion?: boolean
  onUseSuggestion?: (suggestion: string) => void
}

export function MessageBubble({ 
  message, 
  onReply, 
  onCopy, 
  showAISuggestion,
  onUseSuggestion 
}: MessageBubbleProps) {
  const isOutgoing = message.direction === 'out'

  const formattedTime = useMemo(() => {
    return format(new Date(message.created_at), 'HH:mm', { locale: ru })
  }, [message.created_at])

  const statusIcon = useMemo(() => {
    if (!isOutgoing) return null

    const icons: Record<WhatsAppMessageStatus, React.ReactNode> = {
      pending: <Clock className="w-3 h-3 text-white/60" />,
      sent: <Check className="w-3 h-3 text-white/60" />,
      delivered: <CheckCheck className="w-3 h-3 text-white/60" />,
      read: <CheckCheck className="w-3 h-3 text-sky-300" />,
      failed: <AlertCircle className="w-3 h-3 text-red-300" />,
    }

    return icons[message.status] || null
  }, [isOutgoing, message.status])

  return (
    <div className={cn(
      'flex flex-col gap-1 max-w-[75%] wa-animate-fade-in',
      isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
    )}>
      {/* Quoted message */}
      {message.quoted_text && (
        <div className={cn(
          'text-xs px-3 py-1.5 rounded-lg border-l-2',
          isOutgoing 
            ? 'bg-emerald-400/20 border-emerald-300 text-white/80'
            : 'bg-slate-100 dark:bg-slate-700 border-slate-400 text-slate-600 dark:text-slate-300'
        )}>
          {message.quoted_text.substring(0, 100)}
          {message.quoted_text.length > 100 && '...'}
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'wa-message group relative',
          isOutgoing ? 'wa-message-out' : 'wa-message-in'
        )}
      >
        {/* Content */}
        {message.content_type === 'text' && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content_text}
          </p>
        )}

        {message.content_type === 'image' && (
          <div className="space-y-2">
            <img
              src={message.content_media_url || ''}
              alt="Image"
              className="rounded-lg max-w-full"
            />
            {message.content_caption && (
              <p className="text-sm">{message.content_caption}</p>
            )}
          </div>
        )}

        {message.content_type === 'document' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10">
            <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.content_media_filename || 'Документ'}
              </p>
              <p className="text-xs opacity-70">
                {message.content_media_mime || 'file'}
              </p>
            </div>
          </div>
        )}

        {message.content_type === 'audio' && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              🎵
            </div>
            <div className="flex-1 h-1 bg-white/30 rounded-full">
              <div className="w-1/3 h-full bg-white rounded-full" />
            </div>
          </div>
        )}

        {/* Time & Status */}
        <div className={cn(
          'flex items-center gap-1 mt-1',
          isOutgoing ? 'justify-end' : 'justify-start'
        )}>
          <span className={cn(
            'text-[10px]',
            isOutgoing ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
          )}>
            {formattedTime}
          </span>
          {statusIcon}
        </div>

        {/* Hover actions */}
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center gap-1',
          isOutgoing ? '-left-20' : '-right-20'
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 shadow-sm"
                  onClick={onReply}
                >
                  <Reply className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ответить</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 shadow-sm"
                  onClick={onCopy}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Копировать</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* AI Suggestion (only for incoming messages) */}
      {!isOutgoing && showAISuggestion && message.ai_suggestion && (
        <div className="wa-ai-panel mt-2 wa-animate-slide-in">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">AI подсказка</span>
          </div>
          <div className="wa-ai-suggestion">
            <p className="text-slate-700 dark:text-slate-200">
              {message.ai_suggestion}
            </p>
            {message.ai_suggestion_sources && message.ai_suggestion_sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-violet-200 dark:border-violet-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Источники:
                </p>
                <div className="flex flex-wrap gap-1">
                  {message.ai_suggestion_sources.map((source, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                    >
                      {source.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            size="sm"
            className="mt-3 w-full quick-action-btn primary"
            onClick={() => onUseSuggestion?.(message.ai_suggestion!)}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Использовать ответ
          </Button>
        </div>
      )}
    </div>
  )
}

interface MessageListProps {
  messages: WhatsAppMessage[]
  onReply?: (message: WhatsAppMessage) => void
  onCopy?: (message: WhatsAppMessage) => void
  onUseSuggestion?: (suggestion: string) => void
  showAISuggestions?: boolean
}

export function MessageList({ 
  messages, 
  onReply, 
  onCopy, 
  onUseSuggestion,
  showAISuggestions = true 
}: MessageListProps) {
  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: WhatsAppMessage[] }[] = []
    let currentDate = ''

    messages.forEach((message) => {
      const messageDate = format(new Date(message.created_at), 'yyyy-MM-dd')
      
      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({
          date: messageDate,
          messages: [message],
        })
      } else {
        groups[groups.length - 1].messages.push(message)
      }
    })

    return groups
  }, [messages])

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === format(today, 'yyyy-MM-dd')) {
      return 'Сегодня'
    }
    if (dateStr === format(yesterday, 'yyyy-MM-dd')) {
      return 'Вчера'
    }
    return format(date, 'd MMMM yyyy', { locale: ru })
  }

  return (
    <div className="flex flex-col gap-4 p-4 wa-scrollbar">
      {groupedMessages.map((group) => (
        <div key={group.date} className="space-y-3">
          {/* Date header */}
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {formatDateHeader(group.date)}
            </span>
          </div>

          {/* Messages */}
          {group.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showAISuggestion={showAISuggestions && message.direction === 'in'}
              onReply={() => onReply?.(message)}
              onCopy={() => onCopy?.(message)}
              onUseSuggestion={onUseSuggestion}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
