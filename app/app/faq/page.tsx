'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreateFaqDialog } from './create-faq-dialog'
import { FaqList } from './faq-list'
import { FaqSearch } from './faq-search'
import { useLocale } from '@/lib/i18n/use-locale'
import { useMembership } from '@/lib/auth/use-membership'
import { useFaqItems } from '@/lib/hooks/use-faq-items'

export default function FaqPage() {
  const { t } = useLocale()
  const { membership } = useMembership()
  const searchParams = useSearchParams()
  const urlHighlightId = searchParams.get('highlight') || null
  const urlSearchQuery = searchParams.get('q') || ''
  const { data: faqItems = [], isLoading: loading } = useFaqItems()
  const [highlightId, setHighlightId] = useState<string | null>(urlHighlightId)
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery)
  const [openItemId, setOpenItemId] = useState<string | null>(urlHighlightId)

  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  useEffect(() => {
    if (urlHighlightId) {
      setHighlightId(urlHighlightId)
      setSearchQuery(urlSearchQuery)
      setOpenItemId(urlHighlightId)

      setTimeout(() => {
        const element = document.getElementById(`faq-item-${urlHighlightId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      setTimeout(() => {
        setHighlightId(null)
        setSearchQuery('')
      }, 3000)
    }
  }, [urlHighlightId, urlSearchQuery])

  const handleSearchResultClick = (id: string, query: string) => {
    setHighlightId(id)
    setSearchQuery(query)
    setOpenItemId(id)

    setTimeout(() => {
      const element = document.getElementById(`faq-item-${id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)

    setTimeout(() => {
      setHighlightId(null)
      setSearchQuery('')
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('faq.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('faq.subtitle')}
          </p>
        </div>
        {isAdmin && <CreateFaqDialog />}
      </div>

      <FaqSearch onResultClick={handleSearchResultClick} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <FaqList
          items={faqItems}
          isAdmin={isAdmin}
          highlightId={highlightId}
          searchQuery={searchQuery}
          openItemId={openItemId}
        />
      )}
    </div>
  )
}
