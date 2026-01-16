'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTrainingDocById } from '@/lib/actions/training-docs'
import { getMyProgress } from '@/lib/actions/training-progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TrainingDocViewer } from './doc-viewer'

export default function TrainingDocPage({ params }: { params: { docId: string } }) {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const [doc, setDoc] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      const docResult = await getTrainingDocById(params.docId)
      const progressResult = await getMyProgress(params.docId)

      if (docResult.error || !docResult.data) {
        setError(true)
      } else {
        setDoc(docResult.data)
        setProgress(progressResult.data)
      }
    }
    loadData()
  }, [params.docId])

  if (error) {
    return <div>Документ не найден</div>
  }

  if (!doc) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/training/${doc.category_id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к категории
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
      </div>

      <TrainingDocViewer
        doc={doc}
        progress={progress}
        isAdmin={false}
        searchQuery={searchQuery}
      />
    </div>
  )
}
