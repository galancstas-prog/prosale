'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  X, 
  Image, 
  FileText,
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WhatsAppQuickReply } from '@/lib/whatsapp/types'

interface MessageInputProps {
  onSend: (text: string) => Promise<void>
  onAttach?: (type: 'image' | 'document') => void
  quickReplies?: WhatsAppQuickReply[]
  replyTo?: { text: string } | null
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
  aiSuggestion?: string | null
  onUseSuggestion?: () => void
}

export function MessageInput({
  onSend,
  onAttach,
  quickReplies = [],
  replyTo,
  onCancelReply,
  disabled,
  placeholder = 'Введите сообщение...',
  aiSuggestion,
  onUseSuggestion,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [text])

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending || disabled) return

    setSending(true)
    try {
      await onSend(text.trim())
      setText('')
      onCancelReply?.()
    } finally {
      setSending(false)
    }
  }, [text, sending, disabled, onSend, onCancelReply])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleQuickReplySelect = (reply: WhatsAppQuickReply) => {
    setText(reply.content)
    setShowQuickReplies(false)
    textareaRef.current?.focus()
  }

  const handleUseSuggestion = () => {
    if (aiSuggestion) {
      setText(aiSuggestion)
      onUseSuggestion?.()
      textareaRef.current?.focus()
    }
  }

  // Detect shortcut commands
  useEffect(() => {
    if (text.startsWith('/') && quickReplies.length > 0) {
      const command = text.slice(1).toLowerCase()
      const match = quickReplies.find(
        (r) => r.shortcut?.toLowerCase() === command
      )
      if (match) {
        setText(match.content)
      }
    }
  }, [text, quickReplies])

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 wa-animate-slide-in">
          <div className="w-1 h-8 rounded-full bg-emerald-500" />
          <p className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
            {replyTo.text}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelReply}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* AI Suggestion preview */}
      {aiSuggestion && !text && (
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/50 dark:border-violet-800/30 wa-animate-fade-in">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
                AI предлагает ответ:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                {aiSuggestion}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50"
              onClick={handleUseSuggestion}
            >
              Использовать
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              disabled={disabled}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => onAttach?.('image')}>
              <Image className="w-4 h-4 mr-2" />
              Изображение
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAttach?.('document')}>
              <FileText className="w-4 h-4 mr-2" />
              Документ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className={cn(
              'wa-input resize-none pr-20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />

          {/* Quick replies button */}
          {quickReplies.length > 0 && (
            <DropdownMenu open={showQuickReplies} onOpenChange={setShowQuickReplies}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 bottom-1.5 h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"
                  disabled={disabled}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
                {quickReplies.map((reply) => (
                  <DropdownMenuItem
                    key={reply.id}
                    onClick={() => handleQuickReplySelect(reply)}
                    className="flex-col items-start"
                  >
                    <span className="font-medium">{reply.title}</span>
                    <span className="text-xs text-slate-500 truncate w-full">
                      {reply.content.substring(0, 50)}...
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Emoji button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"
            disabled={disabled}
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className={cn(
            'h-10 w-10 rounded-xl transition-all duration-200',
            text.trim()
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          )}
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
