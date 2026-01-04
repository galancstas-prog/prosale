'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Search, X, MessageSquare, BookOpen, FileText, Database } from 'lucide-react'
import { globalSearch, GlobalSearchResult } from '@/lib/actions/global-search'
import { useLocale } from '@/lib/i18n/use-locale'

interface ModuleFilter {
  scripts: boolean
  training: boolean
  faq: boolean
  kb: boolean
}

export function GlobalSearch() {
  const { t } = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [filters, setFilters] = useState<ModuleFilter>({
    scripts: true,
    training: true,
    faq: true,
    kb: true,
  })

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      const result = await globalSearch(query)
      setResults(result.data || [])
      setIsOpen((result.data || []).length > 0)
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

  const handleResultClick = (result: GlobalSearchResult) => {
    setIsOpen(false)
    setQuery('')

    switch (result.module) {
      case 'scripts':
        router.push(`/app/scripts/thread/${result.meta.threadId}?turnId=${result.meta.turnId}&q=${encodeURIComponent(query)}`)
        break
      case 'faq':
        router.push(`/app/faq?highlight=${result.meta.id}&q=${encodeURIComponent(query)}`)
        break
      case 'training':
        router.push(`/app/training/doc/${result.meta.docId}?q=${encodeURIComponent(query)}`)
        break
      case 'kb':
        router.push(`/app/knowledge/${result.meta.pageId}?q=${encodeURIComponent(query)}`)
        break
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

  const toggleFilter = (module: keyof ModuleFilter) => {
    setFilters((prev) => ({
      ...prev,
      [module]: !prev[module],
    }))
  }

  const filteredResults = results.filter((result) => filters[result.module])
  const groupedResults: Record<string, GlobalSearchResult[]> = {
    scripts: filteredResults.filter((r) => r.module === 'scripts'),
    training: filteredResults.filter((r) => r.module === 'training'),
    faq: filteredResults.filter((r) => r.module === 'faq'),
    kb: filteredResults.filter((r) => r.module === 'kb'),
  }

  const moduleConfig = {
    scripts: { label: 'Scripts', icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400' },
    training: { label: 'Training', icon: BookOpen, color: 'text-green-600 dark:text-green-400' },
    faq: { label: 'FAQ', icon: FileText, color: 'text-orange-600 dark:text-orange-400' },
    kb: { label: 'Knowledge Base', icon: Database, color: 'text-purple-600 dark:text-purple-400' },
  }

  const allFiltersDisabled = !filters.scripts && !filters.training && !filters.faq && !filters.kb

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.search')}
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border rounded-lg shadow-lg overflow-hidden">
          <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter by Module</div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(moduleConfig).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <Switch
                      checked={filters[key as keyof ModuleFilter]}
                      onCheckedChange={() => toggleFilter(key as keyof ModuleFilter)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {allFiltersDisabled ? (
              <div className="p-8 text-center text-slate-500">
                Enable at least one module to search.
              </div>
            ) : (
              <>
                {Object.entries(groupedResults).map(([module, moduleResults]) => {
                  if (moduleResults.length === 0) return null
                  const config = moduleConfig[module as keyof typeof moduleConfig]
                  const Icon = config.icon

                  return (
                    <div key={module}>
                      <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="font-semibold text-sm">{config.label}</span>
                          <span className="text-xs text-slate-500">({moduleResults.length})</span>
                        </div>
                      </div>
                      {moduleResults.map((result) => (
                        <button
                          key={`${result.module}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-b-0"
                        >
                          <div className="font-medium text-sm mb-1 text-slate-700 dark:text-slate-300">
                            {result.breadcrumb}
                          </div>
                          <div
                            className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: highlightText(result.snippet, query) }}
                          />
                        </button>
                      ))}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
