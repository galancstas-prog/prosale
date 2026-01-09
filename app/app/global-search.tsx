'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, X, MessageSquare, BookOpen, FileText, Database, Copy, Sparkles, Lock, Check } from 'lucide-react'
import { QuestionCaptureBar } from '@/components/question-capture-bar'
import { globalSearch, GlobalSearchResult } from '@/lib/actions/global-search'
import { aiSearch, AISource } from '@/lib/actions/ai-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useTenantPlan } from '@/lib/hooks/use-tenant-plan'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ModuleFilter {
  scripts: boolean
  training: boolean
  faq: boolean
  kb: boolean
}

export function GlobalSearch() {
  const { t } = useLocale()
  const { plan } = useTenantPlan()
  const router = useRouter()
  const [mode, setMode] = useState<'search' | 'ai'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiSources, setAiSources] = useState<AISource[]>([])
  const [aiError, setAiError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [filters, setFilters] = useState<ModuleFilter>({
    scripts: true,
    training: true,
    faq: true,
    kb: true,
  })

  const isAiEnabled = plan === 'PRO' || plan === 'TEAM'

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (mode === 'ai') {
      return
    }

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
  }, [query, mode])

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
    setAiAnswer('')
    setAiSources([])
    setAiError('')
    setIsOpen(false)
  }

  const handleModeSwitch = (checked: boolean) => {
    if (!isAiEnabled && checked) {
      return
    }
    setMode(checked ? 'ai' : 'search')
    setQuery('')
    setResults([])
    setAiAnswer('')
    setAiSources([])
    setAiError('')
    setIsOpen(false)
  }

  const handleAiSearch = async () => {
    if (query.length < 4) {
      setAiError('Запрос слишком короткий. Минимум 4 символа.')
      return
    }

    setLoading(true)
    setAiError('')
    setAiAnswer('')
    setAiSources([])

    const result = await aiSearch(query, filters)

    if (result.error) {
      setAiError(result.error)
    } else {
      setAiAnswer(result.answer)
      setAiSources(result.sources)
    }

    setLoading(false)
  }

  const handleResultClick = (result: GlobalSearchResult) => {
    const q = query
    setIsOpen(false)
    setQuery('')

    switch (result.module) {
      case 'scripts':
        router.push(`/app/scripts/thread/${result.meta.threadId}?turnId=${result.meta.turnId}&q=${encodeURIComponent(q)}`)
        break
      case 'faq':
        router.push(`/app/faq?highlight=${result.meta.id}&q=${encodeURIComponent(q)}`)
        break
      case 'training':
        router.push(`/app/training/doc/${result.meta.docId}?q=${encodeURIComponent(q)}`)
        break
      case 'kb':
        router.push(`/app/knowledge/${result.meta.pageId}?q=${encodeURIComponent(q)}`)
        break
    }
  }

  const handleSourceClick = (source: AISource) => {
    const q = query
    switch (source.module) {
      case 'scripts':
        router.push(`/app/scripts/thread/${source.meta.threadId}?turnId=${source.meta.turnId}&q=${encodeURIComponent(q)}`)
        break
      case 'faq':
        router.push(`/app/faq?highlight=${source.meta.id}&q=${encodeURIComponent(q)}`)
        break
      case 'training':
        router.push(`/app/training/doc/${source.meta.docId}?q=${encodeURIComponent(q)}`)
        break
      case 'kb':
        router.push(`/app/knowledge/${source.meta.pageId}?q=${encodeURIComponent(q)}`)
        break
    }
  }

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(aiAnswer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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

  const groupedSources: Record<string, AISource[]> = {
    scripts: aiSources.filter((s) => s.module === 'scripts'),
    training: aiSources.filter((s) => s.module === 'training'),
    faq: aiSources.filter((s) => s.module === 'faq'),
    kb: aiSources.filter((s) => s.module === 'kb'),
  }

  const moduleConfig = {
    scripts: { label: 'Scripts', icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400' },
    training: { label: 'Training', icon: BookOpen, color: 'text-green-600 dark:text-green-400' },
    faq: { label: 'FAQ', icon: FileText, color: 'text-orange-600 dark:text-orange-400' },
    kb: { label: 'Knowledge Base', icon: Database, color: 'text-purple-600 dark:text-purple-400' },
  }

  const allFiltersDisabled = !filters.scripts && !filters.training && !filters.faq && !filters.kb

  return (
    <div ref={containerRef} className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${mode === 'search' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
            Поиск
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={mode === 'ai'}
                    onCheckedChange={handleModeSwitch}
                    disabled={!isAiEnabled}
                  />
                  <span className={`text-sm font-medium flex items-center gap-1 ${mode === 'ai' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'} ${!isAiEnabled ? 'opacity-50' : ''}`}>
                    {!isAiEnabled && <Lock className="h-3 w-3" />}
                    <Sparkles className="h-4 w-4" />
                    AI
                  </span>
                </div>
              </TooltipTrigger>
              {!isAiEnabled && (
                <TooltipContent>
                  <p>Доступно на тарифе PRO</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mode === 'ai' && isAiEnabled) {
                handleAiSearch()
              }
            }}
            placeholder={mode === 'ai' ? 'Задайте вопрос (мин. 4 символа)' : t('common.search')}
            className="pl-10 pr-10 h-12 text-base"
            disabled={mode === 'ai' && !isAiEnabled}
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
        {mode === 'ai' && isAiEnabled && (
          <Button onClick={handleAiSearch} disabled={loading || query.length < 4} size="lg">
            {loading ? 'Поиск...' : 'Найти'}
          </Button>
        )}
      </div>

      {mode === 'ai' && isAiEnabled && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Фильтр</div>
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
      )}

      {mode === 'ai' && aiError && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950">
          <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
        </Card>
      )}

      {mode === 'ai' && aiAnswer && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI-ответ
            </h3>
            <Button variant="outline" size="sm" onClick={handleCopyAnswer}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Копировать
                </>
              )}
            </Button>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
              {aiAnswer}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Источники</h4>
            {aiSources.length === 0 ? (
              <p className="text-sm text-slate-500">Нет источников</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedSources).map(([module, sources]) => {
                  if (sources.length === 0) return null
                  const config = moduleConfig[module as keyof typeof moduleConfig]
                  const Icon = config.icon

                  return (
                    <div key={module} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span>{config.label}</span>
                      </div>
                      {sources.map((source, idx) => (
                        <button
                          key={`${source.module}-${source.id}-${idx}`}
                          onClick={() => handleSourceClick(source)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="font-medium text-sm mb-1">{source.title}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {source.snippet}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {mode === 'search' && isOpen && results.length > 0 && (
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

      {mode === 'ai' && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Не нашли ответ?</h3>
          <QuestionCaptureBar />
        </div>
      )}
    </div>
  )
}
