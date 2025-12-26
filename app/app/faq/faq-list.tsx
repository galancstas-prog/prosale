'use client'

import { useState } from 'react'
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
import { Copy, Trash2, MessageCircle, Loader2 } from 'lucide-react'
import { deleteFaqItem } from '@/lib/actions/faq-items'
import { useToast } from '@/hooks/use-toast'

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
}

export function FaqList({ items, isAdmin }: FaqListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCopy = async (answer: string) => {
    try {
      await navigator.clipboard.writeText(answer)
      toast({
        title: 'Copied!',
        description: 'Answer copied to clipboard',
      })
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
      <Accordion type="single" collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <div className="flex items-center gap-2">
              <AccordionTrigger className="flex-1 text-left hover:no-underline">
                <span className="font-medium">{item.question}</span>
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
                  <p className="flex-1 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {item.answer}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(item.answer)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
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
