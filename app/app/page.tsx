'use client'

import { DashboardContent } from './dashboard-content'
import { useMembership } from '@/lib/auth/use-membership'

export default function DashboardPage() {
  const { membership } = useMembership()
  const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER'

  return <DashboardContent isAdmin={isAdmin} />
}
