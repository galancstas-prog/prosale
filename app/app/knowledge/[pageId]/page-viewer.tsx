'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { EditKbDialog } from '../edit-kb-dialog'

interface KbPageViewerProps {
  page: {
    id: string
    title: string
    content_richtext: string
    created_at: string
  }
  isAdmin: boolean
  searchQuery?: string
}

export function KbPageViewer({ page, isAdmin, searchQuery }: KbPageViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [shouldHighlight, setShouldHighlight] = useState(!!searchQuery)

  useEffect(() => {
    if (searchQuery && contentRef.current) {
      setTimeout(() => {
        const marks = contentRef.current?.querySelectorAll('mark')
        if (marks && marks.length > 0) {
          marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      setTimeout(() => {
        setShouldHighlight(false)
      }, 3000)
    }
  }, [searchQuery])

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

  return (
    <Card className="p-6">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {shouldHighlight && searchQuery ? (
          <div
            ref={contentRef}
            className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightText(page.content_richtext, searchQuery) }}
          />
        ) : (
          <div ref={contentRef} className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
            {page.content_richtext}
          </div>
        )}
      </div>
    </Card>
  )
}
