import { getCategories } from '@/lib/actions/categories'
import { CreateCategoryDialog } from './create-category-dialog'
import { CategoryList } from './category-list'

export default async function ScriptsPage() {
  const categoriesResult = await getCategories()
  const categories = categoriesResult.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scripts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage conversation scripts organized by categories
          </p>
        </div>
        <CreateCategoryDialog />
      </div>

      <CategoryList categories={categories} isAdmin={true} />
    </div>
  )
}
