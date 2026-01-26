'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { Copy, Trash2, MessageCircle, Loader2, Check, ChevronDown, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFaqItemMutation } from '@/lib/hooks/use-faq-items'
import { cn } from '@/lib/utils'

interface FaqItem {
  id: string
  question: string
  answer: string
  order_index: number
  created_at: string
}

interface FaqListProps {
  items: FaqItem[]
  isAdmin: boolean
  highlightId?: string | null
  searchQuery?: string
  openItemId?: string | null
}

export function FaqList({ items, isAdmin, highlightId, searchQuery, openItemId }: FaqListProps) {
  const { toast } = useToast()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { deleteMutation } = useFaqItemMutation()

  useEffect(() => {
    if (openItemId) {
      setOpenItems(prev => new Set(prev).add(openItemId))
    }
  }, [openItemId])

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleCopy = async (itemId: string, answer: string) => {
    try {
      await navigator.clipboard.writeText(answer)
      setCopiedId(itemId)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (err) {
      toast({
        title: 'Не удалось скопировать',
        description: 'Не удалось скопировать в буфер обмена',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот пункт в разделе часто задаваемых вопросов??')) {
      return
    }

    try {
      await deleteMutation.mutateAsync(itemId)
      toast({
        title: 'Удалено',
        description: 'Раздел часто задаваемых вопросов удален.',
      })
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Ошибка при удалении',
        variant: 'destructive',
      })
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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 mb-6">
          <MessageCircle className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Пока нет FAQ
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-md">
          {isAdmin
            ? "Добавьте первый вопрос, чтобы помочь менеджерам быстро находить ответы"
            : "FAQ пока не добавлены"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openItems.has(item.id)
        const isHighlighted = highlightId === item.id

        return (
          <Card
            key={item.id}
            id={`faq-item-${item.id}`}
            className={cn(
              'rounded-xl border transition-all duration-200',
              isHighlighted
                ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-800 shadow-sm'
                : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
            )}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    'flex-1 text-left group cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-lg'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-0.5 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}>
                      <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                    </div>
                    <div className="flex-1">
                      {searchQuery && isHighlighted ? (
                        <h3
                          className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                          dangerouslySetInnerHTML={{ __html: highlightText(item.question, searchQuery) }}
                        />
                      ) : (
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                          {item.question}
                        </h3>
                      )}
                    </div>
                  </div>
                </button>

                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMutation.isPending}
                    className="shrink-0 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    )}
                  </Button>
                )}
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {searchQuery && isHighlighted ? (
                        <p
                          className="flex-1 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: highlightText(item.answer, searchQuery) }}
                        />
                      ) : (
                        <p className="flex-1 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {item.answer}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(item.id, item.answer)}
                        className="shrink-0 h-8 gap-2 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
