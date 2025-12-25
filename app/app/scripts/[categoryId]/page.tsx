import { getCurrentUser } from '@/lib/auth/user'
import { getThreadsByCategory } from '@/lib/actions/script-threads'
import { CreateThreadDialog } from './create-thread-dialog'
import { ThreadList } from './thread-list'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CategoryPage({ params }: { params: { categoryId: string } }) {
  const user = await getCurrentUser()
  const threadsResult = await getThreadsByCategory(params.categoryId)

  if (!user) {
    return <div>Unauthorized</div>
  }

  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', params.categoryId)
    .single()

  if (!category) {
    return <div>Category not found</div>
  }

  const isAdmin = user.appUser.role === 'ADMIN'
  const threads = threadsResult.data || []

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/scripts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {category.description}
              </p>
            )}
          </div>
          {isAdmin && <CreateThreadDialog categoryId={params.categoryId} />}
        </div>
      </div>

      <ThreadList threads={threads} isAdmin={isAdmin} />
    </div>
  )
}
