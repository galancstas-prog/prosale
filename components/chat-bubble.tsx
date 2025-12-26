'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  speaker: 'agent' | 'client'
  content: string
  showCopyButton?: boolean
}

export function ChatBubble({ speaker, content, showCopyButton = false }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false)

  const isAgent = speaker === 'agent'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex mb-4', isAgent ? 'justify-start' : 'justify-end')}>
      <div className={cn('max-w-[70%] group relative')}>
        <div
          className={cn(
            'rounded-lg px-4 py-3 shadow-sm',
            isAgent
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              : 'bg-blue-600 text-white'
          )}
        >
          <div className="text-xs font-semibold mb-1 opacity-70">
            {isAgent ? 'Manager' : 'client'}
          </div>
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        {isAgent && showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
