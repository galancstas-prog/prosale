import { getTrainingCategories } from '@/lib/actions/training-categories'
import { CreateTrainingCategoryDialog } from './create-category-dialog'
import { TrainingCategoryList } from './category-list'

export default async function TrainingPage() {
  const categoriesResult = await getTrainingCategories()
  const categories = categoriesResult.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Access training materials and track your progress
          </p>
        </div>
        <CreateTrainingCategoryDialog />
      </div>

      <TrainingCategoryList categories={categories} isAdmin={true} />
    </div>
  )
}
