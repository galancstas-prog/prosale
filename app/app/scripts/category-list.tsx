'use client'

import { ContentTile } from '@/components/content-tile'
import { EmptyState } from '@/components/empty-state'
import { FolderOpen } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
}

interface CategoryListProps {
  categories: Category[]
  isAdmin: boolean
}

export function CategoryList({ categories, isAdmin }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No categories yet"
        description={
          isAdmin
            ? "Create your first category to start organizing scripts"
            : "No script categories available yet"
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
          href={`/app/scripts/${category.id}`}
          icon={FolderOpen}
          iconColor="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
        />
      ))}
    </div>
  )
}
