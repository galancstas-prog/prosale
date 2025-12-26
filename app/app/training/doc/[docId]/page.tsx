import { getTrainingDocById } from '@/lib/actions/training-docs'
import { getMyProgress } from '@/lib/actions/training-progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TrainingDocViewer } from './doc-viewer'

export default async function TrainingDocPage({ params }: { params: { docId: string } }) {
  const docResult = await getTrainingDocById(params.docId)
  const progressResult = await getMyProgress(params.docId)

  if (docResult.error || !docResult.data) {
    return <div>Document not found</div>
  }

  const doc = docResult.data
  const progress = progressResult.data

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/training/${doc.category_id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Category
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
      </div>

      <TrainingDocViewer
        doc={doc}
        progress={progress}
        isAdmin={true}
      />
    </div>
  )
}
