'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { FileText, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { useTrainingDocs, useTrainingDocMutation } from '@/lib/hooks/use-training-docs'
import { useToast } from '@/hooks/use-toast'

interface DocListProps {
  isAdmin: boolean
  categoryId: string
}

export function TrainingDocList({ isAdmin, categoryId }: DocListProps) {
  const { toast } = useToast()
  const { data: docs = [], isLoading } = useTrainingDocs(categoryId)
  const { deleteMutation } = useTrainingDocMutation(categoryId)
  const [error, setError] = useState('')

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить "${docTitle}"?`)) return

    try {
      await deleteMutation.mutateAsync(docId)
      toast({
        title: 'Успешно',
        description: 'Документ удален',
      })
    } catch (err: any) {
      const message = err?.message || 'Ошибка при удалении'
      setError(message)
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Учебных материалов пока нет"
        description={
          isAdmin
            ? "Создайте свой первый учебный документ, чтобы начать работу"
            : "Учебные материалы пока недоступны"
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
                disabled={deleteMutation.isPending}
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
