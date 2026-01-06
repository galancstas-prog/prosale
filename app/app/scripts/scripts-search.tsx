'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { searchScriptTurns } from '@/lib/actions/script-turns'
import { useLocale } from '@/lib/i18n/use-locale'

interface SearchResult {
  id: string
  threadId: string
  threadTitle: string
  categoryName: string
  message: string
  snippet: string
}

interface ScriptsSearchProps {
  onResultClick: (threadId: string, turnId: string, query: string) => void
}

export function ScriptsSearch({ onResultClick }: ScriptsSearchProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      const result = await searchScriptTurns(query)
      setResults(result.data || [])
      setIsOpen(true)
    }, 400)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleResultClick = (threadId: string, turnId: string) => {
    setIsOpen(false)
    onResultClick(threadId, turnId, query)
    setQuery('')
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

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.search')}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Ничего не найдено
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result.threadId, result.id)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-b-0"
              >
                <div className="font-medium text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Scripts / {result.categoryName} / </span>
                  <span>{result.threadTitle}</span>
                </div>
                <div
                  className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: highlightText(result.snippet, query) }}
                />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
