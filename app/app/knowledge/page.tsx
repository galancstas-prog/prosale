'use client'

import { useEffect, useState } from 'react'
import { getKbPages } from '@/lib/actions/kb-pages'
import { CreateKbDialog } from './create-kb-dialog'
import { KbList } from './kb-list'
import { useLocale } from '@/lib/i18n/use-locale'

export default function KnowledgePage() {
  const { t } = useLocale()
  const [pages, setPages] = useState<any[]>([])

  const isAdmin = true

  useEffect(() => {
    async function loadData() {
      const result = await getKbPages()
      setPages(result.data || [])
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('kb.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('kb.subtitle')}
          </p>
        </div>
        {isAdmin && <CreateKbDialog />}
      </div>

      <KbList pages={pages} isAdmin={isAdmin} />
    </div>
  )
}
