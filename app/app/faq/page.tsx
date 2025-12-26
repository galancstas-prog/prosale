import { getFaqItems } from '@/lib/actions/faq-items'
import { CreateFaqDialog } from './create-faq-dialog'
import { FaqList } from './faq-list'

export default async function FaqPage() {
  const faqResult = await getFaqItems()
  const faqItems = faqResult.data || []

  const isAdmin = true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Frequently asked questions and answers
          </p>
        </div>
        {isAdmin && <CreateFaqDialog />}
      </div>

      <FaqList items={faqItems} isAdmin={isAdmin} />
    </div>
  )
}
