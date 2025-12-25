'use client'

import { ContentTile } from '@/components/content-tile'
import { EmptyState } from '@/components/empty-state'
import { BookOpen } from 'lucide-react'

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
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <ContentTile
          key={category.id}
          title={category.name}
          description={category.description || undefined}
          href={`/app/training/${category.id}`}
          icon={BookOpen}
          iconColor="bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
        />
      ))}
    </div>
  )
}
