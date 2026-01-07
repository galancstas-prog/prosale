'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { Copy, Trash2, MessageCircle, Loader2, Check } from 'lucide-react'
import { deleteFaqItem } from '@/lib/actions/faq-items'
import { useToast } from '@/hooks/use-toast'
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
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (openItemId) {
      setAccordionValue(openItemId)
    }
  }, [openItemId])

  const handleCopy = async (itemId: string, answer: string) => {
    try {
      await navigator.clipboard.writeText(answer)
      setCopiedId(itemId)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ item?')) {
      return
    }

    setDeleting(itemId)
    await deleteFaqItem(itemId)
    setDeleting(null)
    router.refresh()

    toast({
      title: 'Deleted',
      description: 'FAQ item has been removed',
    })
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
      <Card className="p-12">
        <EmptyState
          icon={MessageCircle}
          title="No FAQ items yet"
          description={
            isAdmin
              ? "Create your first FAQ item to help managers find answers quickly"
              : "No FAQ items available at this time"
          }
        />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <Accordion type="single" collapsible className="w-full" value={accordionValue} onValueChange={setAccordionValue}>
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            id={`faq-item-${item.id}`}
            className={cn(
              'transition-colors',
              highlightId === item.id && 'bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2'
            )}
          >
            <div className="flex items-center gap-2">
              <AccordionTrigger className="flex-1 text-left hover:no-underline">
                {searchQuery && highlightId === item.id ? (
                  <span
                    className="font-medium"
                    dangerouslySetInnerHTML={{ __html: highlightText(item.question, searchQuery) }}
                  />
                ) : (
                  <span className="font-medium">{item.question}</span>
                )}
              </AccordionTrigger>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="shrink-0"
                >
                  {deleting === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-600" />
                  )}
                </Button>
              )}
            </div>
            <AccordionContent>
              <div className="pt-2 pb-4">
                <div className="flex items-start gap-4">
                  {searchQuery && highlightId === item.id ? (
                    <p
                      className="flex-1 text-slate-600 dark:text-slate-400 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: highlightText(item.answer, searchQuery) }}
                    />
                  ) : (
                    <p className="flex-1 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                      {item.answer}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(item.id, item.answer)}
                    className="shrink-0"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedId === item.id ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
