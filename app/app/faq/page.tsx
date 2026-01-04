'use client'

import { useEffect, useState } from 'react'
import { getFaqItems } from '@/lib/actions/faq-items'
import { CreateFaqDialog } from './create-faq-dialog'
import { FaqList } from './faq-list'
import { useLocale } from '@/lib/i18n/use-locale'

export default function FaqPage() {
  const { t } = useLocale()
  const [faqItems, setFaqItems] = useState<any[]>([])

  const isAdmin = true

  useEffect(() => {
    async function loadData() {
      const faqResult = await getFaqItems()
      setFaqItems(faqResult.data || [])
    }
    loadData()
  }, [])

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

      <FaqList items={faqItems} isAdmin={isAdmin} />
    </div>
  )
}
