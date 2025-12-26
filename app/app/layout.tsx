import { AppShell } from '@/components/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const mockUser = {
    authUser: { id: 'mock-user', email: 'demo@example.com' },
    appUser: {
      id: 'mock-user',
      tenant_id: 'mock-tenant',
      email: 'demo@example.com',
      full_name: 'Demo User',
      role: 'ADMIN',
    },
  }

  return <AppShell user={mockUser}>{children}</AppShell>
}
