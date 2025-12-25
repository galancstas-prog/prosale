import { requireAdmin } from '@/lib/auth/user'
import { getAllProgress } from '@/lib/actions/training-progress'
import { ProgressTable } from './progress-table'

export default async function AdminProgressPage() {
  await requireAdmin()
  const progressResult = await getAllProgress()

  if (progressResult.error) {
    return <div>Error loading progress data</div>
  }

  const rows = progressResult.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Progress</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          View training completion status for all team members
        </p>
      </div>

      <ProgressTable rows={rows} />
    </div>
  )
}
