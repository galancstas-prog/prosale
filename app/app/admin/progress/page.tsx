'use client'

import { useEffect, useState } from 'react'
import { getAllProgress } from '@/lib/actions/training-progress'
import { ProgressTable } from './progress-table'
import { useLocale } from '@/lib/i18n/use-locale'

export default function AdminProgressPage() {
  const { t } = useLocale()
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const progressResult = await getAllProgress()
      setRows(progressResult.data || [])
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.progress.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          {t('admin.progress.subtitle')}
        </p>
      </div>

      <ProgressTable rows={rows} />
    </div>
  )
}
