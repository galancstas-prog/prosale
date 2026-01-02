'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { FileText, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { deleteTrainingDoc } from '@/lib/actions/training-docs'

interface Doc {
  id: string
  title: string
}

interface DocListProps {
  docs: Doc[]
  isAdmin: boolean
}

export function TrainingDocList({ docs, isAdmin }: DocListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${docTitle}"?`)) return

    setLoading(true)
    await deleteTrainingDoc(docId)
    setLoading(false)
    router.refresh()
  }

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No training documents yet"
        description={
          isAdmin
            ? "Create your first training document to get started"
            : "No training documents available yet"
        }
      />
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {docs.map((doc) => (
        <Card key={doc.id} className="h-full hover:shadow-lg transition-all border-2 relative group">
          <Link href={`/app/training/doc/${doc.id}`}>
            <CardHeader className="cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <CardTitle className="flex items-center justify-between">
                {doc.title}
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CardTitle>
            </CardHeader>
          </Link>
          {isAdmin && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(doc.id, doc.title)
                }}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
