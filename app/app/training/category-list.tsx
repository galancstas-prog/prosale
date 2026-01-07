'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/empty-state'
import { BookOpen, ArrowRight, Pencil, Trash2, Loader2 } from 'lucide-react'
import { updateTrainingCategory, deleteTrainingCategory } from '@/lib/actions/training-categories'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getCategoryColor } from '@/lib/color-utils'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  description: string | null
}

interface CategoryListProps {
  categories: Category[]
  isAdmin: boolean
}

export function TrainingCategoryList({ categories, isAdmin }: CategoryListProps) {
  const router = useRouter()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCategory) return

    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateTrainingCategory(editingCategory.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setEditingCategory(null)
      setLoading(false)
      router.refresh()
    }
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? All training documents will be deleted.`)) return

    setLoading(true)
    await deleteTrainingCategory(categoryId)
    setLoading(false)
    router.refresh()
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No training categories yet"
        description={
          isAdmin
            ? "Create your first category to start organizing training materials"
            : "No training categories available yet"
        }
      />
    )
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const color = getCategoryColor(category.id)
          return (
          <Card key={category.id} className="h-full hover:shadow-lg transition-all border-2 relative group">
            <Link href={`/app/training/${category.id}`}>
              <CardHeader className="cursor-pointer">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-3', color.bg, color.text)}>
                  <span className="text-2xl">{color.emoji}</span>
                </div>
                <CardTitle className="flex items-center justify-between">
                  {category.name}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </CardTitle>
                {category.description && <CardDescription>{category.description}</CardDescription>}
              </CardHeader>
            </Link>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault()
                    setEditingCategory(category)
                  }}
                  disabled={loading}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(category.id, category.name)
                  }}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )}
          </Card>
        )})}
      </div>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Training Category</DialogTitle>
            <DialogDescription>Update the category details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingCategory?.name}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingCategory?.description || ''}
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
