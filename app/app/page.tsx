import { getCurrentUser } from '@/lib/auth/user'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  return <DashboardContent isAdmin={user.appUser.role === 'ADMIN'} />
}
