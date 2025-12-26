import { getKbPages } from '@/lib/actions/kb-pages'
import { CreateKbDialog } from './create-kb-dialog'
import { KbList } from './kb-list'

export default async function KnowledgePage() {
  const result = await getKbPages()
  const pages = result.data || []

  const isAdmin = true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Browse and manage knowledge base articles
          </p>
        </div>
        {isAdmin && <CreateKbDialog />}
      </div>

      <KbList pages={pages} isAdmin={isAdmin} />
    </div>
  )
}
